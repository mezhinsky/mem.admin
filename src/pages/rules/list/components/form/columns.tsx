"use client";

import type { ColumnDef } from "@tanstack/react-table";
import {
  IconCircleCheckFilled,
  IconForbid2Filled,
  IconClockHour2,
} from "@tabler/icons-react";

import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";

import type { Rule } from "../data/schema";
import { DataTableColumnHeader } from "./data-table-column-header";
import { DataTableRowActions } from "./data-table-row-actions";
import { formatDate } from "@/lib/formatDate";

const ruleTypeLabel: Record<Rule["type"], string> = {
  TAG: "TAG",
  CATEGORY: "CATEGORY",
  ALL: "ALL",
};

export const columns: ColumnDef<Rule>[] = [
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
    id: "channel",
    header: () => <div>Канал</div>,
    cell: ({ row }) => (
      <div className="flex flex-col">
        <div className="font-mono text-sm font-medium">
          {row.original.channel?.key ?? row.original.channelId}
        </div>
        <div className="text-xs text-muted-foreground truncate max-w-[220px]">
          {row.original.channel?.title ?? "—"}
        </div>
      </div>
    ),
    enableSorting: false,
  },
  {
    accessorKey: "type",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Тип" />
    ),
    cell: ({ row }) => (
      <Badge variant="outline" className="font-mono">
        {ruleTypeLabel[row.original.type]}
      </Badge>
    ),
  },
  {
    accessorKey: "value",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Значение" />
    ),
    cell: ({ row }) => (
      <div className="font-mono text-sm font-medium">
        {row.getValue("value")}
      </div>
    ),
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
        {row.original.isActive ? "Активно" : "Неактивно"}
      </Badge>
    ),
  },
  {
    accessorKey: "createdAt",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Создано" />
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
      <DataTableColumnHeader column={column} title="Обновлено" />
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

