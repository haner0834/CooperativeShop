import React, { useState, useEffect, useRef, useCallback } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { LazyLoadImage } from "react-lazy-load-image-component";

interface ImageGalleryModalProps {
  imageLinks: string[];
  initialIndex: number;
  isOpen: boolean;
  onClose: () => void;
}

const ImageGalleryModal: React.FC<ImageGalleryModalProps> = ({
  imageLinks,
  initialIndex,
  isOpen,
  onClose,
}) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [showOverlayUI, setShowOverlayUI] = useState(true);
  const [isAnimating, setIsAnimating] = useState(false);
  const carouselRef = useRef<HTMLDivElement>(null);
  const isScrollingRef = useRef(false);

  // 使用 scrollLeft 直接控制滾動位置
  const slideTo = useCallback(
    (index: number, smooth: boolean = true) => {
      if (imageLinks.length === 0 || !carouselRef.current) return;

      const newIndex = Math.max(0, Math.min(imageLinks.length - 1, index));
      setCurrentIndex(newIndex);

      const container = carouselRef.current;
      const targetScrollLeft = newIndex * container.clientWidth;

      if (smooth) {
        container.scrollTo({
          left: targetScrollLeft,
          behavior: "smooth",
        });
      } else {
        container.scrollLeft = targetScrollLeft;
      }
    },
    [imageLinks.length]
  );

  // 1. 初始化
  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(initialIndex);
      setShowOverlayUI(true);
      setIsAnimating(true);

      // 延遲滾動以確保 DOM 已完全渲染
      setTimeout(() => {
        slideTo(initialIndex, false);
      }, 100);
    } else {
      // 關閉時重置動畫狀態
      setIsAnimating(false);
    }
  }, [isOpen, initialIndex, slideTo]);

  // 2. 監聽手動滾動
  useEffect(() => {
    if (!isOpen || !carouselRef.current) return;

    const handleScroll = () => {
      if (!carouselRef.current || isScrollingRef.current) return;

      const container = carouselRef.current;
      const scrollLeft = container.scrollLeft;
      const containerWidth = container.clientWidth;

      // 計算當前應該顯示第幾張圖片
      const newIndex = Math.round(scrollLeft / containerWidth);

      if (
        newIndex !== currentIndex &&
        newIndex >= 0 &&
        newIndex < imageLinks.length
      ) {
        setCurrentIndex(newIndex);
      }
    };

    const container = carouselRef.current;
    container.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      container.removeEventListener("scroll", handleScroll);
    };
  }, [isOpen, currentIndex, imageLinks.length]);

  // 3. 鍵盤事件
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === "ArrowLeft") {
        slideTo(currentIndex - 1);
      } else if (e.key === "ArrowRight") {
        slideTo(currentIndex + 1);
      } else if (e.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, currentIndex, slideTo, onClose]);

  if (!isOpen) {
    return null;
  }

  return (
    <div
      className={`modal modal-open flex items-center justify-center p-0 bg-black/80 transition-opacity duration-300 ${
        isAnimating ? "opacity-100" : "opacity-0"
      }`}
      onClick={onClose}
    >
      <div
        className={`modal-box w-screen h-screen max-w-none max-h-none p-0 bg-transparent shadow-none flex items-center justify-center transition-transform duration-300 ${
          isAnimating ? "scale-100" : "scale-95"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative w-full h-full flex flex-col justify-center items-center">
          {/* 關閉按鈕 */}
          <button
            className={`btn btn-circle btn-sm absolute top-4 right-4 z-20 bg-white/30 hover:bg-white/50 border-none text-white transition-opacity duration-300 ${
              showOverlayUI ? "opacity-100" : "opacity-0 pointer-events-none"
            }`}
            onClick={onClose}
          >
            <X size={20} />
          </button>

          {/* 圖片展示區域 */}
          <div
            ref={carouselRef}
            className="carousel w-full h-full overflow-x-auto snap-x snap-mandatory"
            style={{
              scrollbarWidth: "none",
              msOverflowStyle: "none",
              WebkitOverflowScrolling: "touch",
            }}
          >
            {imageLinks.map((link, i) => (
              <div
                key={i}
                className="carousel-item w-full h-full flex-shrink-0 flex justify-center items-center snap-start"
                onClick={() => setShowOverlayUI(!showOverlayUI)}
              >
                <LazyLoadImage
                  src={link}
                  className="max-w-full max-h-full object-contain"
                  placeholder={
                    <div className="w-full h-full skeleton bg-gray-700" />
                  }
                />
              </div>
            ))}
          </div>

          {/* 左右滑動按鈕 */}
          <div
            className={`absolute flex justify-between transform -translate-y-1/2 left-5 right-5 top-1/2 z-10 transition-opacity duration-300 ${
              showOverlayUI ? "opacity-100" : "opacity-0 pointer-events-none"
            }`}
          >
            <button
              className="btn btn-circle bg-white/30 hover:bg-white/50 border-none text-white disabled:opacity-30"
              onClick={() => slideTo(currentIndex - 1)}
              disabled={currentIndex === 0}
            >
              <ChevronLeft size={24} />
            </button>
            <button
              className="btn btn-circle bg-white/30 hover:bg-white/50 border-none text-white disabled:opacity-30"
              onClick={() => slideTo(currentIndex + 1)}
              disabled={currentIndex === imageLinks.length - 1}
            >
              <ChevronRight size={24} />
            </button>
          </div>

          {/* 圖片索引顯示 */}
          <div
            className={`absolute bottom-4 left-1/2 transform -translate-x-1/2 px-3 py-1 bg-black/50 text-white rounded-full text-sm z-20 transition-opacity duration-300 ${
              showOverlayUI ? "opacity-100" : "opacity-0 pointer-events-none"
            }`}
          >
            {currentIndex + 1} / {imageLinks.length}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImageGalleryModal;
