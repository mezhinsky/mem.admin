"use client";

import type { Table } from "@tanstack/react-table";
import { X, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DataTableViewOptions } from "./data-table-view-options";
import type { PostStatus } from "@/lib/posts-api";

interface DataTableToolbarProps<TData> {
  table: Table<TData>;
  search: string;
  onSearchChange: (search: string) => void;
  statusFilter: PostStatus | undefined;
  onStatusFilterChange: (status: PostStatus | undefined) => void;
}

export function DataTableToolbar<TData>({
  table,
  search,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
}: DataTableToolbarProps<TData>) {
  const hasFilters = search || statusFilter;

  const clearFilters = () => {
    onSearchChange("");
    onStatusFilterChange(undefined);
  };

  return (
    <div className="flex items-center justify-between">
      <div className="flex flex-1 items-center gap-2">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Поиск по articleId..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="h-9 w-[220px] pl-8 lg:w-[320px]"
          />
        </div>

        <Select
          value={statusFilter || "all"}
          onValueChange={(value) =>
            onStatusFilterChange(value === "all" ? undefined : (value as PostStatus))
          }
        >
          <SelectTrigger className="h-9 w-[160px]">
            <SelectValue placeholder="Статус" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Все статусы</SelectItem>
            <SelectItem value="PENDING">PENDING</SelectItem>
            <SelectItem value="SENT">SENT</SelectItem>
            <SelectItem value="PARTIAL">PARTIAL</SelectItem>
            <SelectItem value="FAILED">FAILED</SelectItem>
          </SelectContent>
        </Select>

        {hasFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            Сбросить
            <X className="ml-1 h-4 w-4" />
          </Button>
        )}
      </div>
      <div className="flex items-center gap-2">
        <DataTableViewOptions table={table} />
      </div>
    </div>
  );
}

