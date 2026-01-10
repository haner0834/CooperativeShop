import {
  Filter,
  Menu,
  Navigation,
  Search,
  Check,
  MapPin,
  Clock,
  Bookmark,
  ChevronRight,
} from "lucide-react";
import Sidebar from "../widgets/Sidebar";
import { SidebarContent } from "../widgets/SidebarContent";
import Logo from "@shared/app-icons/cooperativeshop-logo.svg?react";
import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import mapboxgl, { type ExpressionSpecification } from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import MapboxLanguage from "@mapbox/mapbox-gl-language";
import { useDevice } from "../widgets/DeviceContext";
import { transformDtoToShop, type Shop } from "../types/shop";
import { SearchResultItem } from "./Shops"; // Reuse from Shops
import { Link } from "react-router-dom";
import { useAuthFetch } from "../auth/useAuthFetch";
import { useAuth } from "../auth/AuthContext";
import { path } from "../utils/path";
import { useToast } from "../widgets/Toast/ToastProvider";
import ResponsiveSheet from "../widgets/ResponsiveSheet";
import clsx from "clsx";

// --- Types ---
interface PureMapProps {
  onMapLoad: (map: mapboxgl.Map) => void;
}

// --- Constants ---
const SHOP_SOURCE_ID = "shops-source";

const PureMap = ({ onMapLoad }: PureMapProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);

  useEffect(() => {
    const accessToken = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;
    mapboxgl.accessToken = accessToken;

    if (!mapContainer.current) return;
    if (mapRef.current) return; // Prevent double init

    const map = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/streets-v12",
      zoom: 14, // Default zoom suitable for finding shops
      maxZoom: 20,
      center: [120.218, 23.006], // Tainan default center or adjusted per school
      attributionControl: false,
      logoPosition: "bottom-left",
    });

    const language = new MapboxLanguage({ defaultLanguage: "zh-Hant" });
    map.addControl(language);

    map.on("load", () => {
      onMapLoad(map);
    });

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
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
  const { isDesktop, isMobile } = useDevice();
  const { authedFetch } = useAuthFetch();
  const { activeUserRef } = useAuth();
  const { showToast } = useToast();

  // --- State ---
  const mapRef = useRef<mapboxgl.Map | null>(null); // 用於回調函數獲取最新實例
  const [mapInstance, setMapInstance] = useState<mapboxgl.Map | null>(null);
  const [showSidebar, setShowSidebar] = useState(false);

  // Search State
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const [previewResults, setPreviewResults] = useState<Shop[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Data & Filters
  const shopsRef = useRef<Shop[]>([]);
  const [savedIds, setSavedIds] = useState<string[]>([]);
  const [selectedShop, setSelectedShop] = useState<Shop | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  const setShopsRef = (newValue: Shop[]) => {
    shopsRef.current = newValue;
  };

  const [filters, setFilters] = useState({
    isOpen: false,
    isSaved: false,
  });

  // --- Map Logic ---

  // 1. Convert Shops to GeoJSON FeatureCollection
  const shopsGeoJson = useMemo(() => {
    const features = shopsRef.current
      .filter((shop) => {
        // Client-side filtering if needed, though API handles bounds
        if (filters.isOpen && !shop.isOpen) return false;
        if (filters.isSaved && !savedIds.includes(shop.id)) return false;
        return true;
      })
      .map((shop) => {
        const isSaved = savedIds.includes(shop.id);
        // Calculate priority: Saved > Hot Score.
        // symbol-sort-key: Features with higher sort key are placed before lower.
        const priority = (isSaved ? 10000 : 0) + (shop.hotScore || 0);

        return {
          type: "Feature",
          geometry: {
            type: "Point",
            coordinates: [shop.longitude, shop.latitude],
          },
          properties: {
            id: shop.id,
            title: shop.title,
            isOpen: shop.isOpen,
            isSaved: isSaved,
            sortKey: priority,
            icon: isSaved ? "marker-saved" : "marker-default", // Can distinguish colors
          },
        };
      });

    return {
      type: "FeatureCollection",
      features,
    } as GeoJSON.FeatureCollection;
  }, [filters, savedIds]);

  // 2. Fetch Shops based on Bounds
  const fetchShopsInBounds = useCallback(
    async (currentMap: mapboxgl.Map) => {
      if (!currentMap) {
        console.log("No map instance");
        return;
      }

      const bounds = currentMap.getBounds();
      if (!bounds) {
        console.log("No bounds");
        return;
      }
      const params = new URLSearchParams({
        minLat: bounds.getSouth().toString(),
        maxLat: bounds.getNorth().toString(),
        minLng: bounds.getWest().toString(),
        maxLng: bounds.getEast().toString(),
        limit: "300", // As per requirement, limit shouldn't be an issue
      });

      try {
        // Fetch Shops
        const route = path(`/api/shops?${params.toString()}`);
        let resData;

        if (activeUserRef.current) {
          resData = await authedFetch(route);
        } else {
          const res = await fetch(route);
          resData = await res.json();
        }

        if (resData.success && Array.isArray(resData.data)) {
          const fetchedShops = resData.data.map(transformDtoToShop);
          setShopsRef(fetchedShops);
        }

        // Fetch Saved IDs if logged in
        if (activeUserRef.current) {
          const savedRes = await authedFetch(path("/api/shops/saved-ids"));
          if (savedRes?.success) {
            setSavedIds(savedRes.data);
          }
        }
      } catch (error) {
        console.error("Failed to fetch shops in bounds", error);
      }
    },
    [activeUserRef, authedFetch]
  );

  // Function to create a custom SVG marker programmatically
  const createMarkerImage = (color: string) => {
    const size = 72;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;

    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas not supported");

    const cx = size / 2;
    const cy = 28;
    const outerR = 26;
    const innerR = 16;
    const bottomY = 70;
    const tipRadius = 6; // 控制底部尖角的圓潤程度

    /* ---------- Shadow ---------- */
    ctx.shadowColor = "rgba(0,0,0,0.3)";
    ctx.shadowBlur = 4;
    ctx.shadowOffsetY = 2;

    /* ---------- Outer Pin ---------- */
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();

    // 1. 上半部 3/4 圓 (從 135度 到 45度)
    // Math.PI * 0.75 = 135°, Math.PI * 0.25 = 45°
    ctx.arc(cx, cy, outerR, Math.PI * 0.75, Math.PI * 0.25, false);

    // 2. 連接到右下角 (直線銜接)
    // arcTo 會在當前點與目標點之間畫出圓弧
    ctx.lineTo(cx + 8, bottomY - 6); // 靠近底部的點
    ctx.arcTo(cx, bottomY, cx - 8, bottomY - 6, tipRadius); // 底部圓角

    // 3. 連接回左側圓弧起點 (直線銜接)
    ctx.lineTo(
      cx - outerR * Math.cos(Math.PI * 0.25),
      cy + outerR * Math.sin(Math.PI * 0.25)
    );

    ctx.closePath();
    ctx.fill();

    /* ---------- Inner Circle ---------- */
    ctx.shadowColor = "transparent";
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(cx, cy, innerR, 0, Math.PI * 2);
    ctx.fill();

    return ctx.getImageData(0, 0, size, size);
  };

  // 3. Initialize Map Layers & Events
  const handleMapLoad = (map: mapboxgl.Map) => {
    mapRef.current = map;
    setMapInstance(map);

    map.addImage("pin-saved", createMarkerImage("#10B981")); // Green
    map.addImage("pin-default", createMarkerImage("#f59e0b")); // Orange

    map.addSource(SHOP_SOURCE_ID, { type: "geojson", data: shopsGeoJson });

    const SORT_EXPRESSION: ExpressionSpecification = [
      "case",
      ["get", "isSaved"],
      ["-", 0, ["get", "hotScore"]], // 已收藏：優先度最高，hotScore 越高越優先 (變負數)
      ["-", 10000, ["get", "hotScore"]], // 未收藏：優先度較低，基準值設大一點
    ] as const;

    map.addLayer({
      id: "shops-icons",
      type: "symbol",
      source: SHOP_SOURCE_ID,
      layout: {
        "icon-image": ["case", ["get", "isSaved"], "pin-saved", "pin-default"],
        "icon-size": 0.5,
        "icon-allow-overlap": false,
        "icon-anchor": "bottom",
        "symbol-sort-key": SORT_EXPRESSION, // 關鍵：決定誰先顯示
      },
    });

    // 文字標籤圖層
    map.addLayer({
      id: "shops-text",
      type: "symbol",
      source: SHOP_SOURCE_ID,
      layout: {
        "text-field": ["get", "title"],
        "text-size": 12,
        "text-anchor": "top",
        "text-offset": [0, 0.5],
        "text-allow-overlap": false,
        "symbol-sort-key": SORT_EXPRESSION, // 關鍵：文字與圖示的隱藏邏輯同步
      },
      paint: {
        "text-color": "#333",
        "text-halo-color": "#fff",
        "text-halo-width": 1.5,
      },
    });

    const layerIds = ["shops-circle", "shops-text"];

    layerIds.forEach((layerId) => {
      map.on("click", layerId, (e) => {
        console.log("Click");
        if (!e.features || e.features.length === 0) {
          console.log(" wtf is this shi");
          return;
        }
        const feature = e.features[0];
        const shopId = feature.properties?.id;
        console.log(shopId);

        // Find full shop data
        const clickedShop = shopsRef.current.find((s) => s.id === shopId);
        if (clickedShop) {
          setSelectedShop(clickedShop);
          setIsSheetOpen(true);

          map.flyTo({
            center: [clickedShop.longitude, clickedShop.latitude],
            zoom: 16,
            offset: [0, isMobile ? -100 : 0],
            essential: true,
          });
        } else {
          console.log("No fucking data");
        }
      });
      // Change cursor
      map.on("mouseenter", layerId, () => {
        map.getCanvas().style.cursor = "pointer";
      });
      map.on("mouseleave", layerId, () => {
        map.getCanvas().style.cursor = "";
      });
    });
    // Interactions
    map.on("moveend", () => fetchShopsInBounds(map));

    // Click on shop

    // Initial Fetch
    fetchShopsInBounds(map);
  };

  // 4. Update Source Data when shops/filters change
  useEffect(() => {
    if (!mapRef.current) return;
    const source = mapRef.current.getSource(
      SHOP_SOURCE_ID
    ) as mapboxgl.GeoJSONSource;
    if (source) {
      source.setData(shopsGeoJson);
    }
  }, [shopsGeoJson, mapRef.current]);

  // --- Handlers ---

  const handleLocateMe = () => {
    if (!navigator.geolocation) {
      showToast({
        title: "瀏覽器不支援定位",
        icon: <MapPin className="text-error" />,
      });
      return;
    }

    showToast({
      title: "正在取得位置...",
      icon: <MapPin className="animate-bounce" />,
      duration: 1000,
    });

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        if (mapInstance) {
          mapInstance.flyTo({
            center: [pos.coords.longitude, pos.coords.latitude],
            zoom: 15,
            essential: true,
          });
          // Also render a user marker? (Optional, mapbox-gl-geolocate-control usually does this)
          new mapboxgl.Marker({ color: "#3b82f6" })
            .setLngLat([pos.coords.longitude, pos.coords.latitude])
            .addTo(mapInstance);
        }
      },
      (err) => {
        showToast({
          title: "無法取得位置",
          description: err.message,
          icon: <MapPin className="text-error" />,
        });
      }
    );
  };

  // Search Logic
  useEffect(() => {
    const doSearch = async () => {
      if (!searchInput.trim() || !activeUserRef.current) {
        setPreviewResults([]);
        return;
      }
      setIsSearching(true);
      try {
        const { success, data } = await authedFetch(
          path(`/api/shops?q=${searchInput}&limit=5`)
        );
        if (success) {
          setPreviewResults(data.map(transformDtoToShop));
        }
      } catch (e) {
        console.error(e);
      } finally {
        setIsSearching(false);
      }
    };
    const t = setTimeout(doSearch, 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  return (
    <div className="fixed w-full h-full touch-none bg-base-100">
      {/* 1. The Map */}
      <div className="absolute inset-0 z-0">
        <PureMap onMapLoad={handleMapLoad} />
      </div>

      {/* 2. Top UI (Search & Controls) */}
      <div className="absolute inset-0 flex flex-col w-full pt-safe-area pointer-events-none">
        {/* Top Bar Container */}
        <div className="relative flex items-center m-4 gap-3 pointer-events-auto">
          {/* A. Search Mode */}
          {isSearchFocused ? (
            <div className="flex-1 flex relative">
              <div className="flex-1"></div>
              <div className="flex items-center gap-2 bg-base-100 rounded-full shadow-md px-2 w-full max-w-120 h-12 border border-base-200">
                <Search size={20} className="opacity-50 ms-2" />
                <input
                  type="text"
                  className="flex-1 bg-transparent outline-none text-base"
                  placeholder="搜尋店家..."
                  autoFocus
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                />
                <button
                  onClick={() => {
                    setIsSearchFocused(false);
                    setSearchInput("");
                  }}
                  className="btn btn-ghost btn-circle btn-sm"
                >
                  ✕
                </button>
              </div>

              {/* Search Results Dropdown */}
              {searchInput !== "" && (
                <ul className="absolute top-14 right-0 max-w-120 w-full bg-base-100 rounded-box shadow-md overflow-hidden max-h-[60vh] overflow-y-auto p-2 z-50">
                  {isSearching ? (
                    <li className="p-4 text-center text-sm opacity-50">
                      搜尋中...
                    </li>
                  ) : previewResults.length === 0 && searchInput ? (
                    <li className="p-4 text-center text-sm opacity-50">
                      無結果
                    </li>
                  ) : (
                    previewResults.map((shop, i) => (
                      <SearchResultItem
                        key={shop.id}
                        shop={shop}
                        index={i}
                        onClick={() => {
                          // Fly to shop
                          mapInstance?.flyTo({
                            center: [shop.longitude, shop.latitude],
                            zoom: 17,
                          });
                          setSelectedShop(shop);
                          setIsSheetOpen(true);
                          setIsSearchFocused(false);
                          setSearchInput("");
                        }}
                      />
                    ))
                  )}
                </ul>
              )}
            </div>
          ) : (
            // B. Default Mode (Sidebar, Logo, Filters, Search Btn)
            <>
              <button
                onClick={() =>
                  setShowSidebar((prev) => (isDesktop ? prev : !prev))
                }
                className={`btn ${
                  showSidebar || isDesktop ? "rounded-full" : "btn-circle"
                } shadow-md z-50 transition-all flex gap-4`}
              >
                <Menu size={20} />
                {(showSidebar || isDesktop) && <Logo className="h-7 w-auto" />}
              </button>

              <div className="flex-1"></div>

              {/* Filter Dropdown */}
              <div className="dropdown dropdown-end">
                <div
                  tabIndex={0}
                  role="button"
                  className="btn btn-circle bg-base-100 border-none shadow-md"
                >
                  <Filter
                    size={20}
                    className={clsx(
                      filters.isOpen || filters.isSaved
                        ? "text-primary fill-current"
                        : ""
                    )}
                  />
                </div>
                <ul
                  tabIndex={0}
                  className="dropdown-content z-[1] menu p-2 shadow-lg bg-base-100 rounded-box w-52 mt-2 border border-base-200"
                >
                  <li>
                    <a
                      onClick={() =>
                        setFilters((p) => ({ ...p, isOpen: !p.isOpen }))
                      }
                      className="justify-between"
                    >
                      <span className="flex items-center gap-2">
                        <Clock size={16} /> 營業中
                      </span>
                      {filters.isOpen && (
                        <Check size={16} className="text-primary" />
                      )}
                    </a>
                  </li>
                  <li>
                    <a
                      onClick={() =>
                        setFilters((p) => ({ ...p, isSaved: !p.isSaved }))
                      }
                      className="justify-between"
                    >
                      <span className="flex items-center gap-2">
                        <Bookmark size={16} /> 已收藏
                      </span>
                      {filters.isSaved && (
                        <Check size={16} className="text-primary" />
                      )}
                    </a>
                  </li>
                </ul>
              </div>

              <button
                onClick={() => setIsSearchFocused(true)}
                className="btn btn-circle bg-base-100 border-none shadow-md"
              >
                <Search size={20} />
              </button>
            </>
          )}
        </div>

        {/* 3. Bottom UI (Location Button) */}
        <div className="flex-1" />
        <div className="relative flex items-center m-4 gap-4 mb-8 pointer-events-auto">
          <div className="flex-1"></div>
          <button
            onClick={handleLocateMe}
            className="btn btn-circle shadow-md z-10"
          >
            <Navigation
              size={20}
              className="-translate-x-[1.5px] translate-y-[1.5px]"
            />
          </button>
        </div>
      </div>

      <Sidebar isOpen={showSidebar} onClose={() => setShowSidebar(false)}>
        <SidebarContent />
      </Sidebar>

      {/* 4. Shop Detail Sheet */}
      <ResponsiveSheet
        isOn={isSheetOpen}
        onClose={() => setIsSheetOpen(false)}
        title="商家資訊"
      >
        {selectedShop && (
          <div className="flex flex-col gap-4 pb-safe-area">
            {/* Header Image */}
            <div className="relative h-40 w-full rounded-2xl overflow-hidden bg-base-200">
              {selectedShop.thumbnailLink ? (
                <img
                  src={selectedShop.thumbnailLink}
                  className="w-full h-full object-cover"
                  alt={selectedShop.title}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center opacity-30">
                  <Logo className="w-12 h-12 grayscale" />
                </div>
              )}
              <div className="absolute top-2 right-2">
                {selectedShop.isOpen ? (
                  <span className="badge badge-success shadow-sm">營業中</span>
                ) : (
                  <span className="badge badge-neutral opacity-80">休息中</span>
                )}
              </div>
            </div>

            {/* Title & Info */}
            <div className="px-1">
              <h2 className="text-2xl font-bold">{selectedShop.title}</h2>
              <p className="text-sm opacity-60 flex items-center gap-1 mt-1">
                <MapPin size={14} />
                {selectedShop.address || "無地址資訊"}
              </p>
            </div>

            {/* Actions */}
            <div className="grid grid-cols-2 gap-3 mt-2">
              {/* 導航按鈕 - 開啟 Google Maps */}
              <a
                href={`https://www.google.com/maps/dir/?api=1&destination=${selectedShop.latitude},${selectedShop.longitude}&destination_place_id=${selectedShop.title}`}
                target="_blank"
                rel="noreferrer"
                className="btn"
              >
                <Navigation size={18} />
                導航
              </a>

              {/* 查看詳情 - 內部路由 */}
              <Link
                to={`/shops/${selectedShop.id}`}
                className="btn btn-primary text-white"
              >
                查看詳情
                <ChevronRight size={18} />
              </Link>
            </div>
          </div>
        )}
      </ResponsiveSheet>
    </div>
  );
};

export default ShopsMap;
