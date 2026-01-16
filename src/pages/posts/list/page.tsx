import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import type {
  ColumnFiltersState,
  RowSelectionState,
  SortingState,
} from "@tanstack/react-table";

import { DataTable } from "./components/form/data-table";
import { columns } from "./components/form/columns";
import { useBreadcrumb } from "@/hooks/use-breadcrumb";
import { postsApi, type PostStatus } from "@/lib/posts-api";

export default function TgPostsListPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  const page = Number(searchParams.get("page")) || 1;
  const limit = Number(searchParams.get("limit")) || 20;
  const sortBy = searchParams.get("sortBy") || "createdAt";
  const order = (searchParams.get("order") || "desc") as "asc" | "desc";
  const articleId = searchParams.get("articleId") || "";
  const status = (searchParams.get("status") as PostStatus) || undefined;

  const queryKey = useMemo(
    () => ["tg-posts", { page, limit, sortBy, order, articleId, status }],
    [page, limit, sortBy, order, articleId, status]
  );

  const { data, isLoading } = useQuery({
    queryKey,
    queryFn: () =>
      postsApi.getAll({
        page,
        limit,
        sortBy,
        order,
        articleId: articleId || undefined,
        status,
      }),
    placeholderData: (prev) => prev,
  });

  const updateParams = (updates: Record<string, string | undefined>) => {
    const next = new URLSearchParams(searchParams);

    Object.entries(updates).forEach(([key, value]) => {
      if (value === undefined || value === "") {
        next.delete(key);
      } else {
        next.set(key, value);
      }
    });

    setSearchParams(next);
  };

  const handlePageChange = (newPage: number) => updateParams({ page: String(newPage) });
  const handleLimitChange = (newLimit: number) =>
    updateParams({ page: "1", limit: String(newLimit) });

  const handleSortChange = (newSorting: SortingState) => {
    const [first] = newSorting;
    updateParams({
      page: "1",
      sortBy: first?.id ?? "createdAt",
      order: first?.desc ? "desc" : "asc",
    });
  };

  const handleSearchChange = (newArticleId: string) =>
    updateParams({ page: "1", articleId: newArticleId || undefined });

  const handleStatusChange = (newStatus: PostStatus | undefined) =>
    updateParams({ page: "1", status: newStatus });

  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const { setPage: setBreadcrumbPage } = useBreadcrumb();

  const sorting = useMemo<SortingState>(
    () => [{ id: sortBy, desc: order === "desc" }],
    [sortBy, order]
  );

  const filters = useMemo<ColumnFiltersState>(() => [], []);

  useEffect(() => {
    setBreadcrumbPage([
      { link: "/", label: "Главная" },
      { link: "/tg-posts", label: "Telegram публикации" },
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
        onLimitChange={handleLimitChange}
        onSortingChange={handleSortChange}
        onFiltersChange={() => {}}
        onRowSelectionChange={setRowSelection}
        search={articleId}
        onSearchChange={handleSearchChange}
        statusFilter={status}
        onStatusFilterChange={handleStatusChange}
      />
    </div>
  );
}

