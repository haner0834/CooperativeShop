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
  CornerUpRight,
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
import { Link, useNavigate } from "react-router-dom";
import { useAuthFetch } from "../auth/useAuthFetch";
import { useAuth } from "../auth/AuthContext";
import { path } from "../utils/path";
import { useToast } from "../widgets/Toast/ToastProvider";
import ResponsiveSheet from "../widgets/ResponsiveSheet";
import clsx from "clsx";
import { useModal } from "../widgets/ModalContext";
import { usePathHistory } from "../contexts/PathHistoryContext";

interface PureMapProps {
  onMapLoad: (map: mapboxgl.Map) => void;
}

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

const THRESHOLD = 0.3; // 缺失比例閾值

/**
 * 根據 Zoom Level 取得動態瓦片大小 (單位：經緯度度數)
 * Zoom 14 (市中心) -> 0.01 度 (~1.1km)
 * Zoom 10 (城市)   -> 0.16 度 (~18km)
 * Zoom 5  (國家)   -> 5.12 度 (~570km)
 */
const getTileSize = (zoom: number) => {
  const zLayer = Math.round(zoom);
  const size = 0.01 * Math.pow(2, Math.max(0, 14 - zLayer));
  return { size, zLayer };
};

const ShopsMap = () => {
  const navigate = useNavigate();
  const { isDesktop, isMobile } = useDevice();
  const { authedFetch } = useAuthFetch();
  const { activeUserRef, restorePromise } = useAuth();
  const { showToast } = useToast();
  const { showModal } = useModal();
  const { goBack } = usePathHistory();

  const mapRef = useRef<mapboxgl.Map | null>(null);
  const [mapInstance, setMapInstance] = useState<mapboxgl.Map | null>(null);
  const [showSidebar, setShowSidebar] = useState(false);

  const [isAvailable, setIsAvailable] = useState(
    !(activeUserRef.current?.isSchoolLimited ?? true)
  );

  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const [previewResults, setPreviewResults] = useState<Shop[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const shopsCacheRef = useRef<Map<string, Shop>>(new Map());
  const [dataVersion, setDataVersion] = useState(0);
  const [selectedShop, setSelectedShop] = useState<Shop | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  const fetchedTilesRef = useRef<Set<string>>(new Set());
  const abortControllerRef = useRef<AbortController | null>(null);

  const userLocationMarkerRef = useRef<mapboxgl.Marker | null>(null);

  const [filters, setFilters] = useState({
    isOpen: false,
    isSaved: false,
  });

  const shopsGeoJson = useMemo(() => {
    let allShops = Array.from(shopsCacheRef.current.values());

    if (searchInput.trim() !== "" && previewResults.length > 0) {
      const resultIds = new Set(previewResults.map((s) => s.id));
      allShops = allShops.filter((shop) => resultIds.has(shop.id));
    }

    const features = allShops
      .filter((shop) => {
        if (filters.isOpen && !shop.isOpen) return false;
        if (filters.isSaved && !shop.isSaved) return false;
        return true;
      })
      .map((shop) => {
        const isSaved = shop.isSaved;
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
            icon: isSaved ? "marker-saved" : "marker-default",
          },
        };
      });

    return {
      type: "FeatureCollection",
      features,
    } as GeoJSON.FeatureCollection;
  }, [filters, dataVersion]);

  const fetchShopsInBounds = useCallback(
    async (currentMap: mapboxgl.Map) => {
      if (!currentMap || !activeUserRef.current) return;

      const bounds = currentMap.getBounds();
      if (!bounds) return;

      const south = bounds.getSouth();
      const north = bounds.getNorth();
      const west = bounds.getWest();
      const east = bounds.getEast();
      const latSpan = north - south;
      const lngSpan = east - west;
      const BUFFER_RATIO = 0.25;

      const pad = {
        minLat: south - latSpan * BUFFER_RATIO,
        maxLat: north + latSpan * BUFFER_RATIO,
        minLng: west - lngSpan * BUFFER_RATIO,
        maxLng: east + lngSpan * BUFFER_RATIO,
      };

      const cellsInView: string[] = [];
      const missingCells: string[] = [];

      const { size, zLayer } = getTileSize(currentMap.getZoom());

      for (
        let lat = Math.floor(pad.minLat / size);
        lat <= Math.floor(pad.maxLat / size);
        lat++
      ) {
        for (
          let lng = Math.floor(pad.minLng / size);
          lng <= Math.floor(pad.maxLng / size);
          lng++
        ) {
          const cellId = `z${zLayer}_${lat}_${lng}`;
          cellsInView.push(cellId);
          if (!fetchedTilesRef.current.has(cellId)) {
            missingCells.push(cellId);
          }
        }
      }

      const missingRatio =
        cellsInView.length > 0 ? missingCells.length / cellsInView.length : 0;

      if (missingRatio < THRESHOLD) {
        return;
      }

      if (abortControllerRef.current) abortControllerRef.current.abort();
      abortControllerRef.current = new AbortController();

      try {
        const params = new URLSearchParams({
          minLat: pad.minLat.toString(),
          maxLat: pad.maxLat.toString(),
          minLng: pad.minLng.toString(),
          maxLng: pad.maxLng.toString(),
          limit: "500",
        });

        const route = path(`/api/shops?${params.toString()}`);
        let resData;
        resData = await authedFetch(route, {
          signal: abortControllerRef.current.signal,
        });

        if (resData.success && Array.isArray(resData.data)) {
          let hasNew = false;

          resData.data.forEach((dto: any) => {
            if (!shopsCacheRef.current.has(dto.id)) {
              const shop = transformDtoToShop(dto);
              shopsCacheRef.current.set(shop.id, shop);
              hasNew = true;
            }
          });

          missingCells.forEach((id) => fetchedTilesRef.current.add(id));

          if (hasNew) {
            requestAnimationFrame(() => setDataVersion((v) => v + 1));
          }
        }
      } catch (error) {
        console.error("Failed to fetch shops in bounds", error);
      }
    },
    [activeUserRef, authedFetch]
  );

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
    const innerR = 12;
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
    ctx.lineTo(cx + 6, bottomY - 6); // 靠近底部的點
    ctx.arcTo(cx, bottomY, cx - 6, bottomY - 6, tipRadius); // 底部圓角

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

  const handleMapLoad = (map: mapboxgl.Map) => {
    mapRef.current = map;
    setMapInstance(map);

    map.addImage("pin-saved", createMarkerImage("#2b7fff")); // Blue
    map.addImage("pin-default", createMarkerImage("#f45353")); // Orange

    map.addSource(SHOP_SOURCE_ID, { type: "geojson", data: shopsGeoJson });

    const SORT_EXPRESSION: ExpressionSpecification = [
      "+",
      ["*", ["to-number", ["get", "isSaved"]], 100000],
      ["get", "hotScore"],
    ];

    map.addLayer({
      id: "shops",
      type: "symbol",
      source: SHOP_SOURCE_ID,
      layout: {
        "icon-image": ["case", ["get", "isSaved"], "pin-saved", "pin-default"],
        "icon-size": 0.5,
        "icon-anchor": "bottom",

        "text-field": ["get", "title"],
        "text-size": 12,
        "text-anchor": "top",
        "text-offset": [0, 0.5],

        "icon-allow-overlap": true,
        "text-allow-overlap": true,

        "symbol-sort-key": SORT_EXPRESSION,
      },
      paint: {
        "text-color": "#333",
        "text-halo-color": "#fff",
        "text-halo-width": 1.5,
      },
    });

    map.on("click", "shops", (e) => {
      console.log("Click");
      if (!e.features || e.features.length === 0) {
        console.log(" wtf is this shi");
        return;
      }
      const feature = e.features[0];
      const shopId = feature.properties?.id;
      console.log(shopId);

      // Find full shop data
      const clickedShop = shopsCacheRef.current.get(shopId);
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

    map.on("mouseenter", "shops", () => {
      map.getCanvas().style.cursor = "pointer";
    });
    map.on("mouseleave", "shops", () => {
      map.getCanvas().style.cursor = "";
    });

    map.on("moveend", () => fetchShopsInBounds(map));

    fetchShopsInBounds(map);
  };

  useEffect(() => {
    if (!mapRef.current) return;
    const source = mapRef.current.getSource(
      SHOP_SOURCE_ID
    ) as mapboxgl.GeoJSONSource;
    if (source) {
      source.setData(shopsGeoJson);
    }
  }, [shopsGeoJson, mapRef.current]);

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
        const { longitude, latitude } = pos.coords;
        if (mapInstance) {
          mapInstance.flyTo({
            center: [longitude, latitude],
            zoom: 15,
            essential: true,
          });

          if (userLocationMarkerRef.current) {
            userLocationMarkerRef.current.setLngLat([longitude, latitude]);
          } else {
            const el = document.createElement("div");
            el.className =
              "w-4 h-4 bg-blue-500 rounded-full border-2 border-white shadow-lg";

            userLocationMarkerRef.current = new mapboxgl.Marker({
              color: "#3b82f6",
            })
              .setLngLat([longitude, latitude])
              .addTo(mapInstance);
          }
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

  useEffect(() => {
    const checkAvailable = async () => {
      if (!activeUserRef.current) {
        const result = await restorePromise;
        if (!result.ok || !activeUserRef.current) {
          showModal({
            title: "請先登入以繼續使用",
            buttons: [
              { label: "關閉" },
              { label: "返回", role: "primary", onClick: () => goBack() },
            ],
          });
          return;
        }
      }

      if (activeUserRef.current.isSchoolLimited) {
        const { success, data } = await authedFetch(path("/api/map/check"));
        if (!success || !data.allowed) {
          showModal({
            title: "貴校本日地圖使用次數已達上限",
            description: "若需了解狀況，請至 FAQ 或詢問貴校學生會狀況",
            buttons: [
              { label: "FAQ", onClick: () => navigate("/faq") },
              { label: "返回", onClick: () => goBack() },
            ],
          });
          return;
        }
      }
      setIsAvailable(true);
    };
    checkAvailable();
  }, []);

  useEffect(() => {
    const doSearch = async () => {
      console.log("Hello", searchInput, mapRef.current);
      if (!searchInput && mapRef.current) {
        fetchShopsInBounds(mapRef.current);
        return;
      }
      if (!searchInput.trim() || !activeUserRef.current) {
        setPreviewResults([]);
        return;
      }
      setIsSearching(true);
      try {
        const { success, data } = await authedFetch(
          path(`/api/shops?q=${searchInput}&limit=20`)
        );
        if (success) {
          const searchedShops = data.map(transformDtoToShop);
          setPreviewResults(searchedShops);

          if (searchedShops.length > 0 && mapInstance) {
            searchedShops.forEach((s: Shop) =>
              shopsCacheRef.current.set(s.id, s)
            );
            setDataVersion((v) => v + 1);

            // Calculate LngLatBounds
            const bounds = new mapboxgl.LngLatBounds();
            searchedShops.forEach((s: Shop) => {
              bounds.extend([s.longitude, s.latitude]);
            });

            mapInstance.fitBounds(bounds, {
              padding: isMobile ? 80 : 150,
              maxZoom: 16,
              duration: 1000,
            });
          }
        }
      } catch (e) {
        console.error(e);
      } finally {
        setIsSearching(false);
      }
    };

    const t = setTimeout(doSearch, 500);
    return () => clearTimeout(t);
  }, [searchInput, mapInstance]);

  return (
    <div className="fixed w-full h-full touch-none bg-base-100">
      {/* 1. The Map */}
      {isAvailable ? (
        <div className="absolute inset-0 z-0">
          <PureMap onMapLoad={handleMapLoad} />
        </div>
      ) : (
        <div className="absolute inset-0 h-full overflow-visible">
          <div className="relative inset-0 h-full p-10 lg:ps-74 flex flex-col">
            <h1 className="text-9xl font-black z-10">Shops Map</h1>
            <p className="mt-5 p-2 text-sm z-10">
              這裡，你可以看到最方便的地圖服務，完美整合我們的商店服務。
              <br />
              極速體驗、終極享受、流程優化，想得到的功能都在這裡。
              <br />
              現在加入我們，開始享受吧！
            </p>

            <div className="absolute -bottom-100 right-0 w-50 h-400 bg-teal-400 rotate-38" />
            <div className="absolute -bottom-100 left-0 w-50 h-400 bg-purple-500 -rotate-22" />
            <div className="absolute top-100 -left-20 w-400 h-50 bg-amber-300 rotate-10" />
            <div className="absolute top-100 -left-20 w-450 h-50 bg-fuchsia-500 -rotate-25" />
          </div>
        </div>
      )}

      {/* 2. Top UI (Search & Controls) */}
      <div className="absolute inset-0 flex flex-col w-full pt-safe-area pointer-events-none">
        {/* Top Bar Container */}
        <div className="relative flex items-center m-4 gap-3 pointer-events-auto">
          {/* A. Search Mode */}
          {!isAvailable ? (
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
          ) : isSearchFocused ? (
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
                      filters.isOpen || filters.isSaved ? "fill-current" : ""
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
        {isAvailable && (
          <>
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
          </>
        )}
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
                <CornerUpRight size={18} />
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
