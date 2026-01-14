import { useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useBreadcrumb } from "@/hooks/use-breadcrumb";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { tagsApi, type CreateTagDto } from "@/lib/tags-api";

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

export default function CreateTagPage() {
  const navigate = useNavigate();
  const { setPage: setBreadcrumbPage } = useBreadcrumb();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      slug: "",
    },
  });

  useEffect(() => {
    setBreadcrumbPage([
      { link: "/", label: "Главная" },
      { link: "/tags", label: "Теги" },
      { link: "", label: "Новый тег" },
    ]);
  }, [setBreadcrumbPage]);

  const createMutation = useMutation({
    mutationFn: (payload: CreateTagDto) => tagsApi.create(payload),
    onSuccess: (created) => {
      toast.success("Тег успешно создан");
      navigate(`/tags/${created.id}`);
    },
    onError: () => {
      toast.error("Ошибка при создании тега");
    },
  });

  const onSubmit = (values: FormValues) => {
    createMutation.mutate(values);
  };

  // Автогенерация slug из name
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    form.setValue("name", name);

    // Генерируем slug из названия
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-");
    form.setValue("slug", slug);
  };

  return (
    <div className="max-w-lg mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle>Создать тег</CardTitle>
          <CardDescription>
            Создайте новый тег для группировки статей
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
                      <Input
                        placeholder="Например: JavaScript"
                        {...field}
                        onChange={handleNameChange}
                      />
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
                  Отмена
                </Button>
                <Button type="submit" disabled={createMutation.isPending}>
                  {createMutation.isPending ? "Создание..." : "Создать"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
