type SummaryBody = {
  corpName?: string;
  reportName?: string;
  receiptDate?: string;
  rawText?: string;
};

const fallbackSummary = (corpName: string, reportName: string) => ({
  summary: `${corpName}의 "${reportName}" 공시를 투자자가 읽기 쉬운 형태로 요약했어요.`,
  easyExplanation: '공시 제목과 유형을 먼저 확인하고, 자금 조달·자사주·실적처럼 주가에 직접 영향을 줄 수 있는 항목인지 살펴보면 좋아요.',
  characterComment: '하마가 노트를 펼쳤어요. 단정하기보다 조건과 목적을 차분히 확인할 타이밍이에요.',
  riskNotes: ['공시 원문 확인', '공시 목적과 규모 확인', '단기 변동성 유의'],
  source: 'fallback'
});

export default async function handler(req: any, res: any) {
  const body: SummaryBody = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body ?? {};
  const reportName = body.reportName ?? '공시';
  const corpName = body.corpName ?? '해당 기업';

  if (!process.env.OPENAI_API_KEY) {
    res.status(200).json(fallbackSummary(corpName, reportName));
    return;
  }

  try {
    const response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || 'gpt-4.1-mini',
        input: [
          {
            role: 'system',
            content:
              '너는 Zooseek의 금융 공시 요약 도우미다. 공시를 쉽게 설명하되 매수/매도 추천을 단정하지 않는다. 반드시 JSON만 반환한다.'
          },
          {
            role: 'user',
            content: JSON.stringify({
              corpName,
              reportName,
              receiptDate: body.receiptDate,
              rawText: body.rawText,
              schema: {
                summary: 'string',
                easyExplanation: 'string',
                characterComment: 'string',
                riskNotes: ['string']
              }
            })
          }
        ],
        text: {
          format: {
            type: 'json_schema',
            name: 'zooseek_disclosure_summary',
            strict: true,
            schema: {
              type: 'object',
              additionalProperties: false,
              properties: {
                summary: { type: 'string' },
                easyExplanation: { type: 'string' },
                characterComment: { type: 'string' },
                riskNotes: {
                  type: 'array',
                  items: { type: 'string' }
                }
              },
              required: ['summary', 'easyExplanation', 'characterComment', 'riskNotes']
            }
          }
        }
      })
    });

    if (!response.ok) throw new Error(`OpenAI failed: ${response.status}`);

    const data = await response.json();
    const text = data.output_text ?? data.output?.[0]?.content?.[0]?.text;
    const parsed = JSON.parse(text);
    res.status(200).json({ ...parsed, source: 'openai' });
  } catch (error) {
    res.status(200).json({
      ...fallbackSummary(corpName, reportName),
      error: error instanceof Error ? error.message : 'unknown error'
    });
  }
}
