type Mover = [string, number];

const fallback = {
  kospi: {
    gainers: [
      ['삼성전자', 3.45],
      ['LG에너지솔루션', 3.02],
      ['현대차', 2.59],
      ['기아', 2.16],
      ['NAVER', 1.73]
    ] as Mover[],
    losers: [
      ['카카오', -2.31],
      ['포스코홀딩스', -1.98],
      ['엔씨소프트', -1.65],
      ['에코프로비엠', -1.32],
      ['셀트리온', -0.99]
    ] as Mover[]
  },
  kosdaq: {
    gainers: [
      ['에코프로', 4.15],
      ['알테오젠', 3.78],
      ['HLB', 3.22],
      ['리노공업', 2.84],
      ['JYP Ent.', 2.47]
    ] as Mover[],
    losers: [
      ['펄어비스', -3.2],
      ['카카오게임즈', -2.66],
      ['스튜디오드래곤', -2.04],
      ['위메이드', -1.72],
      ['천보', -1.21]
    ] as Mover[]
  }
};

function decodeHtml(value: string) {
  return value
    .replaceAll('&amp;', '&')
    .replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>')
    .replaceAll('&quot;', '"')
    .replaceAll('&#39;', "'")
    .trim();
}

function parseNaverMovers(html: string, sign: 1 | -1): Mover[] {
  const rows = [...html.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/g)];
  const movers: Mover[] = [];

  for (const [, row] of rows) {
    const name = row.match(/class="tltle">([^<]+)</);
    const percent = [...row.matchAll(/<span class="tah p11 [^"]+">([\s\S]*?)<\/span>/g)]
      .map((match) => match[1].replace(/<[^>]+>/g, '').replace(/,/g, '').trim())
      .find((text) => text.includes('%'));

    if (!name || !percent) continue;

    const rate = Number(percent.replace('%', '').replace(/[+\s]/g, ''));
    if (!Number.isFinite(rate)) continue;

    const stockName = decodeHtml(name[1]);
    if (shouldExcludeInstrument(stockName)) continue;

    movers.push([stockName, Math.abs(rate) * sign]);
    if (movers.length >= 5) break;
  }

  return movers;
}

function shouldExcludeInstrument(name: string) {
  const normalized = name.replace(/\s+/g, '').toUpperCase();
  const blocked = ['ETN', 'ETF', '스팩', 'SPAC', '인버스', '레버리지', '선물', '리츠', 'REIT'];
  if (blocked.some((word) => normalized.includes(word))) return true;
  if (/우$|우B$|우C$|우\(전환\)$/.test(normalized)) return true;
  return false;
}

async function fetchNaver(path: string, sign: 1 | -1): Promise<Mover[]> {
  const response = await fetch(`https://finance.naver.com${path}`, {
    headers: {
      'User-Agent': 'Mozilla/5.0 Zooseek',
      Accept: 'text/html,application/xhtml+xml'
    }
  });

  if (!response.ok) throw new Error(`Naver Finance failed: ${response.status}`);

  const buffer = await response.arrayBuffer();
  const html = new TextDecoder('euc-kr').decode(buffer);
  const movers = parseNaverMovers(html, sign);

  if (movers.length === 0) throw new Error('No mover rows parsed');
  return movers;
}

export default async function handler(_req: any, res: any) {
  try {
    const [kospiGainers, kospiLosers, kosdaqGainers, kosdaqLosers] = await Promise.all([
      fetchNaver('/sise/sise_rise.naver?sosok=0', 1),
      fetchNaver('/sise/sise_fall.naver?sosok=0', -1),
      fetchNaver('/sise/sise_rise.naver?sosok=1', 1),
      fetchNaver('/sise/sise_fall.naver?sosok=1', -1)
    ]);

    res.status(200).json({
      kospi: { gainers: kospiGainers, losers: kospiLosers },
      kosdaq: { gainers: kosdaqGainers, losers: kosdaqLosers },
      source: 'naver-finance'
    });
  } catch (error) {
    res.status(200).json({
      ...fallback,
      source: 'fallback',
      error: error instanceof Error ? error.message : 'unknown error'
    });
  }
}
