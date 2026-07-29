import axios from "axios";
import { getDeviceId } from "../utils/device";

const TARGET_ORIGIN = "http://localhost:3000";
const TARGET_PATH = "/api";
const IMAGE_HOST_ORIGIN = "https://image.cooperativeshops.org";
const R2_STORAGE_ORIGIN = "https://r2.cloudflarestorage.com";

const isImageHostUrl = (url: string | undefined): boolean => {
  if (!url) return false;
  try {
    const fullUrl = new URL(url, window.location.origin);
    return fullUrl.origin === IMAGE_HOST_ORIGIN;
  } catch {
    return false;
  }
};

const isR2StorageUrl = (url: string | undefined): boolean => {
  if (!url) return false;
  try {
    const fullUrl = new URL(url, window.location.origin);
    return fullUrl.origin === R2_STORAGE_ORIGIN;
  } catch {
    return false;
  }
};

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

// --- axios ---

declare module "axios" {
  interface AxiosRequestConfig {
    idempotent?: boolean;
  }
}

axios.interceptors.request.use((config) => {
  if (isR2StorageUrl(config.url) || isImageHostUrl(config.url)) {
    return config;
  }

  if (shouldIntercept(config?.url)) {
    config.headers.set("X-Device-ID", getDeviceId());

    if (config.idempotent && !config.headers.has("X-Idempotency-Key")) {
      config.headers.set("X-Idempotency-Key", crypto.randomUUID());
    }

    config.withCredentials = true;
  }

  return config;
});

// --- fetch ---

declare global {
  interface RequestInit {
    idempotent?: boolean;
  }
}

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
      const newHeaders = new Headers(resource.headers);

      newHeaders.set("X-Device-ID", deviceId);
      if (!newHeaders.has("X-Idempotency-Key") && config?.idempotent) {
        newHeaders.set("X-Idempotency-Key", crypto.randomUUID());
      }

      resource = new Request(resource, {
        headers: newHeaders,
        credentials: "include",
        ...config,
      });
    } else {
      config = { ...config };
      const headers = new Headers(config.headers || {});
      if (!headers.has("X-Idempotency-Key") && config?.idempotent) {
        headers.set("X-Idempotency-Key", crypto.randomUUID());
      }
      headers.set("X-Device-ID", deviceId);
      config.headers = headers;
      config.credentials = "include";
    }
  }

  return originalFetch(resource, config);
};
