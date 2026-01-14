import { forwardRef, useEffect, useImperativeHandle, useState } from "react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useQuery } from "@tanstack/react-query";
import { ImageIcon, X, Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";

import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import FileManager from "@/components/file-manager/file-manager";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Badge } from "@/components/ui/badge";
import { getAsset, type Asset, type JsonObject } from "@/lib/assets-api";
import { tagsApi } from "@/lib/tags-api";

// 🎯 схема валидации
const formSchema = z.object({
  title: z
    .string()
    .trim()
    .min(3, { message: "Введите заголовок (минимум 3 символа)" }),
  slug: z
    .string()
    .trim()
    .min(3, { message: "Введите slug (минимум 3 символа)" })
    .regex(/^[a-z0-9-]+$/, {
      message: "Только строчные буквы, цифры и дефис",
    }),
  description: z.string().optional(),
  published: z.boolean(),
  weight: z.number().min(1).max(3),
  thumbnailAssetId: z.string().optional(),
  ogImageAssetId: z.string().optional(),
  tagIds: z.array(z.number()).optional(),
});

export type ArticleFormValues = z.infer<typeof formSchema>;

// 👇 тип для ref — что родитель сможет вызывать у формы
export type ArticleFormHandle = {
  getValues: () => ArticleFormValues;
  reset: (data?: Partial<ArticleFormValues>) => void;
};

type ArticleFormInput = Omit<
  Partial<ArticleFormValues>,
  "slug" | "description" | "thumbnailAssetId" | "ogImageAssetId" | "weight" | "tagIds"
> & {
  slug?: string | null;
  description?: string | null;
  thumbnailAssetId?: string | null;
  ogImageAssetId?: string | null;
  weight?: number | null;
  tags?: { id: number; name: string; slug: string }[];
};

interface ArticleFormProps {
  data?: ArticleFormInput;
  onSubmit?: (values: ArticleFormValues) => void;
  formId?: string;
}

function isJsonObject(value: unknown): value is JsonObject {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function getVariantUrl(asset?: Asset | null): string | null {
  const variantsValue = asset?.metadata?.variants;
  if (!isJsonObject(variantsValue)) return asset?.url ?? null;
  const variants = variantsValue as JsonObject;
  const lg = variants["lg"];
  const md = variants["md"];
  const original = variants["original"];
  if (typeof lg === "string") return lg;
  if (typeof md === "string") return md;
  if (typeof original === "string") return original;
  return asset?.url ?? null;
}

// 🧩 сам компонент
const ArticleForm = forwardRef<ArticleFormHandle, ArticleFormProps>(
  ({ data, onSubmit, formId = "article-form" }, ref) => {
    const [thumbnailPickerOpen, setThumbnailPickerOpen] = useState(false);
    const [ogPickerOpen, setOgPickerOpen] = useState(false);
    const [tagsPopoverOpen, setTagsPopoverOpen] = useState(false);

    // Загружаем все теги для выбора
    const { data: tagsData } = useQuery({
      queryKey: ["tags", "all"],
      queryFn: () => tagsApi.getAll({ limit: 100 }),
    });
    const allTags = tagsData?.items ?? [];

    const form = useForm<ArticleFormValues>({
      resolver: zodResolver(formSchema),
      defaultValues: {
        title: data?.title ?? "",
        slug: data?.slug ?? "",
        description: data?.description ?? "",
        published: data?.published ?? false,
        weight: data?.weight ?? 1,
        thumbnailAssetId: data?.thumbnailAssetId ?? undefined,
        ogImageAssetId: data?.ogImageAssetId ?? undefined,
        tagIds: data?.tags?.map((t) => t.id) ?? [],
      },
    });

    const thumbnailAssetId = form.watch("thumbnailAssetId");
    const ogImageAssetId = form.watch("ogImageAssetId");
    const selectedTagIds = form.watch("tagIds") ?? [];

    const { data: thumbnailAsset } = useQuery({
      queryKey: ["asset", thumbnailAssetId],
      queryFn: () => getAsset(thumbnailAssetId!),
      enabled: Boolean(thumbnailAssetId),
      retry: 0,
    });

    const { data: ogAsset } = useQuery({
      queryKey: ["asset", ogImageAssetId],
      queryFn: () => getAsset(ogImageAssetId!),
      enabled: Boolean(ogImageAssetId),
      retry: 0,
    });

    useEffect(() => {
      if (data) {
        form.reset({
          title: data?.title ?? "",
          slug: data?.slug ?? "",
          description: data?.description ?? "",
          published: data?.published ?? false,
          weight: data?.weight ?? 1,
          thumbnailAssetId: data?.thumbnailAssetId ?? undefined,
          ogImageAssetId: data?.ogImageAssetId ?? undefined,
          tagIds: data?.tags?.map((t) => t.id) ?? [],
        });
      }
    }, [data, form]);

    // Экспортируем наружу методы getValues() и reset()
    useImperativeHandle(ref, () => ({
      getValues: form.getValues,
      reset: form.reset,
    }));

    return (
      <>
        <Form {...form}>
          <form
            id={formId}
            className="space-y-6 border rounded-lg p-6 bg-white"
            onSubmit={form.handleSubmit((values) => onSubmit?.(values))}
          >
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Заголовок статьи</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Например: Как собрать модель X-Wing"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Это название статьи, которое будет отображаться на сайте.
                  </FormDescription>
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
                    <Input
                      placeholder="kak-sobrat-x-wing"
                      {...field}
                      onChange={(event) =>
                        field.onChange(event.target.value.toLowerCase())
                      }
                    />
                  </FormControl>
                  <FormDescription>
                    Используется в адресе страницы статьи.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Описание</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Краткое описание статьи..."
                      className="min-h-[80px]"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Необязательное поле. Показывается в списке статей.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="published"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                  <div className="space-y-0.5">
                    <FormLabel>Опубликовано</FormLabel>
                    <FormDescription>
                      Сделает статью видимой на сайте.
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

            <FormField
              control={form.control}
              name="weight"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ширина карточки</FormLabel>
                  <FormControl>
                    <div className="flex gap-2">
                      {[1, 2, 3].map((w) => (
                        <Button
                          key={w}
                          type="button"
                          variant={field.value === w ? "default" : "outline"}
                          className="flex-1"
                          onClick={() => field.onChange(w)}
                        >
                          <span className="flex items-center gap-2">
                            <span
                              className="inline-flex gap-0.5"
                              aria-hidden="true"
                            >
                              {Array.from({ length: w }).map((_, i) => (
                                <span
                                  key={i}
                                  className="w-3 h-4 rounded-sm bg-current opacity-60"
                                />
                              ))}
                            </span>
                            <span>{w}</span>
                          </span>
                        </Button>
                      ))}
                    </div>
                  </FormControl>
                  <FormDescription>
                    Сколько колонок занимает карточка в сетке (1-3).
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="thumbnailAssetId"
              render={({ field }) => (
                <div>
                  <FormLabel>Thumbnail</FormLabel>
                  <FormControl className="py-2">
                    <div className="space-y-3">
                      {thumbnailAsset ? (
                        <div className="flex flex-col items-center gap-2 rounded-lg border p-3 w-full">
                          <div className="h-60 w-60 shrink-0 overflow-hidden rounded-md border bg-muted">
                            <img
                              src={
                                getVariantUrl(thumbnailAsset) ??
                                thumbnailAsset.url
                              }
                              alt={thumbnailAsset.originalName}
                              className="h-full w-full object-cover"
                              loading="lazy"
                            />
                          </div>
                          <div className="flex shrink-0 gap-2">
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => setThumbnailPickerOpen(true)}
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
                          onClick={() => setThumbnailPickerOpen(true)}
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
                    Картинка для карточки/списка статей.
                  </FormDescription>
                  <FormMessage />
                </div>
              )}
            />

            <FormField
              control={form.control}
              name="ogImageAssetId"
              render={({ field }) => (
                <div>
                  <FormLabel>OG Image</FormLabel>
                  <FormControl className="py-2">
                    <div className="space-y-3">
                      {ogAsset ? (
                        <div className="flex flex-col items-center gap-2 rounded-lg border p-3 w-full">
                          <div className="h-60 w-60 shrink-0 overflow-hidden rounded-md border bg-muted">
                            <img
                              src={getVariantUrl(ogAsset) ?? ogAsset.url}
                              alt={ogAsset.originalName}
                              className="h-full w-full object-cover"
                              loading="lazy"
                            />
                          </div>
                          <div className="flex shrink-0 gap-2">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => setOgPickerOpen(true)}
                            >
                              <ImageIcon className="mr-1.5 h-4 w-4" />
                              Заменить
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
                          onClick={() => setOgPickerOpen(true)}
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
                    Картинка для OpenGraph (шаринг в соцсетях).
                  </FormDescription>
                  <FormMessage />
                </div>
              )}
            />

            <FormField
              control={form.control}
              name="tagIds"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Теги</FormLabel>
                  <FormControl>
                    <Popover open={tagsPopoverOpen} onOpenChange={setTagsPopoverOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={tagsPopoverOpen}
                          className="w-full justify-between h-auto min-h-10"
                        >
                          <div className="flex flex-wrap gap-1">
                            {selectedTagIds.length > 0 ? (
                              selectedTagIds.map((tagId) => {
                                const tag = allTags.find((t) => t.id === tagId);
                                return tag ? (
                                  <Badge
                                    key={tag.id}
                                    variant="secondary"
                                    className="mr-1"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      field.onChange(
                                        selectedTagIds.filter((id) => id !== tagId)
                                      );
                                    }}
                                  >
                                    {tag.name}
                                    <X className="ml-1 h-3 w-3 cursor-pointer" />
                                  </Badge>
                                ) : null;
                              })
                            ) : (
                              <span className="text-muted-foreground">
                                Выберите теги...
                              </span>
                            )}
                          </div>
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-full p-0" align="start">
                        <Command>
                          <CommandInput placeholder="Поиск тегов..." />
                          <CommandList>
                            <CommandEmpty>Теги не найдены.</CommandEmpty>
                            <CommandGroup>
                              {allTags.map((tag) => (
                                <CommandItem
                                  key={tag.id}
                                  value={tag.name}
                                  onSelect={() => {
                                    const isSelected = selectedTagIds.includes(tag.id);
                                    if (isSelected) {
                                      field.onChange(
                                        selectedTagIds.filter((id) => id !== tag.id)
                                      );
                                    } else {
                                      field.onChange([...selectedTagIds, tag.id]);
                                    }
                                  }}
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      selectedTagIds.includes(tag.id)
                                        ? "opacity-100"
                                        : "opacity-0"
                                    )}
                                  />
                                  {tag.name}
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  </FormControl>
                  <FormDescription>
                    Выберите теги для группировки статьи.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </form>
        </Form>

        <Dialog
          open={thumbnailPickerOpen}
          onOpenChange={setThumbnailPickerOpen}
        >
          <DialogContent className="w-[calc(100vw-2rem)] max-w-[calc(100vw-2rem)] sm:max-w-[calc(100vw-2rem)] h-[calc(100vh-2rem)] grid-rows-[auto_1fr] overflow-hidden">
            <DialogHeader>
              <DialogTitle>Выберите thumbnail</DialogTitle>
            </DialogHeader>
            <div className="min-h-0 overflow-y-auto">
              <FileManager
                mode="pick"
                types={["IMAGE"]}
                accept="image/*"
                onPick={(asset) => {
                  form.setValue("thumbnailAssetId", asset.id);
                  setThumbnailPickerOpen(false);
                }}
              />
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={ogPickerOpen} onOpenChange={setOgPickerOpen}>
          <DialogContent className="w-[calc(100vw-2rem)] max-w-[calc(100vw-2rem)] sm:max-w-[calc(100vw-2rem)] h-[calc(100vh-2rem)] grid-rows-[auto_1fr] overflow-hidden">
            <DialogHeader>
              <DialogTitle>Выберите OG image</DialogTitle>
            </DialogHeader>
            <div className="min-h-0 overflow-y-auto">
              <FileManager
                mode="pick"
                types={["IMAGE"]}
                accept="image/*"
                onPick={(asset) => {
                  form.setValue("ogImageAssetId", asset.id);
                  setOgPickerOpen(false);
                }}
              />
            </div>
          </DialogContent>
        </Dialog>
      </>
    );
  }
);

export default ArticleForm;
