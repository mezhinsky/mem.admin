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
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "sonner";
import { tagsApi, type UpdateTagDto } from "@/lib/tags-api";

const formSchema = z.object({
  name: z.string().trim().min(1, { message: "Введите название тега" }),
  slug: z
    .string()
    .trim()
    .min(1, { message: "Введите slug" })
    .regex(/^[a-z0-9-]+$/, {
      message: "Только строчные буквы, цифры и дефис",
    }),
});

type FormValues = z.infer<typeof formSchema>;

export default function EditTagPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { setPage: setBreadcrumbPage } = useBreadcrumb();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      slug: "",
    },
  });

  const { data: tag, isLoading } = useQuery({
    queryKey: ["tag", id],
    queryFn: () => tagsApi.getById(id!),
    enabled: !!id,
  });

  useEffect(() => {
    setBreadcrumbPage([
      { link: "/", label: "Главная" },
      { link: "/tags", label: "Теги" },
      { link: "", label: tag?.name ?? "Редактирование" },
    ]);
  }, [setBreadcrumbPage, tag]);

  useEffect(() => {
    if (tag) {
      form.reset({
        name: tag.name,
        slug: tag.slug,
      });
    }
  }, [tag, form]);

  const updateMutation = useMutation({
    mutationFn: (payload: UpdateTagDto) => tagsApi.update(id!, payload),
    onSuccess: (updated) => {
      toast.success("Тег успешно обновлен");
      queryClient.invalidateQueries({ queryKey: ["tag", id] });
      queryClient.invalidateQueries({ queryKey: ["tags"] });
      form.reset({
        name: updated.name,
        slug: updated.slug,
      });
    },
    onError: () => {
      toast.error("Ошибка при обновлении тега");
    },
  });

  const onSubmit = (values: FormValues) => {
    updateMutation.mutate(values);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-6">
        <Spinner className="h-6 w-6" />
      </div>
    );
  }

  if (!tag) {
    return (
      <div className="p-6 text-center text-muted-foreground">
        Тег не найден
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle>Редактировать тег</CardTitle>
          <CardDescription>
            Измените название или slug тега
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
                    <FormLabel>Название</FormLabel>
                    <FormControl>
                      <Input placeholder="Например: JavaScript" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="slug"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Slug</FormLabel>
                    <FormControl>
                      <Input placeholder="javascript" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate("/tags")}
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
