import { type Dispatch, useRef } from "react";
import QuestionBlock from "./QuestionBlock";
import {
  CloudAlert,
  Upload,
  X,
  FileText,
  FileX,
  FileExclamationPoint,
} from "lucide-react";
import { AnimatedCloudUploadIcon } from "../../widgets/icon-animation/CloudUploadIcon";
import { useAuthFetch } from "../../auth/useAuthFetch";
import { path } from "../../utils/path";
import { uploadToR2 } from "../../utils/upload-to-r2";
import { useToast } from "../../widgets/Toast/ToastProvider";

export interface UploadedContract {
  fileName: string;
  fileSize: number;
  status: "idle" | "uploading" | "success" | "error" | "deleting";
  uploadProgress: number;
  fileKey?: string;
  uploadUrl?: string;
  errorMessage?: string;
}

interface ShopContractBlockProps {
  contract: UploadedContract | null;
  setContract: Dispatch<React.SetStateAction<UploadedContract | null>>;
  showHint: boolean;
}

const ShopContractBlock = ({
  contract,
  setContract,
  showHint,
}: ShopContractBlockProps) => {
  const { authedFetch } = useAuthFetch();
  const { showToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];

    // Android 容錯：有些 Android 裝置的 file.type 可能為空字串，以副檔名做二次確認
    const isPdfType =
      file.type === "application/pdf" || file.type.includes("pdf");
    const isPdfExtension = file.name.toLowerCase().endsWith(".pdf");

    if (!isPdfType && !isPdfExtension) {
      showToast({
        title: "不支援的檔案格式，請上傳 .pdf 檔案。",
        icon: <FileExclamationPoint className="text-error" />,
      });
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    if (file.size > 3 * 1024 * 1024) {
      showToast({
        title: "檔案過大，請上傳 3 MB 以下的檔案。",
        icon: <FileX className="text-error" />,
      });
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    const newContract: UploadedContract = {
      fileName: file.name,
      fileSize: file.size,
      status: "uploading", // 修正點：直接設為 uploading，避免 UI 卡在 idle
      uploadProgress: 5, // 設定 5% 讓使用者感覺到「系統已經開始處理」
    };

    setContract(newContract);

    // 啟動自訂的上傳邏輯
    await uploadContractFile(file);

    // 清空 input 讓重複上傳同一個檔案能被觸發
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const uploadContractFile = async (file: File) => {
    try {
      let apiResponse;
      try {
        apiResponse = await authedFetch(path("/api/storage/presigned-url"), {
          method: "POST",
          body: JSON.stringify({
            fileName: file.name,
            contentType: "application/pdf",
            category: "shop-contract",
            hasThumbnail: false,
            fileSize: file.size,
          }),
        });
      } catch (err) {
        throw new Error("無法取得上傳授權，請檢查網路連線。");
      }

      const { success, data, error } = apiResponse || {};
      if (!success || !data) {
        throw new Error(
          error?.message || error || "取得上傳網址失敗，伺服器無回應。"
        );
      }

      const { uploadUrl, fileKey } = data;
      if (!uploadUrl || !fileKey) {
        throw new Error("伺服器未提供有效的上傳憑證。");
      }

      // 進度提升到 10% 代表網址取得成功
      updateProgress(10);

      // 2. 上傳至 Cloudflare R2 (10% ~ 90%)
      await uploadToR2(uploadUrl, file, "application/pdf", (progress) =>
        updateProgress(10 + progress * 0.8)
      );

      // 3. 確認上傳完成
      await confirmUpload(fileKey, uploadUrl);
    } catch (err: any) {
      const userFriendlyError =
        err?.message || "檔案上傳過程中發生非預期錯誤。";

      setContract(() => ({
        fileName: file.name,
        fileSize: file.size,
        uploadProgress: 0,
        status: "error",
        errorMessage: userFriendlyError,
      }));
    }
  };

  const confirmUpload = async (fileKey: string, uploadUrl: string) => {
    let result;
    try {
      result = await authedFetch(path("/api/storage/confirm-upload"), {
        method: "POST",
        body: JSON.stringify({
          fileKey,
          category: "shop-contract",
          contentType: "application/pdf",
        }),
      });
    } catch (err) {
      throw new Error("確認檔案狀態時連線失敗。");
    }

    const { success, meta, error } = result || {};
    if (!success) {
      throw new Error(error?.message || error || "伺服器無法確認檔案完整性。");
    }

    if (meta && !meta.isExist) {
      throw new Error("檔案尚未順利寫入雲端儲存區，請重試。");
    }

    // 成功完成
    setContract((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        status: "success",
        uploadProgress: 100,
        fileKey,
        uploadUrl,
        errorMessage: undefined,
      };
    });
  };

  const updateProgress = (progress: number) => {
    setContract((prev) => {
      if (!prev) return null;
      return { ...prev, uploadProgress: Math.min(Math.round(progress), 100) };
    });
  };

  const handleRemove = async () => {
    try {
      if (!contract?.fileKey) {
        setContract(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
        return;
      }

      setContract((prev) => (prev ? { ...prev, status: "deleting" } : null));

      const apiResponse = await authedFetch(path("/api/storage/delete"), {
        method: "POST",
        body: JSON.stringify({
          fileKey: contract.fileKey,
        }),
      });

      if (!apiResponse?.success) {
        showToast({
          title: "刪除舊檔案失敗，請重新嘗試",
          icon: <FileX className="text-error" />,
        });
      }
      setContract(null);
    } catch (error) {
      setContract(null);
    }
  };

  return (
    <QuestionBlock
      title="合約書"
      status={contract?.status === "success" ? "ok" : "required"}
      description="請掃描店家簽署的合約書，以 `.pdf` 格式上傳。"
      hint="尚未上傳合約書"
      showHint={showHint}
    >
      <div className="w-full aspect-[3/1] relative flex-none rounded-field overflow-hidden">
        <input
          type="file"
          ref={fileInputRef}
          accept="application/pdf"
          className="hidden"
          onChange={handleFileChange}
        />

        {!contract ? (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="w-full h-full bg-base-300 rounded-field flex flex-col items-center justify-center space-y-1 hover:bg-base-200 transition cursor-pointer"
          >
            <div className="p-2 bg-neutral/10 rounded-full">
              <Upload className="text-base-100" />
            </div>
            <p className="text-sm font-medium">上傳簽章合約 (PDF)</p>
            <p className="text-xs opacity-50">僅支援 PDF 格式</p>
          </button>
        ) : (
          <div className="w-full h-full bg-base-200 flex flex-col items-center justify-center p-4 relative">
            {/* 顯示檔案基本資訊 */}
            {contract.status !== "error" && (
              <div className="flex items-center space-x-3 mb-2 max-w-[80%]">
                <FileText className="text-primary flex-shrink-0" size={28} />
                <div className="truncate">
                  <p className="text-sm font-semibold truncate">
                    {contract.fileName}
                  </p>
                  <p className="text-xs opacity-50">
                    {(contract.fileSize / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              </div>
            )}

            {/* 上傳中 (含進度條與狀態顯示) */}
            {(contract.status === "uploading" ||
              contract.status === "idle") && (
              <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center text-white px-4">
                <AnimatedCloudUploadIcon />
                <p className="text-xs mt-1">
                  {contract.uploadProgress < 10
                    ? "正在取得授權..."
                    : "檔案上傳中..."}
                </p>
                <div className="w-[60%] h-1 bg-white/20 rounded-full mt-2 overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all duration-150"
                    style={{ width: `${contract.uploadProgress}%` }}
                  />
                </div>
              </div>
            )}

            {/* 錯誤狀態：向使用者呈現詳細錯誤 */}
            {contract.status === "error" && (
              <div className="absolute inset-0 bg-error/10 flex flex-col items-center justify-center p-3 border-2 border-error/20 rounded-field text-center">
                <CloudAlert className="text-error mb-1" size={24} />
                <p className="text-sm font-semibold text-error">上傳失敗</p>
                <p
                  className="text-xs text-error/80 my-1 max-w-[90%] truncate"
                  title={contract.errorMessage}
                >
                  {contract.errorMessage || "系統無回應，請重試"}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setContract(null);
                    if (fileInputRef.current) fileInputRef.current.value = "";
                  }}
                  className="btn btn-xs btn-error btn-outline mt-1"
                >
                  重新選取檔案
                </button>
              </div>
            )}

            {/* 上傳成功 */}
            {contract.status === "success" && (
              <button
                type="button"
                onClick={handleRemove}
                className="absolute top-2 right-2 bg-black/60 hover:bg-black/80 rounded-full p-1.5 text-white transition-colors"
                title="刪除檔案"
              >
                <X size={14} />
              </button>
            )}
          </div>
        )}
      </div>
    </QuestionBlock>
  );
};

export default ShopContractBlock;
