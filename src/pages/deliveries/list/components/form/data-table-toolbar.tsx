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
import type { DeliveryStatus } from "@/lib/deliveries-api";

interface DataTableToolbarProps<TData> {
  table: Table<TData>;
  postId: string;
  onPostIdChange: (value: string) => void;
  channelId: string;
  onChannelIdChange: (value: string) => void;
  statusFilter: DeliveryStatus | undefined;
  onStatusFilterChange: (status: DeliveryStatus | undefined) => void;
}

export function DataTableToolbar<TData>({
  table,
  postId,
  onPostIdChange,
  channelId,
  onChannelIdChange,
  statusFilter,
  onStatusFilterChange,
}: DataTableToolbarProps<TData>) {
  const hasFilters = postId || channelId || statusFilter;

  const clearFilters = () => {
    onPostIdChange("");
    onChannelIdChange("");
    onStatusFilterChange(undefined);
  };

  return (
    <div className="flex items-center justify-between">
      <div className="flex flex-1 flex-wrap items-center gap-2">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Post ID..."
            value={postId}
            onChange={(e) => onPostIdChange(e.target.value)}
            className="h-9 w-[220px] pl-8 lg:w-[280px]"
          />
        </div>

        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Channel ID..."
            value={channelId}
            onChange={(e) => onChannelIdChange(e.target.value)}
            className="h-9 w-[220px] pl-8 lg:w-[280px]"
          />
        </div>

        <Select
          value={statusFilter || "all"}
          onValueChange={(value) =>
            onStatusFilterChange(
              value === "all" ? undefined : (value as DeliveryStatus)
            )
          }
        >
          <SelectTrigger className="h-9 w-[170px]">
            <SelectValue placeholder="Статус" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Все статусы</SelectItem>
            <SelectItem value="PENDING">PENDING</SelectItem>
            <SelectItem value="SENT">SENT</SelectItem>
            <SelectItem value="FAILED">FAILED</SelectItem>
            <SelectItem value="CANCELLED">CANCELLED</SelectItem>
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

