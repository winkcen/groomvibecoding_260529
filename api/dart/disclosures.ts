const fallbackItems = [
  {
    id: 'fallback-1',
    corpName: '삼성전자',
    stockCode: '005930',
    reportName: '주요사항보고서',
    receiptDate: '오늘',
    tag: '실적',
    originalUrl: 'https://dart.fss.or.kr/'
  },
  {
    id: 'fallback-2',
    corpName: '카카오',
    stockCode: '035720',
    reportName: '타법인 주식 및 출자증권 처분결정',
    receiptDate: '오늘',
    tag: '기타공시',
    originalUrl: 'https://dart.fss.or.kr/'
  },
  {
    id: 'fallback-3',
    corpName: '현대차',
    stockCode: '005380',
    reportName: '자기주식취득 신탁계약 체결 결정',
    receiptDate: '오늘',
    tag: '자사주',
    originalUrl: 'https://dart.fss.or.kr/'
  }
];

function yyyymmdd(date: Date) {
  return date.toISOString().slice(0, 10).replaceAll('-', '');
}

function classify(reportName: string) {
  if (/유상증자|증자/.test(reportName)) return '유상증자';
  if (/자기주식|자사주/.test(reportName)) return '자사주';
  if (/영업실적|매출액|손익구조|실적/.test(reportName)) return '실적';
  if (/불성실|관리종목|횡령|배임|상장폐지/.test(reportName)) return '투자주의';
  return '기타공시';
}

export default async function handler(req: any, res: any) {
  const key = process.env.DART_API_KEY;

  if (!key) {
    res.status(200).json({
      items: fallbackItems,
      source: 'fallback',
      message: 'DART_API_KEY가 설정되면 실제 공시가 표시됩니다.'
    });
    return;
  }

  const end = new Date();
  const start = new Date(end);
  start.setDate(end.getDate() - 7);

  try {
    const params = new URLSearchParams({
      crtfc_key: key,
      bgn_de: yyyymmdd(start),
      end_de: yyyymmdd(end),
      page_no: '1',
      page_count: '8',
      sort: 'date',
      sort_mth: 'desc'
    });
    const response = await fetch(`https://opendart.fss.or.kr/api/list.json?${params.toString()}`);
    const json = await response.json();

    if (json.status !== '000') throw new Error(json.message ?? 'DART request failed');

    const items = (json.list ?? []).map((item: any) => ({
      id: item.rcept_no,
      corpName: item.corp_name,
      stockCode: item.stock_code,
      reportName: item.report_nm,
      receiptDate: item.rcept_dt,
      tag: classify(item.report_nm),
      originalUrl: `https://dart.fss.or.kr/dsaf001/main.do?rcpNo=${item.rcept_no}`
    }));

    res.status(200).json({ items, source: 'dart' });
  } catch (error) {
    res.status(200).json({
      items: fallbackItems,
      source: 'fallback',
      error: error instanceof Error ? error.message : 'unknown error'
    });
  }
}
