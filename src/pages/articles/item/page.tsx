import { Suspense, lazy, useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import ArticleForm, {
  type ArticleFormHandle,
} from "@/pages/articles/item/components/form/form";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { useBreadcrumb } from "@/hooks/use-breadcrumb";
import { articlesApi, type UpdateArticleDto } from "@/lib/articles-api";

const ArticleEditor = lazy(
  () => import("@/pages/articles/item/components/editor/editor")
);

export default function DemoPage() {
  const { id } = useParams();
  const [content, setContent] = useState<unknown | null>(null);
  const formRef = useRef<ArticleFormHandle>(null);

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
      console.log("✅ Статья успешно сохранена");
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
        });
      }
      setContent(updated.content);
    },
    onError: (err) => {
      console.error(err);
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

  // 💾 Сохраняем всё сразу — и форму, и редактор
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
      </div>
    </div>
  );
}
