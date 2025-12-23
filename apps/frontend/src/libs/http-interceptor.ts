// src/lib/http-interceptor.ts
import axios from "axios";
import { getDeviceId } from "../utils/device";

const TARGET_ORIGIN = window.location.origin; // 或是你的 API Domain 'https://example.com'
const TARGET_PATH = "/api";

/**
 * 驗證 URL 是否符合目標路徑
 */
const shouldIntercept = (url: string | undefined): boolean => {
  if (!url) return false;
  try {
    // 處理相對路徑與絕對路徑
    const fullUrl = new URL(url, window.location.origin);
    return (
      fullUrl.origin === TARGET_ORIGIN &&
      fullUrl.pathname.startsWith(TARGET_PATH)
    );
  } catch (e) {
    return false;
  }
};

// 1. Axios 攔截器
axios.interceptors.request.use((config) => {
  if (shouldIntercept(config.url)) {
    config.headers = config.headers || {};
    config.headers["X-Device-ID"] = getDeviceId();
  }
  return config;
});

// 2. Fetch Monkey Patch
const { fetch: originalFetch } = window;
window.fetch = async (...args) => {
  let [resource, config] = args;

  const urlString =
    resource instanceof Request ? resource.url : String(resource);

  if (shouldIntercept(urlString)) {
    config = config || {};
    const headers = new Headers(config.headers);
    headers.set("X-Device-ID", getDeviceId());
    config.headers = headers;

    // 如果 resource 是 Request 物件，需要重新建立以套用新 header
    if (resource instanceof Request) {
      resource = new Request(resource, config);
    }
  }

  return originalFetch(resource, config);
};
