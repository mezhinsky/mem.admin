import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { columns } from "@/pages/channels/list/components/form/columns";

import { DataTable as MMTable } from "@/pages/articles/list/components/form/data-table";
import type {
  ColumnFiltersState,
  RowSelectionState,
  SortingState,
} from "@tanstack/react-table";
import { useBreadcrumb } from "@/hooks/use-breadcrumb";
import { channelsApi } from "@/lib/channels-api";

export default function ChannelsListPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  const page = Number(searchParams.get("page")) || 1;
  const limit = Number(searchParams.get("limit")) || 10;
  const search = searchParams.get("search") || "";

  const queryKey = useMemo(
    () => ["channels", { page, limit, search }],
    [page, limit, search]
  );

  const { data, isLoading } = useQuery({
    queryKey,
    queryFn: () =>
      channelsApi.getAll({
        page,
        limit,
        search: search || undefined,
      }),
    placeholderData: (prev) => prev,
  });

  const handlePageChange = (newPage: number) => {
    setSearchParams({
      page: String(newPage),
      limit: String(limit),
      ...(search ? { search } : {}),
    });
  };

  const handleSearch = (term: string) => {
    setSearchParams({
      page: "1",
      limit: String(limit),
      search: term,
    });
  };

  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const { setPage: setBreadcrumbPage } = useBreadcrumb();

  const sorting = useMemo<SortingState>(() => [], []);

  const filters = useMemo<ColumnFiltersState>(
    () => (search ? [{ id: "key", value: search }] : []),
    [search]
  );

  useEffect(() => {
    setBreadcrumbPage([
      { link: "/", label: "Главная" },
      { link: "/channels", label: "Telegram каналы" },
    ]);
  }, [setBreadcrumbPage]);

  if (isLoading) {
    return <div className="p-6 text-muted-foreground">Загрузка...</div>;
  }

  return (
    <div className="container mx-auto p-4 space-y-4">
      <MMTable
        data={data ? data.data.map((item) => ({ ...item, name: item.key })) : []}
        page={page}
        totalPages={data ? data.meta.totalPages : 0}
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
            ...(search ? { search } : {}),
          });
        }}
        onSortingChange={() => {}}
        onFiltersChange={(next) => {
          const keyFilter = next.find((f) => f.id === "key");
          handleSearch(
            keyFilter && keyFilter.value ? String(keyFilter.value) : ""
          );
        }}
        onRowSelectionChange={setRowSelection}
      />
    </div>
  );
}
