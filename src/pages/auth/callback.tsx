import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { persistSessionId } from '@/lib/auth/utils';
import { API_BASE_URL } from '@/lib/api';

/**
 * Auth Callback Page
 *
 * This page handles the OAuth callback from the backend.
 * The backend redirects here with tokens as URL parameters.
 *
 * Flow:
 * 1. Extract tokens from URL params
 * 2. Call /auth/set-cookie to store refresh token in HttpOnly cookie
 * 3. Store sessionId in localStorage (for refresh/logout)
 * 4. Store accessToken in memory (AuthProvider)
 * 5. Clear sensitive data from URL and redirect to home
 */
export default function AuthCallbackPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { setAuth, clearAuth } = useAuth();
  const [status, setStatus] = useState<'processing' | 'error'>('processing');
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    const processCallback = async () => {
      // Check for error
      const error = searchParams.get('error');
      if (error) {
        setStatus('error');
        setErrorMessage(
          error === 'missing_params'
            ? 'Missing authorization parameters'
            : error === 'auth_failed'
            ? 'Authentication failed'
            : `OAuth error: ${error}`
        );
        return;
      }

      // Extract tokens from URL
      const accessToken = searchParams.get('accessToken');
      const sessionId = searchParams.get('sessionId');
      const refreshToken = searchParams.get('refreshToken');
      const userId = searchParams.get('userId');
      const email = searchParams.get('email');
      const name = searchParams.get('name');
      const avatar = searchParams.get('avatar');

      if (!accessToken || !sessionId || !refreshToken || !userId) {
        setStatus('error');
        setErrorMessage('Missing required authentication data');
        return;
      }

      try {
        // Step 1: Call /auth/set-cookie to store refresh token in HttpOnly cookie
        // This also sets the CSRF token cookie
        const response = await fetch(`${API_BASE_URL}/auth/set-cookie`, {
          method: 'POST',
          credentials: 'include', // Important: include cookies
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            sessionId,
            refreshToken,
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to set authentication cookies');
        }

        // Step 2: Persist sessionId to localStorage
        // This is needed for refresh and logout operations
        persistSessionId(sessionId);

        // Step 3: Store accessToken and user in memory (AuthProvider)
        // accessToken is NEVER stored in localStorage - only in React state
        setAuth(accessToken, {
          id: userId,
          email: email || null,
          name: name || null,
          avatar: avatar || null,
        });

        // Step 4: Clear sensitive data from URL and redirect
        // Replace history entry to prevent back button from exposing tokens
        navigate('/', { replace: true });
      } catch (err) {
        console.error('Auth callback error:', err);
        setStatus('error');
        setErrorMessage(
          err instanceof Error ? err.message : 'Authentication failed'
        );
        clearAuth();
      }
    };

    processCallback();
  }, [searchParams, setAuth, clearAuth, navigate]);

  if (status === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-destructive mb-2">
            Authentication Error
          </h1>
          <p className="text-muted-foreground mb-4">{errorMessage}</p>
          <button
            onClick={() => navigate('/login', { replace: true })}
            className="text-primary hover:underline"
          >
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
        <p className="text-muted-foreground">Completing sign in...</p>
      </div>
    </div>
  );
}
