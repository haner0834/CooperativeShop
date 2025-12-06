// types.ts
import type { ReactNode } from "react";

export type ToastPlacement =
  | "top"
  | "top-left"
  | "top-right"
  | "bottom"
  | "bottom-left"
  | "bottom-right";

export type ToastType = "info" | "success" | "warning" | "error" | "default";

export interface ToastButton {
  label: string;
  onClick: () => void;
  variant?: string; // e.g., 'btn-primary', 'btn-ghost'
}

export interface ToastConfig {
  title: string;
  description?: string;
  type?: ToastType;
  placement?: ToastPlacement;
  duration?: number;
  icon?: ReactNode;
  buttons?: ToastButton[]; // 新增按鈕陣列
  replace?: boolean; // 是否替換當前位置的舊 Toast
}

export interface Toast extends ToastConfig {
  id: string;
}

export interface ToastProviderProps {
  children: ReactNode;
  defaultOptions?: {
    duration?: number;
    placement?: ToastPlacement;
    maxStack?: number; // 每個位置最大堆疊數
  };
}

export interface ToastContextType {
  showToast: (config: ToastConfig) => void;
  removeToast: (id: string) => void;
}
