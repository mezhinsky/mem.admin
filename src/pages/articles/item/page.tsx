import { Suspense, lazy, useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import ArticleForm, {
  type ArticleFormHandle,
} from "@/pages/articles/item/components/form/form";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { useBreadcrumb } from "@/hooks/use-breadcrumb";

const ArticleEditor = lazy(
  () => import("@/pages/articles/item/components/editor/editor")
);

export default function DemoPage() {
  const { id } = useParams();
  const [content, setContent] = useState(null);
  const formRef = useRef<ArticleFormHandle>(null);

  const { setPage: setBreadcrumbPage } = useBreadcrumb();

  // Загружаем статью
  const { data: article, isLoading } = useQuery({
    queryKey: ["article", id],
    queryFn: async () => {
      const res = await fetch(`http://localhost:3000/articles/${id}`);
      if (!res.ok) throw new Error("Ошибка загрузки статьи");
      return res.json();
    },
    enabled: !!id,
  });

  // Мутация сохранения
  const updateMutation = useMutation({
    mutationFn: async (payload) => {
      const res = await fetch(`http://localhost:3000/articles/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Ошибка сохранения статьи");
      return res.json();
    },
    onSuccess: () => console.log("✅ Статья успешно сохранена"),
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
    if (article && formRef.current) {
      formRef.current.reset({
        title: article.title,
        description: article.description,
        published: article.published,
      });
      setContent(article.content);
    }
  }, [article]);

  if (isLoading) return <p>Загрузка...</p>;
  if (!article) return <p>Статья не найдена</p>;

  // 💾 Сохраняем всё сразу — и форму, и редактор
  const handleSave = () => {
    const formValues = formRef.current?.getValues();
    if (!formValues) return;

    updateMutation.mutate({
      ...article,
      ...formValues,
      content,
    });
  };

  return (
    <div className="max-w-7xl mx-auto p-6 grid grid-cols-1 lg:grid-cols-[350px_1fr] gap-6">
      {/* 🧾 Левая колонка — форма */}
      <ArticleForm ref={formRef} data={article} />

      {/* ✍️ Правая колонка — редактор */}
      <div className="flex flex-col">
        <Suspense fallback={<div className="p-4">Загрузка редактора...</div>}>
          <ArticleEditor initialContent={content} onChange={setContent} />
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
