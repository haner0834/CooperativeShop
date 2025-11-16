import { useEffect, useRef, useState, type Dispatch } from "react";
import QuestionBlock from "./QuestionBlock";
import mapboxgl from "mapbox-gl";
import MapboxLanguage from "@mapbox/mapbox-gl-language";
import "mapbox-gl/dist/mapbox-gl.css";
import { MapPin } from "lucide-react";

export interface Point {
  id: string;
  title: string;
  lng: number;
  lat: number;
}

interface MapComponentProps {
  points: Point[];
  selectedPointId?: string | null;
  onPointClick?: (pointId: string) => void;
  onMapClick?: (lng: number, lat: number) => void;
}

const MapComponent = ({
  points,
  selectedPointId,
  onPointClick,
  onMapClick,
}: MapComponentProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);

  // 初始化地圖
  useEffect(() => {
    const accessToken = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;
    mapboxgl.accessToken = accessToken;

    if (!mapContainer.current) return;

    const map = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/streets-v12",
      zoom: 8,
      maxZoom: 30,
      center: [120.195246, 23.118989],
    });

    const language = new MapboxLanguage({ defaultLanguage: "zh-Hant" });
    map.addControl(language);
    map.addControl(new mapboxgl.NavigationControl(), "top-right");

    map.on("load", () => {
      // 添加 source 和 layer（會在後續的 useEffect 中更新數據）
      if (!map.getSource("points")) {
        map.addSource("points", {
          type: "geojson",
          data: {
            type: "FeatureCollection",
            features: [],
          },
        });

        // 未選中的點
        map.addLayer({
          id: "points-unselected",
          type: "circle",
          source: "points",
          filter: ["!", ["get", "selected"]],
          paint: {
            "circle-radius": 10,
            "circle-color": "#ef4444",
            "circle-stroke-width": 3,
            "circle-stroke-color": "#ffffff",
            "circle-opacity": 0.9,
          },
        });

        // 選中的點
        map.addLayer({
          id: "points-selected",
          type: "circle",
          source: "points",
          filter: ["get", "selected"],
          paint: {
            "circle-radius": 15,
            "circle-color": "#3b82f6",
            "circle-stroke-width": 3,
            "circle-stroke-color": "#ffffff",
            "circle-opacity": 1,
          },
        });

        // 點擊事件
        map.on("click", "points-unselected", (e) => {
          if (e.features && e.features[0]) {
            const pointId = e.features[0].properties?.id;
            if (pointId && onPointClick) {
              onPointClick(pointId);
            }
          }
        });

        map.on("click", "points-selected", (e) => {
          if (e.features && e.features[0]) {
            const pointId = e.features[0].properties?.id;
            if (pointId && onPointClick) {
              onPointClick(pointId);
            }
          }
        });

        map.on("click", (e) => {
          // 檢查是否點擊在 point 上
          const features = map.queryRenderedFeatures(e.point, {
            layers: ["points-unselected", "points-selected"],
          });

          // 如果沒有點擊到 point，則執行 onMapClick
          if (features.length === 0 && onMapClick) {
            const { lng, lat } = e.lngLat;
            onMapClick(lng, lat);
          }
        });

        // 滑鼠游標效果
        map.on("mouseenter", "points-unselected", () => {
          map.getCanvas().style.cursor = "pointer";
        });
        map.on("mouseleave", "points-unselected", () => {
          map.getCanvas().style.cursor = "";
        });
        map.on("mouseenter", "points-selected", () => {
          map.getCanvas().style.cursor = "pointer";
        });
        map.on("mouseleave", "points-selected", () => {
          map.getCanvas().style.cursor = "";
        });
      }
    });

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // 更新 points 數據
  useEffect(() => {
    if (!mapRef.current || !mapRef.current.isStyleLoaded()) return;

    const map = mapRef.current;
    const source = map.getSource("points") as mapboxgl.GeoJSONSource;

    if (!source) return;

    // 將 points 轉換為 GeoJSON features
    const features = points.map((point) => ({
      type: "Feature" as const,
      geometry: {
        type: "Point" as const,
        coordinates: [point.lng, point.lat],
      },
      properties: {
        id: point.id,
        title: point.title,
        selected: point.id === selectedPointId,
      },
    }));

    source.setData({
      type: "FeatureCollection",
      features,
    });

    // 自動調整視野
    if (points.length > 0) {
      const bounds = new mapboxgl.LngLatBounds();
      points.forEach((point) => {
        bounds.extend([point.lng, point.lat]);
      });

      map.fitBounds(bounds, {
        padding: 50,
        maxZoom: 14,
        duration: 5000, // 平滑動畫
      });
    }
  }, [points, selectedPointId]);

  return <div ref={mapContainer} className="absolute w-full h-full" />;
};

interface GeocodeResult {
  id: string;
  place_name: string;
  center: [number, number]; // [lng, lat]
  relevance: number; // 信心度 0-1
  place_type: string[];
  address?: string;
  text?: string;
}

// Geocoding API 函數
async function searchLocationsByAddress(
  address: string,
  options?: {
    country?: string;
    language?: string;
    limit?: number;
    proximity?: [number, number]; // [lng, lat]
  }
): Promise<GeocodeResult[]> {
  const accessToken = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;

  if (!address.trim()) {
    return [];
  }

  // 設置預設參數
  const params = new URLSearchParams({
    access_token: accessToken,
    country: options?.country || "TW", // 預設限制在台灣
    language: options?.language || "zh-Hant", // 預設繁體中文
    limit: String(options?.limit || 5), // 預設返回5個結果
  });

  // 如果有提供 proximity（優先搜尋附近），加入參數
  if (options?.proximity) {
    params.append("proximity", options.proximity.join(","));
  }

  const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
    address
  )}.json?${params}`;

  try {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Geocoding API error: ${response.status}`);
    }

    const data = await response.json();

    return data.features || [];
  } catch (error) {
    console.error("Geocoding failed:", error);
    return [];
  }
}

// 輔助函數：將 GeocodeResult 轉換為 Point
function geocodeResultsToPoints(results: GeocodeResult[]): Point[] {
  return results.map((result, index) => ({
    id: result.id || `geocode-${index}`,
    title: result.place_name,
    lng: result.center[0],
    lat: result.center[1],
  }));
}

// 輔助函數：反向地理編碼（座標轉地址）
async function getAddressFromCoordinates(
  lng: number,
  lat: number,
  options?: {
    language?: string;
  }
): Promise<GeocodeResult | null> {
  const accessToken = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;

  const params = new URLSearchParams({
    access_token: accessToken,
    language: options?.language || "zh-Hant",
  });

  const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?${params}`;

  try {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Reverse geocoding API error: ${response.status}`);
    }

    const data = await response.json();

    return data.features?.[0] || null;
  } catch (error) {
    console.error("Reverse geocoding failed:", error);
    return null;
  }
}

function getPosition(): Promise<{ latitude: number; longitude: number }> {
  return new Promise((resolve, reject) => {
    if (!("geolocation" in navigator)) {
      reject(new Error("Geolocation is not supported by your browser."));
    }

    navigator.geolocation.getCurrentPosition(
      (position: GeolocationPosition) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      },
      (error: GeolocationPositionError) => {
        reject(error);
      },
      {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0,
      }
    );
  });
}

type Mode = "geocoding" | "current-location" | "manually-point";

const ShopLocationBlock = ({
  address,
  selectedPoint,
  setAddress,
  setSelectedPoint,
}: {
  address: string;
  selectedPoint: Point | null;
  setAddress: Dispatch<React.SetStateAction<string>>;
  setSelectedPoint: Dispatch<React.SetStateAction<Point | null>>;
}) => {
  const [mode, setMode] = useState<Mode>("geocoding");
  const [selectedPointId, setSelectedPointId] = useState<string | null>(null);
  const [geocodePoints, setGeocodePoints] = useState<Point[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const modeRef = useRef(mode);
  useEffect(() => {
    modeRef.current = mode;
  }, [mode]);

  const searchLocations = async () => {
    if (!address) {
      setGeocodePoints([]);
      setSelectedPointId(null);
      return;
    }

    setIsSearching(true);

    try {
      // 呼叫 geocoding API，優先搜尋台灣中心附近的結果
      const results = await searchLocationsByAddress(address, {
        proximity: [120.9605, 23.6978], // 台灣中心座標
        limit: 5,
      });

      // 將結果轉換成 Point 格式
      const points = geocodeResultsToPoints(results);

      setGeocodePoints(points);

      // 自動選擇第一個結果（信心度最高）
      if (points.length > 0) {
        setSelectedPointId(points[0].id);
      }
    } catch (error) {
      console.error("搜尋地點失敗:", error);
      setGeocodePoints([]);
    } finally {
      setIsSearching(false);
    }
  };

  useEffect(() => {
    if (selectedPoint?.id) {
      setSelectedPointId(selectedPoint.id);
    }
  }, []);

  useEffect(() => {
    if (selectedPointId && geocodePoints.length > 0) {
      setSelectedPoint(
        geocodePoints.find((p) => p.id === selectedPointId) ?? null
      );
    }
  }, [selectedPointId]);

  useEffect(() => {
    if (mode === "manually-point") {
    }
    if (mode !== "geocoding") return;
    const handler = setTimeout(searchLocations, 500);

    return () => clearTimeout(handler);
  }, [address]);

  useEffect(() => {
    const a = async () => {
      if (mode === "current-location") {
        const { longitude, latitude } = await getPosition();
        const result = await getAddressFromCoordinates(longitude, latitude);
        if (!result) return;

        if (result.place_name) {
          setAddress(result.place_name);
        }

        const points = geocodeResultsToPoints([result]);
        setGeocodePoints(points);
        setSelectedPointId(points[0].id);
      } else if (mode === "geocoding") {
        await searchLocations();
      } else {
      }
    };
    a();
  }, [mode]);

  const handlePointClick = (pointId: string) => {
    setSelectedPointId(pointId);
  };

  const handleMapClick = async (lng: number, lat: number) => {
    if (modeRef.current === "manually-point") {
      const result = await getAddressFromCoordinates(lng, lat);
      setGeocodePoints([
        {
          id: "point-1",
          title: result?.place_name ?? "Unknown",
          lng,
          lat,
        },
      ]);
      setAddress(result?.place_name ?? "Unknown");
      setSelectedPointId("point-1");
    }
  };

  const getSelectedPointTitle = () => {
    return geocodePoints.find((p) => p.id === selectedPointId)?.title;
  };

  return (
    <QuestionBlock title="地點">
      <input
        type="text"
        className="input w-full"
        value={address}
        onChange={(e) => setAddress(e.target.value)}
        placeholder="輸入地址"
      />

      <div className="flex space-x-1 p-1 bg-base-300 rounded-xl">
        <button
          onClick={() => setMode("geocoding")}
          className={
            mode === "geocoding"
              ? "btn flex-1 bg-base-100"
              : "flex-1 text-sm px-4"
          }
        >
          輸入地址
        </button>
        <button
          onClick={() => setMode("current-location")}
          className={
            mode === "current-location"
              ? "btn flex-1 bg-base-100"
              : "flex-1 text-sm px-4"
          }
        >
          當前位置
        </button>
        <button
          onClick={() => setMode("manually-point")}
          className={
            mode === "manually-point"
              ? "btn flex-1 bg-base-100"
              : "flex-1 text-sm px-4"
          }
        >
          手動標記
        </button>
      </div>

      <div className="flex opacity-50 items-center space-x-1">
        {selectedPointId && <MapPin className="w-4 h-4" />}

        <p className="text-sm">
          {selectedPointId === null
            ? "由地圖中選擇一個對應的地點"
            : isSearching
            ? "搜尋中..."
            : getSelectedPointTitle()}
        </p>
      </div>

      <div className="w-full h-80 rounded-field overflow-clip relative">
        <MapComponent
          points={geocodePoints}
          selectedPointId={selectedPointId}
          onPointClick={handlePointClick}
          onMapClick={handleMapClick}
        />
      </div>
    </QuestionBlock>
  );
};

export default ShopLocationBlock;
