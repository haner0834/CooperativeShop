import React, {
  type ReactNode,
  useMemo,
  useRef,
  useEffect,
  useState,
} from "react";
import clsx from "clsx";

type Direction = "left" | "right";

interface MarqueeProps {
  elements: ReactNode[];
  speed?: number; // 秒數，越小越快，default 20
  direction?: Direction; // 預設往左
  gap?: number; // px，元素之間的間距
  pauseOnHover?: boolean; // 是否 hover 暫停
  className?: string; // 外層樣式
  itemClassName?: string; // 每個元素樣式
}

const Marquee: React.FC<MarqueeProps> = ({
  elements,
  speed = 20,
  direction = "left",
  gap = 32,
  pauseOnHover = false,
  className,
  itemClassName,
}) => {
  // 使用 ref 來量測單一組內容的寬度
  const contentRef = useRef<HTMLDivElement>(null);
  const [contentWidth, setContentWidth] = useState(0);

  // 當 elements 或 gap 變動時，重新量測寬度
  useEffect(() => {
    if (contentRef.current) {
      // scrollWidth 可以精確計算出所有子元素的總寬度，即使它們超出了容器
      setContentWidth(contentRef.current.scrollWidth);
    }
  }, [elements, gap]);

  useEffect(() => {
    if (!contentRef.current) return;
    // update scroll width everytime it changed
    const observer = new ResizeObserver(() => {
      if (contentRef.current) {
        console.log("Changed", contentRef.current.scrollWidth);
        setContentWidth(contentRef.current.scrollWidth);
      }
    });

    observer.observe(contentRef.current);

    return () => observer.disconnect();
  }, []);

  // 產生唯一的 keyframes 名稱，避免多個跑馬燈實例之間樣式衝突
  const animationName = useMemo(
    () => `marquee-animation-${Math.random().toString(36).substring(2, 9)}`,
    []
  );

  // 【修復核心】計算動畫需要移動的總距離，必須包含 gap
  const animationDistance = contentWidth > 0 ? contentWidth + gap : 0;

  // 【修復核心】根據方向動態產生 keyframes
  // 1. left: 從 0 移動到 -(內容寬度 + 間距)
  // 2. right: 從 -(內容寬度 + 間距) 移動到 0
  // 這樣可以確保動畫結束時，下一組內容能無縫銜接上
  const keyframes = `
    @keyframes ${animationName} {
      from {
        transform: translateX(${
          direction === "left" ? "0" : `-${animationDistance}px`
        });
      }
      to {
        transform: translateX(${
          direction === "left" ? `-${animationDistance}px` : "0"
        });
      }
    }
  `;

  // 將渲染內容的邏輯抽成一個組件，方便複用
  const MarqueeContent = useMemo(() => {
    return (
      <div
        // 將 ref 放在這個容器上，以量測單組元素的寬度
        ref={contentRef}
        className="flex shrink-0 items-center"
        style={{ gap: `${gap}px` }}
      >
        {elements.map((el, i) => (
          <div key={`element-${i}`} className={clsx("shrink-0", itemClassName)}>
            {el}
          </div>
        ))}
      </div>
    );
  }, [elements, gap, itemClassName]);

  return (
    <div
      className={clsx(
        "relative overflow-hidden w-full",
        // 【優化】將 group class 放在最外層，方便控制 hover 效果
        pauseOnHover && "group",
        className
      )}
    >
      {/* 只有在計算出寬度後才插入 keyframes 和啟動動畫 */}
      {contentWidth > 0 && <style>{keyframes}</style>}

      <div
        className={clsx("flex")}
        style={{
          // 【優化】這裡不再需要手動計算總寬度，Flexbox 會自動處理
          // 【修復核心】動畫名稱和速度
          animation: contentWidth
            ? `${animationName} ${speed}s linear infinite`
            : "none",
        }}
      >
        {/* 為了無縫滾動，我們需要渲染兩次內容 */}
        {MarqueeContent}

        {/* 在兩組內容之間插入一個明確的間距元素，確保銜接正確 */}
        {contentWidth > 0 && (
          <div
            aria-hidden="true"
            style={{ width: `${gap}px`, flexShrink: 0 }}
          />
        )}

        {/* 這是第二組複製的內容 */}
        {contentWidth > 0 && (
          <div
            aria-hidden="true"
            className="flex shrink-0 items-center"
            style={{ gap: `${gap}px` }}
          >
            {elements.map((el, i) => (
              <div
                key={`clone-element-${i}`}
                className={clsx("shrink-0", itemClassName)}
              >
                {el}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 【優化】使用更簡潔的 CSS 選擇器來控制 hover 暫停效果
        當滑鼠懸停在 .group (最外層容器) 上時，
        暫停其直接子元素 (也就是正在跑的 div) 的動畫。
      */}
      {pauseOnHover && (
        <style>{`
          .group:hover > div {
            animation-play-state: paused;
          }
        `}</style>
      )}
    </div>
  );
};

export default Marquee;
