import { MapPin, Store, Search, Bell, Menu, Map } from "lucide-react";
import { SidebarContent } from "../widgets/SidebarContent";
import Sidebar from "../widgets/Sidebar";
import { useState } from "react";
import { Link } from "react-router-dom";
import Logo from "@shared/app-icons/cooperativeshop-logo.svg?react";

const ShopMap = () => {
  const [showSidebar, setShowSidebar] = useState(false);
  return (
    <div className="min-h-screen bg-base-300 flex flex-col items-center justify-center p-6 text-center pt-24">
      <nav className="navbar fixed z-50 bg-base-100 top-0 shadow-xs">
        <div className="navbar-start space-x-2">
          <button
            className="btn btn-square btn-ghost"
            onClick={() => setShowSidebar((prev) => !prev)}
          >
            <Menu />
          </button>

          <Logo className="h-9 w-auto hidden md:block" />
        </div>
        <div className="navbar-center space-x-2">
          <h3 className="font-semibold">商家地圖</h3>
        </div>
        <div className="navbar-end space-x-2"></div>
      </nav>

      <Sidebar isOpen={showSidebar} onClose={() => setShowSidebar(false)}>
        <SidebarContent />
      </Sidebar>
      {/* 主要內容區 */}
      <div className="max-w-2xl w-full space-y-8">
        {/* 圖標組合 */}
        <div className="relative inline-block">
          <div className="bg-base-100 p-6 rounded-full shadow-md">
            <Map className="w-16 h-16 " />
          </div>
          <MapPin className="absolute -top-1 -right-1 w-8 h-8 text-secondary rotate-12" />
        </div>

        {/* 標題與描述 */}
        <div className="space-y-4">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900">
            探索周邊商家{" "}
            <span className="text-primary text-2xl align-top">Beta</span>
          </h1>
          <p className="opacity-50 max-w-md mx-auto">
            我們正在打造最直覺的在地商圈地圖系統。
          </p>
        </div>

        {/* 功能亮點預覽 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
          <div className="p-4 bg-base-100 hover:bg-base-200 backdrop-blur-sm rounded-xl border border-slate-200 transition-colors">
            <Search className="w-6 h-6 mx-auto mb-2 opacity-40" />
            <p className="text-sm font-medium">精準搜尋</p>
          </div>
          <div className="p-4 bg-base-100 hover:bg-base-200 backdrop-blur-sm rounded-xl border border-slate-200 transition-colors">
            <Store className="w-6 h-6 mx-auto mb-2 opacity-40" />
            <p className="text-sm font-medium">店家詳情</p>
          </div>
          <div className="p-4 bg-base-100 hover:bg-base-200 backdrop-blur-sm rounded-xl border border-slate-200 transition-colors">
            <Bell className="w-6 h-6 mx-auto mb-2 opacity-40" />
            <p className="text-sm font-medium">限時優惠</p>
          </div>
        </div>

        <Link to="/shops" className="btn btn-primary btn-wide rounded-full">
          回首頁
        </Link>
      </div>

      {/* 底部裝飾 */}
      <footer className="mt-12 opacity-40 text-sm">© 2025 嘎嘎嘎</footer>
    </div>
  );
};

export default ShopMap;
