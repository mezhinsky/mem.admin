"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

import type { User, UpdateUserDto } from "@/lib/users-api";
import { usersApi } from "@/lib/users-api";

const formSchema = z.object({
  name: z.string().optional(),
  avatar: z.string().url("Введите корректный URL").optional().or(z.literal("")),
  role: z.enum(["USER", "ADMIN"]),
  isActive: z.boolean(),
});

type FormValues = z.infer<typeof formSchema>;

interface EditUserSheetProps {
  user: User;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditUserSheet({ user, open, onOpenChange }: EditUserSheetProps) {
  const queryClient = useQueryClient();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: user.name || "",
      avatar: user.avatar || "",
      role: user.role,
      isActive: user.isActive,
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        name: user.name || "",
        avatar: user.avatar || "",
        role: user.role,
        isActive: user.isActive,
      });
    }
  }, [open, user, form]);

  const updateMutation = useMutation({
    mutationFn: async (data: UpdateUserDto) => {
      return usersApi.update(user.id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast.success("Пользователь обновлён");
      onOpenChange(false);
    },
    onError: (error) => {
      toast.error(`Ошибка: ${error.message}`);
    },
  });

  const onSubmit = (values: FormValues) => {
    const data: UpdateUserDto = {};

    if (values.name !== user.name) data.name = values.name || undefined;
    if (values.avatar !== user.avatar) data.avatar = values.avatar || undefined;
    if (values.role !== user.role) data.role = values.role;
    if (values.isActive !== user.isActive) data.isActive = values.isActive;

    if (Object.keys(data).length === 0) {
      toast.info("Нет изменений для сохранения");
      return;
    }

    updateMutation.mutate(data);
  };

  const initials = user.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : user.email?.[0]?.toUpperCase() || "?";

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Редактировать пользователя</SheetTitle>
          <SheetDescription>
            {user.email || "Без email"}
          </SheetDescription>
        </SheetHeader>

        <div className="flex items-center gap-4 py-4">
          <Avatar className="h-16 w-16">
            <AvatarImage src={user.avatar || undefined} alt={user.name || ""} />
            <AvatarFallback className="text-lg">{initials}</AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium">{user.name || "Без имени"}</p>
            <p className="text-sm text-muted-foreground">{user.email}</p>
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Имя</FormLabel>
                  <FormControl>
                    <Input placeholder="Введите имя" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="avatar"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>URL аватара</FormLabel>
                  <FormControl>
                    <Input placeholder="https://..." {...field} />
                  </FormControl>
                  <FormDescription>
                    Ссылка на изображение профиля
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Роль</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Выберите роль" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="USER">Пользователь</SelectItem>
                      <SelectItem value="ADMIN">Администратор</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Администраторы могут управлять контентом и пользователями
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="isActive"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                  <div className="space-y-0.5">
                    <FormLabel>Активен</FormLabel>
                    <FormDescription>
                      Заблокированные пользователи не могут войти
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <SheetFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Отмена
              </Button>
              <Button type="submit" disabled={updateMutation.isPending}>
                {updateMutation.isPending ? "Сохранение..." : "Сохранить"}
              </Button>
            </SheetFooter>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}
