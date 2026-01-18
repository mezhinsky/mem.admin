import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { useBreadcrumb } from "@/hooks/use-breadcrumb";
import { postsApi } from "@/lib/posts-api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDate } from "@/lib/formatDate";
import { Textarea } from "@/components/ui/textarea";

export default function TgPostPage() {
  const { id } = useParams();
  const { setPage: setBreadcrumbPage } = useBreadcrumb();
  const queryClient = useQueryClient();
  const [isEditingPayload, setIsEditingPayload] = useState(false);
  const [titleDraft, setTitleDraft] = useState("");
  const [urlDraft, setUrlDraft] = useState("");
  const [excerptDraft, setExcerptDraft] = useState("");
  const [tagsDraft, setTagsDraft] = useState("");
  const [createEditDeliveries, setCreateEditDeliveries] = useState(true);

  const { data: post, isLoading } = useQuery({
    queryKey: ["tg-post", id],
    queryFn: () => postsApi.getById(id!),
    enabled: !!id,
  });

  const retryMutation = useMutation({
    mutationFn: () => postsApi.retry(id!),
    onSuccess: (result) => {
      toast.success(`Переотправка запущена: ${result.retriedCount}`);
      queryClient.invalidateQueries({ queryKey: ["tg-post", id] });
      queryClient.invalidateQueries({ queryKey: ["tg-posts"] });
    },
    onError: (error) => {
      toast.error(`Ошибка: ${error.message}`);
    },
  });

  const updatePayloadMutation = useMutation({
    mutationFn: (payload: {
      title: string;
      url: string;
      excerpt?: string;
      tags: string[];
    }) => postsApi.update(id!, { ...payload, createEditDeliveries }),
    onSuccess: (result) => {
      toast.success(
        `Payload сохранён. Edit deliveries: ${result.editDeliveriesCreated}`,
      );
      setIsEditingPayload(false);
      queryClient.invalidateQueries({ queryKey: ["tg-post", id] });
      queryClient.invalidateQueries({ queryKey: ["tg-posts"] });
      queryClient.invalidateQueries({ queryKey: ["tg-deliveries"] });
    },
    onError: (error) => {
      toast.error(`Ошибка: ${error.message}`);
    },
  });

  useEffect(() => {
    setBreadcrumbPage([
      { link: "/", label: "Главная" },
      { link: "/tg-posts", label: "Telegram публикации" },
      { link: "", label: post?.articleId ?? "Публикация" },
    ]);
  }, [setBreadcrumbPage, post]);

  const parsedPayload = useMemo(() => {
    const raw = post?.payload;
    if (raw && typeof raw === "object" && !Array.isArray(raw)) {
      return raw as Record<string, unknown>;
    }
    return {};
  }, [post]);

  useEffect(() => {
    if (!post) return;
    if (isEditingPayload) return;
    const title =
      typeof parsedPayload.title === "string" ? parsedPayload.title : "";
    const url = typeof parsedPayload.url === "string" ? parsedPayload.url : "";
    const excerpt =
      typeof parsedPayload.excerpt === "string" ? parsedPayload.excerpt : "";
    const tags = Array.isArray(parsedPayload.tags)
      ? parsedPayload.tags.map((t) => String(t))
      : [];

    setTitleDraft(title);
    setUrlDraft(url);
    setExcerptDraft(excerpt);
    setTagsDraft(tags.join(", "));
  }, [post, isEditingPayload, parsedPayload]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-6">
        <Spinner className="h-6 w-6" />
      </div>
    );
  }

  if (!post) {
    return <div className="p-6 text-muted-foreground">Публикация не найдена</div>;
  }

  const canRetry = post.status === "FAILED" || post.status === "PARTIAL";
  const payload = post.payload as { title?: unknown; url?: unknown; tags?: unknown } | null;
  const title = payload && typeof payload.title === "string" ? payload.title : null;
  const url = payload && typeof payload.url === "string" ? payload.url : null;
  const tags = payload && Array.isArray(payload.tags) ? payload.tags : [];

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <div className="font-mono text-sm text-muted-foreground">
            {post.id}
          </div>
          <div className="text-xl font-semibold">
            {title ?? post.articleId}
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className="font-mono">
              {post.status}
            </Badge>
            <Badge variant="outline" className="font-mono">
              deliveries: {post.deliveries?.length ?? 0}
            </Badge>
            <Badge variant="outline">
              created: {formatDate(post.createdAt)}
            </Badge>
            <Badge variant="outline">
              updated: {formatDate(post.updatedAt)}
            </Badge>
          </div>
          {url && (
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline text-sm"
            >
              {url}
            </a>
          )}
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {tags.slice(0, 12).map((tag, idx) => (
                <Badge key={`${String(tag)}-${idx}`} variant="secondary">
                  {String(tag)}
                </Badge>
              ))}
            </div>
          )}
        </div>

        <Button
          disabled={!canRetry || retryMutation.isPending}
          onClick={() => retryMutation.mutate()}
        >
          {retryMutation.isPending ? "Запуск..." : "Переотправить FAILED"}
        </Button>
      </div>

      <div className="overflow-hidden rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Канал</TableHead>
              <TableHead>Rev</TableHead>
              <TableHead>Статус</TableHead>
              <TableHead>Attempts</TableHead>
              <TableHead>Sent</TableHead>
              <TableHead>Ошибка</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {post.deliveries?.length ? (
              post.deliveries.map((delivery) => (
                <TableRow key={delivery.id}>
                  <TableCell className="font-mono text-sm">
                    {delivery.channel?.key ?? delivery.channelId}
                  </TableCell>
                  <TableCell className="font-mono text-sm">
                    {delivery.revision}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="font-mono">
                      {delivery.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-mono text-sm">
                    {delivery.attempts}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {delivery.sentAt ? formatDate(delivery.sentAt) : "—"}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground max-w-[420px] truncate">
                    {delivery.lastError ?? "—"}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  Нет доставок
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="rounded-md border p-4 space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div className="font-medium">Payload</div>
          {!isEditingPayload && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => setIsEditingPayload(true)}
            >
              Редактировать
            </Button>
          )}
        </div>

        {isEditingPayload ? (
          <div className="space-y-3">
            <div className="grid grid-cols-1 gap-3">
              <div className="space-y-1">
                <div className="text-sm text-muted-foreground">Title</div>
                <Input
                  value={titleDraft}
                  onChange={(e) => setTitleDraft(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <div className="text-sm text-muted-foreground">URL</div>
                <Input
                  value={urlDraft}
                  onChange={(e) => setUrlDraft(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <div className="text-sm text-muted-foreground">Excerpt</div>
                <Textarea
                  value={excerptDraft}
                  onChange={(e) => setExcerptDraft(e.target.value)}
                  className="min-h-[120px]"
                />
              </div>

              <div className="space-y-1">
                <div className="text-sm text-muted-foreground">
                  Tags (comma-separated)
                </div>
                <Input
                  value={tagsDraft}
                  onChange={(e) => setTagsDraft(e.target.value)}
                />
              </div>
            </div>

            <label className="flex items-center gap-2 text-sm text-muted-foreground">
              <Checkbox
                checked={createEditDeliveries}
                onCheckedChange={(v) => setCreateEditDeliveries(v === true)}
              />
              <span>Создать доставки для обновления в Telegram</span>
            </label>

            <div className="flex items-center justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setIsEditingPayload(false);
                  setTitleDraft(
                    typeof parsedPayload.title === "string"
                      ? parsedPayload.title
                      : "",
                  );
                  setUrlDraft(
                    typeof parsedPayload.url === "string" ? parsedPayload.url : "",
                  );
                  setExcerptDraft(
                    typeof parsedPayload.excerpt === "string"
                      ? parsedPayload.excerpt
                      : "",
                  );
                  setTagsDraft(
                    Array.isArray(parsedPayload.tags)
                      ? parsedPayload.tags.map((t) => String(t)).join(", ")
                      : "",
                  );
                }}
                disabled={updatePayloadMutation.isPending}
              >
                Отмена
              </Button>
              <Button
                onClick={() => {
                  const title = titleDraft.trim();
                  const url = urlDraft.trim();
                  if (!title) {
                    toast.error("Title не может быть пустым");
                    return;
                  }
                  if (!url) {
                    toast.error("URL не может быть пустым");
                    return;
                  }

                  const tags = tagsDraft
                    .split(/[\n,]/g)
                    .map((t) => t.trim())
                    .filter(Boolean);

                  updatePayloadMutation.mutate({
                    title,
                    url,
                    excerpt: excerptDraft.trim()
                      ? excerptDraft.trim()
                      : undefined,
                    tags,
                  });
                }}
                disabled={updatePayloadMutation.isPending}
              >
                {updatePayloadMutation.isPending
                  ? "Сохранение..."
                  : "Сохранить"}
              </Button>
            </div>
          </div>
        ) : (
          <pre className="whitespace-pre-wrap text-sm">
            {JSON.stringify(post.payload, null, 2)}
          </pre>
        )}
      </div>
    </div>
  );
}
