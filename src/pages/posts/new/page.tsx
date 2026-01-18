import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

import { useBreadcrumb } from "@/hooks/use-breadcrumb";
import { articlesApi, type Article } from "@/lib/articles-api";
import { postsApi } from "@/lib/posts-api";
import { ApiError } from "@/lib/api/client";
import { tgEventsApi } from "@/lib/tg-events-api";
import { buildFrontendArticleUrl, toAbsoluteHttpUrl } from "@/lib/urls";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import FileManager from "@/components/file-manager/file-manager";
import type { Asset, JsonObject } from "@/lib/assets-api";

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

export default function TgPostCreatePage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { setPage: setBreadcrumbPage } = useBreadcrumb();

  const [articleSearch, setArticleSearch] = useState("");
  const [selectedArticleId, setSelectedArticleId] = useState<string>("");

  const [articleIdDraft, setArticleIdDraft] = useState("");
  const [titleDraft, setTitleDraft] = useState("");
  const [excerptDraft, setExcerptDraft] = useState("");
  const [urlDraft, setUrlDraft] = useState("");
  const [tagsDraft, setTagsDraft] = useState("");
  const [coverUrlDraft, setCoverUrlDraft] = useState("");
  const [selectedCoverAsset, setSelectedCoverAsset] = useState<Asset | null>(
    null,
  );
  const [coverPickerOpen, setCoverPickerOpen] = useState(false);

  useEffect(() => {
    setBreadcrumbPage([
      { link: "/", label: "Главная" },
      { link: "/tg-posts", label: "Telegram публикации" },
      { link: "", label: "Новая публикация" },
    ]);
  }, [setBreadcrumbPage]);

  const { data: articlesList, isLoading: isArticlesLoading } = useQuery({
    queryKey: ["articles", { search: articleSearch, limit: 20 }],
    queryFn: () =>
      articlesApi.getAll({
        page: 1,
        limit: 20,
        search: articleSearch.trim() ? articleSearch.trim() : undefined,
        sortBy: "createdAt",
        order: "desc",
      }),
    placeholderData: (prev) => prev,
  });

  const articles = useMemo(() => articlesList?.items ?? [], [articlesList]);

  const { data: selectedArticle, isLoading: isSelectedArticleLoading } =
    useQuery<Article>({
      queryKey: ["article", selectedArticleId],
      enabled: Boolean(selectedArticleId),
      queryFn: () => articlesApi.getById(selectedArticleId),
    });

  useEffect(() => {
    if (!selectedArticle) return;

    const computedArticleId = (
      selectedArticle.slug?.trim() || String(selectedArticle.id)
    ).trim();

    setArticleIdDraft(computedArticleId);
    setTitleDraft(selectedArticle.title ?? "");
    setExcerptDraft(selectedArticle.description ?? "");

    const tags = (selectedArticle.tags ?? [])
      .map((t) => t.slug)
      .filter(Boolean);
    setTagsDraft(tags.join(", "));

    const slugOrId = selectedArticle.slug ?? selectedArticle.id;
    setUrlDraft(buildFrontendArticleUrl(slugOrId) ?? "");

    setCoverUrlDraft("");
    setSelectedCoverAsset(null);
  }, [selectedArticle]);

  const createMutation = useMutation({
    mutationFn: async () => {
      const articleId = articleIdDraft.trim();
      const title = titleDraft.trim();
      const url = urlDraft.trim();

      if (!articleId) throw new Error("articleId не может быть пустым");
      if (!title) throw new Error("Title не может быть пустым");
      if (!url) throw new Error("URL не может быть пустым");

      const tags = tagsDraft
        .split(/[\n,]/g)
        .map((t) => t.trim())
        .filter(Boolean);

      // "Create" should not unexpectedly overwrite an existing post.
      try {
        const existing = await postsApi.getByArticleId(articleId);
        return { postId: existing.id, deliveriesCreated: 0, alreadyExists: true };
      } catch (error) {
        if (!(error instanceof ApiError && error.status === 404)) throw error;
      }

      const coverUrlRaw = coverUrlDraft.trim();
      const coverUrlValue = coverUrlRaw ? toAbsoluteHttpUrl(coverUrlRaw) : null;
      if (coverUrlRaw && !coverUrlValue) {
        throw new Error("coverUrl должен быть URL");
      }
      const coverUrl = coverUrlValue ?? undefined;

      const result = await tgEventsApi.articlePublished({
        articleId,
        title,
        excerpt: excerptDraft.trim() ? excerptDraft.trim() : undefined,
        url,
        coverUrl,
        tags,
      });

      return { postId: result.postId, deliveriesCreated: result.deliveriesCreated };
    },
    onSuccess: (result) => {
      if ("alreadyExists" in result && result.alreadyExists) {
        toast.info("TG пост уже существует — открываю");
      } else {
        toast.success(`Создано. Deliveries: ${result.deliveriesCreated}`);
      }
      queryClient.invalidateQueries({ queryKey: ["tg-posts"] });
      queryClient.invalidateQueries({ queryKey: ["tg-deliveries"] });
      navigate(`/tg-posts/${result.postId}`);
    },
    onError: (error: Error) => {
      toast.error(`Ошибка: ${error.message}`);
    },
  });

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <div className="rounded-lg border p-4 space-y-4">
        <div className="font-medium">Создать tg-post</div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="space-y-1">
            <div className="text-sm text-muted-foreground">Поиск статьи</div>
            <Input
              value={articleSearch}
              onChange={(e) => setArticleSearch(e.target.value)}
              placeholder="title / slug..."
            />
          </div>

          <div className="space-y-1">
            <div className="text-sm text-muted-foreground">Статья</div>
            <Select
              value={selectedArticleId || "none"}
              onValueChange={(value) => {
                if (value === "none") {
                  setSelectedArticleId("");
                  return;
                }
                setSelectedArticleId(value);
              }}
            >
              <SelectTrigger>
                <SelectValue
                  placeholder={
                    isArticlesLoading ? "Загрузка..." : "Выберите статью"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Не выбрано</SelectItem>
                {articles.map((a) => (
                  <SelectItem key={a.id} value={String(a.id)}>
                    {(a.slug ? `${a.slug} · ` : "") + a.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {isSelectedArticleLoading ? (
          <div className="text-sm text-muted-foreground">Загрузка статьи...</div>
        ) : null}

        <div className="space-y-1">
          <div className="text-sm text-muted-foreground">articleId</div>
          <Input
            value={articleIdDraft}
            onChange={(e) => setArticleIdDraft(e.target.value)}
            placeholder="test-gallery-008"
            className="font-mono"
          />
        </div>

        <div className="space-y-1">
          <div className="text-sm text-muted-foreground">Cover (1 фото)</div>
          <div className="flex items-center gap-2">
            <Input
              value={coverUrlDraft}
              onChange={(e) => setCoverUrlDraft(e.target.value)}
              placeholder="https://..."
              className="font-mono"
            />
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => setCoverPickerOpen(true)}
            >
              Выбрать asset
            </Button>
            {coverUrlDraft && (
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => {
                  setCoverUrlDraft("");
                  setSelectedCoverAsset(null);
                }}
              >
                Очистить
              </Button>
            )}
          </div>
          {coverUrlDraft ? (
            <div className="mt-2 flex items-center gap-2 rounded-md border p-2">
              <div className="h-14 w-14 shrink-0 overflow-hidden rounded-md border bg-muted">
                <img
                  src={
                    selectedCoverAsset
                      ? getVariantUrl(selectedCoverAsset) ??
                        selectedCoverAsset.url
                      : toAbsoluteHttpUrl(coverUrlDraft) ?? coverUrlDraft
                  }
                  alt=""
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-xs text-muted-foreground font-mono">
                  {toAbsoluteHttpUrl(coverUrlDraft) ?? coverUrlDraft}
                </div>
              </div>
            </div>
          ) : null}
        </div>

        <div className="space-y-1">
          <div className="text-sm text-muted-foreground">Title</div>
          <Input
            value={titleDraft}
            onChange={(e) => setTitleDraft(e.target.value)}
          />
        </div>

        <div className="space-y-1">
          <div className="text-sm text-muted-foreground">URL</div>
          <Input
            value={urlDraft}
            onChange={(e) => setUrlDraft(e.target.value)}
            placeholder="https://example.com/..."
          />
          {!buildFrontendArticleUrl("test") ? (
            <div className="text-xs text-muted-foreground">
              Подсказка: можно задать `VITE_PUBLIC_SITE_URL` (или
              `VITE_FRONTEND_URL`), чтобы URL подставлялся автоматически.
            </div>
          ) : null}
        </div>

        <div className="space-y-1">
          <div className="text-sm text-muted-foreground">Excerpt</div>
          <Textarea
            value={excerptDraft}
            onChange={(e) => setExcerptDraft(e.target.value)}
            className="min-h-[110px]"
          />
        </div>

        <div className="space-y-1">
          <div className="text-sm text-muted-foreground">
            Tags (comma-separated)
          </div>
          <Input
            value={tagsDraft}
            onChange={(e) => setTagsDraft(e.target.value)}
          />
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => navigate("/tg-posts")}>
            Отмена
          </Button>
          <Button
            onClick={() => createMutation.mutate()}
            disabled={createMutation.isPending}
          >
            {createMutation.isPending ? "Создание..." : "Создать"}
          </Button>
        </div>
      </div>

      <Dialog open={coverPickerOpen} onOpenChange={setCoverPickerOpen}>
        <DialogContent className="max-w-5xl">
          <DialogHeader>
            <DialogTitle>Выбор обложки (1 фото)</DialogTitle>
          </DialogHeader>
          <FileManager
            mode="pick"
            types={["IMAGE"]}
            accept="image/*"
            onPick={(asset) => {
              const candidate = getVariantUrl(asset) ?? asset.url;
              const absolute = toAbsoluteHttpUrl(candidate);
              if (!absolute) {
                toast.error("Невалидный URL у выбранного asset");
                return;
              }
              setSelectedCoverAsset(asset);
              setCoverUrlDraft(absolute);
              setCoverPickerOpen(false);
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
