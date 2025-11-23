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
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";

// 🎯 схема валидации
const formSchema = z.object({
  title: z
    .string()
    .trim()
    .min(3, { message: "Введите заголовок (минимум 3 символа)" }),
  slug: z
    .string()
    .trim()
    .min(3, { message: "Введите slug (минимум 3 символа)" })
    .regex(/^[a-z0-9-]+$/, {
      message: "Только строчные буквы, цифры и дефис",
    }),
  description: z.string().optional(),
  published: z.boolean(),
});

export type ArticleFormValues = z.infer<typeof formSchema>;

// 👇 тип для ref — что родитель сможет вызывать у формы
export type ArticleFormHandle = {
  getValues: () => ArticleFormValues;
  reset: (data?: Partial<ArticleFormValues>) => void;
};

interface ArticleFormProps {
  data?: Partial<ArticleFormValues>;
  onSubmit?: (values: ArticleFormValues) => void;
  formId?: string;
}

// 🧩 сам компонент
const ArticleForm = forwardRef<ArticleFormHandle, ArticleFormProps>(
  ({ data, onSubmit, formId = "article-form" }, ref) => {
    const form = useForm<ArticleFormValues>({
      resolver: zodResolver(formSchema),
      defaultValues: {
        title: data?.title || "",
        slug: data?.slug || "",
        description: data?.description || "",
        published: data?.published ?? false,
      },
    });

    useEffect(() => {
      if (data) {
        form.reset({
          title: data?.title || "",
          slug: data?.slug || "",
          description: data?.description || "",
          published: data?.published ?? false,
        });
      }
    }, [data, form]);

    // Экспортируем наружу методы getValues() и reset()
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
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Заголовок статьи</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Например: Как собрать модель X-Wing"
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  Это название статьи, которое будет отображаться на сайте.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="slug"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Slug</FormLabel>
                <FormControl>
                  <Input
                    placeholder="kak-sobrat-x-wing"
                    {...field}
                    onChange={(event) =>
                      field.onChange(event.target.value.toLowerCase())
                    }
                  />
                </FormControl>
                <FormDescription>
                  Используется в адресе страницы статьи.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Описание</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Краткое описание статьи..."
                    className="min-h-[80px]"
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  Необязательное поле. Показывается в списке статей.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="published"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                <div className="space-y-0.5">
                  <FormLabel>Опубликовано</FormLabel>
                  <FormDescription>
                    Сделает статью видимой на сайте.
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

export default ArticleForm;
