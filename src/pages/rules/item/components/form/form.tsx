import { forwardRef, useEffect, useImperativeHandle } from "react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useQuery } from "@tanstack/react-query";

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { channelsApi } from "@/lib/channels-api";
import type { RuleType } from "@/lib/rules-api";

const formSchema = z.object({
  channelId: z.string().trim().min(1, { message: "Выберите канал" }),
  type: z.enum(["TAG", "CATEGORY", "ALL"]),
  value: z
    .string()
    .trim()
    .min(1, { message: "Обязательное поле" })
    .max(100, { message: "Максимум 100 символов" }),
  isActive: z.boolean(),
});

export type RuleFormValues = z.infer<typeof formSchema>;

export type RuleFormHandle = {
  getValues: () => RuleFormValues;
  reset: (data?: Partial<RuleFormValues>) => void;
};

interface RuleFormInput {
  channelId?: string;
  type?: RuleType;
  value?: string;
  isActive?: boolean;
  channel?: { id: string; key: string; title: string | null } | null;
}

interface RuleFormProps {
  data?: RuleFormInput;
  onSubmit?: (values: RuleFormValues) => void;
  formId?: string;
  isEditMode?: boolean;
}

const RuleForm = forwardRef<RuleFormHandle, RuleFormProps>(
  ({ data, onSubmit, formId = "rule-form", isEditMode = false }, ref) => {
    const form = useForm<RuleFormValues>({
      resolver: zodResolver(formSchema),
      defaultValues: {
        channelId: data?.channelId ?? "",
        type: data?.type ?? "TAG",
        value: data?.value ?? "",
        isActive: data?.isActive ?? true,
      },
    });

    const { data: channels } = useQuery({
      queryKey: ["channels", { page: 1, limit: 100, search: "" }],
      queryFn: () =>
        channelsApi.getAll({
          page: 1,
          limit: 100,
        }),
      staleTime: 60_000,
    });

    useEffect(() => {
      if (data) {
        form.reset({
          channelId: data?.channelId ?? "",
          type: data?.type ?? "TAG",
          value: data?.value ?? "",
          isActive: data?.isActive ?? true,
        });
      }
    }, [data, form]);

    useImperativeHandle(ref, () => ({
      getValues: form.getValues,
      reset: form.reset,
    }));

    const channelOptions = channels?.data ?? [];

    return (
      <Form {...form}>
        <form
          id={formId}
          className="space-y-6 border rounded-lg p-6 bg-white"
          onSubmit={form.handleSubmit((values) => onSubmit?.(values))}
        >
          <FormField
            control={form.control}
            name="channelId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Канал</FormLabel>
                <Select
                  value={field.value}
                  onValueChange={field.onChange}
                  disabled={isEditMode}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Выберите канал" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {channelOptions.map((channel) => (
                      <SelectItem key={channel.id} value={channel.id}>
                        <span className="font-mono">{channel.key}</span>
                        {channel.title ? (
                          <span className="text-muted-foreground">
                            {" "}
                            — {channel.title}
                          </span>
                        ) : null}
                      </SelectItem>
                    ))}
                    {data?.channelId &&
                      !channelOptions.some((c) => c.id === data.channelId) && (
                        <SelectItem value={data.channelId}>
                          <span className="font-mono">
                            {data.channel?.key ?? data.channelId}
                          </span>
                        </SelectItem>
                      )}
                  </SelectContent>
                </Select>
                <FormDescription>
                  {isEditMode
                    ? "Канал нельзя изменить после создания"
                    : "Канал, в который будут публиковаться совпадающие посты"}
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Тип</FormLabel>
                <Select
                  value={field.value}
                  onValueChange={field.onChange}
                  disabled={isEditMode}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Выберите тип" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="TAG">TAG</SelectItem>
                    <SelectItem value="CATEGORY">CATEGORY</SelectItem>
                    <SelectItem value="ALL">ALL</SelectItem>
                  </SelectContent>
                </Select>
                <FormDescription>
                  {isEditMode
                    ? "Тип нельзя изменить после создания"
                    : "Как интерпретировать значение правила"}
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="value"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Значение</FormLabel>
                <FormControl>
                  <Input placeholder="star-wars" {...field} />
                </FormControl>
                <FormDescription>
                  Например slug тега (для TAG) или другой идентификатор
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
                  <FormLabel>Активно</FormLabel>
                  <FormDescription>
                    Включает/выключает применение правила
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

export default RuleForm;

