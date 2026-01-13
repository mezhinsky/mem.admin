"use client";

import type { ColumnDef } from "@tanstack/react-table";
import {
  IconCircleCheckFilled,
  IconForbid2Filled,
  IconClockHour2,
  IconShieldCheckFilled,
  IconUser,
} from "@tabler/icons-react";

import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DataTableColumnHeader } from "@/components/data-table";
import type { User } from "@/lib/users-api";
import { formatDate } from "@/lib/formatDate";
import { UserRowActions } from "./row-actions";

export const columns: ColumnDef<User>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Выбрать все"
        className="translate-y-[2px]"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Выбрать строку"
        className="translate-y-[2px]"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "avatar",
    header: "",
    cell: ({ row }) => {
      const user = row.original;
      const initials = user.name
        ? user.name
            .split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase()
            .slice(0, 2)
        : user.email?.[0]?.toUpperCase() || "?";

      return (
        <Avatar className="h-8 w-8">
          <AvatarImage src={user.avatar || undefined} alt={user.name || ""} />
          <AvatarFallback className="text-xs">{initials}</AvatarFallback>
        </Avatar>
      );
    },
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "name",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Имя" />
    ),
    cell: ({ row }) => {
      return (
        <div className="flex flex-col">
          <span className="font-medium">
            {row.original.name || "Без имени"}
          </span>
          <span className="text-xs text-muted-foreground">
            {row.original.email || "Нет email"}
          </span>
        </div>
      );
    },
  },
  {
    accessorKey: "email",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Email" />
    ),
    cell: ({ row }) => (
      <span className="text-muted-foreground">{row.getValue("email") || "—"}</span>
    ),
    enableHiding: true,
  },
  {
    accessorKey: "role",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Роль" />
    ),
    cell: ({ row }) => {
      const role = row.original.role;
      return (
        <Badge
          variant={role === "ADMIN" ? "default" : "secondary"}
          className="gap-1"
        >
          {role === "ADMIN" ? (
            <IconShieldCheckFilled className="h-3 w-3" />
          ) : (
            <IconUser className="h-3 w-3" />
          )}
          {role === "ADMIN" ? "Админ" : "Пользователь"}
        </Badge>
      );
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id));
    },
  },
  {
    accessorKey: "isActive",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Статус" />
    ),
    cell: ({ row }) => {
      const isActive = row.original.isActive;
      return (
        <Badge variant="outline" className="text-muted-foreground px-1.5">
          {isActive ? (
            <IconCircleCheckFilled className="fill-green-500 dark:fill-green-400" />
          ) : (
            <IconForbid2Filled className="fill-red-500 dark:fill-red-400" />
          )}
          {isActive ? "Активен" : "Заблокирован"}
        </Badge>
      );
    },
    filterFn: (row, id, value) => {
      return value.includes(String(row.getValue(id)));
    },
  },
  {
    accessorKey: "createdAt",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Создан" />
    ),
    cell: ({ getValue }) => (
      <Badge variant="outline" className="gap-1">
        <IconClockHour2 className="h-3 w-3" />
        {formatDate(getValue() as string)}
      </Badge>
    ),
  },
  {
    id: "actions",
    cell: ({ row }) => <UserRowActions user={row.original} />,
  },
];
