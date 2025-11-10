import { createContext, useContext } from "react";

export type BreadcrumbContextValue = {
  page: string;
  setPage: (label: string) => void;
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
