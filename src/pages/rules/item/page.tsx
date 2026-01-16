import { useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import RuleForm, {
  type RuleFormHandle,
} from "@/pages/rules/item/components/form/form";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { useBreadcrumb } from "@/hooks/use-breadcrumb";
import { rulesApi, type UpdateRuleDto } from "@/lib/rules-api";
import { toast } from "sonner";

export default function RuleEditPage() {
  const { id } = useParams();
  const formRef = useRef<RuleFormHandle>(null);

  const { setPage: setBreadcrumbPage } = useBreadcrumb();

  const { data: rule, isLoading } = useQuery({
    queryKey: ["rule", id],
    queryFn: () => rulesApi.getById(id!),
    enabled: !!id,
  });

  const queryClient = useQueryClient();

  const updateMutation = useMutation({
    mutationFn: (payload: UpdateRuleDto) => rulesApi.update(id!, payload),
    onSuccess: (updated) => {
      toast.success("Правило успешно сохранено");
      queryClient.invalidateQueries({ queryKey: ["rule", id] });
      queryClient.invalidateQueries({ queryKey: ["rules"] });
      formRef.current?.reset({
        channelId: updated.channelId,
        type: updated.type,
        value: updated.value,
        isActive: updated.isActive,
      });
    },
    onError: (error) => {
      toast.error(`Ошибка: ${error.message}`);
    },
  });

  useEffect(() => {
    setBreadcrumbPage([
      { link: "/", label: "Главная" },
      { link: "/rules", label: "Telegram правила" },
      { link: "", label: rule ? `${rule.type}:${rule.value}` : "Правило" },
    ]);
  }, [setBreadcrumbPage, rule]);

  useEffect(() => {
    if (!rule) return;
    formRef.current?.reset({
      channelId: rule.channelId,
      type: rule.type,
      value: rule.value,
      isActive: rule.isActive,
    });
  }, [rule]);

  if (isLoading) return <p className="p-6">Загрузка...</p>;
  if (!rule) return <p className="p-6">Правило не найдено</p>;

  const handleSave = () => {
    const formValues = formRef.current?.getValues();
    if (!formValues) return;

    const payload: UpdateRuleDto = {
      value: formValues.value,
      isActive: formValues.isActive,
    };

    updateMutation.mutate(payload);
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <RuleForm ref={formRef} data={rule} isEditMode />

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
  );
}

