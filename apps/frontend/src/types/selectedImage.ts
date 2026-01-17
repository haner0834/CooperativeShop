export interface SelectedImage {
  localId: string;
  previewUrl: string | null;
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
