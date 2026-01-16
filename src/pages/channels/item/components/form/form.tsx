import { forwardRef, useEffect, useImperativeHandle } from "react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";

const formSchema = z.object({
  key: z
    .string()
    .trim()
    .min(2, { message: "Минимум 2 символа" })
    .max(50, { message: "Максимум 50 символов" })
    .regex(/^[a-z0-9_]+$/, {
      message: "Только строчные буквы, цифры и подчёркивания",
    }),
  chatId: z
    .string()
    .trim()
    .min(1, { message: "Обязательное поле" })
    .max(100, { message: "Максимум 100 символов" }),
  username: z.string().trim().max(100).optional(),
  title: z.string().trim().max(200).optional(),
  isActive: z.boolean(),
});

export type ChannelFormValues = z.infer<typeof formSchema>;

export type ChannelFormHandle = {
  getValues: () => ChannelFormValues;
  reset: (data?: Partial<ChannelFormValues>) => void;
};

interface ChannelFormInput {
  key?: string;
  chatId?: string;
  username?: string | null;
  title?: string | null;
  isActive?: boolean;
}

interface ChannelFormProps {
  data?: ChannelFormInput;
  onSubmit?: (values: ChannelFormValues) => void;
  formId?: string;
  isEditMode?: boolean;
}

const ChannelForm = forwardRef<ChannelFormHandle, ChannelFormProps>(
  ({ data, onSubmit, formId = "channel-form", isEditMode = false }, ref) => {
    const form = useForm<ChannelFormValues>({
      resolver: zodResolver(formSchema),
      defaultValues: {
        key: data?.key ?? "",
        chatId: data?.chatId ?? "",
        username: data?.username ?? "",
        title: data?.title ?? "",
        isActive: data?.isActive ?? true,
      },
    });

    useEffect(() => {
      if (data) {
        form.reset({
          key: data?.key ?? "",
          chatId: data?.chatId ?? "",
          username: data?.username ?? "",
          title: data?.title ?? "",
          isActive: data?.isActive ?? true,
        });
      }
    }, [data, form]);

    useImperativeHandle(ref, () => ({
      getValues: form.getValues,
      reset: form.reset,
    }));

    return (
      <Form {...form}>
        <form
          id={formId}
          className="space-y-6 border rounded-lg p-6 bg-white"
          onSubmit={form.handleSubmit((values) => onSubmit?.(values))}
        >
          <FormField
            control={form.control}
            name="key"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Ключ канала</FormLabel>
                <FormControl>
                  <Input
                    placeholder="mem_main"
                    {...field}
                    disabled={isEditMode}
                    onChange={(event) =>
                      field.onChange(event.target.value.toLowerCase())
                    }
                  />
                </FormControl>
                <FormDescription>
                  {isEditMode
                    ? "Ключ нельзя изменить после создания"
                    : "Уникальный идентификатор канала (только строчные буквы, цифры, _)"}
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="chatId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Chat ID</FormLabel>
                <FormControl>
                  <Input placeholder="-1001234567890" {...field} />
                </FormControl>
                <FormDescription>
                  Telegram chat_id канала (можно узнать через @userinfobot)
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="username"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Username</FormLabel>
                <FormControl>
                  <Input placeholder="channel_username" {...field} />
                </FormControl>
                <FormDescription>
                  Username канала без @ (необязательно)
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Название</FormLabel>
                <FormControl>
                  <Input placeholder="Мой канал" {...field} />
                </FormControl>
                <FormDescription>
                  Человекочитаемое название канала (необязательно)
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="isActive"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                <div className="space-y-0.5">
                  <FormLabel>Активен</FormLabel>
                  <FormDescription>
                    Включает/выключает отправку сообщений в канал
                  </FormDescription>
                </div>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
              </FormItem>
            )}
          />
        </form>
      </Form>
    );
  }
);

export default ChannelForm;
