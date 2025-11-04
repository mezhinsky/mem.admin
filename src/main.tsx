import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import { createBrowserRouter, RouterProvider } from "react-router-dom";
import RootLayout from "./layouts/RootLayout";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";

import Dashboard from "./pages/Dashboard";
import Articles from "./pages/articles";
import Article from "./pages/article/page";

import "./index.css";

const router = createBrowserRouter([
  {
    path: "/",
    element: <RootLayout />,
    children: [
      { path: "/", element: <Dashboard /> },
      { path: "/articles", element: <Articles /> },
      { path: "/article", element: <Article /> },
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
  </StrictMode>
);
