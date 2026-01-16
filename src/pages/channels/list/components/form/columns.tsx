"use client";

import type { ColumnDef } from "@tanstack/react-table";
import {
  IconCircleCheckFilled,
  IconForbid2Filled,
  IconClockHour2,
} from "@tabler/icons-react";

import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";

import type { Channel } from "../data/schema";
import { DataTableColumnHeader } from "@/pages/articles/list/components/form/data-table-column-header";
import { DataTableRowActions } from "./data-table-row-actions";
import { formatDate } from "@/lib/formatDate";

export const columns: ColumnDef<Channel>[] = [
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
    accessorKey: "key",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Ключ" />
    ),
    cell: ({ row }) => (
      <div className="font-mono text-sm font-medium">
        {row.getValue("key")}
      </div>
    ),
  },
  {
    accessorKey: "title",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Название" />
    ),
    cell: ({ row }) => (
      <div className="max-w-[300px] truncate">
        {row.getValue("title") || <span className="text-muted-foreground">—</span>}
      </div>
    ),
  },
  {
    accessorKey: "chatId",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Chat ID" />
    ),
    cell: ({ row }) => (
      <div className="font-mono text-sm text-muted-foreground">
        {row.getValue("chatId")}
      </div>
    ),
  },
  {
    accessorKey: "username",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Username" />
    ),
    cell: ({ row }) => {
      const username = row.getValue("username") as string | null;
      return (
        <div className="text-sm">
          {username ? (
            <a
              href={`https://t.me/${username}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              @{username}
            </a>
          ) : (
            <span className="text-muted-foreground">—</span>
          )}
        </div>
      );
    },
  },
  {
    accessorKey: "isActive",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Статус" />
    ),
    cell: ({ row }) => (
      <Badge variant="outline" className="text-muted-foreground px-1.5">
        {row.original.isActive ? (
          <IconCircleCheckFilled className="fill-green-500 dark:fill-green-400" />
        ) : (
          <IconForbid2Filled className="fill-red-500 dark:fill-red-400" />
        )}
        {row.original.isActive ? "Активен" : "Неактивен"}
      </Badge>
    ),
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
    id: "actions",
    cell: ({ row }) => <DataTableRowActions row={row} />,
  },
];
