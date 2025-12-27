const rawBaseUrl = import.meta.env.VITE_API_BASE_URL;

if (!rawBaseUrl) {
  throw new Error("VITE_API_BASE_URL is not set");
}

const normalizedBaseUrl = rawBaseUrl.replace(/\/$/, "");

export const API_BASE_URL = normalizedBaseUrl;

export const apiUrl = (path: string) =>
  `${API_BASE_URL}${path.startsWith("/") ? "" : "/"}${path}`;
