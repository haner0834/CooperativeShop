import type { Dispatch } from "react";
import QuestionBlock from "./QuestionBlock";
import { CloudAlert, Upload, X } from "lucide-react";
import type { SelectedImage } from "../../types/selectedImage";
import axios from "axios";
import { path } from "../../utils/path";
import { compressImage } from "../../utils/imageCompressor";
import { useAuthFetch } from "../../auth/useAuthFetch";
import { AnimatedCloudUploadIcon } from "../../widgets/icon-animation/CloudUploadIcon";
import { AnimatedChevrons } from "../../widgets/icon-animation/AnimatedChevrons";
import { ImageWithFallback } from "../../widgets/ImageWithFallback";

const R2_PUBLIC_URL = "https://image.cooperativeshops.org";

const ShopImagesBlock = ({
  images,
  showHint,
  setImages,
}: {
  images: SelectedImage[];
  showHint: boolean;
  setImages: Dispatch<React.SetStateAction<SelectedImage[]>>;
}) => {
  const { authedFetch } = useAuthFetch();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const selectedFiles = Array.from(files).slice(0, 10 - images.length);

    // 轉換成預覽圖
    const newImages: SelectedImage[] = await Promise.all(
      selectedFiles.map(async (_) => {
        // To prevent user upload very large image, preview url use compressed one
        return {
          localId: crypto.randomUUID(),
          previewUrl: "",
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
      const reader = new FileReader();
      const previewUrl = await new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => reject(new Error("Failed to read file"));
        reader.readAsDataURL(mainImage);
      });

      setImages((prev) =>
        prev.map((img) =>
          img.localId === localId
            ? {
                ...img,
                previewUrl,
              }
            : img
        )
      );

      // 取得 presigned urls
      const apiResponse = await authedFetch(
        path("/api/storage/presigned-url"),
        {
          method: "POST",
          body: JSON.stringify({
            fileName: mainImage.name,
            contentType: "image/webp",
            category: "shop-image",
            fileSize: mainImage.size,
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
          contentType: "image/webp",
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
                previewUrl: `${R2_PUBLIC_URL}/${thumbnailKey}`,
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
      headers: {
        "Content-Type": file.type,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
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

  const handleRemove = async (index: number) => {
    try {
      const image = images[index];
      setImages((prev) =>
        prev.map((img) =>
          img.localId === image.localId ? { ...img, status: "deleting" } : img
        )
      );

      if (!image.uploadInfo) {
        setImages((prev) => prev.filter((_, i) => i !== index));
        return;
      }

      const { fileKey, thumbnailKey } = image.uploadInfo;
      if (!fileKey || !thumbnailKey)
        throw new Error("No fileKey nor thumbnailKey");

      const apiResponse = await authedFetch(path("/api/storage/delete"), {
        method: "POST",
        body: JSON.stringify({
          fileKey: image.uploadInfo?.fileKey,
          thumbnailKey: image.uploadInfo?.thumbnailKey,
        }),
      });
      if (!apiResponse.success) {
      }
      setImages((prev) => prev.filter((_, i) => i !== index));
    } catch (error) {}
  };

  return (
    <QuestionBlock
      title="圖片"
      status={images.length >= 1 ? "ok" : "required"}
      description="於此上傳商家的照片。至多上傳 10 張。"
      hint="至少一張照片"
      showHint={showHint}
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
            <ImageWithFallback
              src={img.previewUrl}
              error={img.previewUrl === "" ? <div /> : undefined}
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
            {img.status === "deleting" && (
              <div className="absolute inset-0 bg-neutral/50 flex items-center justify-center">
                <span className="loading text-white" />
              </div>
            )}
            {img.status === "idle" && (
              <div className="absolute inset-0 skeleton flex flex-col items-center justify-center">
                <AnimatedChevrons className="rotate-90" />
                <p className="text-sm">壓縮中</p>
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
              img.status !== "deleting" &&
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
