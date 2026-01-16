import { useEffect } from "react";
import { useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { useBreadcrumb } from "@/hooks/use-breadcrumb";
import { postsApi } from "@/lib/posts-api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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

export default function TgPostPage() {
  const { id } = useParams();
  const { setPage: setBreadcrumbPage } = useBreadcrumb();
  const queryClient = useQueryClient();

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

  useEffect(() => {
    setBreadcrumbPage([
      { link: "/", label: "Главная" },
      { link: "/tg-posts", label: "Telegram публикации" },
      { link: "", label: post?.articleId ?? "Публикация" },
    ]);
  }, [setBreadcrumbPage, post]);

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
                <TableCell colSpan={5} className="h-24 text-center">
                  Нет доставок
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <details className="rounded-md border p-4">
        <summary className="cursor-pointer select-none">Payload</summary>
        <pre className="mt-3 whitespace-pre-wrap text-sm">
          {JSON.stringify(post.payload, null, 2)}
        </pre>
      </details>
    </div>
  );
}

