"use client";

import type { ColumnDef } from "@tanstack/react-table";
import {
  IconCircleCheckFilled,
  IconForbid2Filled,
  IconClockHour2,
  IconX,
} from "@tabler/icons-react";

import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";

import { DataTableColumnHeader } from "./data-table-column-header";
import { DataTableRowActions } from "./data-table-row-actions";
import { formatDate } from "@/lib/formatDate";
import type { TgDelivery } from "@/lib/deliveries-api";

const statusMeta: Record<
  TgDelivery["status"],
  { label: string; icon: React.ComponentType<{ className?: string }> }
> = {
  PENDING: { label: "PENDING", icon: IconClockHour2 },
  SENT: { label: "SENT", icon: IconCircleCheckFilled },
  FAILED: { label: "FAILED", icon: IconForbid2Filled },
  CANCELLED: { label: "CANCELLED", icon: IconX },
};

export const columns: ColumnDef<TgDelivery>[] = [
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
    id: "articleId",
    header: () => <div>Article</div>,
    cell: ({ row }) => (
      <div className="font-mono text-sm text-muted-foreground">
        {row.original.post?.articleId ?? "—"}
      </div>
    ),
    enableSorting: false,
  },
  {
    accessorKey: "status",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Статус" />
    ),
    cell: ({ row }) => {
      const meta = statusMeta[row.original.status];
      const Icon = meta.icon;
      const className =
        row.original.status === "SENT"
          ? "fill-green-500 dark:fill-green-400"
          : row.original.status === "FAILED"
            ? "fill-red-500 dark:fill-red-400"
            : row.original.status === "CANCELLED"
              ? "fill-zinc-500 dark:fill-zinc-400"
              : "";
      return (
        <Badge variant="outline" className="text-muted-foreground px-1.5">
          <Icon className={className} />
          {meta.label}
        </Badge>
      );
    },
  },
  {
    accessorKey: "attempts",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Attempts" />
    ),
    cell: ({ row }) => (
      <Badge variant="outline" className="font-mono">
        {row.getValue("attempts")}
      </Badge>
    ),
  },
  {
    accessorKey: "sentAt",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Sent" />
    ),
    cell: ({ row }) => (
      <Badge variant="outline">
        <IconClockHour2 className="" />
        {row.original.sentAt ? formatDate(row.original.sentAt) : "—"}
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
    accessorKey: "lastError",
    header: () => <div>Ошибка</div>,
    cell: ({ row }) => (
      <div className="text-sm text-muted-foreground max-w-[320px] truncate">
        {row.original.lastError ?? "—"}
      </div>
    ),
    enableSorting: false,
  },
  {
    id: "actions",
    cell: ({ row }) => <DataTableRowActions row={row} />,
  },
];

