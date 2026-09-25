import axios from "axios";

export const uploadToR2 = async (
  uploadUrl: string,
  file: File,
  contentType: string,
  onProgress: (percent: number) => void
) => {
  try {
    await axios.put(uploadUrl, file, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
      timeout: 60000,
      onUploadProgress: (e) => {
        if (e.total && e.total > 0) {
          onProgress((e.loaded / e.total) * 100);
        }
      },
    });
  } catch (err: any) {
    if (axios.isAxiosError(err)) {
      if (err.code === "ECONNABORTED") {
        throw new Error("檔案上傳超時，請檢查網路連線後重試。");
      }
      if (err.response) {
        // R2 回傳 HTTP 狀態碼錯誤
        const status = err.response.status;
        if (status === 403) {
          throw new Error("上傳權限驗證失敗 (403)，請重新操作。");
        } else if (status === 400) {
          throw new Error("上傳請求格式不符 (400)，請更換檔案後重試。");
        } else {
          throw new Error(`伺服器儲存失敗 (${status})，請稍後再試。`);
        }
      } else if (err.request) {
        // 發出了 Request 但沒有收到 Response (通常是跨域 CORS 或網路中斷)
        throw new Error("無法連接至雲端儲存空間，請檢查網路或跨域設定。");
      }
    }
    throw new Error(err?.message || "檔案上傳至雲端時發生未知錯誤。");
  }
};
