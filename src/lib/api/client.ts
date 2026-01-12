/**
 * API Client with automatic token refresh and retry on 401
 *
 * Features:
 * - Single-flight refresh: Only one refresh request at a time, others wait
 * - Automatic retry on 401
 * - CSRF token handling for protected endpoints
 * - credentials: 'include' for all requests
 */

import { API_BASE_URL } from '../api';
import { getCsrfToken, getSessionId, clearSessionId } from '../auth/utils';

// Reference to the auth context's getAccessToken and setAuth functions
// These will be set by the AuthProvider
let getAccessTokenFn: (() => string | null) | null = null;
let setAuthFn: ((token: string, user: { id: string; email: string | null; name: string | null; avatar: string | null }) => void) | null = null;
let clearAuthFn: (() => void) | null = null;

// Single-flight refresh state
let refreshPromise: Promise<string | null> | null = null;

/**
 * Initialize the API client with auth context functions
 * Must be called from AuthProvider
 */
export function initApiClient(
  getAccessToken: () => string | null,
  setAuth: (token: string, user: { id: string; email: string | null; name: string | null; avatar: string | null }) => void,
  clearAuth: () => void
): void {
  getAccessTokenFn = getAccessToken;
  setAuthFn = setAuth;
  clearAuthFn = clearAuth;
}

/**
 * Refresh the access token
 * Single-flight pattern: if a refresh is in progress, return the existing promise
 */
async function refreshAccessToken(): Promise<string | null> {
  // If refresh is already in progress, wait for it
  if (refreshPromise) {
    return refreshPromise;
  }

  const sessionId = getSessionId();
  const csrfToken = getCsrfToken();

  if (!sessionId || !csrfToken) {
    return null;
  }

  // Start new refresh
  refreshPromise = (async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfToken,
        },
        body: JSON.stringify({ sessionId }),
      });

      if (!response.ok) {
        throw new Error('Refresh failed');
      }

      const data = await response.json();
      const newToken = data.accessToken;

      // Fetch user info to update auth state
      const meResponse = await fetch(`${API_BASE_URL}/auth/me`, {
        headers: {
          'Authorization': `Bearer ${newToken}`,
        },
      });

      if (meResponse.ok && setAuthFn) {
        const user = await meResponse.json();
        setAuthFn(newToken, user);
      }

      return newToken;
    } catch (error) {
      console.error('Token refresh failed:', error);
      // Clear auth state on refresh failure
      if (clearAuthFn) {
        clearAuthFn();
      }
      clearSessionId();
      return null;
    } finally {
      // Clear the promise so next refresh can happen
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

export interface ApiRequestOptions extends Omit<RequestInit, 'body'> {
  body?: unknown;
  skipAuth?: boolean;
  skipRetry?: boolean;
}

/**
 * Make an authenticated API request
 *
 * @param path - API path (will be prefixed with API_BASE_URL)
 * @param options - Fetch options with some additions
 * @returns Response data parsed as JSON
 */
export async function apiRequest<T = unknown>(
  path: string,
  options: ApiRequestOptions = {}
): Promise<T> {
  const { body, skipAuth = false, skipRetry = false, ...fetchOptions } = options;

  const url = path.startsWith('http') ? path : `${API_BASE_URL}${path.startsWith('/') ? '' : '/'}${path}`;

  const headers: HeadersInit = {
    ...(fetchOptions.headers || {}),
  };

  // Add Content-Type for JSON bodies
  if (body && !(body instanceof FormData)) {
    (headers as Record<string, string>)['Content-Type'] = 'application/json';
  }

  // Add Authorization header if we have a token
  if (!skipAuth && getAccessTokenFn) {
    const token = getAccessTokenFn();
    if (token) {
      (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
    }
  }

  const response = await fetch(url, {
    ...fetchOptions,
    credentials: 'include',
    headers,
    body: body instanceof FormData ? body : body ? JSON.stringify(body) : undefined,
  });

  // Handle 401 - try refresh and retry
  if (response.status === 401 && !skipAuth && !skipRetry) {
    const newToken = await refreshAccessToken();

    if (newToken) {
      // Retry the request with new token
      (headers as Record<string, string>)['Authorization'] = `Bearer ${newToken}`;

      const retryResponse = await fetch(url, {
        ...fetchOptions,
        credentials: 'include',
        headers,
        body: body instanceof FormData ? body : body ? JSON.stringify(body) : undefined,
      });

      if (!retryResponse.ok) {
        const error = await retryResponse.text();
        throw new ApiError(retryResponse.status, error);
      }

      // Handle empty responses (204, etc.)
      if (retryResponse.status === 204) {
        return undefined as T;
      }

      return retryResponse.json();
    }

    // No token after refresh - redirect to login
    window.location.href = '/login';
    throw new ApiError(401, 'Session expired');
  }

  if (!response.ok) {
    const error = await response.text();
    throw new ApiError(response.status, error);
  }

  // Handle empty responses
  if (response.status === 204) {
    return undefined as T;
  }

  return response.json();
}

/**
 * Make a CSRF-protected request (for auth endpoints)
 */
export async function csrfRequest<T = unknown>(
  path: string,
  options: ApiRequestOptions = {}
): Promise<T> {
  const csrfToken = getCsrfToken();

  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string> || {}),
  };

  if (csrfToken) {
    headers['X-CSRF-Token'] = csrfToken;
  }

  return apiRequest<T>(path, {
    ...options,
    headers,
  });
}

/**
 * Custom API Error class
 */
export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

// Convenience methods
export const api = {
  get: <T = unknown>(path: string, options?: ApiRequestOptions) =>
    apiRequest<T>(path, { ...options, method: 'GET' }),

  post: <T = unknown>(path: string, body?: unknown, options?: ApiRequestOptions) =>
    apiRequest<T>(path, { ...options, method: 'POST', body }),

  put: <T = unknown>(path: string, body?: unknown, options?: ApiRequestOptions) =>
    apiRequest<T>(path, { ...options, method: 'PUT', body }),

  patch: <T = unknown>(path: string, body?: unknown, options?: ApiRequestOptions) =>
    apiRequest<T>(path, { ...options, method: 'PATCH', body }),

  delete: <T = unknown>(path: string, options?: ApiRequestOptions) =>
    apiRequest<T>(path, { ...options, method: 'DELETE' }),
};
