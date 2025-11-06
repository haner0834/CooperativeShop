import React, { type ReactNode } from "react";

interface SidebarProps {
  isOpen: boolean;
  onClose?: () => void;
  children: ReactNode;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose, children }) => {
  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-30 bg-black/50 transition-opacity duration-300
          ${isOpen ? "opacity-100" : "opacity-0 pointer-events-none"}
          lg:hidden`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Sidebar 主體
        - 始終為 'fixed' 定位 (無論大小螢幕)
        - 小螢幕: 根據 'isOpen' 狀態 'translate-x-0' 或 '-translate-x-full'
        - 大螢幕: 'lg:translate-x-0' 會覆蓋 'isOpen' 的 transform，強制顯示
      */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 transform bg-base-100 shadow-xl lg:shadow-none border border-base-300 transition-transform duration-300 ease-in-out
          ${isOpen ? "translate-x-0" : "-translate-x-full"}
          lg:translate-x-0`}
      >
        <div className="h-full overflow-y-auto">{children}</div>
      </aside>
    </>
  );
};

export default Sidebar;
