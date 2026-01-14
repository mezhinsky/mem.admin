import { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useBreadcrumb } from "@/hooks/use-breadcrumb";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { usersApi, type UpdateUserDto } from "@/lib/users-api";
import { formatDate } from "@/lib/formatDate";
import {
  IconShieldCheckFilled,
  IconUser,
  IconCircleCheckFilled,
  IconForbid2Filled,
} from "@tabler/icons-react";

const formSchema = z.object({
  name: z.string().optional(),
  avatar: z.string().url("Введите корректный URL").optional().or(z.literal("")),
  role: z.enum(["USER", "ADMIN"]),
  isActive: z.boolean(),
});

type FormValues = z.infer<typeof formSchema>;

export default function EditUserPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { setPage: setBreadcrumbPage } = useBreadcrumb();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      avatar: "",
      role: "USER",
      isActive: true,
    },
  });

  const { data: user, isLoading } = useQuery({
    queryKey: ["user", id],
    queryFn: () => usersApi.getById(id!),
    enabled: !!id,
  });

  useEffect(() => {
    setBreadcrumbPage([
      { link: "/", label: "Главная" },
      { link: "/users", label: "Пользователи" },
      { link: "", label: user?.name || user?.email || "Редактирование" },
    ]);
  }, [setBreadcrumbPage, user]);

  useEffect(() => {
    if (user) {
      form.reset({
        name: user.name || "",
        avatar: user.avatar || "",
        role: user.role,
        isActive: user.isActive,
      });
    }
  }, [user, form]);

  const updateMutation = useMutation({
    mutationFn: (payload: UpdateUserDto) => usersApi.update(id!, payload),
    onSuccess: (updated) => {
      toast.success("Пользователь успешно обновлен");
      queryClient.invalidateQueries({ queryKey: ["user", id] });
      queryClient.invalidateQueries({ queryKey: ["users"] });
      form.reset({
        name: updated.name || "",
        avatar: updated.avatar || "",
        role: updated.role,
        isActive: updated.isActive,
      });
    },
    onError: () => {
      toast.error("Ошибка при обновлении пользователя");
    },
  });

  const onSubmit = (values: FormValues) => {
    const data: UpdateUserDto = {};

    if (values.name !== (user?.name || "")) data.name = values.name || undefined;
    if (values.avatar !== (user?.avatar || "")) data.avatar = values.avatar || undefined;
    if (values.role !== user?.role) data.role = values.role;
    if (values.isActive !== user?.isActive) data.isActive = values.isActive;

    if (Object.keys(data).length === 0) {
      toast.info("Нет изменений для сохранения");
      return;
    }

    updateMutation.mutate(data);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-6">
        <Spinner className="h-6 w-6" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="p-6 text-center text-muted-foreground">
        Пользователь не найден
      </div>
    );
  }

  const initials = user.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : user.email?.[0]?.toUpperCase() || "?";

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      {/* User Info Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={user.avatar || undefined} alt={user.name || ""} />
              <AvatarFallback className="text-lg">{initials}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <CardTitle className="flex items-center gap-2">
                {user.name || "Без имени"}
                <Badge
                  variant={user.role === "ADMIN" ? "default" : "secondary"}
                  className="gap-1"
                >
                  {user.role === "ADMIN" ? (
                    <IconShieldCheckFilled className="h-3 w-3" />
                  ) : (
                    <IconUser className="h-3 w-3" />
                  )}
                  {user.role === "ADMIN" ? "Админ" : "Пользователь"}
                </Badge>
              </CardTitle>
              <CardDescription>{user.email || "Нет email"}</CardDescription>
            </div>
            <Badge variant="outline" className="text-muted-foreground px-1.5">
              {user.isActive ? (
                <IconCircleCheckFilled className="fill-green-500 dark:fill-green-400" />
              ) : (
                <IconForbid2Filled className="fill-red-500 dark:fill-red-400" />
              )}
              {user.isActive ? "Активен" : "Заблокирован"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">ID:</span>
              <p className="font-mono text-xs mt-1">{user.id}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Создан:</span>
              <p className="mt-1">{formatDate(user.createdAt)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Edit Form Card */}
      <Card>
        <CardHeader>
          <CardTitle>Редактировать пользователя</CardTitle>
          <CardDescription>
            Измените данные пользователя
          </CardDescription>
        </CardHeader>
        <CardContent>
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
                      value={field.value}
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
                        Заблокированные пользователи не могут войти в систему
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

              <div className="flex justify-end gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate("/users")}
                >
                  Назад
                </Button>
                <Button type="submit" disabled={updateMutation.isPending}>
                  {updateMutation.isPending && (
                    <Spinner className="mr-2 h-4 w-4" />
                  )}
                  {updateMutation.isPending ? "Сохранение..." : "Сохранить"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
