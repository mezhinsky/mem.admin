import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { columns } from "@/pages/rules/list/components/form/columns";

import { DataTable } from "@/pages/rules/list/components/form/data-table";
import type {
  ColumnFiltersState,
  RowSelectionState,
  SortingState,
} from "@tanstack/react-table";
import { useBreadcrumb } from "@/hooks/use-breadcrumb";
import { rulesApi } from "@/lib/rules-api";

export default function RulesListPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  const page = Number(searchParams.get("page")) || 1;
  const limit = Number(searchParams.get("limit")) || 10;
  const sortBy = searchParams.get("sortBy") || "createdAt";
  const order = (searchParams.get("order") || "desc") as "asc" | "desc";
  const search = searchParams.get("search") || "";

  const queryKey = useMemo(
    () => ["rules", { page, limit, sortBy, order, search }],
    [page, limit, sortBy, order, search]
  );

  const { data, isLoading } = useQuery({
    queryKey,
    queryFn: () =>
      rulesApi.getAll({
        page,
        limit,
        sortBy,
        order,
        value: search || undefined,
      }),
    placeholderData: (prev) => prev,
  });

  const handlePageChange = (newPage: number) => {
    setSearchParams({
      page: String(newPage),
      limit: String(limit),
      sortBy,
      order,
      ...(search ? { search } : {}),
    });
  };

  const handleSortChange = (field: string, dir: "asc" | "desc") => {
    setSearchParams({
      page: "1",
      limit: String(limit),
      sortBy: field,
      order: dir,
      ...(search ? { search } : {}),
    });
  };

  const handleSearch = (term: string) => {
    setSearchParams({
      page: "1",
      limit: String(limit),
      sortBy,
      order,
      search: term,
    });
  };

  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const { setPage: setBreadcrumbPage } = useBreadcrumb();

  const sorting = useMemo<SortingState>(
    () => [{ id: sortBy, desc: order === "desc" }],
    [sortBy, order]
  );

  const filters = useMemo<ColumnFiltersState>(
    () => (search ? [{ id: "value", value: search }] : []),
    [search]
  );

  useEffect(() => {
    setBreadcrumbPage([
      { link: "/", label: "Главная" },
      { link: "/rules", label: "Telegram правила" },
    ]);
  }, [setBreadcrumbPage]);

  if (isLoading && !data) {
    return <div className="p-6 text-muted-foreground">Загрузка...</div>;
  }

  return (
    <div className="container mx-auto p-4 space-y-4">
      <DataTable
        data={data?.data || []}
        page={page}
        totalPages={data?.meta.totalPages || 0}
        limit={limit}
        columns={columns}
        sorting={sorting}
        filters={filters}
        rowSelection={rowSelection}
        onPageChange={handlePageChange}
        onLimitChange={(newLimit) => {
          setSearchParams({
            page: "1",
            limit: String(newLimit),
            sortBy,
            order,
            ...(search ? { search } : {}),
          });
        }}
        onSortingChange={(next) => {
          const [first] = next;
          handleSortChange(
            first?.id ?? "createdAt",
            first?.desc ? "desc" : "asc"
          );
        }}
        onFiltersChange={(next) => {
          const valueFilter = next.find((f) => f.id === "value");
          handleSearch(
            valueFilter && valueFilter.value ? String(valueFilter.value) : ""
          );
        }}
        onRowSelectionChange={setRowSelection}
      />
    </div>
  );
}

