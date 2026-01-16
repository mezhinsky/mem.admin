import {
  StrictMode,
  Suspense,
  lazy,
  type ComponentType,
  type LazyExoticComponent,
} from "react";
import { createRoot } from "react-dom/client";

import {
  createBrowserRouter,
  RouterProvider,
  Outlet,
} from "react-router-dom";
import RootLayout from "./layouts/RootLayout";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";

import { AuthProvider } from "@/lib/auth";
import { RequireAuth } from "@/components/auth/RequireAuth";
import { Toaster } from "@/components/ui/sonner";

import "./index.css";

// Lazy load pages
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Articles = lazy(() => import("./pages/articles/list/page"));
const Article = lazy(() => import("./pages/articles/item/page"));
const ArticleCreate = lazy(() => import("./pages/articles/new/page"));
const Tags = lazy(() => import("./pages/tags/list/page"));
const Tag = lazy(() => import("./pages/tags/item/page"));
const TagCreate = lazy(() => import("./pages/tags/new/page"));
const Assets = lazy(() => import("./pages/assets/page"));
const Users = lazy(() => import("./pages/users/list/page"));
const User = lazy(() => import("./pages/users/item/page"));
const Channels = lazy(() => import("./pages/channels/list/page"));
const Channel = lazy(() => import("./pages/channels/item/page"));
const ChannelCreate = lazy(() => import("./pages/channels/new/page"));

// Auth pages (not lazy loaded for faster initial load)
const LoginPage = lazy(() => import("./pages/login/page"));
const AuthCallback = lazy(() => import("./pages/auth/callback"));

const withSuspense = (Component: LazyExoticComponent<ComponentType>) => (
  <Suspense
    fallback={<div className="p-4 text-muted-foreground">Loading...</div>}
  >
    <Component />
  </Suspense>
);

/**
 * Auth wrapper component that provides AuthProvider with router context
 */
function AuthWrapper() {
  return (
    <AuthProvider>
      <Outlet />
    </AuthProvider>
  );
}

/**
 * Protected layout that requires authentication
 */
function ProtectedLayout() {
  return (
    <RequireAuth>
      <RootLayout />
    </RequireAuth>
  );
}

const router = createBrowserRouter([
  {
    // Wrap all routes with AuthProvider
    element: <AuthWrapper />,
    children: [
      // Public routes (no auth required)
      { path: "/login", element: withSuspense(LoginPage) },
      { path: "/auth/callback", element: withSuspense(AuthCallback) },

      // Protected routes (require authentication)
      {
        element: <ProtectedLayout />,
        children: [
          { path: "/", element: withSuspense(Dashboard) },
          { path: "/articles", element: withSuspense(Articles) },
          { path: "/articles/new", element: withSuspense(ArticleCreate) },
          { path: "/articles/:id", element: withSuspense(Article) },
          { path: "/tags", element: withSuspense(Tags) },
          { path: "/tags/new", element: withSuspense(TagCreate) },
          { path: "/tags/:id", element: withSuspense(Tag) },
          { path: "/assets", element: withSuspense(Assets) },
          { path: "/users", element: withSuspense(Users) },
          { path: "/users/:id", element: withSuspense(User) },
          { path: "/channels", element: withSuspense(Channels) },
          { path: "/channels/new", element: withSuspense(ChannelCreate) },
          { path: "/channels/:id", element: withSuspense(Channel) },
        ],
      },
    ],
  },
]);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 30_000,
    },
    mutations: {
      retry: 0,
    },
  },
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
    <Toaster />
  </StrictMode>
);
