import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';

type Trend = 'up' | 'down' | 'flat';
type RangeKey = '1d' | '5d' | '1mo' | '3mo' | '1y';
type MarketKey = 'kospi' | 'kosdaq';

type MarketIndex = {
  id: 'kospi' | 'nasdaq' | 'sp500';
  name: string;
  value: number;
  previousClose?: number;
  change: number;
  changeRate: number;
  updatedAt: string;
  series: number[];
};

type Disclosure = {
  id: string;
  corpName: string;
  stockCode?: string;
  reportName: string;
  receiptDate: string;
  tag: string;
  originalUrl: string;
};

type Movers = Record<MarketKey, { gainers: [string, number][]; losers: [string, number][]; source?: string }>;

const characters = {
  rabbit: '/assets/characters/rabbit-full.png',
  rabbitSit: '/assets/characters/rabbit-sit.png',
  hippo: '/assets/characters/hippo-full.png',
  hippoLaptop: '/assets/characters/hippo-laptop.png',
  turtle: '/assets/characters/turtle-full.png'
};

const trendMeta = {
  up: { label: '상승', color: 'var(--rabbit)', className: 'up', character: characters.rabbit },
  down: { label: '하락', color: 'var(--hippo)', className: 'down', character: characters.hippo },
  flat: { label: '보합', color: 'var(--turtle)', className: 'flat', character: characters.turtle }
} satisfies Record<Trend, { label: string; color: string; className: string; character: string }>;

const rangeLabels: Record<RangeKey, string> = {
  '1d': '1일',
  '5d': '1주',
  '1mo': '1개월',
  '3mo': '3개월',
  '1y': '1년'
};

const fallbackIndices: MarketIndex[] = [
  {
    id: 'kospi',
    name: 'KOSPI',
    value: 2728.15,
    previousClose: 2695.29,
    change: 32.86,
    changeRate: 1.22,
    updatedAt: new Date().toISOString(),
    series: [2695, 2704, 2698, 2709, 2716, 2722, 2728]
  },
  {
    id: 'nasdaq',
    name: 'NASDAQ',
    value: 16920.58,
    previousClose: 16794.5,
    change: 126.08,
    changeRate: 0.75,
    updatedAt: new Date().toISOString(),
    series: [16794, 16805, 16832, 16880, 16862, 16910, 16920]
  },
  {
    id: 'sp500',
    name: 'S&P 500',
    value: 5303.27,
    previousClose: 5278.92,
    change: 24.35,
    changeRate: 0.46,
    updatedAt: new Date().toISOString(),
    series: [5278, 5287, 5292, 5290, 5300, 5305, 5303]
  }
];

function trendOf(rate: number): Trend {
  if (rate > 0) return 'up';
  if (rate < 0) return 'down';
  return 'flat';
}

function formatNumber(value: number) {
  return new Intl.NumberFormat('en-US', { maximumFractionDigits: 2, minimumFractionDigits: 2 }).format(value);
}

function formatSigned(value: number) {
  return `${value > 0 ? '+' : ''}${formatNumber(value)}`;
}

function formatPercent(value: number) {
  return `${value > 0 ? '+' : ''}${value.toFixed(2)}%`;
}

function compactDate(value: string) {
  if (/^\d{8}$/.test(value)) return `${value.slice(0, 4)}.${value.slice(4, 6)}.${value.slice(6, 8)}`;
  return value;
}

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, options);
  if (!response.ok) throw new Error(`${url} failed`);
  return response.json();
}

function CharacterImage({ src, alt, className = '' }: { src: string; alt: string; className?: string }) {
  return <img className={`character-img ${className}`} src={src} alt={alt} draggable={false} />;
}

function Sparkline({ points, color }: { points: number[]; color: string }) {
  const visible = points.filter(Number.isFinite);
  const max = Math.max(...visible);
  const min = Math.min(...visible);
  const d = visible
    .map((point, index) => {
      const x = (index / Math.max(1, visible.length - 1)) * 260;
      const y = 82 - ((point - min) / (max - min || 1)) * 72;
      return `${index === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(' ');

  return (
    <svg className="sparkline" viewBox="0 0 260 90" aria-hidden="true">
      <path d={d} fill="none" stroke={color} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="258" cy="82" r="2.6" fill={color} />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="11" cy="11" r="7" />
      <path d="m16.5 16.5 4 4" />
    </svg>
  );
}

function BellIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 7h18s-3 0-3-7" />
      <path d="M13.7 21a2 2 0 0 1-3.4 0" />
    </svg>
  );
}

function HeroHeader({ moodLabel, source }: { moodLabel: string; source: string }) {
  return (
    <header className="hero reveal">
      <div className="hero-mascot">
        <CharacterImage src={characters.rabbit} alt="토끼 캐릭터" className="hero-rabbit" />
      </div>
      <div className="hero-copy">
        <p className="hello">
          <strong>Jane</strong> 님, 좋은 아침이에요! <span>☀️</span>
        </p>
        <h1>오늘도 똑똑한 투자를 응원해요</h1>
        <div className="mood-pill">오늘의 시장은 {moodLabel} 모드예요. 전영업일 대비 흐름을 확인했어요.</div>
        <small className="source-note">market source: {source}</small>
      </div>
      <div className="hero-actions">
        <label className="search">
          <input placeholder="종목명 또는 키워드 검색" />
          <SearchIcon />
        </label>
        <button className="icon-button" aria-label="알림">
          <BellIcon />
          <span />
        </button>
      </div>
    </header>
  );
}

function IndexCard({ item }: { item: MarketIndex }) {
  const trend = trendOf(item.changeRate);
  const meta = trendMeta[trend];

  return (
    <section className={`card index-card ${meta.className} reveal`}>
      <div className="index-head">
        <h2>{item.name}</h2>
        <CharacterImage src={meta.character} alt={`${meta.label} 캐릭터`} className="index-character" />
      </div>
      <strong className="index-value">{formatNumber(item.value)}</strong>
      <p className="index-change" style={{ color: meta.color }}>
        {formatSigned(item.change)} &nbsp; {formatPercent(item.changeRate)}
      </p>
      <small className="index-basis">전영업일 종가 {formatNumber(item.previousClose ?? item.value - item.change)} 기준</small>
      <Sparkline points={item.series} color={meta.color} />
    </section>
  );
}

function MarketMoodGauge({ score, label }: { score: number; label: string }) {
  const clamped = Math.max(0, Math.min(100, score));

  return (
    <section className="card mood-card reveal">
      <div className="card-title">
        <h2>시장 분위기</h2>
        <span className="info-dot">i</span>
      </div>
      <div className="gauge">
        <svg viewBox="0 0 220 132" aria-hidden="true">
          <defs>
            <linearGradient id="warm" x1="30" x2="170" y1="106" y2="24" gradientUnits="userSpaceOnUse">
              <stop stopColor="#ff5f94" />
              <stop offset="1" stopColor="#ffbf61" />
            </linearGradient>
          </defs>
          <path className="gauge-track" d="M30 106a80 80 0 0 1 160 0" />
          <path className="gauge-hot" d="M30 106a80 80 0 0 1 101-76" />
          <path className="gauge-cool" d="M131 30a80 80 0 0 1 59 76" />
          <circle cx={30 + (clamped / 100) * 160} cy={clamped > 50 ? 42 : 106 - clamped} r="6" />
        </svg>
        <CharacterImage src={characters.rabbitSit} alt="시장 분위기 토끼" className="gauge-rabbit" />
        <b>{label}</b>
      </div>
      <div className="fear-row">
        <span>공포·탐욕 지수</span>
        <strong>
          Greed {clamped}
          <small>/100</small>
        </strong>
        <Sparkline points={[20, 24, 22, 28, 25, 33, 31, 38, 35, 44, 42, 49, 48, 56, clamped]} color="var(--turtle)" />
      </div>
    </section>
  );
}

function makeTicks(min: number, max: number) {
  const span = Math.max(0.1, max - min);
  const paddedMin = min - span * 0.16;
  const paddedMax = max + span * 0.16;
  const step = (paddedMax - paddedMin) / 4;
  return Array.from({ length: 5 }, (_, index) => paddedMin + step * index);
}

function ComparisonChart({ indices, range, setRange }: { indices: MarketIndex[]; range: RangeKey; setRange: (range: RangeKey) => void }) {
  const width = 690;
  const height = 258;
  const normalized = indices.map((item) => {
    const first = item.series[0] || item.value;
    return item.series.map((value) => ((value - first) / first) * 100);
  });
  const all = normalized.flat().filter(Number.isFinite);
  const ticks = makeTicks(Math.min(...all, 0), Math.max(...all, 0));
  const min = ticks[0];
  const max = ticks[ticks.length - 1];

  const makePath = (values: number[]) =>
    values
      .map((point, index) => {
        const x = 54 + (index / Math.max(1, values.length - 1)) * (width - 92);
        const y = 20 + ((max - point) / (max - min || 1)) * (height - 52);
        return `${index === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
      })
      .join(' ');

  return (
    <section className="card chart-card reveal">
      <div className="section-head">
        <h2>주요 지수 차트</h2>
        <div className="tabs">
          {(Object.keys(rangeLabels) as RangeKey[]).map((key) => (
            <button key={key} className={range === key ? 'active' : ''} onClick={() => setRange(key)}>
              {rangeLabels[key]}
            </button>
          ))}
        </div>
      </div>
      <svg className="comparison-chart" viewBox={`0 0 ${width} ${height}`} role="img" aria-label="주요 지수 비교 차트">
        {ticks.map((tick) => {
          const y = 20 + ((max - tick) / (max - min || 1)) * (height - 52);
          return (
            <g key={tick.toFixed(3)}>
              <line x1="54" x2="664" y1={y} y2={y} />
              <text x="10" y={y + 4}>
                {tick.toFixed(1)}%
              </text>
            </g>
          );
        })}
        <text x="54" y={height - 6}>start</text>
        <text x="546" y={height - 6}>latest</text>
        <path className="line kospi" d={makePath(normalized[0] ?? [])} />
        <path className="line nasdaq" d={makePath(normalized[1] ?? [])} />
        <path className="line sp500" d={makePath(normalized[2] ?? [])} />
      </svg>
      <div className="legend">
        <span><i className="pink" /> KOSPI</span>
        <span><i className="purple" /> NASDAQ</span>
        <span><i className="green" /> S&amp;P 500</span>
      </div>
    </section>
  );
}

function DisclosureFeed({ items }: { items: Disclosure[] }) {
  const [summary, setSummary] = useState<Record<string, string>>({});
  const [expanded, setExpanded] = useState(false);
  const visibleItems = expanded ? items : items.slice(0, 3);

  async function summarize(item: Disclosure) {
    setSummary((prev) => ({ ...prev, [item.id]: '요약 생성 중...' }));
    const data = await fetchJson<{ easyExplanation: string; characterComment: string }>('/api/ai/disclosure-summary', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ corpName: item.corpName, reportName: item.reportName, receiptDate: item.receiptDate })
    });
    setSummary((prev) => ({ ...prev, [item.id]: `${data.easyExplanation} ${data.characterComment}` }));
  }

  return (
    <section className="card feed-card reveal">
      <div className="section-head">
        <h2>실시간 공시 피드</h2>
        <button className="more" onClick={() => setExpanded((value) => !value)}>
          {expanded ? '접기' : `더보기 ${items.length > 3 ? items.length - 3 : 0}`}
        </button>
      </div>
      <div className="feed-list">
        {visibleItems.map((item) => (
          <article className="feed-item" key={item.id}>
            <span className="logo">{item.corpName.slice(0, 1)}</span>
            <div>
              <p>
                <strong>{item.corpName}</strong>
                <em>{item.tag}</em>
                <small>{compactDate(item.receiptDate)}</small>
              </p>
              <h3>{item.reportName}</h3>
              <span>{summary[item.id] ?? `${item.stockCode ? `${item.stockCode} · ` : ''}DART 공시 원문을 확인할 수 있어요.`}</span>
            </div>
            <button onClick={() => summarize(item)}>✣ AI 요약</button>
          </article>
        ))}
      </div>
    </section>
  );
}

function DailyReportCard({ indices }: { indices: MarketIndex[] }) {
  const strongest = [...indices].sort((a, b) => b.changeRate - a.changeRate)[0];

  return (
    <section className="card report-card reveal">
      <h2>✦ 오늘의 AI 한줄 리포트</h2>
      <div className="report-body">
        <span className="robot" aria-hidden="true"><i /></span>
        <p>
          {strongest.name}가 전영업일 대비 {formatPercent(strongest.changeRate)} 흐름을 보이고 있어요.
          지수 흐름은 긍정적이지만 공시와 섹터 변동을 함께 확인해볼 타이밍이에요.
        </p>
      </div>
      <div className="chips">
        <span>#전영업일대비</span>
        <span>#DART공시</span>
        <span>#리스크체크</span>
      </div>
    </section>
  );
}

function MoversCard({ movers }: { movers: Movers }) {
  const [market, setMarket] = useState<MarketKey>('kospi');
  const current = movers[market];

  return (
    <section className="card movers-card reveal">
      <div className="section-head compact">
        <h2>상승/하락 TOP 5</h2>
        <div className="mini-tabs">
          {(['kospi', 'kosdaq'] as MarketKey[]).map((key) => (
            <button key={key} className={market === key ? 'active' : ''} onClick={() => setMarket(key)}>
              {key === 'kospi' ? '코스피' : '코스닥'}
            </button>
          ))}
        </div>
      </div>
      <div className="mover-cols">
        <ol>
          <h3>상승 TOP 5</h3>
          {current.gainers.map(([name, rate], index) => (
            <li key={name}>
              <span>{index + 1}</span>
              <em>{name}</em>
              <b>{formatPercent(rate)}</b>
            </li>
          ))}
        </ol>
        <ol>
          <h3>하락 TOP 5</h3>
          {current.losers.map(([name, rate], index) => (
            <li key={name}>
              <span>{index + 1}</span>
              <em>{name}</em>
              <b>{formatPercent(rate)}</b>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

function MemoCard() {
  const [memo, setMemo] = useState(() => localStorage.getItem('zooseek.memo') ?? '');

  useEffect(() => {
    localStorage.setItem('zooseek.memo', memo);
  }, [memo]);

  return (
    <section className="card memo-card reveal">
      <CharacterImage src={characters.hippoLaptop} alt="메모 하마" className="memo-hippo" />
      <h2>오늘의 메모</h2>
      <textarea maxLength={200} placeholder="오늘의 생각을 메모해보세요 ✍️" value={memo} onChange={(event) => setMemo(event.target.value)} />
      <div>
        <span>메모는 나만 볼 수 있어요</span>
        <span>{memo.length} / 200</span>
      </div>
    </section>
  );
}

function sectorMatches(movers: Movers) {
  const gainers = [...movers.kospi.gainers, ...movers.kosdaq.gainers];
  const losers = [...movers.kospi.losers, ...movers.kosdaq.losers];
  const { best, avoid } = summarizeDirectionalSectors(gainers, losers);

  return {
    best: best.length > 0 ? best : [{ name: '강세 섹터', reason: '상승 종목 흐름을 더 수집하는 중이에요.', rate: 0 }],
    avoid: avoid.length > 0 ? avoid : [{ name: '약세 섹터', reason: '하락 종목 흐름을 더 수집하는 중이에요.', rate: 0 }]
  };
}

function sectorOf(name: string) {
  const rules: Array<{ sector: string; keywords: string[] }> = [
    { sector: '반도체·전자부품', keywords: ['전자', '전기', '이노텍', '반도체', '하이닉스', '원익', '리노공업', '테크윙', 'DB하이텍'] },
    { sector: '2차전지·소재', keywords: ['에코프로', '포스코', '금양', '엘앤에프', '천보', '엔켐', '솔루스', '배터리'] },
    { sector: '바이오·헬스케어', keywords: ['바이오', '셀트리온', 'HLB', '알테오젠', '제약', '메디', '헬스', '신라젠'] },
    { sector: '인터넷·게임·콘텐츠', keywords: ['카카오', 'NAVER', '게임', '엔씨', '위메이드', 'JYP', '스튜디오', '콘텐츠'] },
    { sector: '자동차·부품', keywords: ['현대차', '기아', '모비스', '만도', '화신', '성우하이텍'] },
    { sector: '식품·소비재', keywords: ['식품', '푸드', '농심', '오리온', 'CJ', '빙그레', '하이트', '음료'] },
    { sector: '금융·증권', keywords: ['금융', '증권', '은행', '보험', '투자', '캐피탈'] },
    { sector: '건설·기계·조선', keywords: ['건설', '중공업', '조선', '기계', '두산', 'HD현대', '삼성중공업'] }
  ];

  return rules.find((rule) => rule.keywords.some((keyword) => name.includes(keyword)))?.sector ?? '기타 산업';
}

function summarizeDirectionalSectors(gainers: [string, number][], losers: [string, number][]) {
  const groups = new Map<string, { upNames: string[]; downNames: string[]; upRates: number[]; downRates: number[] }>();

  gainers.forEach(([name, rate]) => {
    const sector = sectorOf(name);
    const group = groups.get(sector) ?? { upNames: [], downNames: [], upRates: [], downRates: [] };
    group.upNames.push(name);
    group.upRates.push(rate);
    groups.set(sector, group);
  });

  losers.forEach(([name, rate]) => {
    const sector = sectorOf(name);
    const group = groups.get(sector) ?? { upNames: [], downNames: [], upRates: [], downRates: [] };
    group.downNames.push(name);
    group.downRates.push(rate);
    groups.set(sector, group);
  });

  const scored = [...groups.entries()].map(([name, group]) => {
    const upAvg = group.upRates.length ? group.upRates.reduce((sum, rate) => sum + rate, 0) / group.upRates.length : 0;
    const downAvg = group.downRates.length ? group.downRates.reduce((sum, rate) => sum + rate, 0) / group.downRates.length : 0;
    const score = upAvg + downAvg;
    return { name, group, upAvg, downAvg, score };
  });

  const best = scored
    .filter((item) => item.group.upRates.length > 0 && item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 2)
    .map((item) => {
      const examples = item.group.upNames.slice(0, 2).join(', ');
      return {
        name: item.name,
        reason: `${examples} 중심으로 매수세가 더 우세한 흐름이에요.`,
        rate: item.upAvg
      };
    });

  const avoid = scored
    .filter((item) => item.group.downRates.length > 0 && item.score < 0 && !best.some((sector) => sector.name === item.name))
    .sort((a, b) => a.score - b.score)
    .slice(0, 2)
    .map((item) => {
      const examples = item.group.downNames.slice(0, 2).join(', ');
      return {
        name: item.name,
        reason: `${examples} 중심으로 매도 압력이 더 크게 나타나요.`,
        rate: item.downAvg
      };
    });

  return { best, avoid };
}

function MatchCard({ movers }: { movers: Movers }) {
  const matches = sectorMatches(movers);

  return (
    <section className="card match-card reveal">
      <h2>🌸 오늘의 동물 투자 궁합</h2>
      <div className="match-grid">
        <article>
          <span>BEST MATCH</span>
          <h3>상승 관심 섹터</h3>
          <div className="sector-list">
            {matches.best.map((item) => (
              <div key={item.name}>
                <strong>{item.name}</strong>
                <p>{item.reason}</p>
                <b>{formatPercent(item.rate)}</b>
              </div>
            ))}
          </div>
          <CharacterImage src={characters.rabbitSit} alt="토끼 캐릭터" className="match-character" />
        </article>
        <article>
          <span>AVOID MATCH</span>
          <h3>주의 섹터</h3>
          <div className="sector-list">
            {matches.avoid.map((item) => (
              <div key={item.name}>
                <strong>{item.name}</strong>
                <p>{item.reason}</p>
                <b className="down">{formatPercent(item.rate)}</b>
              </div>
            ))}
          </div>
          <CharacterImage src={characters.hippo} alt="하마 캐릭터" className="match-character" />
        </article>
      </div>
    </section>
  );
}

function QuoteCard() {
  return (
    <section className="card quote-card reveal">
      <h2>오늘의 투자 기운 한 마디</h2>
      <span>”</span>
      <p>“시장에 활기찬 바람이 불어와도, 토끼처럼 빠르게 보고 거북이처럼 천천히 확인하는 마음이 좋아요.”</p>
      <strong>- Zooseek Financial Magic Box -</strong>
    </section>
  );
}

function App() {
  const [range, setRange] = useState<RangeKey>('1d');
  const [cardIndices, setCardIndices] = useState<MarketIndex[]>(fallbackIndices);
  const [chartIndices, setChartIndices] = useState<MarketIndex[]>(fallbackIndices);
  const [mood, setMood] = useState({ score: 62, label: '온화한 상승' });
  const [marketSource, setMarketSource] = useState('loading');
  const [disclosures, setDisclosures] = useState<Disclosure[]>([]);
  const [movers, setMovers] = useState<Movers>({
    kospi: { gainers: [], losers: [] },
    kosdaq: { gainers: [], losers: [] }
  });

  useEffect(() => {
    fetchJson<{ indices: MarketIndex[]; mood: { score: number; label: string }; source: string }>('/api/market/indices?range=1d')
      .then((data) => {
        setCardIndices(data.indices);
        setMood(data.mood);
        setMarketSource(data.source);
      })
      .catch(() => setMarketSource('fallback'));
  }, []);

  useEffect(() => {
    fetchJson<{ indices: MarketIndex[] }>(`/api/market/indices?range=${range}`)
      .then((data) => setChartIndices(data.indices))
      .catch(() => undefined);
  }, [range]);

  useEffect(() => {
    fetchJson<{ items: Disclosure[] }>('/api/dart/disclosures')
      .then((data) => setDisclosures(data.items))
      .catch(() => setDisclosures([]));

    fetchJson<Movers>('/api/market/top-movers').then(setMovers).catch(() => undefined);
  }, []);

  const moodLabel = useMemo(() => {
    if (mood.score >= 61) return '토끼';
    if (mood.score <= 44) return '하마';
    return '거북이';
  }, [mood.score]);

  return (
    <main className="dashboard">
      <HeroHeader moodLabel={moodLabel} source={marketSource} />
      <section className="top-grid">
        {cardIndices.map((item) => (
          <IndexCard item={item} key={item.id} />
        ))}
        <MarketMoodGauge score={mood.score} label={mood.label} />
      </section>
      <section className="middle-grid">
        <ComparisonChart indices={chartIndices} range={range} setRange={setRange} />
        <DisclosureFeed items={disclosures} />
      </section>
      <section className="widget-grid">
        <DailyReportCard indices={cardIndices} />
        <MoversCard movers={movers} />
        <MemoCard />
      </section>
      <section className="bottom-grid">
        <MatchCard movers={movers} />
        <QuoteCard />
      </section>
    </main>
  );
}

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
