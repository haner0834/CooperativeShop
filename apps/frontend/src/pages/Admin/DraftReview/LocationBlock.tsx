import MapboxLanguage from "@mapbox/mapbox-gl-language";
import mapboxgl from "mapbox-gl";
import { useRef, useEffect } from "react";
import type { ShopDraftDto } from "../../../types/shop";
import FieldBlockWithAiReviewResult from "./FieldBlockWithAiReviewResult";

interface Point {
  lng: number;
  lat: number;
  title?: string;
}

interface MapComponentProps {
  point?: Point;
  onMapClick?: (lng: number, lat: number) => void;
}

const MapComponent = ({ point, onMapClick }: MapComponentProps) => {
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
      zoom: 12,
      maxZoom: 30,
      center: point ? [point.lng, point.lat] : [120.195246, 23.118989],
    });

    const language = new MapboxLanguage({ defaultLanguage: "zh-Hant" });
    map.addControl(language);
    map.addControl(new mapboxgl.NavigationControl(), "top-right");

    map.on("load", () => {
      // 初始化單一點的 Source
      if (!map.getSource("single-point")) {
        map.addSource("single-point", {
          type: "geojson",
          data: {
            type: "FeatureCollection",
            features: [],
          },
        });

        // 點的樣式 Layer
        map.addLayer({
          id: "point-layer",
          type: "circle",
          source: "single-point",
          paint: {
            "circle-radius": 12,
            "circle-color": "#ef4444",
            "circle-stroke-width": 3,
            "circle-stroke-color": "#ffffff",
            "circle-opacity": 0.9,
          },
        });

        // 地圖點擊事件（返回點擊位置的經緯度）
        map.on("click", (e) => {
          if (onMapClick) {
            const { lng, lat } = e.lngLat;
            onMapClick(lng, lat);
          }
        });
      }
    });

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // 當 point 傳入或更新時，更新地圖點並平移視角
  useEffect(() => {
    if (!mapRef.current || !point) return;

    const map = mapRef.current;

    const updateSource = () => {
      const source = map.getSource("single-point") as mapboxgl.GeoJSONSource;
      if (!source) return;

      source.setData({
        type: "FeatureCollection",
        features: [
          {
            type: "Feature",
            geometry: {
              type: "Point",
              coordinates: [point.lng, point.lat],
            },
            properties: {
              title: point.title || "",
            },
          },
        ],
      });

      // 平滑平移至該座標
      map.flyTo({
        center: [point.lng, point.lat],
        zoom: 14,
        duration: 1500,
      });
    };

    if (map.isStyleLoaded()) {
      updateSource();
    } else {
      map.once("load", updateSource);
    }
  }, [point]);

  return <div ref={mapContainer} className="absolute w-full h-full" />;
};

const LocationBlock = ({
  draft,
  point,
}: {
  draft: ShopDraftDto;
  point: Point;
}) => {
  return (
    <FieldBlockWithAiReviewResult draft={draft} fieldName="location">
      <div>
        <span className="opacity-50">地點</span>
        <p className="mb-2">{draft?.address}</p>

        <div className="w-full h-80 rounded-field overflow-clip relative">
          <MapComponent point={point} />
        </div>
      </div>
    </FieldBlockWithAiReviewResult>
  );
};

export default LocationBlock;
