import { API_BASE_URL } from "@/lib/api";

export function toAbsoluteHttpUrl(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return null;

  const base = new URL(API_BASE_URL, window.location.origin);

  if (/^https?:\/\//i.test(trimmed)) {
    try {
      return new URL(trimmed).toString();
    } catch {
      return null;
    }
  }

  const normalized = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
  try {
    return new URL(normalized, base.origin).toString();
  } catch {
    return null;
  }
}

export function getPublicSiteBaseUrl(): string | null {
  const raw =
    (import.meta.env.VITE_PUBLIC_SITE_URL as string | undefined) ??
    (import.meta.env.VITE_FRONTEND_URL as string | undefined);
  if (!raw) return null;
  return raw.replace(/\/$/, "");
}

export function buildFrontendArticleUrl(slugOrId: string | number): string | null {
  const base = getPublicSiteBaseUrl();
  if (!base) return null;
  return `${base}/articles/${encodeURIComponent(String(slugOrId))}`;
}
