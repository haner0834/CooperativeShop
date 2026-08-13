import { LazyLoadImage } from "react-lazy-load-image-component";
import type { SelectedImage } from "../../../types/selectedImage";
import Block from "./Block";
import { getImageUrl } from "../../../utils/get-image-url.utils";

const ImagesBlock = ({ images }: { images: SelectedImage[] }) => {
  if (images.some((image) => image.uploadInfo === undefined)) {
    return (
      <Block>
        <p className="text-error text-center">
          包含上傳失敗的圖片，請直接將此次審核標記為不通過，並請對方將上傳失敗的照片刪除
        </p>
      </Block>
    );
  }
  return (
    <Block>
      <div className="flex flex-col gap-2">
        <span className="opacity-50">圖片</span>
        <div className="flex gap-2 overflow-x-auto overflow-y-hidden w-full">
          {images.map((image) => {
            return (
              image.previewUrl && (
                <div key={image.localId} className="shrink-0">
                  <a
                    href={getImageUrl(image.uploadInfo!.fileKey ?? "")}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <LazyLoadImage
                      src={image.previewUrl}
                      className="aspect-square rounded-field h-40 w-40 object-cover"
                    ></LazyLoadImage>
                  </a>
                </div>
              )
            );
          })}
        </div>
      </div>
    </Block>
  );
};
export default ImagesBlock;
