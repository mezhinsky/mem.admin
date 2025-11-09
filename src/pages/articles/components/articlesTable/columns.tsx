"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { IconCircleCheckFilled, IconLoader } from "@tabler/icons-react";

import { formatDate } from "@/lib/formatDate";

// This type is used to define the shape of our data.
// You can use a Zod schema here if you want.
export type Article = {
  id: string;
  title: string;
  published: true | false;
  description: string;
  createdAt: string;
  updatedAt: string;
};

export const columns: ColumnDef<Article>[] = [
  {
    accessorKey: "published",
    header: "Published",
    cell: ({ row }) => (
      <Badge variant="outline" className="text-muted-foreground px-1.5">
        {row.original.published == true ? (
          <IconCircleCheckFilled className="fill-green-500 dark:fill-green-400" />
        ) : (
          <IconLoader />
        )}
        {row.original.published ? "Yes" : "No"}
      </Badge>
    ),
  },
  {
    accessorKey: "title",
    header: "Title",
  },
  {
    accessorKey: "description",
    header: "Description",
  },
  {
    accessorKey: "createdAt",
    header: "Created",
    cell: ({ getValue }) => formatDate(getValue() as string),
  },
  {
    accessorKey: "updatedAt",
    header: "Updated",
    cell: ({ getValue }) => formatDate(getValue() as string),
  },
];
