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

    if (file.type !== "application/pdf" && !file.name.endsWith(".pdf")) {
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

      return;
    }

    const newContract: UploadedContract = {
      fileName: file.name,
      fileSize: file.size,
      status: "idle",
      uploadProgress: 0,
    };

    setContract(newContract);

    // 啟動您自訂的上傳邏輯
    await uploadContractFile(file);

    // 清空 input 讓重複上傳同一個檔案能被觸發
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const uploadContractFile = async (file: File) => {
    try {
      const apiResponse = await authedFetch(
        path("/api/storage/presigned-url"),
        {
          method: "POST",
          body: JSON.stringify({
            fileName: file.name,
            contentType: "image/webp",
            category: "shop-image",
            hasThumbnail: false,
            fileSize: file.size,
          }),
        }
      );

      const { success, data, error } = apiResponse;
      if (!success) {
        console.error(error);
        return;
      }

      const { uploadUrl, fileKey } = data;

      await uploadToR2(uploadUrl, file, (progress) =>
        updateProgress(progress * 0.8)
      );

      await confirmUpload(fileKey, uploadUrl);
    } catch {
      setContract({
        uploadProgress: 0,
        fileName: "",
        fileSize: 0,
        uploadUrl: undefined,
        fileKey: undefined,
        status: "idle",
      });
    }
  };

  const confirmUpload = async (fileKey: string, uploadUrl: string) => {
    const result = await authedFetch(path("/api/storage/confirm-upload"), {
      method: "POST",
      body: JSON.stringify({
        fileKey,
        category: "shop-contract",
        contentType: "application/pdf",
      }),
    });

    const { success, meta, error } = result;
    if (!success) {
      console.error(error);
    }

    if (!meta.isExist) {
      console.error(error);
    }

    setContract((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        isUploading: false,
        status: "success",
        uploadProgress: 100,
        fileKey,
        uploadUrl,
      };
    });
  };

  const updateProgress = (progress: number) => {
    setContract((prev) => {
      if (!prev) return null;

      return { ...prev, uploadProgress: progress };
    });
  };

  // 3. 移除/刪除檔案邏輯（請在此處實作 R2/後端刪除 API）
  const handleRemove = async () => {
    try {
      setContract((prev) => (prev ? { ...prev, status: "deleting" } : null));

      if (!contract?.fileKey) {
        setContract(null);
        return;
      }

      const apiResponse = await authedFetch(path("/api/storage/delete"), {
        method: "POST",
        body: JSON.stringify({
          fileKey: contract.fileKey,
        }),
      });
      if (!apiResponse.success) {
        return;
      }
      setContract(null);
    } catch (error) {}
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
        {/* 隱藏的真實 file input */}
        <input
          type="file"
          ref={fileInputRef}
          accept="application/pdf"
          className="hidden"
          onChange={handleFileChange}
        />

        {!contract ? (
          // 未上傳狀態（按鈕）
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
          // 已選擇/上傳中的容器狀態
          <div className="w-full h-full bg-base-200 flex flex-col items-center justify-center p-4 relative">
            {/* 檔案基本圖示與名稱顯示 */}
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

            {/* 上傳中 (含動畫與進度條) */}
            {(contract.status === "uploading" ||
              contract.status === "idle") && (
              <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center text-white">
                <AnimatedCloudUploadIcon />
                <p className="text-xs mt-1">
                  {contract.status === "idle" ? "準備中..." : "檔案上傳中..."}
                </p>
                <div className="w-[60%] h-1 bg-white/20 rounded-full mt-2 overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all duration-150"
                    style={{ width: `${contract.uploadProgress}%` }}
                  />
                </div>
              </div>
            )}

            {/* 錯誤狀態 */}
            {contract.status === "error" && (
              <div className="absolute inset-0 bg-error/10 flex flex-col items-center justify-center p-3 border-2 border-error/20 rounded-field">
                <CloudAlert className="text-error mb-1" size={24} />
                <p className="text-sm font-semibold text-error">上傳失敗</p>
                <p className="text-xs opacity-70 mb-2">
                  {contract.errorMessage || "未知錯誤"}
                </p>
                <button
                  type="button"
                  onClick={handleRemove}
                  className="btn btn-xs btn-error btn-outline"
                >
                  清除並重試
                </button>
              </div>
            )}

            {/* 上傳成功：顯示刪除/重傳按鈕 */}
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
