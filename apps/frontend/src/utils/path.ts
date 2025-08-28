export const BASE_URL = import.meta.env.DEV ? "http://localhost:3000" : "";

export const path = (path: string, query?: Record<string, string>) => {
  const queryString = query ? `?${new URLSearchParams(query).toString()}` : "";
  return BASE_URL + path + queryString;
};
