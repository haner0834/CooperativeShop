import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import svgr from "vite-plugin-svgr";
import path from "node:path";
import { VitePWA } from "vite-plugin-pwa";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    svgr({
      svgrOptions: {
        replaceAttrValues: {
          "#000": "currentColor",
          "#000000": "currentColor",
        },
      },
    }),
    VitePWA({
      registerType: "autoUpdate", // 自動更新 service worker
      devOptions: {
        enabled: true,
      },
      workbox: {
        // 1. 讓 Workbox 完全不要掃描 API 相關檔案
        globIgnores: ["**/api/**/*"],

        // 2. 這是解決白屏的關鍵：防止 SPA 路由攔截 API 請求
        navigateFallbackDenylist: [/^\/api/],

        runtimeCaching: [
          {
            // 3. 修正：只快取「非 API」的資源，或是確保 API 請求能正確處理跳轉
            urlPattern: ({ url }) => {
              // 排除掉所有 /api 開頭的請求，讓它們直接走瀏覽器原生請求，不經過 Service Worker 緩存
              return (
                url.origin === "https://cooperativeshops.org" &&
                !url.pathname.startsWith("/api")
              );
            },
            handler: "NetworkFirst",
            options: {
              cacheName: "static-assets-cache",
            },
          },
          // {
          //   // 4. 如果您真的要快取 API，請針對特定的資料介面，而不是包含 Google 登入的跳轉介面
          //   urlPattern: /^https:\/\/cooperativeshops\.org\/api\/data\/.*/, // 範例：只快取資料類 API
          //   handler: "NetworkFirst",
          //   options: {
          //     cacheName: "api-data-cache",
          //     networkTimeoutSeconds: 5, // 5秒沒回應就抓舊資料
          //   },
          // },
        ],
      },
      manifest: {
        name: "南校聯合特約",
        short_name: "南校聯合特約",
        description: "?",
        theme_color: "#ffffff",
        start_url: "/",
        display: "standalone",
        icons: [
          {
            src: "apple-touch-icon-180x180.jpg",
            sizes: "180x180",
            type: "image/jpeg",
          },
          {
            src: "pwa-192x192.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "pwa-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "pwa-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable", // 重要：支援 Android 圓形/方塊圖示切換
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      "@assets": path.resolve(__dirname, "./src/assets"),
      "@shared": path.resolve(__dirname, "./src/shared"),
      "@icons": path.resolve(__dirname, "./src/generated/icons"),
    },
  },
});
