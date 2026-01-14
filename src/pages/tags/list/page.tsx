import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { columns } from "@/pages/tags/list/components/form/columns";

import { DataTable } from "@/pages/tags/list/components/form/data-table";
import type {
  ColumnFiltersState,
  RowSelectionState,
  SortingState,
} from "@tanstack/react-table";
import { useBreadcrumb } from "@/hooks/use-breadcrumb";
import { tagsApi } from "@/lib/tags-api";

export default function TagsPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  const page = Number(searchParams.get("page")) || 1;
  const limit = Number(searchParams.get("limit")) || 10;
  const sortBy = searchParams.get("sortBy") || "name";
  const order = (searchParams.get("order") || "asc") as "asc" | "desc";
  const search = searchParams.get("search") || "";

  const queryKey = useMemo(
    () => ["tags", { search }],
    [search]
  );

  const { data, isLoading } = useQuery({
    queryKey,
    queryFn: () =>
      tagsApi.getAll({
        search: search || undefined,
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
      page: String(page),
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
    () => (search ? [{ id: "name", value: search }] : []),
    [search]
  );

  useEffect(() => {
    setBreadcrumbPage([
      { link: "/", label: "Главная" },
      { link: "/tags", label: "Теги" },
    ]);
  }, [setBreadcrumbPage]);

  // Клиентская пагинация (т.к. API возвращает все теги)
  const paginatedData = useMemo(() => {
    if (!data) return [];
    const start = (page - 1) * limit;
    return data.slice(start, start + limit);
  }, [data, page, limit]);

  const totalPages = useMemo(() => {
    if (!data) return 0;
    return Math.ceil(data.length / limit);
  }, [data, limit]);

  if (isLoading) {
    return <div className="p-6 text-muted-foreground">Загрузка...</div>;
  }

  return (
    <div className="container mx-auto p-4 space-y-4">
      <DataTable
        data={paginatedData}
        page={page}
        totalPages={totalPages}
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
            first?.id ?? "name",
            first?.desc ? "desc" : "asc"
          );
        }}
        onFiltersChange={(next) => {
          const nameFilter = next.find((f) => f.id === "name");
          handleSearch(
            nameFilter && nameFilter.value ? String(nameFilter.value) : ""
          );
        }}
        onRowSelectionChange={setRowSelection}
      />
    </div>
  );
}
