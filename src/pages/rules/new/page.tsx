import { useEffect, useRef } from "react";
import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import RuleForm, {
  type RuleFormHandle,
  type RuleFormValues,
} from "@/pages/rules/item/components/form/form";
import { useBreadcrumb } from "@/hooks/use-breadcrumb";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { rulesApi, type CreateRuleDto } from "@/lib/rules-api";

export default function RuleCreatePage() {
  const formRef = useRef<RuleFormHandle>(null);
  const navigate = useNavigate();
  const { setPage: setBreadcrumbPage } = useBreadcrumb();

  useEffect(() => {
    setBreadcrumbPage([
      { link: "/", label: "Главная" },
      { link: "/rules", label: "Telegram правила" },
      { link: "", label: "Новое правило" },
    ]);
  }, [setBreadcrumbPage]);

  const createMutation = useMutation({
    mutationFn: (payload: CreateRuleDto) => rulesApi.create(payload),
    onSuccess: (created) => {
      formRef.current?.reset({
        channelId: "",
        type: "TAG",
        value: "",
        isActive: true,
      });
      toast.success("Правило успешно создано");
      navigate(`/rules/${created.id}`);
    },
    onError: (error) => {
      toast.error(`Ошибка: ${error.message}`);
    },
  });

  const handleCreate = (values: RuleFormValues) => {
    createMutation.mutate({
      channelId: values.channelId,
      type: values.type,
      value: values.value,
      isActive: values.isActive,
    });
  };

  const formId = "create-rule-form";

  return (
    <div className="max-w-2xl mx-auto p-6">
      <RuleForm ref={formRef} onSubmit={handleCreate} formId={formId} />

      <div className="flex justify-end mt-4">
        <Button type="submit" form={formId} disabled={createMutation.isPending}>
          {createMutation.isPending ? "Создание..." : "Создать правило"}
        </Button>
      </div>
    </div>
  );
}

