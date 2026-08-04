/**
 * 一筆從 Gemini `googleSearch` grounding 結果整理出來的公開資訊來源。
 *
 * 只在「第一次審核」（此 draft 尚未有任何 aiGroundingSources）時，
 * 透過 googleSearch tool 取得並存到 ShopDraft.aiGroundingSources；
 * 之後的審核直接把這份清單當作 public_info 塞進 prompt，
 * 不再啟用 googleSearch，藉此省下 grounding 的費用。
 */
export interface AiReviewGroundingSource {
  uri: string;
  title: string;
}

/**
 * 存進 ShopDraft.aiGroundingSources 的完整快照。
 * 除了來源清單外，順便記錄當初的搜尋關鍵字與擷取時間，
 * 方便之後除錯／人工檢視「AI 當初到底查了什麼」。
 */
export interface AiReviewGroundingSnapshot {
  fetchedAt: string; // ISO timestamp
  webSearchQueries: string[];
  sources: AiReviewGroundingSource[];
}
