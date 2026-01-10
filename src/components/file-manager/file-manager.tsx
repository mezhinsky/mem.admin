import { useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import { formatBytes } from "@/lib/formatBytes";
import { formatDate } from "@/lib/formatDate";
import {
  deleteAsset,
  listAssets,
  type AssetType,
  type Asset,
  uploadAsset,
} from "@/lib/assets-api";
import { Copy, File as FileIcon, Image as ImageIcon, Trash2 } from "lucide-react";

export type FileManagerMode = "manage" | "pick";

export type FileManagerProps = {
  mode?: FileManagerMode;
  onPick?: (asset: Asset) => void;
  accept?: string;
  types?: AssetType[];
  className?: string;
};

function getThumbUrl(asset: Asset): string | null {
  const variants = asset?.metadata?.variants;
  if (!variants || typeof variants !== "object") return null;
  return (
    variants.thumb ||
    variants.md ||
    variants.lg ||
    variants.original ||
    null
  );
}

export default function FileManager({
  mode = "manage",
  onPick,
  accept,
  types,
  className,
}: FileManagerProps) {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const limit = 30;

  const queryKey = useMemo(
    () => ["assets", { page, limit, search }],
    [page, limit, search]
  );

  const { data, isLoading, isFetching } = useQuery({
    queryKey,
    queryFn: () => listAssets({ page, limit, search, sortBy: "createdAt" }),
  });

  const uploadMutation = useMutation({
    mutationFn: uploadAsset,
    onSuccess: () => {
      toast.success("Файл загружен");
      queryClient.invalidateQueries({ queryKey: ["assets"] });
    },
    onError: (err) => {
      console.error(err);
      toast.error("Не удалось загрузить файл");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteAsset(id),
    onSuccess: () => {
      toast.success("Asset удален");
      queryClient.invalidateQueries({ queryKey: ["assets"] });
    },
    onError: (err) => {
      console.error(err);
      toast.error("Не удалось удалить asset");
    },
  });

  const items: Asset[] = useMemo(() => {
    const all: Asset[] = data?.items ?? [];
    if (!types || types.length === 0) return all;
    const set = new Set(types);
    return all.filter((a) => set.has(a.type));
  }, [data?.items, types]);
  const totalPages: number | undefined = data?.totalPages;

  const handleUploadClick = () => fileInputRef.current?.click();

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    uploadMutation.mutate({ file });

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleCopy = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Ссылка скопирована");
    } catch (e) {
      console.error(e);
      toast.error("Не удалось скопировать ссылку");
    }
  };

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <Input
            placeholder="Поиск по названию, mimeType или ключу…"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full sm:w-[360px]"
          />
          {isFetching && <Spinner className="h-4 w-4" />}
        </div>

        <div className="flex items-center gap-2">
          <Button onClick={handleUploadClick} disabled={uploadMutation.isPending}>
            {uploadMutation.isPending && (
              <Spinner className="mr-2 h-4 w-4 animate-spin" />
            )}
            Загрузить
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept={accept}
            className="hidden"
            onChange={handleUpload}
          />
        </div>
      </div>

      {isLoading ? (
        <div className="p-6 text-muted-foreground">Загрузка...</div>
      ) : (
        <div className="grid gap-3 [grid-template-columns:repeat(auto-fill,minmax(280px,1fr))]">
          {items.map((asset) => {
            const isImage = asset.type === "IMAGE";
            const thumb = isImage ? getThumbUrl(asset) : null;

            return (
              <div
                key={asset.id}
                className="rounded-lg border bg-background p-3"
              >
                <div className="flex items-start gap-3">
                  <div className="h-16 w-16 shrink-0 overflow-hidden rounded-md border bg-muted">
                    {thumb ? (
                      <img
                        src={thumb}
                        alt={asset.originalName}
                        className="h-full w-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                        {isImage ? <ImageIcon size={18} /> : <FileIcon size={18} />}
                      </div>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="truncate font-medium">
                          {asset.originalName}
                        </div>
                        <div className="truncate text-xs text-muted-foreground">
                          {asset.mimeType} · {formatBytes(asset.size)}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {formatDate(asset.createdAt)}
                        </div>
                      </div>

                      <div className="flex shrink-0 items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleCopy(asset.url)}
                          title="Скопировать URL"
                        >
                          <Copy size={16} />
                        </Button>

                        {mode === "pick" && onPick && (
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => onPick(asset)}
                          >
                            Выбрать
                          </Button>
                        )}

                        {mode === "manage" && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                title="Удалить"
                                disabled={deleteMutation.isPending}
                              >
                                <Trash2 size={16} />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Удалить asset?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Удалит запись и файлы из S3/MinIO.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Отмена</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => deleteMutation.mutate(asset.id)}
                                >
                                  Удалить
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
                      </div>
                    </div>

                    <div className="mt-2 truncate text-xs text-muted-foreground">
                      {asset.url}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {items.length === 0 && (
            <div className="col-span-full rounded-lg border p-6 text-center text-muted-foreground">
              Ничего не найдено
            </div>
          )}
        </div>
      )}

      {typeof totalPages === "number" && totalPages > 1 && (
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
          >
            Назад
          </Button>
          <div className="text-sm text-muted-foreground">
            Страница {page} / {totalPages}
          </div>
          <Button
            variant="outline"
            onClick={() => setPage((p) => p + 1)}
            disabled={page >= totalPages}
          >
            Вперед
          </Button>
        </div>
      )}
    </div>
  );
}
