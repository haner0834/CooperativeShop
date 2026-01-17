import axios from "axios";
import { getDeviceId } from "../utils/device";

const TARGET_ORIGIN = window.location.origin;
const TARGET_PATH = "/api";

const shouldIntercept = (url: string | undefined): boolean => {
  if (!url) return false;
  try {
    if (url.startsWith("http") && !url.startsWith(TARGET_ORIGIN)) {
      return false;
    }
    const fullUrl = new URL(url, window.location.origin);
    return (
      fullUrl.origin === TARGET_ORIGIN &&
      fullUrl.pathname.startsWith(TARGET_PATH)
    );
  } catch (e) {
    return false;
  }
};

axios.interceptors.request.use((config) => {
  if (
    config.url?.startsWith("https://r2.cloudflarestorage.com") ||
    config.url?.startsWith("https://image.cooperativeshops.org")
  ) {
    return config;
  }

  if (shouldIntercept(config?.url)) {
    config.headers.set("X-Device-ID", getDeviceId());
    config.withCredentials = true;
  }
  return config;
});

const { fetch: originalFetch } = window;
window.fetch = async (...args) => {
  let [resource, config] = args;

  let urlString;
  if (resource instanceof Request) {
    urlString = resource.url;
  } else {
    urlString = String(resource);
  }

  if (shouldIntercept(urlString)) {
    const deviceId = getDeviceId();

    if (resource instanceof Request) {
      resource.headers.set("X-Device-ID", deviceId);
      resource = new Request(resource, { credentials: "include" });
    } else {
      config = { ...config };
      const headers = new Headers(config.headers || {});
      headers.set("X-Device-ID", deviceId);
      config.headers = headers;
      config.credentials = "include";
    }
  }

  return originalFetch(resource, config);
};
