import React, { useState, useEffect, useRef, type RefObject } from "react";

interface WordScrollerProps {
  words: string[];
  scrollHeightPerWord?: number;
  stickyContainerRef: RefObject<HTMLDivElement | null>;
}

const WordScroller: React.FC<WordScrollerProps> = ({
  words,
  scrollHeightPerWord = 300,
  stickyContainerRef,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const stickyStartPositionRef = useRef<number | null>(null);

  useEffect(() => {
    const handleScroll = () => {
      const stickyContainer = stickyContainerRef.current;
      if (!stickyContainer) return;

      const containerRect = stickyContainer.getBoundingClientRect();
      const containerTop = containerRect.top;

      // 如果還沒記錄起始位置，且容器即將或已經被釘住時記錄
      if (stickyStartPositionRef.current === null && containerTop <= 0) {
        stickyStartPositionRef.current = window.scrollY - containerTop;
      }

      // 使用記錄的起始位置進行計算
      if (stickyStartPositionRef.current !== null) {
        const scrollProgress = window.scrollY - stickyStartPositionRef.current;

        if (scrollProgress >= 0) {
          const newIndex = Math.floor(scrollProgress / scrollHeightPerWord);
          const limitedIndex = Math.max(
            0,
            Math.min(newIndex, words.length - 1)
          );

          setCurrentIndex((prevIndex) => {
            if (prevIndex !== limitedIndex) {
              return limitedIndex;
            }
            return prevIndex;
          });
        }
      }
    };

    // 重置起始位置
    stickyStartPositionRef.current = null;
    handleScroll();

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
      stickyStartPositionRef.current = null;
    };
  }, [words, scrollHeightPerWord, stickyContainerRef]);

  return (
    <div className="relative w-full h-full flex items-center justify-center">
      {words.map((word, index) => (
        <span
          key={index}
          className={`
            absolute inset-0 flex items-center justify-center
            text-5xl md:text-7xl font-bold text-gray-800
            tracking-wider
            ${index === currentIndex ? "opacity-100" : "opacity-0"}
          `}
        >
          {word}
        </span>
      ))}
    </div>
  );
};

export default WordScroller;
