import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/lib/auth';

interface RequireAuthProps {
  children: React.ReactNode;
}

/**
 * Route Guard Component
 *
 * Wraps protected routes and ensures user is authenticated.
 * If not authenticated:
 * 1. Wait for auth loading to complete (might be restoring session)
 * 2. If still not authenticated, redirect to login
 *
 * This works client-side. For SSR/server-side protection,
 * you would need middleware or server-side checks.
 */
export function RequireAuth({ children }: RequireAuthProps) {
  const { isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Wait for loading to complete before redirecting
    if (!isLoading && !isAuthenticated) {
      // Save the attempted URL for redirecting after login
      navigate('/login', {
        replace: true,
        state: { from: location.pathname },
      });
    }
  }, [isAuthenticated, isLoading, navigate, location.pathname]);

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Not authenticated - will redirect via useEffect
  if (!isAuthenticated) {
    return null;
  }

  // Authenticated - render children
  return <>{children}</>;
}
