import React, { createContext, useContext, useState } from "react";
import { AnimatePresence } from "framer-motion";
import type {
  Toast,
  ToastConfig,
  ToastContextType,
  ToastPlacement,
  ToastProviderProps,
} from "./types";
import { ToastItem } from "./ToastItem";
import { useDevice } from "../DeviceContext";

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast must be used within a ToastProvider");
  return context;
};

export const ToastProvider: React.FC<ToastProviderProps> = ({
  children,
  defaultOptions,
}) => {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const { isMobile } = useDevice();

  const showToast = (config: ToastConfig) => {
    const id = Math.random().toString(36).substring(2, 9);

    let finalPlacement =
      config.placement || defaultOptions?.placement || "top-right";
    if (isMobile) {
      finalPlacement = finalPlacement.includes("bottom") ? "bottom" : "top";
    }

    const newToast: Toast = {
      ...config,
      duration: config.duration ?? defaultOptions?.duration ?? 3000,
      placement: finalPlacement,
      type: config.type || "default",
      id,
    };

    setToasts((prev) => {
      // 邏輯: 如果是 replace，過濾掉該位置的所有舊 toast
      let nextToasts = config.replace
        ? prev.filter((t) => t.placement !== finalPlacement)
        : [...prev];

      // Max Stack 邏輯 (非 replace 時)
      const maxStack = defaultOptions?.maxStack || 5;
      const toastsInSamePlacement = nextToasts.filter(
        (t) => t.placement === finalPlacement
      );

      if (!config.replace && toastsInSamePlacement.length >= maxStack) {
        // 移除該位置最早的一個
        const oldestId = toastsInSamePlacement[0]?.id;
        if (oldestId) {
          nextToasts = nextToasts.filter((t) => t.id !== oldestId);
        }
      }

      return [...nextToasts, newToast];
    });
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const getToastsByPlacement = (placement: ToastPlacement) => {
    return toasts.filter((t) => t.placement === placement);
  };

  // 樣式調整：保持 flex-col，這樣 popLayout 運作時，absolute 元素會疊在相對應位置
  const containerBase = "fixed z-[100] flex flex-col pointer-events-none pt-4";
  const mobileContainer = isMobile ? "left-0 right-0 w-full items-center" : "";

  const placementStyles: Record<ToastPlacement, string> = {
    top: `top-0 left-1/2 -translate-x-1/2 ${
      isMobile ? mobileContainer : "items-center"
    }`,
    "top-left": "top-0 left-0 items-start p-4",
    "top-right": "top-0 right-0 items-end p-4",
    bottom: `bottom-0 left-1/2 -translate-x-1/2 ${
      isMobile ? mobileContainer : "items-center"
    }`,
    "bottom-left": "bottom-0 left-0 items-start p-4",
    "bottom-right": "bottom-0 right-0 items-end p-4",
  };

  const supportedPlacements: ToastPlacement[] = [
    "top",
    "top-left",
    "top-right",
    "bottom",
    "bottom-left",
    "bottom-right",
  ];

  return (
    <ToastContext.Provider value={{ showToast, removeToast }}>
      {children}

      {supportedPlacements.map((pos) => {
        const items = getToastsByPlacement(pos);

        // ❌ 移除這行： if (items.length === 0) return null;
        // ✅ 改為：即使沒有 items，也要保留容器 DOM，這樣 AnimatePresence 才能在裡面播放 exit 動畫

        return (
          <div key={pos} className={`${containerBase} ${placementStyles[pos]}`}>
            {/* mode="popLayout" 關鍵：讓離開的元素變成 position: absolute，不佔據空間，讓新的元素直接頂上去 */}
            <AnimatePresence mode="popLayout" initial={false}>
              {items.map((toast) => (
                <ToastItem
                  key={toast.id}
                  toast={toast}
                  onRemove={removeToast}
                  isMobile={isMobile}
                />
              ))}
            </AnimatePresence>
          </div>
        );
      })}
    </ToastContext.Provider>
  );
};
