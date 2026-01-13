/* eslint-disable @typescript-eslint/no-explicit-any */

"use client";

import * as React from "react";
import {
  type ColumnDef,
  type ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  type OnChangeFn,
  type RowSelectionState,
  type SortingState,
  useReactTable,
  type VisibilityState,
} from "@tanstack/react-table";

declare module "@tanstack/react-table" {
  interface TableMeta<TData> {
    __type?: TData;
    goToPage?: (pageIndex: number) => void;
    changePageSize?: (size: number) => void;
    rowSelectionCount?: number;
  }
}

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { DataTablePagination } from "./data-table-pagination";
import { DataTableToolbar } from "./data-table-toolbar";

interface DataTableProps {
  // Keep the table flexible: columns can be demo/synthetic types, while
  // backend data can contain nulls/extra fields. We only need runtime shape.
  columns: ColumnDef<any, any>[];
  data: any[];
  page: number;
  totalPages: number;
  limit: number;
  sorting: SortingState;
  filters: ColumnFiltersState;
  rowSelection: RowSelectionState;
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
  onSortingChange: (updater: SortingState) => void;
  onFiltersChange: (filters: ColumnFiltersState) => void;
  onRowSelectionChange: (
    updater: RowSelectionState | ((old: RowSelectionState) => RowSelectionState)
  ) => void;
}

export function DataTable({
  columns,
  data,
  page,
  totalPages,
  limit,
  sorting,
  filters,
  rowSelection,
  onPageChange,
  onLimitChange,
  onSortingChange,
  onFiltersChange,
  onRowSelectionChange,
}: DataTableProps) {
  // const [rowSelection, setRowSelection] = React.useState({});
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});
  // const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
  //   []
  // );
  // const [sorting, setSorting] = React.useState<SortingState>([]);

  const handleSortingChange: OnChangeFn<SortingState> = (updaterOrValue) => {
    const nextSorting =
      typeof updaterOrValue === "function"
        ? updaterOrValue(sorting)
        : updaterOrValue;
    onSortingChange(nextSorting);
  };

  const handleFiltersChange: OnChangeFn<ColumnFiltersState> = (updater) => {
    const next = typeof updater === "function" ? updater(filters) : updater;
    onFiltersChange(next);
  };

  const handleRowSelectionChange: OnChangeFn<RowSelectionState> = (updater) => {
    const next =
      typeof updater === "function" ? updater(rowSelection) : updater;
    onRowSelectionChange(next);
  };

  const table = useReactTable({
    data,
    columns,
    getRowId: (row) => String((row as { id: string | number }).id),
    state: {
      sorting,
      columnVisibility,
      rowSelection: rowSelection,
      columnFilters: filters,
      pagination: { pageIndex: page - 1, pageSize: limit },
    },
    meta: {
      goToPage: (pageIdx: number) => onPageChange?.(pageIdx + 1),
      changePageSize: (size: number) => onLimitChange?.(size),
      rowSelectionCount: Object.keys(rowSelection).length,
    },
    enableRowSelection: true,
    manualPagination: true,
    manualSorting: true,
    manualFiltering: true,

    pageCount: totalPages,
    onRowSelectionChange: handleRowSelectionChange,
    onSortingChange: handleSortingChange,
    onColumnFiltersChange: handleFiltersChange,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
  });

  return (
    <div className="flex flex-col gap-4">
      <DataTableToolbar table={table} />
      <div className="overflow-hidden rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id} colSpan={header.colSpan}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="max-w-[250px] truncate">
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <DataTablePagination table={table} />
    </div>
  );
}
