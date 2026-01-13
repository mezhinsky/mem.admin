"use client";

import { MoreHorizontal, Pencil, UserX, UserCheck, Shield, ShieldOff } from "lucide-react";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";

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
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";

import type { User } from "@/lib/users-api";
import { usersApi } from "@/lib/users-api";
import { EditUserSheet } from "./edit-user-sheet";

interface UserRowActionsProps {
  user: User;
}

export function UserRowActions({ user }: UserRowActionsProps) {
  const queryClient = useQueryClient();
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeactivateOpen, setIsDeactivateOpen] = useState(false);
  const [isToggleRoleOpen, setIsToggleRoleOpen] = useState(false);

  const toggleActiveMutation = useMutation({
    mutationFn: async () => {
      return usersApi.update(user.id, { isActive: !user.isActive });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast.success(
        user.isActive ? "Пользователь заблокирован" : "Пользователь разблокирован"
      );
      setIsDeactivateOpen(false);
    },
    onError: (error) => {
      toast.error(`Ошибка: ${error.message}`);
    },
  });

  const toggleRoleMutation = useMutation({
    mutationFn: async () => {
      const newRole = user.role === "ADMIN" ? "USER" : "ADMIN";
      return usersApi.update(user.id, { role: newRole });
    },
    onSuccess: (updatedUser) => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast.success(
        `Роль изменена на ${updatedUser.role === "ADMIN" ? "Админ" : "Пользователь"}`
      );
      setIsToggleRoleOpen(false);
    },
    onError: (error) => {
      toast.error(`Ошибка: ${error.message}`);
    },
  });

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="data-[state=open]:bg-muted size-8"
          >
            <MoreHorizontal />
            <span className="sr-only">Открыть меню</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-[180px]">
          <DropdownMenuItem onSelect={() => setIsEditOpen(true)}>
            <Pencil className="mr-2 h-4 w-4" />
            Редактировать
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={() => setIsToggleRoleOpen(true)}>
            {user.role === "ADMIN" ? (
              <>
                <ShieldOff className="mr-2 h-4 w-4" />
                Снять админа
              </>
            ) : (
              <>
                <Shield className="mr-2 h-4 w-4" />
                Сделать админом
              </>
            )}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onSelect={() => setIsDeactivateOpen(true)}
            className={user.isActive ? "text-destructive" : "text-green-600"}
          >
            {user.isActive ? (
              <>
                <UserX className="mr-2 h-4 w-4" />
                Заблокировать
              </>
            ) : (
              <>
                <UserCheck className="mr-2 h-4 w-4" />
                Разблокировать
              </>
            )}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Edit Sheet */}
      <EditUserSheet
        user={user}
        open={isEditOpen}
        onOpenChange={setIsEditOpen}
      />

      {/* Deactivate Dialog */}
      <AlertDialog open={isDeactivateOpen} onOpenChange={setIsDeactivateOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {user.isActive ? "Заблокировать пользователя?" : "Разблокировать пользователя?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {user.isActive
                ? `Пользователь ${user.name || user.email} не сможет войти в систему.`
                : `Пользователь ${user.name || user.email} снова сможет войти в систему.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => toggleActiveMutation.mutate()}
              className={user.isActive ? "bg-destructive hover:bg-destructive/90" : ""}
            >
              {toggleActiveMutation.isPending
                ? "Обработка..."
                : user.isActive
                ? "Заблокировать"
                : "Разблокировать"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Toggle Role Dialog */}
      <AlertDialog open={isToggleRoleOpen} onOpenChange={setIsToggleRoleOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Изменить роль?</AlertDialogTitle>
            <AlertDialogDescription>
              {user.role === "ADMIN"
                ? `${user.name || user.email} потеряет права администратора.`
                : `${user.name || user.email} получит права администратора.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction onClick={() => toggleRoleMutation.mutate()}>
              {toggleRoleMutation.isPending ? "Обработка..." : "Подтвердить"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
