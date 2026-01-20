import { useEffect, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ImageIcon, X } from "lucide-react";
import { useBreadcrumb } from "@/hooks/use-breadcrumb";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import FileManager from "@/components/file-manager/file-manager";
import { toast } from "sonner";
import { tagsApi, type CreateTagDto } from "@/lib/tags-api";
import { getAsset, type JsonObject } from "@/lib/assets-api";

const formSchema = z.object({
  name: z.string().trim().min(1, { message: "Введите название тега" }),
  slug: z
    .string()
    .trim()
    .min(1, { message: "Введите slug" })
    .regex(/^[a-z0-9-]+$/, {
      message: "Только строчные буквы, цифры и дефис",
    }),
  coverAssetId: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

function isJsonObject(value: unknown): value is JsonObject {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function getVariantUrl(asset?: { url: string; metadata?: JsonObject | null } | null): string | null {
  if (!asset) return null;
  const variantsValue = asset.metadata?.variants;
  if (!isJsonObject(variantsValue)) return asset.url;
  const variants = variantsValue as JsonObject;
  const lg = variants["lg"];
  const md = variants["md"];
  if (typeof lg === "string") return lg;
  if (typeof md === "string") return md;
  return asset.url;
}

export default function CreateTagPage() {
  const navigate = useNavigate();
  const { setPage: setBreadcrumbPage } = useBreadcrumb();
  const [coverPickerOpen, setCoverPickerOpen] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      slug: "",
      coverAssetId: undefined,
    },
  });

  const coverAssetId = form.watch("coverAssetId");

  const { data: coverAsset } = useQuery({
    queryKey: ["asset", coverAssetId],
    queryFn: () => getAsset(coverAssetId!),
    enabled: Boolean(coverAssetId),
    retry: 0,
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

              <FormField
                control={form.control}
                name="coverAssetId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Обложка</FormLabel>
                    <FormControl>
                      <div className="space-y-3">
                        {coverAsset ? (
                          <div className="flex flex-col items-center gap-2 rounded-lg border p-3">
                            <div className="h-40 w-full shrink-0 overflow-hidden rounded-md border bg-muted">
                              <img
                                src={getVariantUrl(coverAsset) ?? coverAsset.url}
                                alt={coverAsset.originalName}
                                className="h-full w-full object-cover"
                                loading="lazy"
                              />
                            </div>
                            <div className="flex shrink-0 gap-2">
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => setCoverPickerOpen(true)}
                              >
                                <ImageIcon className="h-4 w-4" />
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                onClick={() => field.onChange(undefined)}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div
                            className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-6 text-muted-foreground transition-colors hover:border-primary hover:text-primary"
                            onClick={() => setCoverPickerOpen(true)}
                          >
                            <ImageIcon className="h-8 w-8" />
                            <span className="text-sm font-medium">
                              Выбрать изображение
                            </span>
                          </div>
                        )}
                      </div>
                    </FormControl>
                    <FormDescription>
                      Изображение-шапка для страницы тега.
                    </FormDescription>
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

      <Dialog open={coverPickerOpen} onOpenChange={setCoverPickerOpen}>
        <DialogContent className="w-[calc(100vw-2rem)] max-w-[calc(100vw-2rem)] sm:max-w-[calc(100vw-2rem)] h-[calc(100vh-2rem)] grid-rows-[auto_1fr] overflow-hidden">
          <DialogHeader>
            <DialogTitle>Выберите обложку</DialogTitle>
          </DialogHeader>
          <div className="min-h-0 overflow-y-auto">
            <FileManager
              mode="pick"
              types={["IMAGE"]}
              accept="image/*"
              onPick={(asset) => {
                form.setValue("coverAssetId", asset.id);
                setCoverPickerOpen(false);
              }}
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
