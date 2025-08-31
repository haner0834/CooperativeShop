import { useEffect, useRef } from "react";
import QRCodeStyling, { type Options } from "qr-code-styling";

export default function QRDisplay({
  data,
  className = "",
}: {
  data: string;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  // 將 QRCodeStyling instance 也存入 ref，以便在重新渲染時可以更新它
  const qrCodeRef = useRef<QRCodeStyling | null>(null);

  // 將 options 抽出來，方便管理
  const qrOptions: Options = {
    type: "svg",
    margin: 0,
    dotsOptions: {
      type: "rounded",
      color: "#6a1a4c",
      gradient: {
        type: "linear",
        rotation: 0.7853981633974483, // 45 degrees in radians
        colorStops: [
          { offset: 0, color: "#0056d6" },
          { offset: 1, color: "#00c7fc" },
        ],
      },
    },
    image: "https://cooperativeshops.org/logo-small.jpg",
    imageOptions: { hideBackgroundDots: true, imageSize: 0.4, margin: 7 },
    backgroundOptions: { color: "#ffffff" },
    cornersSquareOptions: { type: "extra-rounded", color: "#0056d6" },
    cornersDotOptions: { type: "dot", color: "#0056d6" },
  };

  useEffect(() => {
    const container = ref.current;
    if (!container) return;

    // 當 data 變化時，更新現有的 QR code 或創建新的
    if (qrCodeRef.current) {
      qrCodeRef.current.update({ data });
    } else {
      // 首次創建
      // 先用一個初始值，ResizeObserver 會立即觸發並更新為正確尺寸
      const initialSize = container.offsetWidth || 300;
      qrCodeRef.current = new QRCodeStyling({
        ...qrOptions,
        width: initialSize,
        height: initialSize,
        data,
      });
      qrCodeRef.current.append(container);
    }

    // 創建一個 ResizeObserver 來監聽容器大小變化
    const resizeObserver = new ResizeObserver((entries) => {
      // 通常 entries 只有一個元素
      for (const entry of entries) {
        // 使用 contentBoxSize 或 contentRect 來獲取不含 padding 和 border 的尺寸
        // 確保尺寸是正方形，取寬高中較小的值
        const newSize = Math.min(
          entry.contentRect.width,
          entry.contentRect.height
        );

        if (newSize > 0 && qrCodeRef.current) {
          qrCodeRef.current.update({
            width: newSize,
            height: newSize,
          });
        }
      }
    });

    // 開始觀察容器
    resizeObserver.observe(container);

    // Cleanup: 當 component unmount 時，停止觀察
    return () => {
      resizeObserver.disconnect();
      // 清空容器內容
      if (ref.current) {
        ref.current.innerHTML = "";
      }
      qrCodeRef.current = null;
    };
  }, [data]); // 依賴 data，當 data 改變時重新執行

  return <div ref={ref} className={`${className}`}></div>;
}
