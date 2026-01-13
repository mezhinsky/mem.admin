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
import { DataTableViewOptions } from "@/components/data-table";
import type { User, Role } from "@/lib/users-api";

interface UsersToolbarProps {
  table: Table<User>;
  search: string;
  onSearchChange: (search: string) => void;
  roleFilter: Role | undefined;
  onRoleFilterChange: (role: Role | undefined) => void;
  activeFilter: boolean | undefined;
  onActiveFilterChange: (isActive: boolean | undefined) => void;
}

export function UsersToolbar({
  table,
  search,
  onSearchChange,
  roleFilter,
  onRoleFilterChange,
  activeFilter,
  onActiveFilterChange,
}: UsersToolbarProps) {
  const hasFilters = search || roleFilter || activeFilter !== undefined;

  const clearFilters = () => {
    onSearchChange("");
    onRoleFilterChange(undefined);
    onActiveFilterChange(undefined);
  };

  return (
    <div className="flex items-center justify-between">
      <div className="flex flex-1 items-center gap-2">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Поиск по имени или email..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="h-9 w-[200px] pl-8 lg:w-[280px]"
          />
        </div>

        <Select
          value={roleFilter || "all"}
          onValueChange={(value) =>
            onRoleFilterChange(value === "all" ? undefined : (value as Role))
          }
        >
          <SelectTrigger className="h-9 w-[140px]">
            <SelectValue placeholder="Роль" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Все роли</SelectItem>
            <SelectItem value="ADMIN">Админы</SelectItem>
            <SelectItem value="USER">Пользователи</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={activeFilter === undefined ? "all" : String(activeFilter)}
          onValueChange={(value) =>
            onActiveFilterChange(
              value === "all" ? undefined : value === "true"
            )
          }
        >
          <SelectTrigger className="h-9 w-[160px]">
            <SelectValue placeholder="Статус" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Все статусы</SelectItem>
            <SelectItem value="true">Активные</SelectItem>
            <SelectItem value="false">Заблокированные</SelectItem>
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
