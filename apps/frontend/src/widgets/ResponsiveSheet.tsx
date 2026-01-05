import React, { useEffect, useState } from "react";
import { useDevice } from "./DeviceContext";

type Props = {
  isOn: boolean;
  height?: SheetHeight;
  title?: string;
  onClose: () => void;
  children: React.ReactNode;
};

// h-1/2 h-1/3 h-2/3 h-1/4 h-3/4 h-1/5 h-2/5 h-3/5 h-4/5 h-11/12
type SheetHeight =
  | "1/2"
  | "1/3"
  | "2/3"
  | "1/4"
  | "3/4"
  | "1/5"
  | "2/5"
  | "3/5"
  | "4/5"
  | "11/12";

const ResponsiveSheet: React.FC<Props> = ({
  isOn,
  height,
  title,
  onClose,
  children,
}) => {
  const { isMobile } = useDevice();
  const [visible, setVisible] = useState(isOn);
  const [animateIn, setAnimateIn] = useState(false);

  useEffect(() => {
    if (isOn) {
      setVisible(true);
      // Use a very short delay to ensure the browser completes the initial rendering
      // So that the transition animation can be triggered
      const timeoutId = setTimeout(() => {
        setAnimateIn(true);
      }, 20);
      return () => clearTimeout(timeoutId);
    } else {
      setAnimateIn(false);
      const timeoutId = setTimeout(() => setVisible(false), 300);
      return () => clearTimeout(timeoutId);
    }
  }, [isOn]);

  if (!visible) return null;

  return (
    <>
      <div
        className={`
          fixed inset-0 z-50 transition-opacity duration-300 bg-black
          ${animateIn ? "opacity-40" : "opacity-0"}
        `}
        onClick={onClose}
      />

      <div
        className={`
          fixed z-50 bg-base-100 shadow-xl transition-transform duration-300 ease-out
          overflow-y-auto pwa:pb-pwa
          ${
            isMobile
              ? `
              left-0 right-0 bottom-0 ${
                height ? "h-" + height : ""
              } rounded-t-2xl
              ${animateIn ? "translate-y-0" : "translate-y-full"}
            `
              : `
              top-0 right-0 h-full w-80
              ${animateIn ? "translate-x-0" : "translate-x-full"}
            `
          }
        `}
      >
        <div
          className={`relative flex p-4 items-center ${
            title ? "justify-center" : "justify-end"
          }`}
        >
          <p className="text-center font-bold">{title}</p>
          <button
            onClick={onClose}
            className={`btn btn-sm btn-ghost btn-circle ${
              title ? "absolute right-4" : ""
            }`}
          >
            ✕
          </button>
        </div>
        <div className="px-4 pb-4">{children}</div>
      </div>
    </>
  );
};

export default ResponsiveSheet;
