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
    <div className="min-h-screen relative">
      <div className="absolute inset-0 flex flex-col w-full">
        <button
          onClick={() => setShowSidebar((prev) => !prev)}
          className={`m-4 mr-auto btn ${
            showSidebar || isDesktop ? "rounded-full" : "btn-circle"
          } shadow-md z-50 transition-all flex gap-4`}
        >
          <Menu size={20} />
          {(showSidebar || isDesktop) && <Logo className="h-7 w-auto" />}
        </button>

        <div className="mt-auto flex flex-col">
          <div className="flex justify-between mx-4 items-end">
            <button className="backdrop-blur-sm bg-base-100/25 p-[6px] rounded-full shadow-md z-10">
              <ShoppingCart className="text-amber-500 p-2 bg-base-100/85 rounded-full h-9 w-9 overflow-visible" />
            </button>
            <div className="backdrop-blur-md z-10 shadow-md p-[6px] rounded-full h-auto flex flex-col bg-base-100/25 gap-[6px] transition-all">
              {true && (
                <button>
                  <Bookmark className="p-2 bg-base-100/85 rounded-full h-9 w-9 overflow-visible" />
                </button>
              )}
              <button>
                <Navigation className="p-2 bg-base-100/85 rounded-full h-9 w-9 overflow-visible" />
              </button>
            </div>
          </div>

          <div className="m-4 mb-8 rounded-full p-2 backdrop-blur-sm bg-base-100/25 z-10 shadow-md">
            <div className="input border-none rounded-full w-full h-8 bg-base-100 outline-none">
              <Search size={18} />
              <input type="text" placeholder="Search Shops" />
            </div>
          </div>
        </div>
      </div>

      <Sidebar isOpen={showSidebar} onClose={() => setShowSidebar(false)}>
        <SidebarContent />
      </Sidebar>

      <div className="relative w-full h-screen overflow-clip z-9">
        <PureMap />
        {/* <div className="w-full h-full bg-accent"></div> */}
      </div>
    </div>
  );
};

export default ShopsMap;
