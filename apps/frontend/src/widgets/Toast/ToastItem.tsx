import React, { useEffect } from "react";
import { motion, type Variants } from "framer-motion";
import type { Toast } from "./types";

interface ToastItemProps {
  toast: Toast;
  onRemove: (id: string) => void;
  isMobile: boolean;
}

export const ToastItem: React.FC<ToastItemProps> = ({
  toast,
  onRemove,
  isMobile,
}) => {
  const {
    id,
    title,
    description,
    type = "default",
    duration = 5000,
    icon,
    buttons,
  } = toast;

  useEffect(() => {
    // 只有當 duration > 0 時才設定自動關閉
    if (duration > 0) {
      const timer = setTimeout(() => {
        onRemove(id);
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [id, duration, onRemove]);

  const getVariants = (): Variants => {
    const isTop = toast.placement?.startsWith("top");

    // Mobile: 簡單的滑入滑出
    if (isMobile) {
      return {
        initial: { y: isTop ? -50 : 50, opacity: 0 },
        animate: { y: 0, opacity: 1 },
        exit: {
          y: isTop ? -50 : 50,
          opacity: 0,
          scale: 0.9,
          // 確保 exit 夠快，讓 replace 感覺流暢
          transition: { duration: 0.2 },
        },
      };
    }

    // Desktop
    let initialX = 0;
    let initialY = 0;
    if (toast.placement?.includes("left")) initialX = -50;
    else if (toast.placement?.includes("right")) initialX = 50;
    else initialY = isTop ? -20 : 20;

    return {
      initial: { x: initialX, y: initialY, opacity: 0, scale: 0.9 },
      animate: { x: 0, y: 0, opacity: 1, scale: 1 },
      exit: {
        opacity: 0,
        scale: 0.95,
        transition: { duration: 0.15 }, // 加快離場速度
      },
    };
  };

  const getAlertClass = () => {
    const base = "alert shadow-lg flex flex-row items-center gap-4";
    const radius = "rounded-2xl";
    const mobileStyle = isMobile
      ? "w-full mx-0"
      : "min-w-[320px] sm:alert-horizontal";

    switch (type) {
      case "success":
        return `${base} alert-success ${mobileStyle} ${radius}`;
      case "error":
        return `${base} alert-error ${mobileStyle} ${radius}`;
      case "warning":
        return `${base} alert-warning ${mobileStyle} ${radius}`;
      case "info":
        return `${base} alert-info ${mobileStyle} ${radius}`;
      case "default":
      default:
        return `${base} ${mobileStyle} ${radius} border border-base-300 bg-base-100`;
    }
  };

  const IconComponent = () => {
    if (icon) return <div className="self-center">{icon}</div>;
    const iconColorClass =
      type === "default" ? "stroke-info" : "stroke-current";
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        className={`${iconColorClass} h-6 w-6 shrink-0 self-center`}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        ></path>
      </svg>
    );
  };

  return (
    <motion.div
      layout
      variants={getVariants()}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={{ type: "spring", stiffness: 400, damping: 30 }}
      className={`pointer-events-auto ${
        isMobile ? "w-full px-4 pt-2" : "pt-2"
      }`}
    >
      <div role="alert" className={getAlertClass()}>
        <IconComponent />

        {description ? (
          <div className="flex-1">
            <h3 className="font-bold">{title}</h3>
            <div className="text-xs">{description}</div>
            {buttons && buttons.length > 0 && (
              <div className="flex gap-2 mt-2">
                {buttons.map((btn, idx) => (
                  <button
                    key={idx}
                    onClick={btn.onClick}
                    className={`btn btn-sm ${btn.variant || ""}`}
                  >
                    {btn.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="flex-1 flex flex-col sm:flex-row gap-2 items-center w-full">
            <span className="flex-1 font-bold">{title}</span>
            {buttons && (
              <div className="flex gap-2">
                {buttons.map((btn, idx) => (
                  <button
                    key={idx}
                    onClick={btn.onClick}
                    className={`btn btn-sm ${btn.variant || ""}`}
                  >
                    {btn.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        <button
          onClick={() => onRemove(id)}
          className="btn btn-sm btn-circle btn-ghost border-transparent bg-transparent hover:bg-transparent hover:opacity-30 hover:border-base-300 self-center"
        >
          ✕
        </button>
      </div>
    </motion.div>
  );
};
