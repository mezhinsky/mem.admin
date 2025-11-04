import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import { ProfileForm } from "@/pages/article/components/articleForm/form";
import AdminEditor from "@/pages/article/components/articleEditor/editor";

export default function DemoPage() {
  const { id } = useParams();
  const [content, setContent] = useState(null);

  const { data: article, isLoading } = useQuery({
    queryKey: ["article", id],
    queryFn: async () => {
      const res = await fetch(`http://localhost:3000/articles/${id}`);
      if (!res.ok) throw new Error("Ошибка загрузки статьи");
      return res.json();
    },
    enabled: !!id,
  });

  const updateMutation = useMutation({
    mutationFn: async (payload) => {
      const res = await fetch(`http://localhost:3000/articles/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Ошибка сохранения статьи");
      return res.json();
    },
  });

  // ⚠️ этот useEffect безопасен, хуки выше не меняются
  useEffect(() => {
    if (article) setContent(article.content);
  }, [article]);

  if (isLoading) return <p>Загрузка...</p>;
  if (!article) return <p>Статья не найдена</p>;

  const handleSave = () => {
    updateMutation.mutate({
      ...article,
      content,
    });
  };

  return (
    <>
      <ProfileForm article={article} onSave={handleSave} />
      <AdminEditor initialContent={content} onChange={setContent} />
    </>
  );
}
