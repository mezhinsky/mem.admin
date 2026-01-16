"use client";

import type { Row } from "@tanstack/react-table";
import { MoreHorizontal } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
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

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { deliveriesApi } from "@/lib/deliveries-api";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

interface DataTableRowActionsProps<TData> {
  row: Row<TData>;
}

export function DataTableRowActions<
  TData extends { id: string; status: string; postId?: string; channelId?: string },
>({ row }: DataTableRowActionsProps<TData>) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [action, setAction] = useState<"retry" | "cancel" | null>(null);
  const delivery = row.original;

  const retryMutation = useMutation({
    mutationFn: () => deliveriesApi.retry(delivery.id),
    onSuccess: () => {
      setAction(null);
      toast.success("Retry запущен");
      queryClient.invalidateQueries({ queryKey: ["tg-deliveries"] });
    },
    onError: (error) => {
      setAction(null);
      toast.error(`Ошибка: ${error.message}`);
    },
  });

  const cancelMutation = useMutation({
    mutationFn: () => deliveriesApi.cancel(delivery.id),
    onSuccess: () => {
      setAction(null);
      toast.success("Доставка отменена");
      queryClient.invalidateQueries({ queryKey: ["tg-deliveries"] });
    },
    onError: (error) => {
      setAction(null);
      toast.error(`Ошибка: ${error.message}`);
    },
  });

  const canRetry = delivery.status === "FAILED" || delivery.status === "CANCELLED";
  const canCancel = delivery.status === "PENDING";

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
      <DropdownMenuContent align="end" className="w-[220px]">
        <DropdownMenuItem
          onSelect={() => {
            if (delivery.postId) navigate(`/tg-posts/${delivery.postId}`);
          }}
          disabled={!delivery.postId}
        >
          Открыть публикацию
        </DropdownMenuItem>
        {(canRetry || canCancel) && <DropdownMenuSeparator />}

        {canRetry && (
          <AlertDialog open={action === "retry"} onOpenChange={(open) => setAction(open ? "retry" : null)}>
            <AlertDialogTrigger asChild>
              <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                Retry доставки
              </DropdownMenuItem>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Retry доставки?</AlertDialogTitle>
                <AlertDialogDescription>
                  Доставка будет переведена в PENDING и поставлена в очередь.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Отмена</AlertDialogCancel>
                <AlertDialogAction onClick={() => retryMutation.mutate()}>
                  {retryMutation.isPending ? "Запуск..." : "Retry"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}

        {canCancel && (
          <AlertDialog open={action === "cancel"} onOpenChange={(open) => setAction(open ? "cancel" : null)}>
            <AlertDialogTrigger asChild>
              <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                Отменить доставку
              </DropdownMenuItem>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Отменить доставку?</AlertDialogTitle>
                <AlertDialogDescription>
                  Доставка будет переведена в CANCELLED.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Отмена</AlertDialogCancel>
                <AlertDialogAction onClick={() => cancelMutation.mutate()}>
                  {cancelMutation.isPending ? "Отмена..." : "Отменить"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

