import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import type {
  ColumnFiltersState,
  RowSelectionState,
  SortingState,
} from "@tanstack/react-table";

import { DataTable } from "@/components/data-table";
import { useBreadcrumb } from "@/hooks/use-breadcrumb";
import { columns } from "./columns";
import { UsersToolbar } from "./toolbar";
import { usersApi, type Role, type User } from "@/lib/users-api";

export default function UsersPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  // Get URL parameters
  const page = Number(searchParams.get("page")) || 1;
  const limit = Number(searchParams.get("limit")) || 20;
  const sortBy = searchParams.get("sortBy") || "createdAt";
  const order = searchParams.get("order") || "desc";
  const search = searchParams.get("search") || "";
  const roleFilter = (searchParams.get("role") as Role) || undefined;
  const activeFilter = searchParams.get("isActive")
    ? searchParams.get("isActive") === "true"
    : undefined;

  // Build query key
  const queryKey = useMemo(
    () => ["users", { page, limit, sortBy, order, search, roleFilter, activeFilter }],
    [page, limit, sortBy, order, search, roleFilter, activeFilter]
  );

  // Load data
  const { data, isLoading } = useQuery({
    queryKey,
    queryFn: async () => {
      const skip = (page - 1) * limit;
      return usersApi.getAll({
        search: search || undefined,
        role: roleFilter,
        isActive: activeFilter,
        skip,
        take: limit,
      });
    },
    placeholderData: (prev) => prev,
  });

  // Calculate total pages
  const totalPages = data ? Math.ceil(data.total / limit) : 1;

  // URL update helpers
  const updateParams = (updates: Record<string, string | undefined>) => {
    const newParams = new URLSearchParams(searchParams);

    Object.entries(updates).forEach(([key, value]) => {
      if (value === undefined || value === "") {
        newParams.delete(key);
      } else {
        newParams.set(key, value);
      }
    });

    setSearchParams(newParams);
  };

  const handlePageChange = (newPage: number) => {
    updateParams({ page: String(newPage) });
  };

  const handleLimitChange = (newLimit: number) => {
    updateParams({ page: "1", limit: String(newLimit) });
  };

  const handleSortChange = (newSorting: SortingState) => {
    const [first] = newSorting;
    updateParams({
      page: "1",
      sortBy: first?.id ?? "createdAt",
      order: first?.desc ? "desc" : "asc",
    });
  };

  const handleSearchChange = (newSearch: string) => {
    updateParams({ page: "1", search: newSearch || undefined });
  };

  const handleRoleFilterChange = (role: Role | undefined) => {
    updateParams({ page: "1", role: role });
  };

  const handleActiveFilterChange = (isActive: boolean | undefined) => {
    updateParams({
      page: "1",
      isActive: isActive === undefined ? undefined : String(isActive),
    });
  };

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
      { link: "/users", label: "Пользователи" },
    ]);
  }, [setBreadcrumbPage]);

  if (isLoading && !data) {
    return <div className="p-6 text-muted-foreground">Загрузка...</div>;
  }

  return (
    <div className="container mx-auto p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Пользователи</h1>
          <p className="text-muted-foreground">
            Управление пользователями и их правами
          </p>
        </div>
      </div>

      <DataTable<User, unknown>
        data={data?.users || []}
        page={page}
        totalPages={totalPages}
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
        toolbar={(table) => (
          <UsersToolbar
            table={table}
            search={search}
            onSearchChange={handleSearchChange}
            roleFilter={roleFilter}
            onRoleFilterChange={handleRoleFilterChange}
            activeFilter={activeFilter}
            onActiveFilterChange={handleActiveFilterChange}
          />
        )}
      />
    </div>
  );
}
