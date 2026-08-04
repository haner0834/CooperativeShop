/**
 * Gemini structured output 用的 responseSchema（OpenAPI 3.0 子集）。
 * 對應 AiReviewResult 這個 TS interface。
 */
const fieldResultSchema = {
  type: 'object',
  properties: {
    isValid: { type: 'boolean' },
    reason: { type: 'string' },
    source: {
      type: 'string',
      enum: [
        '合約掃描',
        '店家提供資料',
        '官方網站',
        '官方社群',
        'Google Maps',
        '其他公開資訊',
        '無法查證',
      ],
    },
  },
  required: ['isValid', 'reason', 'source'],
};

export const AI_REVIEW_RESPONSE_SCHEMA = {
  type: 'object',
  properties: {
    title: fieldResultSchema,
    subtitle: fieldResultSchema,
    description: fieldResultSchema,
    discount: fieldResultSchema,
    contactInfo: fieldResultSchema,
    location: fieldResultSchema,
    // NOTE: 原本叫 contractScan，改名對齊 ShopDraft.contract 欄位命名。
    contract: fieldResultSchema,
    workSchedules: fieldResultSchema,
    isPassed: { type: 'boolean' },
    summary: { type: 'string' },
    suggestions: {
      type: 'object',
      properties: {
        title: { type: 'string' },
        subtitle: { type: 'string' },
        description: { type: 'string' },
        discount: { type: 'string' },
        contactInfo: { type: 'string' },
        location: { type: 'string' },
        contract: { type: 'string' },
        workSchedules: { type: 'string' },
      },
    },
  },
  required: [
    'title',
    'subtitle',
    'description',
    'discount',
    'contactInfo',
    'location',
    'contract',
    'workSchedules',
    'isPassed',
    'summary',
    'suggestions',
  ],
};

export const DEFAULT_GEMINI_MODEL = 'gemini-3.5-flash';
export const DEFAULT_GEMINI_API_BASE_URL =
  'https://generativelanguage.googleapis.com/v1beta';

// 第二次以後的審核改走免費專案的 quota，預設沿用同一顆模型，
// 但保留 GEMINI_FREE_MODEL 環境變數可覆寫，以防免費專案只開放特定模型。
export const DEFAULT_GEMINI_FREE_MODEL = DEFAULT_GEMINI_MODEL;
