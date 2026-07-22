import axios from "axios";

export const uploadToR2 = async (
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
