import React, { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import ArticleForm, {
  type ArticleFormHandle,
} from "@/pages/article/components/articleForm/form";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import ArticleEditor from "@/pages/article/components/articleEditor/editor";

export default function DemoPage() {
  const { id } = useParams();
  const [content, setContent] = useState(null);
  const formRef = useRef<ArticleFormHandle>(null);

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
    <div className="max-w-3xl mx-auto p-6">
      <ArticleForm ref={formRef} data={article} />

      <div className="mt-6">
        <ArticleEditor initialContent={content} onChange={setContent} />
      </div>

      <div className="flex justify-end mt-4">
        <Button
          onClick={handleSave}
          size="sm"
          variant="outline"
          disabled={updateMutation.isPending}
        >
          {updateMutation.isPending && (
            <Spinner className="mr-2 h-4 w-4 animate-spin" />
          )}
          {updateMutation.isPending ? "Сохранение..." : "Сохранить"}
        </Button>
      </div>
    </div>
  );
}
