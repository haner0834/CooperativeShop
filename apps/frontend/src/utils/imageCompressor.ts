import imageCompression from "browser-image-compression";

export async function compressImage(file: File) {
  const mainImage = await imageCompression(file, {
    maxWidthOrHeight: 2000, // 主圖最大邊
    useWebWorker: true,
    maxSizeMB: 1,
    fileType: "image/webp",
  });

  const thumbnail = await imageCompression(file, {
    maxWidthOrHeight: 1500,
    useWebWorker: true,
    maxSizeMB: 0.5,
    initialQuality: 0.85,
    fileType: "image/webp",
  });

  return { mainImage, thumbnail };
}
