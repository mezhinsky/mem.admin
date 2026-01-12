/**
 * Auth utility functions for cookie handling, CSRF tokens, and session persistence
 */

const SESSION_ID_KEY = 'mem_session_id';

/**
 * Read a cookie value by name
 * Works in browser environment only
 */
export function readCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;

  const cookies = document.cookie.split(';');
  for (const cookie of cookies) {
    const [cookieName, cookieValue] = cookie.trim().split('=');
    if (cookieName === name) {
      return decodeURIComponent(cookieValue);
    }
  }
  return null;
}

/**
 * Get CSRF token from cookie
 * The backend sets this as a non-HttpOnly cookie named 'csrf_token'
 */
export function getCsrfToken(): string | null {
  return readCookie('csrf_token');
}

/**
 * Persist session ID to localStorage
 * Session ID is needed to identify the current device session for refresh/logout
 */
export function persistSessionId(sessionId: string): void {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(SESSION_ID_KEY, sessionId);
}

/**
 * Get persisted session ID from localStorage
 */
export function getSessionId(): string | null {
  if (typeof localStorage === 'undefined') return null;
  return localStorage.getItem(SESSION_ID_KEY);
}

/**
 * Clear persisted session ID
 * Called on logout
 */
export function clearSessionId(): void {
  if (typeof localStorage === 'undefined') return;
  localStorage.removeItem(SESSION_ID_KEY);
}

/**
 * Decode JWT payload without verification
 * Used for extracting user info client-side (display only, not for security decisions)
 */
export function decodeJwtPayload<T = Record<string, unknown>>(token: string): T | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const payload = parts[1];
    // Handle base64url encoding
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );

    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

/**
 * Check if a JWT is expired
 * Returns true if expired or invalid
 */
export function isTokenExpired(token: string): boolean {
  const payload = decodeJwtPayload<{ exp?: number }>(token);
  if (!payload?.exp) return true;

  // Add 10 second buffer to account for clock skew
  return Date.now() >= (payload.exp * 1000) - 10000;
}
