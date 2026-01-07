import { Bookmark, Menu, Navigation, Search, ShoppingCart } from "lucide-react";
import Sidebar from "../widgets/Sidebar";
import { SidebarContent } from "../widgets/SidebarContent";
import Logo from "@shared/app-icons/cooperativeshop-logo.svg?react";
import { useState } from "react";

import { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import MapboxLanguage from "@mapbox/mapbox-gl-language";
import { useDevice } from "../widgets/DeviceContext";

const PureMap = () => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);

  useEffect(() => {
    const accessToken = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;
    mapboxgl.accessToken = accessToken;

    if (!mapContainer.current) return;

    // 1. 初始化地圖
    const map = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/streets-v12",
      zoom: 8,
      maxZoom: 30,
      center: [120.195246, 23.118989],
    });

    const language = new MapboxLanguage({ defaultLanguage: "zh-Hant" });
    map.addControl(language);

    // 2. 儲存實例供後續使用
    mapRef.current = map;

    // 3. 組件卸載時銷毀地圖，防止記憶體洩漏
    return () => {
      map.remove();
    };
  }, []);

  return (
    <div
      ref={mapContainer}
      style={{ width: "100%", height: "100%", position: "absolute" }}
    />
  );
};

const ShopsMap = () => {
  const [showSidebar, setShowSidebar] = useState(false);

  const { isDesktop } = useDevice();

  return (
    <div className="fixed w-full h-full touch-none -pt-safe-area">
      <div className="absolute inset-0 z-10 pointer-events-auto">
        <PureMap />
      </div>

      <div className="absolute inset-0 flex flex-col w-full pt-safe-area">
        <div className="relative flex flex-col mr-auto">
          <button
            onClick={() => setShowSidebar((prev) => !prev)}
            className={`m-4 btn ${
              showSidebar || isDesktop ? "rounded-full" : "btn-circle"
            } shadow-md z-50 transition-all flex gap-4`}
          >
            <Menu size={20} />
            {(showSidebar || isDesktop) && <Logo className="h-7 w-auto" />}
          </button>
        </div>
      </div>

      <Sidebar isOpen={showSidebar} onClose={() => setShowSidebar(false)}>
        <SidebarContent />
      </Sidebar>
    </div>
  );
};

export default ShopsMap;
