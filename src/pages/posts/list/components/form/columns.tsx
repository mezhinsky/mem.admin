"use client";

import type { ColumnDef } from "@tanstack/react-table";
import {
  IconCircleCheckFilled,
  IconForbid2Filled,
  IconClockHour2,
  IconAlertTriangleFilled,
} from "@tabler/icons-react";

import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";

import { DataTableColumnHeader } from "./data-table-column-header";
import { DataTableRowActions } from "./data-table-row-actions";
import { formatDate } from "@/lib/formatDate";
import type { TgPost } from "@/lib/posts-api";

const statusBadge: Record<
  TgPost["status"],
  { label: string; icon: React.ComponentType<{ className?: string }> }
> = {
  PENDING: { label: "PENDING", icon: IconClockHour2 },
  SENT: { label: "SENT", icon: IconCircleCheckFilled },
  PARTIAL: { label: "PARTIAL", icon: IconAlertTriangleFilled },
  FAILED: { label: "FAILED", icon: IconForbid2Filled },
};

export const columns: ColumnDef<TgPost>[] = [
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
    accessorKey: "articleId",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Article ID" />
    ),
    cell: ({ row }) => (
      <div className="font-mono text-sm font-medium">
        {row.getValue("articleId")}
      </div>
    ),
  },
  {
    id: "title",
    header: () => <div>Заголовок</div>,
    cell: ({ row }) => {
      const payload = row.original.payload as { title?: unknown } | null;
      const title = payload && typeof payload.title === "string" ? payload.title : null;
      return (
        <div className="max-w-[420px] truncate">
          {title ? <span className="font-medium">{title}</span> : "—"}
        </div>
      );
    },
    enableSorting: false,
  },
  {
    accessorKey: "status",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Статус" />
    ),
    cell: ({ row }) => {
      const meta = statusBadge[row.original.status];
      const Icon = meta.icon;
      const className =
        row.original.status === "SENT"
          ? "fill-green-500 dark:fill-green-400"
          : row.original.status === "FAILED"
            ? "fill-red-500 dark:fill-red-400"
            : row.original.status === "PARTIAL"
              ? "fill-yellow-500 dark:fill-yellow-400"
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
    id: "deliveries",
    header: () => <div>Deliveries</div>,
    cell: ({ row }) => (
      <Badge variant="outline" className="font-mono">
        {row.original._count?.deliveries ?? "—"}
      </Badge>
    ),
    enableSorting: false,
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

