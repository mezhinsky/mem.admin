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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { ChevronsUpDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { postsApi, type TgPost } from "@/lib/posts-api";
import { formatDate } from "@/lib/formatDate";
import { buildFrontendArticleUrl, getPublicSiteBaseUrl } from "@/lib/urls";

const ArticleEditor = lazy(
  () => import("@/pages/articles/item/components/editor/editor")
);

export default function DemoPage() {
  const { id } = useParams();
  const [content, setContent] = useState<unknown | null>(null);
  const formRef = useRef<ArticleFormHandle>(null);
  const [tgPostIdDraft, setTgPostIdDraft] = useState("");
  const [tgPostSelectOpen, setTgPostSelectOpen] = useState(false);

  const { setPage: setBreadcrumbPage } = useBreadcrumb();

  // Загружаем статью
  const { data: article, isLoading } = useQuery({
    queryKey: ["article", id],
    queryFn: () => articlesApi.getById(id!),
    enabled: !!id,
  });

  const queryClient = useQueryClient();
  const syncTgPostUrlMutation = useMutation({
    mutationFn: async (payload: { tgPostId: string; url: string }) => {
      return postsApi.update(payload.tgPostId, {
        url: payload.url,
        createEditDeliveries: false,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tg-posts"] });
      queryClient.invalidateQueries({ queryKey: ["tg-post"] });
    },
    onError: (error: Error) => {
      toast.error(`TG: не удалось обновить URL: ${error.message}`);
    },
  });

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
      setTgPostIdDraft(updated.tgPostId ?? "");

      const tgPostId = updated.tgPostId ?? "";
      const slugOrId = updated.slug ?? updated.id;
      const frontendUrl = buildFrontendArticleUrl(slugOrId);
      if (tgPostId) {
        if (!frontendUrl) {
          const base = getPublicSiteBaseUrl();
          toast.error(
            base
              ? "Не удалось собрать URL для frontend"
              : "Не задан frontend URL (VITE_PUBLIC_SITE_URL / VITE_FRONTEND_URL)",
          );
        } else {
          syncTgPostUrlMutation.mutate({ tgPostId, url: frontendUrl });
        }
      }
    },
    onError: (err) => {
      toast.error(`Ошибка: ${err.message}`);
    },
  });

  const { data: tgPostsPage } = useQuery({
    queryKey: ["tg-posts", { page: 1, limit: 100, sortBy: "createdAt", order: "desc" }],
    queryFn: () =>
      postsApi.getAll({
        page: 1,
        limit: 100,
        sortBy: "createdAt",
        order: "desc",
      }),
    placeholderData: (prev) => prev,
  });

  const tgPosts = useMemo(() => tgPostsPage?.data ?? [], [tgPostsPage]);

  const { data: selectedTgPost } = useQuery<TgPost | null>({
    queryKey: ["tg-post", tgPostIdDraft],
    enabled: Boolean(tgPostIdDraft),
    queryFn: async () => {
      if (!tgPostIdDraft) return null;
      try {
        return await postsApi.getById(tgPostIdDraft);
      } catch {
        return null;
      }
    },
    retry: 0,
  });

  const tgPostsForSelect = useMemo(() => {
    if (!selectedTgPost) return tgPosts;
    if (tgPosts.some((p) => p.id === selectedTgPost.id)) return tgPosts;
    return [selectedTgPost, ...tgPosts];
  }, [selectedTgPost, tgPosts]);

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
    setTgPostIdDraft(article.tgPostId ?? "");
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
      tgPostId: tgPostIdDraft.trim() ? tgPostIdDraft.trim() : undefined,
    };

    updateMutation.mutate(payload);
  };

  return (
    <div className="max-w-7xl mx-auto p-6 grid grid-cols-1 lg:grid-cols-[350px_1fr] gap-6">
      {/* 🧾 Левая колонка — форма */}
      <div className="space-y-6">
        <ArticleForm ref={formRef} data={article} />

        <div className="rounded-lg border p-4 space-y-3">
          <div className="font-medium">Telegram</div>

          <div className="space-y-1">
            <div className="text-sm text-muted-foreground">tg post</div>
            <Popover open={tgPostSelectOpen} onOpenChange={setTgPostSelectOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={tgPostSelectOpen}
                  className="w-full justify-between font-normal"
                >
                  {tgPostIdDraft
                    ? tgPostsForSelect.find((p) => p.id === tgPostIdDraft)
                        ?.articleId ?? "Не выбрано"
                    : "Не выбрано"}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[300px] p-0" align="start">
                <Command>
                  <CommandInput placeholder="Поиск по articleId..." />
                  <CommandList>
                    <CommandEmpty>Посты не найдены</CommandEmpty>
                    <CommandGroup>
                      <CommandItem
                        value=""
                        onSelect={() => {
                          setTgPostIdDraft("");
                          setTgPostSelectOpen(false);
                        }}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            !tgPostIdDraft ? "opacity-100" : "opacity-0"
                          )}
                        />
                        Не выбрано
                      </CommandItem>
                      {tgPostsForSelect.map((p: TgPost) => (
                        <CommandItem
                          key={p.id}
                          value={p.articleId}
                          onSelect={() => {
                            setTgPostIdDraft(p.id === tgPostIdDraft ? "" : p.id);
                            setTgPostSelectOpen(false);
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              tgPostIdDraft === p.id ? "opacity-100" : "opacity-0"
                            )}
                          />
                          <span className="truncate">
                            {p.articleId} · {p.status}
                          </span>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          {selectedTgPost ? (
            <div className="text-sm text-muted-foreground">
              Обновлен: {formatDate(selectedTgPost.updatedAt)} · Deliveries:{" "}
              {selectedTgPost._count?.deliveries ??
                selectedTgPost.deliveries?.length ??
                0}
            </div>
          ) : null}
        </div>
      </div>

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
      </div>
    </div>
  );
}
