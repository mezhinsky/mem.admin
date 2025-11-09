"use client";

import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";

import {
  IconChevronLeft,
  IconChevronRight,
  IconChevronsLeft,
  IconChevronsRight,
  IconPlus,
} from "@tabler/icons-react";

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  page: number;
  totalPages: number;
  limit: number;
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
  onSortChange?: (field: string, dir: "asc" | "desc") => void;
  isLoading?: boolean;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  page,
  totalPages,
  limit,
  onPageChange,
  onLimitChange,
  onSortChange,
  isLoading,
}: DataTableProps<TData, TValue>) {
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  const handlePrev = () => {
    if (page > 1) onPageChange(page - 1);
  };

  const handleNext = () => {
    if (page < totalPages) onPageChange(page + 1);
  };

  return (
    <div className="flex-1 outline-none relative flex flex-col gap-4 overflow-auto px-4 lg:px-6 py-2">
      <div className="flex items-center justify-between">
        <Button variant="outline" size="sm">
          <IconPlus className="mr-1" />
          <span className="hidden lg:inline">Создать пост</span>
        </Button>
      </div>

      <div className="overflow-hidden rounded-md border">
        <Table>
          <TableHeader className="bg-muted sticky top-0 z-10">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className="cursor-pointer select-none"
                    onClick={() => {
                      const field = header.column.id;
                      onSortChange?.(
                        field,
                        header.column.getIsSorted() === "asc" ? "desc" : "asc"
                      );
                    }}
                  >
                    {flexRender(
                      header.column.columnDef.header,
                      header.getContext()
                    )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>

          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="text-center py-6 text-muted-foreground"
                >
                  Загружается...
                </TableCell>
              </TableRow>
            ) : table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
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
                  className="text-center py-6 text-muted-foreground"
                >
                  Нет результатов
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Пагинация и лимит */}
      <div className="flex items-center justify-between px-4 py-2">
        <div className="hidden lg:flex items-center gap-2">
          <Label htmlFor="rows-per-page" className="text-sm font-medium">
            Кол-во строк
          </Label>
          <Select
            value={String(limit)}
            onValueChange={(value) => onLimitChange(Number(value))}
          >
            <SelectTrigger size="sm" className="w-20" id="rows-per-page">
              <SelectValue placeholder={limit} />
            </SelectTrigger>
            <SelectContent side="top">
              {[5, 10, 20, 30, 50].map((size) => (
                <SelectItem key={size} value={String(size)}>
                  {size}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => onPageChange(1)}
            disabled={page === 1}
          >
            <IconChevronsLeft />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={handlePrev}
            disabled={page === 1}
          >
            <IconChevronLeft />
          </Button>

          <span className="text-sm font-medium">
            Стр. {page} из {totalPages || 1}
          </span>

          <Button
            variant="outline"
            size="icon"
            onClick={handleNext}
            disabled={page === totalPages}
          >
            <IconChevronRight />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => onPageChange(totalPages)}
            disabled={page === totalPages}
          >
            <IconChevronsRight />
          </Button>
        </div>
      </div>
    </div>
  );
}
