const symbols = [
  { id: 'kospi', name: 'KOSPI', symbol: '^KS11' },
  { id: 'nasdaq', name: 'NASDAQ', symbol: '^IXIC' },
  { id: 'sp500', name: 'S&P 500', symbol: '^GSPC' }
];

const fallback = {
  indices: [
    {
      id: 'kospi',
      name: 'KOSPI',
      value: 2728.15,
      change: 32.86,
      changeRate: 1.22,
      updatedAt: new Date().toISOString(),
      series: [18, 36, 28, 31, 34, 38, 35, 42, 41, 50, 48, 58, 55, 75, 62, 64, 58, 61, 59, 60, 57]
    },
    {
      id: 'nasdaq',
      name: 'NASDAQ',
      value: 16920.58,
      change: 126.08,
      changeRate: 0.75,
      updatedAt: new Date().toISOString(),
      series: [24, 36, 31, 39, 37, 43, 48, 45, 56, 53, 69, 55, 49, 52, 47, 51, 49, 55, 51, 53, 50]
    },
    {
      id: 'sp500',
      name: 'S&P 500',
      value: 5303.27,
      change: 24.35,
      changeRate: 0.46,
      updatedAt: new Date().toISOString(),
      series: [20, 29, 34, 43, 47, 45, 52, 49, 60, 73, 61, 58, 52, 55, 50, 56, 53, 58, 54, 55, 52]
    }
  ]
};

async function fetchIndex(item: (typeof symbols)[number], range: string) {
  const interval = range === '1d' ? '5m' : '1d';
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(item.symbol)}?range=${range}&interval=${interval}`;
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 Zooseek'
    }
  });

  if (!response.ok) throw new Error(`Yahoo chart failed: ${response.status}`);

  const json = await response.json();
  const result = json.chart?.result?.[0];
  const meta = result?.meta;
  const closes = result?.indicators?.quote?.[0]?.close?.filter((value: number | null) => typeof value === 'number') ?? [];
  const dailyMeta = range === '1d' ? meta : await fetchDailyMeta(item.symbol);
  const value = Number(dailyMeta?.regularMarketPrice ?? meta?.regularMarketPrice ?? closes.at(-1) ?? 0);
  const previous = Number(dailyMeta?.previousClose ?? dailyMeta?.chartPreviousClose ?? value);
  const metaChange = Number(dailyMeta?.regularMarketChange);
  const metaChangeRate = Number(dailyMeta?.regularMarketChangePercent);
  const change = Number.isFinite(metaChange) ? metaChange : value - previous;
  const changeRate = Number.isFinite(metaChangeRate) ? metaChangeRate : previous ? (change / previous) * 100 : 0;

  return {
    id: item.id,
    name: item.name,
    value,
    previousClose: previous,
    change,
    changeRate,
    updatedAt: new Date((dailyMeta?.regularMarketTime ?? meta?.regularMarketTime ?? Date.now() / 1000) * 1000).toISOString(),
    series: closes.length > 1 ? closes.slice(-80) : fallback.indices.find((index) => index.id === item.id)?.series
  };
}

async function fetchDailyMeta(symbol: string) {
  const response = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?range=1d&interval=5m`, {
    headers: {
      'User-Agent': 'Mozilla/5.0 Zooseek'
    }
  });

  if (!response.ok) return undefined;

  const json = await response.json();
  return json.chart?.result?.[0]?.meta;
}

function moodFromScore(score: number) {
  if (score >= 61) return '온화한 상승';
  if (score <= 44) return '신중한 하락';
  return '차분한 보합';
}

export default async function handler(req: any, res: any) {
  const range = String(req.query?.range ?? '1d');

  try {
    const indices = await Promise.all(symbols.map((item) => fetchIndex(item, range)));
    const score = Math.round(50 + indices.reduce((sum, item) => sum + item.changeRate, 0) * 4);
    const normalizedScore = Math.max(0, Math.min(100, score));

    res.status(200).json({
      indices,
      mood: {
        score: normalizedScore,
        label: moodFromScore(normalizedScore)
      },
      source: 'yahoo-finance'
    });
  } catch (error) {
    res.status(200).json({
      ...fallback,
      mood: { score: 62, label: '온화한 상승' },
      source: 'fallback',
      error: error instanceof Error ? error.message : 'unknown error'
    });
  }
}
