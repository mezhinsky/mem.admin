"use client";

import type { ColumnDef } from "@tanstack/react-table";

// This type is used to define the shape of our data.
// You can use a Zod schema here if you want.
export type Article = {
  id: string;
  title: string;
  published: "true" | "false";
  description: string;
};

export const columns: ColumnDef<Article>[] = [
  {
    accessorKey: "published",
    header: "Published",
  },
  {
    accessorKey: "title",
    header: "Title",
  },
  {
    accessorKey: "description",
    header: "Description",
  },
];
