import { Suspense, lazy, useEffect, useRef, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import ArticleForm, {
  type ArticleFormHandle,
  type ArticleFormValues,
} from "@/pages/articles/item/components/form/form";
import { useBreadcrumb } from "@/hooks/use-breadcrumb";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const ArticleEditor = lazy(
  () => import("@/pages/articles/item/components/editor/editor")
);

export default function Page() {
  const formRef = useRef<ArticleFormHandle>(null);
  const [content, setContent] = useState<any>(null);
  const navigate = useNavigate();
  const { setPage: setBreadcrumbPage } = useBreadcrumb();

  useEffect(() => {
    setBreadcrumbPage([
      { link: "/", label: "Главная" },
      { link: "/articles", label: "Посты" },
      { link: "", label: "Новая статья" },
    ]);
  }, [setBreadcrumbPage]);

  const createMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await fetch("http://localhost:3000/articles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error("Не удалось создать статью");
      }

      return res.json();
    },
    onSuccess: (created) => {
      formRef.current?.reset({
        title: "",
        description: "",
        published: false,
      });
      setContent(null);
      toast.info("Event has been created.");
      navigate(`/articles/${created.id}`);
    },
  });

  const handleCreate = (values: ArticleFormValues) => {
    createMutation.mutate({
      ...values,
      content: content ?? "",
    });
  };

  const formId = "create-article-form";

  return (
    <div className="max-w-7xl mx-auto p-6 grid grid-cols-1 lg:grid-cols-[350px_1fr] gap-6">
      {/* 🧾 Левая колонка — форма */}
      <ArticleForm ref={formRef} onSubmit={handleCreate} formId={formId} />

      {/* ✍️ Правая колонка — редактор */}
      <div className="flex flex-col">
        <Suspense fallback={<div className="p-4">Загрузка редактора...</div>}>
          <ArticleEditor initialContent="" onChange={setContent} />
        </Suspense>
        <div className="flex justify-end mt-4">
          <Button
            type="submit"
            form={formId}
            disabled={createMutation.isPending}
          >
            {createMutation.isPending ? "Создание..." : "Создать статью"}
          </Button>
        </div>
      </div>
    </div>
  );
}
