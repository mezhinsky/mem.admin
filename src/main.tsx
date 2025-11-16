import {
  StrictMode,
  Suspense,
  lazy,
  type ComponentType,
  type LazyExoticComponent,
} from "react";
import { createRoot } from "react-dom/client";

import { createBrowserRouter, RouterProvider } from "react-router-dom";
import RootLayout from "./layouts/RootLayout";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";

import { Toaster } from "@/components/ui/sonner";

import "./index.css";

const Dashboard = lazy(() => import("./pages/Dashboard"));
const Articles = lazy(() => import("./pages/articles/list/page"));
const Article = lazy(() => import("./pages/articles/item/page"));
const ArticleCreate = lazy(() => import("./pages/articles/new/page"));

const withSuspense = (Component: LazyExoticComponent<ComponentType<any>>) => (
  <Suspense
    fallback={<div className="p-4 text-muted-foreground">Загрузка...</div>}
  >
    <Component />
  </Suspense>
);

const router = createBrowserRouter([
  {
    path: "/",
    element: <RootLayout />,
    children: [
      { path: "/", element: withSuspense(Dashboard) },
      { path: "/articles", element: withSuspense(Articles) },
      { path: "/articles/new", element: withSuspense(ArticleCreate) },
      { path: "/articles/:id", element: withSuspense(Article) },
    ],
  },
]);

// Общие настройки кэша и стейла — можно корректировать под себя
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1, // одна попытка повторить при ошибке
      refetchOnWindowFocus: false,
      staleTime: 30_000, // 30с считаем данные свежими
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
