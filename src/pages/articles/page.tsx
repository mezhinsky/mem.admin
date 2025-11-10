import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { columns } from "@/pages/articles/components/form/columns";

import { DataTable as MMTable } from "@/pages/articles/components/form/data-table";
import type {
  ColumnFiltersState,
  RowSelectionState,
  SortingState,
} from "@tanstack/react-table";
import { useBreadcrumb } from "@/hooks/use-breadcrumb";

export default function DemoPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  // 🔹 Получаем параметры из URL
  const page = Number(searchParams.get("page")) || 1;
  const limit = Number(searchParams.get("limit")) || 10;
  const sortBy = searchParams.get("sortBy") || "createdAt";
  const order = searchParams.get("order") || "desc";
  const search = searchParams.get("search") || "";

  // 🔹 Формируем queryKey — зависит от параметров
  const queryKey = useMemo(
    () => ["articles", { page, limit, sortBy, order, search }],
    [page, limit, sortBy, order, search]
  );

  // 🔹 Загружаем данные
  const { data, isLoading, isFetching } = useQuery<any>({
    queryKey,
    queryFn: async () => {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
        sortBy,
        order,
        ...(search ? { search } : {}),
      });

      const res = await fetch(`http://localhost:3000/articles?${params}`);
      if (!res.ok) throw new Error("Ошибка загрузки статей");
      return res.json();
    },
    placeholderData: (prev) => prev, // 👈 заменяет keepPreviousData
  });

  // 🔹 Обработчики изменения фильтров / сортировки / страниц
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
    () => (search ? [{ id: "title", value: search }] : []),
    [search]
  );

  useEffect(() => {
    setBreadcrumbPage("Articles");
  }, [setBreadcrumbPage]);

  // 🔹 Отображение
  if (isLoading) {
    return <div className="p-6 text-muted-foreground">Загрузка...</div>;
  }

  return (
    <div className="container mx-auto p-4 space-y-4">
      <MMTable
        data={data.items}
        page={page}
        totalPages={data.totalPages}
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
          const titleFilter = next.find((f) => f.id === "title");
          handleSearch(
            titleFilter && titleFilter.value ? String(titleFilter.value) : ""
          );
        }}
        onRowSelectionChange={setRowSelection}
      />
    </div>
  );
}
