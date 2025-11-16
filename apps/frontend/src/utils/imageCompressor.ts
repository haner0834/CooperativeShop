import imageCompression from "browser-image-compression";

export async function compressImage(file: File) {
  const mainImage = await imageCompression(file, {
    maxWidthOrHeight: 1280, // 主圖最大邊
    useWebWorker: true,
    maxSizeMB: 1,
  });

  const thumbnail = await imageCompression(file, {
    maxWidthOrHeight: 700,
    useWebWorker: true,
    maxSizeMB: 0.015,
  });

  return { mainImage, thumbnail };
}
