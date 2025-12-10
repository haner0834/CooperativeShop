export interface SelectedImage {
  localId: string; // 前端生成 ID
  previewUrl: string; // base64 或 blob url
  uploadInfo?: {
    fileKey: string;
    uploadUrl: string;
    thumbnailKey: string;
    thumbnailUploadUrl: string;
  };
  isUploading: boolean;
  uploadProgress: number;
  status: "idle" | "uploading" | "success" | "error" | "deleting";
  errorMessage?: string;
}

export interface ImageDto {
  fileKey: string;
  thumbnailKey: string;
}
