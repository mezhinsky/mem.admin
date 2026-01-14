"use client";

import type { Row } from "@tanstack/react-table";
import { MoreHorizontal } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

import { useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { tagsApi } from "@/lib/tags-api";

interface DataTableRowActionsProps<TData> {
  row: Row<TData>;
}

export function DataTableRowActions<TData extends { id: number }>({
  row,
}: DataTableRowActionsProps<TData>) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const tag = row.original;

  const deleteMutation = useMutation({
    mutationFn: () => tagsApi.delete(tag.id),
    onSuccess: () => {
      setIsDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ["tags"] });
    },
    onError: () => {
      setIsDialogOpen(false);
    },
  });

  const handleDelete = () => deleteMutation.mutate();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="data-[state=open]:bg-muted size-8"
        >
          <MoreHorizontal />
          <span className="sr-only">Open menu</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[160px]">
        <DropdownMenuItem onSelect={() => navigate(`/tags/${tag.id}`)}>
          Редактировать
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <AlertDialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <AlertDialogTrigger asChild>
            <DropdownMenuItem
              variant="destructive"
              onSelect={(event) => event.preventDefault()}
            >
              Удалить
              <DropdownMenuShortcut>⌘⌫</DropdownMenuShortcut>
            </DropdownMenuItem>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Удалить тег?</AlertDialogTitle>
              <AlertDialogDescription>
                Это действие нельзя отменить. Тег будет удален навсегда.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Отмена</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete}>
                {deleteMutation.isPending ? "Удаляем..." : "Удалить"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
