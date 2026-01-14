"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { IconClockHour2 } from "@tabler/icons-react";

import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";

import type { Tag } from "../data/schema";
import { DataTableColumnHeader } from "./data-table-column-header";
import { DataTableRowActions } from "./data-table-row-actions";
import { formatDate } from "@/lib/formatDate";

export const columns: ColumnDef<Tag>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
        className="translate-y-[2px]"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
        className="translate-y-[2px]"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "id",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="ID" />
    ),
    cell: ({ row }) => (
      <div className="w-[80px] text-muted-foreground font-light">
        {row.getValue("id")}
      </div>
    ),
    enableSorting: true,
    enableHiding: true,
  },
  {
    accessorKey: "name",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Название" />
    ),
    cell: ({ row }) => {
      return (
        <div className="flex gap-2">
          <span className="max-w-[500px] truncate font-medium">
            {row.getValue("name")}
          </span>
        </div>
      );
    },
  },
  {
    accessorKey: "slug",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Slug" />
    ),
    cell: ({ row }) => {
      return (
        <div className="flex gap-2">
          <Badge variant="outline">
            {row.getValue("slug")}
          </Badge>
        </div>
      );
    },
  },
  {
    accessorKey: "createdAt",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Создан" />
    ),
    cell: ({ getValue }) => (
      <Badge variant="outline">
        <IconClockHour2 className="" />
        {formatDate(getValue() as string)}
      </Badge>
    ),
  },
  {
    accessorKey: "updatedAt",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Обновлен" />
    ),
    cell: ({ getValue }) => (
      <Badge variant="outline">
        <IconClockHour2 className="" />
        {formatDate(getValue() as string)}
      </Badge>
    ),
  },
  {
    id: "actions",
    cell: ({ row }) => <DataTableRowActions row={row} />,
  },
];
