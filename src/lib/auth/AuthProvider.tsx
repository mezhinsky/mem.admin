import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
  type ReactNode,
} from 'react';
import { useNavigate } from 'react-router-dom';
import { queryClient } from '@/main';
import { API_BASE_URL } from '../api';
import { initApiClient } from '../api/client';
import {
  getCsrfToken,
  getSessionId,
  clearSessionId,
  isTokenExpired,
  canAttemptRefresh,
} from './utils';
import type { User, AuthContextValue } from './types';

const AuthContext = createContext<AuthContextValue | null>(null);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  // Access token stored ONLY in memory (React state)
  // This is intentional - prevents XSS from stealing tokens
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Use ref to always have latest token available for API client
  const accessTokenRef = useRef<string | null>(null);
  const refreshPromiseRef = useRef<Promise<boolean> | null>(null);

  const navigate = useNavigate();

  // Sync ref with state
  useEffect(() => {
    accessTokenRef.current = accessToken;
  }, [accessToken]);

  // Initialize API client with auth functions
  useEffect(() => {
    initApiClient(getAccessToken, setAuth, clearAuth);
  }, []);

  /**
   * Redirect to Google OAuth login
   */
  const login = useCallback(() => {
    window.location.href = `${API_BASE_URL}/auth/google`;
  }, []);

  /**
   * Set authentication state after successful login
   */
  const setAuth = useCallback((token: string, userData: User) => {
    setAccessToken(token);
    accessTokenRef.current = token;
    setUser(userData);
    setIsLoading(false);
  }, []);

  /**
   * Clear authentication state
   */
  const clearAuth = useCallback(() => {
    setAccessToken(null);
    accessTokenRef.current = null;
    setUser(null);
    clearSessionId();
    setIsLoading(false);

    // Clear all queries and mutations to prevent stale data and infinite retries
    queryClient.clear();
  }, []);

  /**
   * Get current access token (used by API client)
   */
  const getAccessToken = useCallback(() => {
    return accessTokenRef.current;
  }, []);

  /**
   * Proactively refresh access token
   * Single-flight pattern: only one refresh at a time
   */
  const refreshToken = useCallback(async (): Promise<boolean> => {
    // If refresh is already in progress, wait for it
    if (refreshPromiseRef.current) {
      return refreshPromiseRef.current;
    }

    const sessionId = getSessionId();
    const csrfToken = getCsrfToken();

    if (!sessionId || !csrfToken) {
      return false;
    }

    setIsRefreshing(true);

    refreshPromiseRef.current = (async () => {
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

        // Fetch user info with the new token
        const meResponse = await fetch(`${API_BASE_URL}/auth/me`, {
          headers: {
            'Authorization': `Bearer ${data.accessToken}`,
          },
        });

        if (!meResponse.ok) {
          throw new Error('Failed to fetch user info');
        }

        const userData = await meResponse.json();
        setAuth(data.accessToken, userData);
        return true;
      } catch (error) {
        console.error('Token refresh failed:', error);
        return false;
      } finally {
        setIsRefreshing(false);
        refreshPromiseRef.current = null;
      }
    })();

    return refreshPromiseRef.current;
  }, [setAuth]);

  /**
   * Logout from current session
   */
  const logout = useCallback(async () => {
    const sessionId = getSessionId();
    const csrfToken = getCsrfToken();
    const token = accessTokenRef.current;

    if (!sessionId || !csrfToken || !token) {
      clearAuth();
      navigate('/login');
      return;
    }

    try {
      await fetch(`${API_BASE_URL}/auth/logout`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'X-CSRF-Token': csrfToken,
        },
        body: JSON.stringify({ sessionId }),
      });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      clearAuth();
      navigate('/login');
    }
  }, [clearAuth, navigate]);

  /**
   * Logout from all sessions
   */
  const logoutAll = useCallback(async () => {
    const csrfToken = getCsrfToken();
    const token = accessTokenRef.current;

    if (!csrfToken || !token) {
      clearAuth();
      navigate('/login');
      return;
    }

    try {
      await fetch(`${API_BASE_URL}/auth/logout-all`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'X-CSRF-Token': csrfToken,
        },
      });
    } catch (error) {
      console.error('Logout all error:', error);
    } finally {
      clearAuth();
      navigate('/login');
    }
  }, [clearAuth, navigate]);

  /**
   * Try to restore session on mount
   * Attempts token refresh if we have a sessionId stored
   */
  useEffect(() => {
    const tryRestoreSession = async () => {
      const sessionId = getSessionId();
      const csrfToken = getCsrfToken();

      // No stored session - user needs to login
      if (!sessionId || !csrfToken) {
        setIsLoading(false);
        // Redirect to login if not already there
        if (window.location.pathname !== '/login' && !window.location.pathname.startsWith('/auth/')) {
          navigate('/login', { replace: true });
        }
        return;
      }

      try {
        // Try to refresh the access token
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

        // Fetch user info with the new token
        const meResponse = await fetch(`${API_BASE_URL}/auth/me`, {
          headers: {
            'Authorization': `Bearer ${data.accessToken}`,
          },
        });

        if (!meResponse.ok) {
          throw new Error('Failed to fetch user info');
        }

        const userData = await meResponse.json();
        setAuth(data.accessToken, userData);
      } catch (error) {
        console.error('Session restore failed:', error);
        clearAuth();
        // Redirect to login on session restore failure
        if (window.location.pathname !== '/login' && !window.location.pathname.startsWith('/auth/')) {
          navigate('/login', { replace: true });
        }
      }
    };

    tryRestoreSession();
  }, [setAuth, clearAuth, navigate]);

  /**
   * Proactive token refresh when expired but refreshable
   * This prevents redirect to login when token is expired but session is still valid
   */
  useEffect(() => {
    // Skip if still loading initial session, already refreshing, or no token
    if (isLoading || isRefreshing || !accessToken) {
      return;
    }

    // Check if token is expired and we can refresh
    if (isTokenExpired(accessToken) && canAttemptRefresh()) {
      // Trigger refresh - don't await, just fire it
      refreshToken().then((success) => {
        if (!success) {
          // Refresh failed - clear auth and let RequireAuth redirect
          clearAuth();
        }
      });
    }
  }, [accessToken, isLoading, isRefreshing, refreshToken, clearAuth]);

  // Check if we need to refresh (token expired but we have credentials to refresh)
  // This is computed synchronously BEFORE useEffect runs
  const tokenExpired = !!accessToken && isTokenExpired(accessToken);
  const needsRefresh = tokenExpired && canAttemptRefresh() && !isRefreshing;

  // Consider authenticated if:
  // 1. We have a valid non-expired token, OR
  // 2. Token is expired but we're refreshing or about to refresh
  const isAuthenticated = !!accessToken && (!tokenExpired || isRefreshing || needsRefresh);

  // Show loading if:
  // 1. Initial session restore in progress, OR
  // 2. Token refresh in progress, OR
  // 3. Token expired and refresh is about to start (needsRefresh)
  const showLoading = isLoading || isRefreshing || needsRefresh;

  const value: AuthContextValue = {
    user,
    accessToken,
    isAuthenticated,
    isLoading: showLoading,
    login,
    logout,
    logoutAll,
    setAuth,
    clearAuth,
    getAccessToken,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
