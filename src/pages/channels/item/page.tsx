import { useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import ChannelForm, {
  type ChannelFormHandle,
} from "@/pages/channels/item/components/form/form";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { useBreadcrumb } from "@/hooks/use-breadcrumb";
import { channelsApi, type UpdateChannelDto } from "@/lib/channels-api";
import { toast } from "sonner";

export default function ChannelEditPage() {
  const { id } = useParams();
  const formRef = useRef<ChannelFormHandle>(null);

  const { setPage: setBreadcrumbPage } = useBreadcrumb();

  const { data: channel, isLoading } = useQuery({
    queryKey: ["channel", id],
    queryFn: () => channelsApi.getById(id!),
    enabled: !!id,
  });

  const queryClient = useQueryClient();

  const updateMutation = useMutation({
    mutationFn: (payload: UpdateChannelDto) => channelsApi.update(id!, payload),
    onSuccess: (updated) => {
      toast.success("Канал успешно сохранён");
      queryClient.invalidateQueries({ queryKey: ["channel", id] });
      queryClient.invalidateQueries({ queryKey: ["channels"] });
      if (formRef.current) {
        formRef.current.reset({
          key: updated.key,
          chatId: updated.chatId,
          username: updated.username ?? "",
          title: updated.title ?? "",
          isActive: updated.isActive,
        });
      }
    },
    onError: (error) => {
      toast.error(`Ошибка: ${error.message}`);
    },
  });

  useEffect(() => {
    setBreadcrumbPage([
      { link: "/", label: "Главная" },
      { link: "/channels", label: "Telegram каналы" },
      { link: "", label: channel?.title || channel?.key || "Канал" },
    ]);
  }, [setBreadcrumbPage, channel]);

  useEffect(() => {
    if (!channel) return;

    if (formRef.current) {
      formRef.current.reset({
        key: channel.key,
        chatId: channel.chatId,
        username: channel.username ?? "",
        title: channel.title ?? "",
        isActive: channel.isActive,
      });
    }
  }, [channel]);

  if (isLoading) return <p className="p-6">Загрузка...</p>;
  if (!channel) return <p className="p-6">Канал не найден</p>;

  const handleSave = () => {
    const formValues = formRef.current?.getValues();
    if (!formValues) return;

    const payload: UpdateChannelDto = {
      chatId: formValues.chatId,
      username: formValues.username || undefined,
      title: formValues.title || undefined,
      isActive: formValues.isActive,
    };

    updateMutation.mutate(payload);
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <ChannelForm ref={formRef} data={channel} isEditMode />

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
