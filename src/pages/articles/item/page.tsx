import { Suspense, lazy, useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import ArticleForm, {
  type ArticleFormHandle,
} from "@/pages/articles/item/components/form/form";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { useBreadcrumb } from "@/hooks/use-breadcrumb";
import { articlesApi, type UpdateArticleDto } from "@/lib/articles-api";
import { toast } from "sonner";
import { tgEventsApi } from "@/lib/tg-events-api";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import FileManager from "@/components/file-manager/file-manager";
import type { Asset, JsonObject } from "@/lib/assets-api";
import { API_BASE_URL } from "@/lib/api";
import { X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const ArticleEditor = lazy(
  () => import("@/pages/articles/item/components/editor/editor")
);

function isJsonObject(value: unknown): value is JsonObject {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function getVariantUrl(asset: Asset): string | null {
  const variantsValue = asset?.metadata?.variants;
  if (!isJsonObject(variantsValue)) return null;
  const variants = variantsValue as JsonObject;
  const lg = variants["lg"];
  const md = variants["md"];
  const original = variants["original"];
  if (typeof lg === "string") return lg;
  if (typeof md === "string") return md;
  if (typeof original === "string") return original;
  return null;
}

function toAbsoluteHttpUrl(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return null;

  const base = new URL(API_BASE_URL, window.location.origin);

  if (/^https?:\/\//i.test(trimmed)) {
    try {
      return new URL(trimmed).toString();
    } catch {
      return null;
    }
  }

  // Resolve relative URLs against API base so `/api/...` stays on same host.
  const normalized = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
  try {
    return new URL(normalized, base.origin).toString();
  } catch {
    return null;
  }
}

function getTelegramMediaUrl(asset: Asset): string | null {
  const variantsValue = asset?.metadata?.variants;
  if (isJsonObject(variantsValue)) {
    const variants = variantsValue as JsonObject;
    const candidates = [
      variants["original"],
      variants["lg"],
      variants["md"],
      variants["thumb"],
    ];
    for (const candidate of candidates) {
      if (typeof candidate !== "string") continue;
      const url = toAbsoluteHttpUrl(candidate);
      if (url) return url;
    }
  }

  return toAbsoluteHttpUrl(asset.url);
}

export default function DemoPage() {
  const { id } = useParams();
  const [content, setContent] = useState<unknown | null>(null);
  const formRef = useRef<ArticleFormHandle>(null);
  const [tgUrl, setTgUrl] = useState("");
  const [tgMediaAssets, setTgMediaAssets] = useState<Asset[]>([]);
  const [mediaPickerOpen, setMediaPickerOpen] = useState(false);

  const { setPage: setBreadcrumbPage } = useBreadcrumb();

  // Загружаем статью
  const { data: article, isLoading } = useQuery({
    queryKey: ["article", id],
    queryFn: () => articlesApi.getById(id!),
    enabled: !!id,
  });

  const queryClient = useQueryClient();
  // Мутация сохранения
  const updateMutation = useMutation({
    mutationFn: (payload: UpdateArticleDto) => articlesApi.update(id!, payload),
    onSuccess: (updated) => {
      toast.success("Статья успешно сохранена");
      queryClient.invalidateQueries({ queryKey: ["article", id] });
      queryClient.invalidateQueries({ queryKey: ["articles"] });
      if (formRef.current) {
        formRef.current.reset({
          title: updated.title,
          slug: updated.slug ?? "",
          description: updated.description ?? "",
          published: updated.published,
          thumbnailAssetId: updated.thumbnailAssetId ?? undefined,
          ogImageAssetId: updated.ogImageAssetId ?? undefined,
          tagIds: updated.tags?.map((t) => t.id) ?? [],
        });
      }
      setContent(updated.content);
    },
    onError: (err) => {
      toast.error(`Ошибка: ${err.message}`);
    },
  });

  const tgArticleId = useMemo(() => {
    if (!article) return "";
    return (article.slug?.trim() || String(article.id)).trim();
  }, [article]);

  const tgTitle = useMemo(() => {
    return article?.title?.trim() ?? "";
  }, [article]);

  const tgExcerpt = useMemo(() => {
    return article?.description?.trim() || undefined;
  }, [article]);

  const tgTags = useMemo(() => {
    return (article?.tags ?? []).map((t) => t.slug).filter(Boolean);
  }, [article]);

  useEffect(() => {
    if (!article) return;
    setTgUrl("");
    setTgMediaAssets([]);
  }, [article?.id]);

  const publishToTelegramMutation = useMutation({
    mutationFn: async () => {
      const url = tgUrl.trim();
      if (!url) throw new Error("URL не может быть пустым");

      const mapped = tgMediaAssets.map((a) => ({
        id: a.id,
        originalName: a.originalName,
        url: getTelegramMediaUrl(a),
      }));

      const invalid = mapped.filter((x) => !x.url);
      if (invalid.length) {
        throw new Error(
          `Некоторые assets не имеют валидного URL: ${invalid
            .slice(0, 3)
            .map((x) => x.originalName || x.id)
            .join(", ")}`,
        );
      }

      const mediaUrls = mapped
        .map((x) => x.url)
        .filter((u): u is string => Boolean(u));

      return tgEventsApi.articlePublished({
        articleId: tgArticleId,
        title: tgTitle,
        excerpt: tgExcerpt,
        url,
        mediaUrls: mediaUrls.length ? mediaUrls : undefined,
        tags: tgTags,
      });
    },
    onSuccess: (result) => {
      toast.success(
        `Отправлено в Telegram: deliveries=${result.deliveriesCreated}`,
      );
      queryClient.invalidateQueries({ queryKey: ["tg-posts"] });
      queryClient.invalidateQueries({ queryKey: ["tg-deliveries"] });
    },
    onError: (err: Error) => {
      toast.error(`Ошибка: ${err.message}`);
    },
  });

  useEffect(() => {
    setBreadcrumbPage([
      { link: "/", label: "Главная" },
      { link: "/articles", label: "Посты" },
      { link: "", label: `${article?.title}` },
    ]);
  }, [setBreadcrumbPage, article]);

  // Загружаем контент при изменении статьи
  useEffect(() => {
    if (!article) return;

    if (formRef.current) {
      formRef.current.reset({
        title: article.title,
        slug: article.slug ?? "",
        description: article.description ?? "",
        published: article.published,
        thumbnailAssetId: article.thumbnailAssetId ?? undefined,
        ogImageAssetId: article.ogImageAssetId ?? undefined,
      });
    }

    setContent(article.content);
  }, [article]);

  if (isLoading) return <p>Загрузка...</p>;
  if (!article) return <p>Статья не найдена</p>;

  // Сохраняем всё сразу — и форму, и редактор
  const handleSave = () => {
    const formValues = formRef.current?.getValues();
    if (!formValues) return;

    const payload: UpdateArticleDto = {
      title: formValues.title,
      slug: formValues.slug,
      description: formValues.description?.trim()
        ? formValues.description
        : undefined,
      published: formValues.published,
      thumbnailAssetId: formValues.thumbnailAssetId || undefined,
      ogImageAssetId: formValues.ogImageAssetId || undefined,
      content: content ?? undefined,
      tagIds: formValues.tagIds ?? [],
    };

    updateMutation.mutate(payload);
  };

  return (
    <div className="max-w-7xl mx-auto p-6 grid grid-cols-1 lg:grid-cols-[350px_1fr] gap-6">
      {/* 🧾 Левая колонка — форма */}
      <ArticleForm ref={formRef} data={article} />

      {/* ✍️ Правая колонка — редактор */}
      <div className="flex flex-col">
        <Suspense fallback={<div className="p-4">Загрузка редактора...</div>}>
          <div className="prose-content">
            <ArticleEditor initialContent={content} onChange={setContent} />
          </div>
        </Suspense>

        <div className="flex justify-end mt-4">
          <Button
            onClick={handleSave}
            size="sm"
            disabled={updateMutation.isPending}
          >
            {updateMutation.isPending && (
              <Spinner className="mr-2 h-4 w-4 animate-spin" />
            )}
            {updateMutation.isPending ? "Сохранение..." : "Сохранить"}
          </Button>
        </div>

        <div className="mt-6 rounded-lg border p-4 space-y-3">
          <div className="font-medium">Telegram: article-published</div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-1">
              <div className="text-sm text-muted-foreground">articleId</div>
              <Input value={tgArticleId} readOnly className="font-mono" />
            </div>

            <div className="space-y-1">
              <div className="text-sm text-muted-foreground">tags</div>
              <Input value={tgTags.join(", ")} readOnly className="font-mono" />
            </div>
          </div>

          <div className="space-y-1">
            <div className="text-sm text-muted-foreground">title</div>
            <Input value={tgTitle} readOnly />
          </div>

          <div className="space-y-1">
            <div className="text-sm text-muted-foreground">excerpt</div>
            <Textarea value={tgExcerpt ?? ""} readOnly className="min-h-20" />
          </div>

          <div className="space-y-1">
            <div className="text-sm text-muted-foreground">url</div>
            <Input
              value={tgUrl}
              onChange={(e) => setTgUrl(e.target.value)}
              placeholder="https://example.com/..."
            />
          </div>

          <div className="space-y-1">
            <div className="text-sm text-muted-foreground">
              mediaUrls (assets, optional)
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <div className="text-sm text-muted-foreground">
                  Выбрано: {tgMediaAssets.length}/10
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => setMediaPickerOpen(true)}
                  disabled={tgMediaAssets.length >= 10}
                >
                  Добавить asset
                </Button>
              </div>

              {tgMediaAssets.length ? (
                <div className="grid gap-2 grid-cols-[repeat(auto-fill,minmax(220px,1fr))]">
                  {tgMediaAssets.map((asset) => {
                    const thumb = getVariantUrl(asset) ?? asset.url;
                    return (
                      <div
                        key={asset.id}
                        className="flex items-center gap-2 rounded-md border p-2"
                      >
                        <div className="h-12 w-12 shrink-0 overflow-hidden rounded-md border bg-muted">
                          <img
                            src={thumb}
                            alt={asset.originalName}
                            className="h-full w-full object-cover"
                            loading="lazy"
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-sm font-medium">
                            {asset.originalName}
                          </div>
                          <div className="truncate text-xs text-muted-foreground font-mono">
                            {getTelegramMediaUrl(asset) ?? asset.url}
                          </div>
                        </div>
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          onClick={() =>
                            setTgMediaAssets((prev) =>
                              prev.filter((a) => a.id !== asset.id),
                            )
                          }
                          title="Удалить"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="rounded-md border p-3 text-sm text-muted-foreground">
                  Assets не выбраны
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setTgUrl("");
                setTgMediaAssets([]);
              }}
              disabled={publishToTelegramMutation.isPending}
            >
              Очистить
            </Button>
            <Button
              onClick={() => publishToTelegramMutation.mutate()}
              disabled={publishToTelegramMutation.isPending}
            >
              {publishToTelegramMutation.isPending ? "Отправка..." : "Отправить"}
            </Button>
          </div>
        </div>
      </div>

      <Dialog open={mediaPickerOpen} onOpenChange={setMediaPickerOpen}>
        <DialogContent className="max-w-5xl">
          <DialogHeader>
            <DialogTitle>Выбор изображений (Telegram mediaUrls)</DialogTitle>
          </DialogHeader>
          <FileManager
            mode="pick"
            types={["IMAGE"]}
            accept="image/*"
            onPick={(asset) => {
              setTgMediaAssets((prev) => {
                if (prev.some((a) => a.id === asset.id)) return prev;
                if (prev.length >= 10) {
                  toast.error("Максимум 10 изображений (лимит Telegram)");
                  return prev;
                }
                return [...prev, asset];
              });
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
