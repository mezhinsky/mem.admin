import { useEffect, useRef } from "react";
import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import ChannelForm, {
  type ChannelFormHandle,
  type ChannelFormValues,
} from "@/pages/channels/item/components/form/form";
import { useBreadcrumb } from "@/hooks/use-breadcrumb";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { channelsApi, type CreateChannelDto } from "@/lib/channels-api";

export default function ChannelCreatePage() {
  const formRef = useRef<ChannelFormHandle>(null);
  const navigate = useNavigate();
  const { setPage: setBreadcrumbPage } = useBreadcrumb();

  useEffect(() => {
    setBreadcrumbPage([
      { link: "/", label: "Главная" },
      { link: "/channels", label: "Telegram каналы" },
      { link: "", label: "Новый канал" },
    ]);
  }, [setBreadcrumbPage]);

  const createMutation = useMutation({
    mutationFn: (payload: CreateChannelDto) => channelsApi.create(payload),
    onSuccess: (created) => {
      formRef.current?.reset({
        key: "",
        chatId: "",
        username: "",
        title: "",
        isActive: true,
      });
      toast.success("Канал успешно создан");
      navigate(`/channels/${created.id}`);
    },
    onError: (error) => {
      toast.error(`Ошибка: ${error.message}`);
    },
  });

  const handleCreate = (values: ChannelFormValues) => {
    createMutation.mutate({
      key: values.key,
      chatId: values.chatId,
      username: values.username || undefined,
      title: values.title || undefined,
      isActive: values.isActive,
    });
  };

  const formId = "create-channel-form";

  return (
    <div className="max-w-2xl mx-auto p-6">
      <ChannelForm ref={formRef} onSubmit={handleCreate} formId={formId} />

      <div className="flex justify-end mt-4">
        <Button
          type="submit"
          form={formId}
          disabled={createMutation.isPending}
        >
          {createMutation.isPending ? "Создание..." : "Создать канал"}
        </Button>
      </div>
    </div>
  );
}
