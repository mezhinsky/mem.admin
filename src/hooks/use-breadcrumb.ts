import { createContext, useContext } from "react";

export type Breadcrumb = {
  link: string;
  label: string;
};

export type BreadcrumbContextValue = {
  page: Breadcrumb[];
  setPage: (value: Breadcrumb[]) => void;
};

export const BreadcrumbContext = createContext<BreadcrumbContextValue | null>(
  null
);

export const BreadcrumbProvider = BreadcrumbContext.Provider;

export function useBreadcrumb() {
  const ctx = useContext(BreadcrumbContext);
  if (!ctx) {
    throw new Error("useBreadcrumb must be used within a BreadcrumbProvider");
  }
  return ctx;
}
