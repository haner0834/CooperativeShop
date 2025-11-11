import type { Dispatch } from "react";
import QuestionBlock from "./QuestionBlock";
import { CloudAlert, Upload, X } from "lucide-react";
import type { SelectedImage } from "../../types/selectedImage";
import axios from "axios";
import { path } from "../../utils/path";
import { compressImage } from "../../utils/imageCompressor";
import { useAuthFetch } from "../../auth/useAuthFetch";
import { AnimatedCloudUploadIcon } from "../../widgets/CloudUploadIcon";

const ShopImagesBlock = ({
  images,
  setImages,
}: {
  images: SelectedImage[];
  setImages: Dispatch<React.SetStateAction<SelectedImage[]>>;
}) => {
  const { authedFetch } = useAuthFetch();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const selectedFiles = Array.from(files).slice(0, 10 - images.length);

    // 轉換成預覽圖
    const newImages: SelectedImage[] = await Promise.all(
      selectedFiles.map(async (file) => {
        const reader = new FileReader();
        const previewUrl = await new Promise<string>((resolve) => {
          reader.onload = () => resolve(reader.result as string);
          reader.readAsDataURL(file);
        });

        return {
          localId: crypto.randomUUID(),
          previewUrl,
          isUploading: false,
          uploadProgress: 0,
          status: "idle" as const,
        };
      })
    );

    setImages((prev) => [...prev, ...newImages]);

    // 啟動上傳
    for (let i = 0; i < newImages.length; i++) {
      uploadImage(selectedFiles[i], newImages[i]);
    }

    e.target.value = "";
  };

  const uploadImage = async (file: File, image: SelectedImage) => {
    const localId = image.localId;

    // 壓縮
    setImages((prev) =>
      prev.map((img) =>
        img.localId === localId
          ? { ...img, isUploading: true, status: "uploading" }
          : img
      )
    );

    try {
      const { mainImage, thumbnail: thumbnailImage } = await compressImage(
        file
      );

      // 取得 presigned urls
      const apiResponse = await authedFetch(
        path("/api/storage/presigned-url"),
        {
          method: "POST",
          body: JSON.stringify({
            fileName: file.name,
            contentType: file.type,
            category: "shop-image",
            fileSize: file.size,
          }),
        }
      );

      const { success, data, error } = apiResponse;
      if (!success) throw new Error(error.message);

      const { main, thumbnail } = data;
      const { uploadUrl, fileKey } = main;
      const { uploadUrl: thumbnailUploadUrl, fileKey: thumbnailKey } =
        thumbnail;

      // 上傳主圖 + 縮圖
      await Promise.all([
        uploadToR2(uploadUrl, mainImage, (progress) =>
          updateProgress(localId, progress * 0.8)
        ),
        uploadToR2(thumbnailUploadUrl, thumbnailImage, (progress) =>
          updateProgress(localId, 80 + progress * 0.2)
        ),
      ]);

      // 通知後端確認
      await authedFetch(path("/api/storage/confirm-upload"), {
        method: "POST",
        body: JSON.stringify({
          fileKey,
          thumbnailKey,
          category: "shop-image",
          contentType: file.type,
        }),
      });

      // 成功
      setImages((prev) =>
        prev.map((img) =>
          img.localId === localId
            ? {
                ...img,
                isUploading: false,
                uploadProgress: 100,
                status: "success",
                uploadInfo: {
                  fileKey,
                  uploadUrl,
                  thumbnailKey,
                  thumbnailUploadUrl,
                },
              }
            : img
        )
      );
    } catch (err: any) {
      console.error("Upload failed", err);
      setImages((prev) =>
        prev.map((img) =>
          img.localId === localId
            ? {
                ...img,
                isUploading: false,
                status: "error",
                errorMessage: err.message,
              }
            : img
        )
      );
    }
  };

  const uploadToR2 = async (
    uploadUrl: string,
    file: File,
    onProgress: (percent: number) => void
  ) => {
    await axios.put(uploadUrl, file, {
      headers: { "Content-Type": file.type },
      onUploadProgress: (e) => {
        if (e.total) onProgress((e.loaded / e.total) * 100);
      },
    });
  };

  const updateProgress = (localId: string, progress: number) => {
    setImages((prev) =>
      prev.map((img) =>
        img.localId === localId ? { ...img, uploadProgress: progress } : img
      )
    );
  };

  const handleRemove = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <QuestionBlock
      title="圖片"
      description="於此上傳商家的照片。至多上傳 10 張。"
    >
      <div
        className="overflow-x-scroll flex space-x-4 h-40"
        style={{
          scrollbarWidth: "none",
          msOverflowStyle: "none",
          WebkitOverflowScrolling: "touch",
        }}
      >
        {images.length < 10 && (
          <label className="cursor-pointer bg-base-300 h-full aspect-square rounded-field flex flex-col items-center justify-center space-y-1 hover:bg-base-200 transition">
            <div className="p-2 bg-neutral/10 rounded-full">
              <Upload className="text-base-100" />
            </div>
            <p className="text-sm">上傳照片</p>
            <input
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handleFileChange}
            />
          </label>
        )}

        {/* 預覽圖片 */}
        {images.map((img, i) => (
          <div
            key={img.localId}
            className="aspect-square h-full relative flex-none rounded-field overflow-hidden"
          >
            <img
              src={img.previewUrl}
              className="object-cover h-full aspect-square"
            />
            {img.isUploading && (
              <div>
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-white">
                  <AnimatedCloudUploadIcon />
                </div>

                <div
                  className="absolute bottom-2 left-2 right-2 h-1.5 bg-white rounded-full"
                  style={{
                    width: `${Math.min(Math.max(img.uploadProgress, 0), 100)}%`,
                  }}
                />
              </div>
            )}
            {img.status === "error" && (
              <div className="absolute inset-0 bg-neutral/70 flex items-center justify-center">
                <div className="flex flex-col items-center justify-center text-xs bg-base-100/80 p-2 rounded-md">
                  <CloudAlert />

                  <div>
                    上傳失敗{" "}
                    <button className="link" onClick={() => handleRemove(i)}>
                      刪除
                    </button>
                  </div>
                </div>
              </div>
            )}
            {img.status !== "error" &&
              img.status !== "uploading" &&
              !img.isUploading && (
                <button
                  onClick={() => handleRemove(i)}
                  className="absolute top-1 right-1 bg-black/60 hover:bg-black/80 rounded-full p-1 text-white"
                >
                  <X size={14} />
                </button>
              )}
          </div>
        ))}
      </div>
    </QuestionBlock>
  );
};

export default ShopImagesBlock;
