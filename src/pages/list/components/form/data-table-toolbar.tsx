"use client";

import type { Table } from "@tanstack/react-table";
import { X } from "lucide-react";
import { Link } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DataTableViewOptions } from "@/pages/articles/list/components/form/data-table-view-options";

// import {
//   priorities,
//   statuses,
// } from "@/pages/articles/list/components/data/data.tsx";
// import { DataTableFacetedFilter } from "@/pages/articles/list/components/form/data-table-faceted-filter.tsx";

interface DataTableToolbarProps<TData> {
  table: Table<TData>;
}

export function DataTableToolbar<TData>({
  table,
}: DataTableToolbarProps<TData>) {
  const isFiltered = table.getState().columnFilters.length > 0;

  return (
    <div className="flex items-center justify-between">
      <div className="flex flex-1 items-center gap-2">
        <Input
          placeholder="Фильтр по заголовку..."
          value={(table.getColumn("title")?.getFilterValue() as string) ?? ""}
          onChange={(event) => {
            const value = event.target.value;
            table.getColumn("title")?.setFilterValue(value ? value : undefined);
          }}
          className="h-8 w-[150px] lg:w-[250px]"
        />
        {/* {table.getColumn("published") && (
          <DataTableFacetedFilter
            column={table.getColumn("published")}
            title="Status"
            options={statuses}
          />
        )}
        {table.getColumn("priority") && (
          <DataTableFacetedFilter
            column={table.getColumn("priority")}
            title="Priority"
            options={priorities}
          />
        )} */}
        {isFiltered && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => table.resetColumnFilters()}
          >
            Reset
            <X />
          </Button>
        )}
      </div>
      <div className="flex items-center gap-2">
        <DataTableViewOptions table={table} />
        <Button size="sm" asChild>
          <Link to="articles/new">Добавить пост</Link>
        </Button>
      </div>
    </div>
  );
}
