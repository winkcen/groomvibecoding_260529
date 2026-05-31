# Zooseek V2 기술명세서

## 1. 프로젝트 개요

**앱 이름:** Zooseek  
**컨셉:** Dart API + GPT API 기반 아날로그 감성, 귀여운 MZ 스타일 금융 대시보드  
**핵심 문장:** 공시와 시장 데이터를, 귀여운 캐릭터와 함께 읽는 감성 투자 리포트 앱

Zooseek은 주요 지수, 실시간 공시, AI 요약 리포트, 투자 메모, 캐릭터 기반 투자 힌트를 한 화면에서 보여주는 웹 대시보드 앱이다. 기존 금융 앱처럼 차갑고 복잡한 화면이 아니라, 흰 종이 위에 스티커와 젤리 피규어를 올려둔 듯한 감성적인 인터페이스를 목표로 한다.

대상 사용자는 국내 주식과 해외 주요 지수를 가볍게 모니터링하면서, DART 공시를 GPT가 쉬운 말로 풀어주는 리포트를 받고 싶은 개인 투자자다.

## 2. 레퍼런스 디자인 해석

### 2.1 대시보드 레이아웃

참고 이미지: `../zooseek/ChatGPT Image 2026년 5월 30일 오후 10_22_34.png`

첫 화면은 데스크톱 기준 1440px 내외의 넓은 대시보드이며, 전체 배경은 아주 연한 라벤더 화이트 계열이다. 주요 UI는 둥근 카드, 얇은 보더, 부드러운 그림자, 파스텔 포인트 컬러로 구성한다.

화면 구성 순서는 다음과 같다.

1. 상단 히어로 헤더
   - 좌측: 큰 토끼 캐릭터
   - 중앙: 사용자 인사말, 오늘의 응원 문구, 시장 모드 배지
   - 우측: 검색창, 알림 버튼
2. 주요 지수 카드 3개
   - KOSPI, NASDAQ, S&P 500
   - 현재가, 등락폭, 등락률, 미니 라인 차트, 캐릭터
3. 시장 분위기 카드
   - 공포/탐욕 게이지
   - 캐릭터와 상태 라벨
4. 주요 지수 차트
   - 1일, 1주, 1개월, 3개월, 1년 탭
   - KOSPI/NASDAQ/S&P 500 비교 라인
5. 실시간 공시 피드
   - DART 공시 목록
   - 회사 로고 또는 이니셜 배지
   - 공시 중요도 태그
   - GPT 요약 버튼
6. 하단 위젯
   - 오늘의 AI 한줄 리포트
   - 상승/하락 TOP 5
   - 오늘의 메모
7. 하단 추천 영역
   - 오늘의 동물 투자 궁합
   - 오늘의 투자 기운 한 마디

### 2.2 캐릭터 시스템

참고 이미지: `../zooseek/ChatGPT Image 2026년 5월 30일 오후 10_22_26.png`

캐릭터는 레퍼런스 시트의 형태, 비율, 표정, 질감, 색감, 포즈를 그대로 유지한다. 앱 구현 시 임의로 재해석하거나 다른 동물 스타일로 변형하지 않는다. 초기 MVP에서는 레퍼런스 기반 PNG/WebP 에셋을 사용하고, 이후 애니메이션이 필요할 경우에도 동일한 캐릭터 디자인을 유지한 Lottie 또는 Rive 에셋으로만 확장한다.

| 캐릭터 | 색상 | 금융 역할 | 사용 위치 |
| --- | --- | --- | --- |
| Rabbit / 토끼 | 핑크, 화이트 | 상승장, 빠른 흐름, 긍정 리포트 | 히어로, 상승 상태 카드, 상승 추천 |
| Hippo / 하마 | 퍼플 | 하락장, 신중함, 리스크 확인 | 하락 상태 카드, 메모 카드, AI 리포트, 요약 버튼 |
| Turtle / 거북이 | 그린 | 보합장, 장기투자, 안정 | 보합 상태 카드, 탐욕/공포 완충 상태 |

캐릭터 표정은 시장 상태와 연결한다.

| 시장 상태 | 캐릭터 감정 |
| --- | --- |
| 강한 상승 | 토끼가 손 흔들기, 반짝이 |
| 완만한 상승 | 토끼 또는 거북이가 미소 |
| 혼조 | 하마가 물음표 표정 |
| 하락 | 하마가 노트북을 들고 분석 |
| 급락 | 거북이가 방어 자세 |

## 3. 기술 스택

### 3.1 프론트엔드

- React
- Vite
- TypeScript
- CSS Modules 또는 Vanilla CSS + CSS Variables
- Recharts 또는 Lightweight Charts
- TanStack Query
- Zustand
- lucide-react

### 3.2 백엔드/API

Vercel 배포를 기준으로 별도 Express 서버 대신 **Vercel Serverless Functions**를 사용한다.

- `/api/market/indices`
- `/api/market/top-movers`
- `/api/dart/disclosures`
- `/api/ai/disclosure-summary`
- `/api/ai/daily-report`
- `/api/ai/investment-fortune`

API Key는 프론트엔드에 노출하지 않고 Vercel 환경변수로 관리한다.

### 3.3 외부 API

| API | 목적 |
| --- | --- |
| DART Open API | 국내 기업 공시 검색, 공시 원문 링크, 보고서 메타데이터 |
| GPT API | 공시 요약, 시장 한줄 리포트, 투자 기운 문구 생성 |
| 금융 시세 API | KOSPI, NASDAQ, S&P 500 및 상승/하락 종목 데이터 |

금융 시세 API는 MVP 단계에서 선택지가 필요하다.

- 1순위: 한국/미국 지수를 모두 제공하는 유료 API
- 2순위: 한국 지수는 별도 API, 미국 지수는 Twelve Data/Polygon/Finnhub 등 사용
- 3순위: MVP 데모에서는 mock data를 두고 API 어댑터만 먼저 설계

## 4. 폴더 구조

```txt
Zooseek_V2/
  api/
    ai/
      daily-report.ts
      disclosure-summary.ts
      investment-fortune.ts
    dart/
      disclosures.ts
    market/
      indices.ts
      top-movers.ts
  public/
    assets/
      characters/
        rabbit-front.webp
        rabbit-wave.webp
        hippo-front.webp
        hippo-memo.webp
        turtle-front.webp
      textures/
        paper-noise.png
  src/
    app/
      App.tsx
      routes.tsx
    components/
      ai/
        DailyReportCard.tsx
        InvestmentFortuneCard.tsx
      charts/
        IndexComparisonChart.tsx
        Sparkline.tsx
      common/
        Card.tsx
        SearchBar.tsx
        Tag.tsx
      dashboard/
        DashboardPage.tsx
        HeroHeader.tsx
        IndexCard.tsx
        MarketMoodGauge.tsx
      dart/
        DisclosureFeed.tsx
        DisclosureItem.tsx
      memo/
        MemoCard.tsx
      movers/
        TopMoversCard.tsx
    hooks/
      useDisclosures.ts
      useIndices.ts
      useTopMovers.ts
    lib/
      apiClient.ts
      formatters.ts
      marketMood.ts
      promptContracts.ts
    styles/
      globals.css
      tokens.css
    types/
      ai.ts
      dart.ts
      market.ts
  .env.example
  index.html
  package.json
  tsconfig.json
  vercel.json
  vite.config.ts
```

## 5. 화면 상세 명세

### 5.1 DashboardPage

대시보드는 CSS Grid로 구성한다.

데스크톱:

- 전체 max-width: `1360px`
- 좌우 padding: `40px`
- grid gap: `24px`
- 상단 지수 카드: `repeat(4, 1fr)`
- 메인 차트: 2컬럼
- 하단 위젯: 3컬럼

모바일:

- 전체 padding: `16px`
- 모든 카드는 1컬럼 스택
- 차트는 가로 스크롤 대신 높이를 줄이고 범례를 하단으로 이동
- 히어로 캐릭터는 96px 크기로 축소

### 5.2 HeroHeader

표시 요소:

- 토끼 캐릭터
- `Jane 님, 좋은 아침이에요!`
- `오늘도 똑똑한 투자를 응원해요`
- 시장 상태 배지: `오늘의 시장은 🐰 토끼 모드예요! 완만한 상승 흐름이 보여요.`
- 검색창 placeholder: `종목명 또는 키워드 검색`
- 알림 아이콘 버튼

사용자명은 MVP에서 고정값으로 두고, 이후 설정 화면에서 변경 가능하게 한다.

### 5.3 IndexCard

props:

```ts
type IndexCardProps = {
  name: 'KOSPI' | 'NASDAQ' | 'S&P 500';
  value: number;
  change: number;
  changeRate: number;
  points: Array<{ time: string; value: number }>;
  character: 'rabbit' | 'hippo' | 'turtle';
};
```

색상과 캐릭터는 지수 종류에 고정하지 않고, 해당 지수의 현재 흐름에 따라 동적으로 결정한다.

| 상태 | 컬러 | 캐릭터 | 의미 |
| --- | --- | --- | --- |
| 상승 | 핑크 `#ff4f8b` | 토끼 | 빠른 상승 흐름, 긍정적인 에너지 |
| 하락 | 퍼플 `#7c5cff` | 하마 | 신중한 관찰, 리스크 확인 |
| 보합 | 그린 `#45c46b` | 거북이 | 안정, 관망, 장기적 균형 |

예를 들어 KOSPI 카드도 상승 중이면 핑크/토끼로 표시하고, 하락 중이면 퍼플/하마로 변경한다. NASDAQ이나 S&P 500도 동일한 규칙을 따른다.

카드에는 반드시 다음 시각 요소가 있어야 한다.

- 좌상단 지수명
- 큰 현재가
- 등락폭/등락률
- 우측 캐릭터 이미지
- 하단 미니 라인 차트

### 5.4 MarketMoodGauge

공포/탐욕 지수를 0~100으로 표현한다.

상태 기준:

| 점수 | 라벨 | 캐릭터 |
| --- | --- | --- |
| 0~24 | 공포 | 거북이 |
| 25~44 | 조심 | 하마 |
| 45~60 | 중립 | 거북이 |
| 61~80 | 온화한 상승 | 토끼 |
| 81~100 | 과열 | 하마 |

게이지는 SVG 반원 아크로 구현한다. 중앙에는 캐릭터와 라벨을 배치한다.

### 5.5 DisclosureFeed

DART 공시 피드 표시 항목:

- 기업명
- 공시 제목
- 접수 시간
- 중요도 태그
- 한줄 설명
- `AI 요약` 버튼

중요도 분류:

| 태그 | 기준 |
| --- | --- |
| 유상증자 | `유상증자`, `증자` 포함 |
| 자사주 | `자기주식`, `자사주` 포함 |
| 실적 | `영업실적`, `매출액`, `손익구조` 포함 |
| 투자주의 | `불성실`, `관리종목`, `횡령`, `배임` 포함 |
| 기타공시 | 그 외 |

### 5.6 MemoCard

오늘의 메모는 localStorage에 저장한다.

키:

```ts
zooseek.memo.yyyy-mm-dd
```

제약:

- 최대 200자
- 자동 저장
- 우측 상단에 하마 캐릭터 표시

## 6. 데이터 타입

```ts
export type MarketIndex = {
  id: 'kospi' | 'nasdaq' | 'sp500';
  name: string;
  value: number;
  change: number;
  changeRate: number;
  currency?: string;
  updatedAt: string;
  series: Array<{
    time: string;
    value: number;
  }>;
};

export type DartDisclosure = {
  id: string;
  corpCode: string;
  corpName: string;
  stockCode?: string;
  reportName: string;
  receiptNo: string;
  receiptDate: string;
  submitter?: string;
  importanceTag: DisclosureTag;
  originalUrl: string;
};

export type DisclosureTag =
  | '유상증자'
  | '자사주'
  | '실적'
  | '투자주의'
  | '기타공시';

export type AiDisclosureSummary = {
  summary: string;
  investorImpact: 'positive' | 'neutral' | 'negative' | 'watch';
  easyExplanation: string;
  characterComment: string;
  riskNotes: string[];
};

export type DailyAiReport = {
  title: string;
  body: string;
  hashtags: string[];
  mood: 'rabbit' | 'hippo' | 'turtle';
};
```

## 7. API 명세

### 7.1 GET `/api/market/indices`

응답:

```json
{
  "indices": [
    {
      "id": "kospi",
      "name": "KOSPI",
      "value": 2728.15,
      "change": 32.86,
      "changeRate": 1.22,
      "updatedAt": "2026-05-30T13:00:00+09:00",
      "series": []
    }
  ],
  "mood": {
    "score": 62,
    "label": "온화한 상승",
    "character": "rabbit"
  }
}
```

MVP에서는 mock data를 반환하고, 이후 실제 금융 시세 API 어댑터로 교체한다.

### 7.2 GET `/api/dart/disclosures`

query:

- `keyword?: string`
- `corpCode?: string`
- `page?: number`
- `pageSize?: number`

DART Open API의 공시검색 응답을 Zooseek 내부 타입으로 변환한다.

응답:

```json
{
  "items": [
    {
      "id": "20260530000123",
      "corpCode": "00126380",
      "corpName": "삼성전자",
      "stockCode": "005930",
      "reportName": "유상증자 결정",
      "receiptNo": "20260530000123",
      "receiptDate": "2026-05-30",
      "importanceTag": "유상증자",
      "originalUrl": "https://dart.fss.or.kr/dsaf001/main.do?rcpNo=20260530000123"
    }
  ]
}
```

### 7.3 POST `/api/ai/disclosure-summary`

body:

```json
{
  "corpName": "삼성전자",
  "reportName": "유상증자 결정",
  "receiptDate": "2026-05-30",
  "rawText": "공시 원문 또는 주요 필드"
}
```

응답:

```json
{
  "summary": "삼성전자가 신규 자금 조달을 위해 유상증자를 결정했어요.",
  "investorImpact": "watch",
  "easyExplanation": "주식 수가 늘어날 수 있어 단기적으로 주가 희석 가능성을 살펴봐야 해요.",
  "characterComment": "하마가 노트를 펼쳤어요. 조건과 목적을 차분히 확인해볼 타이밍이에요.",
  "riskNotes": ["발행 규모", "자금 사용 목적", "기존 주주 희석 가능성"]
}
```

### 7.4 POST `/api/ai/daily-report`

주요 지수와 공시 요약을 입력받아 오늘의 AI 한줄 리포트를 생성한다.

## 8. GPT 프롬프트 계약

### 8.1 공시 요약 시스템 프롬프트

```txt
너는 Zooseek의 금융 공시 요약 도우미다.
사용자가 DART 공시를 쉽게 이해할 수 있도록 설명한다.
투자 조언을 단정하지 말고, 확인해야 할 포인트와 리스크를 함께 말한다.
문체는 귀엽지만 과장하지 않는다.
응답은 반드시 JSON으로만 작성한다.
```

### 8.2 공시 요약 JSON 스키마

```json
{
  "summary": "string",
  "investorImpact": "positive | neutral | negative | watch",
  "easyExplanation": "string",
  "characterComment": "string",
  "riskNotes": ["string"]
}
```

### 8.3 오늘의 리포트 시스템 프롬프트

```txt
너는 Zooseek의 감성 금융 리포터다.
주요 지수 흐름과 오늘의 공시 피드를 바탕으로 개인 투자자가 읽기 쉬운 한 단락 리포트를 작성한다.
귀엽고 따뜻한 표현은 허용하지만, 수익을 보장하거나 매수/매도 지시를 하지 않는다.
```

## 9. 환경변수

`.env.example`

```env
VITE_APP_NAME=Zooseek

DART_API_KEY=
OPENAI_API_KEY=

MARKET_DATA_PROVIDER=mock
MARKET_DATA_API_KEY=
```

Vercel 환경변수:

- `DART_API_KEY`
- `OPENAI_API_KEY`
- `MARKET_DATA_PROVIDER`
- `MARKET_DATA_API_KEY`

브라우저에서 필요한 값만 `VITE_` prefix를 붙인다. 비밀키에는 절대 `VITE_`를 붙이지 않는다.

## 10. 스타일 시스템

### 10.1 컬러 토큰

```css
:root {
  --color-bg: #fbf9ff;
  --color-surface: rgba(255, 255, 255, 0.82);
  --color-border: rgba(143, 130, 180, 0.18);
  --color-text: #1f1f2e;
  --color-muted: #8a88a3;

  --color-rabbit: #ff6f9f;
  --color-hippo: #8b63ff;
  --color-turtle: #55c878;
  --color-warning: #ffb45f;

  --shadow-card: 0 16px 40px rgba(105, 91, 140, 0.12);
  --radius-card: 20px;
}
```

### 10.2 UI 규칙

- 카드는 흰색 반투명 표면과 얇은 보더를 사용한다.
- 배경에는 아주 약한 종이 질감 이미지를 깐다.
- 주요 숫자는 선명하게, 설명 문구는 작고 부드럽게 표시한다.
- 버튼은 pill 형태를 쓰되, 아이콘 버튼에는 lucide-react 아이콘을 사용한다.
- 차트 라인은 두께 2px, 점은 선택 상태에서만 보여준다.
- 애니메이션은 180~240ms 범위의 가벼운 easing만 사용한다.

## 11. 구현 단계

### Phase 1. 정적 대시보드

- Vite + React + TypeScript 프로젝트 생성
- 레퍼런스 이미지와 동일한 대시보드 레이아웃 구현
- mock data 기반 지수 카드, 차트, 공시 피드 구현
- 캐릭터 에셋 배치

### Phase 2. API 구조 연결

- Vercel Functions 구성
- DART 공시검색 API 연결
- market mock adapter 작성
- TanStack Query로 데이터 fetching 연결

### Phase 3. GPT 요약

- 공시 요약 API 구현
- 오늘의 AI 리포트 구현
- JSON schema 기반 응답 검증
- 실패 시 fallback 문구 제공

### Phase 4. 배포와 품질

- Vercel 배포
- 환경변수 설정
- 모바일 반응형 점검
- Lighthouse 접근성/성능 점검
- API rate limit 및 캐싱 적용

## 12. Vercel 배포 설정

`vercel.json`

```json
{
  "rewrites": [
    {
      "source": "/api/(.*)",
      "destination": "/api/$1"
    }
  ]
}
```

빌드 명령:

```bash
npm run build
```

출력 디렉터리:

```txt
dist
```

## 13. 보안 및 운영 정책

- API Key는 모두 서버리스 함수에서만 사용한다.
- GPT 응답은 JSON parse 실패 가능성을 고려해 try/catch 처리한다.
- 공시 요약은 투자 조언이 아닌 정보 요약임을 UI 하단에 작게 표시한다.
- 동일 공시 요약은 receiptNo 기준으로 캐싱한다.
- DART API 장애 시 최근 캐시 또는 mock fallback을 보여준다.
- 금융 데이터는 지연될 수 있으므로 `updatedAt`을 화면에 표시한다.

## 14. MVP 완료 기준

- 첫 화면이 레퍼런스 이미지와 같은 구조로 렌더링된다.
- KOSPI/NASDAQ/S&P 500 카드가 표시된다.
- 주요 지수 비교 차트가 표시된다.
- DART 공시 피드가 표시된다.
- 공시별 `AI 요약` 버튼이 동작한다.
- 오늘의 AI 한줄 리포트가 표시된다.
- 메모가 localStorage에 저장된다.
- Vercel에 배포 가능하다.

## 15. 참고 링크

- DART Open API: https://opendart.fss.or.kr/
- OpenAI API Docs: https://platform.openai.com/docs
- Vercel Functions: https://vercel.com/docs/functions
- Vite: https://vite.dev/
- React: https://react.dev/
