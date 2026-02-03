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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { formatBytes } from "@/lib/formatBytes";
import { formatDate } from "@/lib/formatDate";
import {
  assetsApi,
  type AssetType,
  type Asset,
  type JsonObject,
} from "@/lib/assets-api";
import {
  foldersApi,
  type FolderWithCounts,
} from "@/lib/folders-api";
import { FolderBreadcrumb } from "./folder-breadcrumb";
import { FolderDialog } from "./folder-dialog";
import { MoveDialog } from "./move-dialog";
import {
  Copy,
  File as FileIcon,
  FolderPlus,
  Folder as FolderIcon,
  Image as ImageIcon,
  MoreVertical,
  Move,
  Pencil,
  Trash2,
} from "lucide-react";

export type FileManagerMode = "manage" | "pick";

export type FileManagerProps = {
  mode?: FileManagerMode;
  onPick?: (asset: Asset) => void;
  accept?: string;
  types?: AssetType[];
  className?: string;
};

function isJsonObject(value: unknown): value is JsonObject {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function getStringProp(obj: JsonObject, key: string): string | null {
  const value = obj[key];
  return typeof value === "string" ? value : null;
}

function getThumbUrl(asset: Asset): string | null {
  const variantsValue = asset?.metadata?.variants;
  if (!isJsonObject(variantsValue)) return null;

  return (
    getStringProp(variantsValue, "thumb") ||
    getStringProp(variantsValue, "md") ||
    getStringProp(variantsValue, "lg") ||
    getStringProp(variantsValue, "original") ||
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
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<{
    total: number;
    completed: number;
  } | null>(null);

  // Folder dialog state
  const [folderDialogOpen, setFolderDialogOpen] = useState(false);
  const [folderDialogMode, setFolderDialogMode] = useState<"create" | "rename">(
    "create"
  );
  const [editingFolder, setEditingFolder] = useState<FolderWithCounts | null>(
    null
  );

  // Move dialog state
  const [moveDialogOpen, setMoveDialogOpen] = useState(false);
  const [movingFolder, setMovingFolder] = useState<FolderWithCounts | null>(
    null
  );
  const [movingAsset, setMovingAsset] = useState<Asset | null>(null);

  const limit = 30;

  // Fetch current folder path
  const { data: folderPath = [] } = useQuery({
    queryKey: ["folderPath", currentFolderId],
    queryFn: () =>
      currentFolderId ? foldersApi.getPath(currentFolderId) : [],
    enabled: !!currentFolderId,
  });

  // Fetch folders in current directory
  const { data: folders = [], isLoading: foldersLoading } = useQuery({
    queryKey: ["folders", { parentId: currentFolderId }],
    queryFn: () =>
      foldersApi.getAll(currentFolderId ? { parentId: currentFolderId } : {}),
  });

  // Fetch assets in current folder
  const queryKey = useMemo(
    () => ["assets", { page, limit, search, folderId: currentFolderId }],
    [page, limit, search, currentFolderId]
  );

  const { data, isLoading: assetsLoading, isFetching } = useQuery({
    queryKey,
    queryFn: () =>
      assetsApi.getAll({
        page,
        limit,
        search,
        sortBy: "createdAt",
        folderId: currentFolderId,
      }),
  });

  const isLoading = foldersLoading || assetsLoading;

  // Mutations
  const uploadMutation = useMutation({
    mutationFn: async (files: File[]) => {
      setUploadProgress({ total: files.length, completed: 0 });
      const results: Asset[] = [];
      const errors: string[] = [];

      for (const file of files) {
        try {
          const asset = await assetsApi.upload(file);
          // Move to current folder if not root
          if (currentFolderId) {
            await assetsApi.update(asset.id, { folderId: currentFolderId });
          }
          results.push(asset);
          setUploadProgress((prev) =>
            prev ? { ...prev, completed: prev.completed + 1 } : null
          );
        } catch (err) {
          console.error(err);
          errors.push(file.name);
        }
      }

      if (errors.length > 0) {
        throw new Error(`Не удалось загрузить: ${errors.join(", ")}`);
      }

      return results;
    },
    onSuccess: (assets) => {
      const count = assets.length;
      toast.success(
        count === 1 ? "Файл загружен" : `Загружено файлов: ${count}`
      );
      queryClient.invalidateQueries({ queryKey: ["assets"] });
    },
    onError: (err) => {
      console.error(err);
      toast.error(
        err instanceof Error ? err.message : "Не удалось загрузить файлы"
      );
    },
    onSettled: () => {
      setUploadProgress(null);
    },
  });

  const deleteAssetMutation = useMutation({
    mutationFn: (id: string) => assetsApi.delete(id),
    onSuccess: () => {
      toast.success("Asset удален");
      queryClient.invalidateQueries({ queryKey: ["assets"] });
    },
    onError: (err) => {
      console.error(err);
      toast.error("Не удалось удалить asset");
    },
  });

  const createFolderMutation = useMutation({
    mutationFn: (name: string) =>
      foldersApi.create({
        name,
        parentId: currentFolderId ?? undefined,
      }),
    onSuccess: () => {
      toast.success("Папка создана");
      queryClient.invalidateQueries({ queryKey: ["folders"] });
      setFolderDialogOpen(false);
    },
    onError: (err) => {
      console.error(err);
      toast.error("Не удалось создать папку");
    },
  });

  const renameFolderMutation = useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) =>
      foldersApi.update(id, { name }),
    onSuccess: () => {
      toast.success("Папка переименована");
      queryClient.invalidateQueries({ queryKey: ["folders"] });
      queryClient.invalidateQueries({ queryKey: ["folderPath"] });
      setFolderDialogOpen(false);
      setEditingFolder(null);
    },
    onError: (err) => {
      console.error(err);
      toast.error("Не удалось переименовать папку");
    },
  });

  const deleteFolderMutation = useMutation({
    mutationFn: (id: string) => foldersApi.delete(id),
    onSuccess: () => {
      toast.success("Папка удалена");
      queryClient.invalidateQueries({ queryKey: ["folders"] });
      queryClient.invalidateQueries({ queryKey: ["assets"] });
    },
    onError: (err) => {
      console.error(err);
      toast.error("Не удалось удалить папку");
    },
  });

  const moveFolderMutation = useMutation({
    mutationFn: ({ id, parentId }: { id: string; parentId: string | null }) =>
      foldersApi.move(id, { parentId }),
    onSuccess: () => {
      toast.success("Папка перемещена");
      queryClient.invalidateQueries({ queryKey: ["folders"] });
      setMoveDialogOpen(false);
      setMovingFolder(null);
    },
    onError: (err) => {
      console.error(err);
      toast.error("Не удалось переместить папку");
    },
  });

  const moveAssetMutation = useMutation({
    mutationFn: ({ id, folderId }: { id: string; folderId: string | null }) =>
      assetsApi.update(id, { folderId }),
    onSuccess: () => {
      toast.success("Файл перемещен");
      queryClient.invalidateQueries({ queryKey: ["assets"] });
      setMoveDialogOpen(false);
      setMovingAsset(null);
    },
    onError: (err) => {
      console.error(err);
      toast.error("Не удалось переместить файл");
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
    const files = event.target.files;
    if (!files || files.length === 0) return;

    uploadMutation.mutate(Array.from(files));

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

  const handleNavigate = (folderId: string | null) => {
    setCurrentFolderId(folderId);
    setPage(1);
    setSearch("");
  };

  const handleFolderClick = (folder: FolderWithCounts) => {
    setCurrentFolderId(folder.id);
    setPage(1);
    setSearch("");
  };

  const handleCreateFolder = () => {
    setFolderDialogMode("create");
    setEditingFolder(null);
    setFolderDialogOpen(true);
  };

  const handleRenameFolder = (folder: FolderWithCounts) => {
    setFolderDialogMode("rename");
    setEditingFolder(folder);
    setFolderDialogOpen(true);
  };

  const handleMoveFolder = (folder: FolderWithCounts) => {
    setMovingFolder(folder);
    setMovingAsset(null);
    setMoveDialogOpen(true);
  };

  const handleMoveAsset = (asset: Asset) => {
    setMovingAsset(asset);
    setMovingFolder(null);
    setMoveDialogOpen(true);
  };

  const handleFolderDialogSubmit = async (name: string) => {
    if (folderDialogMode === "create") {
      await createFolderMutation.mutateAsync(name);
    } else if (editingFolder) {
      await renameFolderMutation.mutateAsync({ id: editingFolder.id, name });
    }
  };

  const handleMoveDialogSubmit = async (targetFolderId: string | null) => {
    if (movingFolder) {
      await moveFolderMutation.mutateAsync({
        id: movingFolder.id,
        parentId: targetFolderId,
      });
    } else if (movingAsset) {
      await moveAssetMutation.mutateAsync({
        id: movingAsset.id,
        folderId: targetFolderId,
      });
    }
  };

  // Get folder IDs to exclude from move dialog (the folder itself and its descendants)
  const getExcludeFolderIds = (): string[] => {
    if (movingFolder) {
      return [movingFolder.id];
    }
    return [];
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* Toolbar */}
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
          {mode === "manage" && (
            <Button variant="outline" onClick={handleCreateFolder}>
              <FolderPlus className="mr-2 h-4 w-4" />
              Папка
            </Button>
          )}
          <Button
            onClick={handleUploadClick}
            disabled={uploadMutation.isPending}
          >
            {uploadMutation.isPending && (
              <Spinner className="mr-2 h-4 w-4 animate-spin" />
            )}
            {uploadProgress
              ? `Загрузка ${uploadProgress.completed}/${uploadProgress.total}`
              : "Загрузить"}
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept={accept}
            multiple
            className="hidden"
            onChange={handleUpload}
          />
        </div>
      </div>

      {/* Breadcrumb */}
      <FolderBreadcrumb path={folderPath} onNavigate={handleNavigate} />

      {isLoading ? (
        <div className="p-6 text-muted-foreground">Загрузка...</div>
      ) : (
        <>
          {/* Folders */}
          {folders.length > 0 && (
            <div className="grid gap-3 grid-cols-[repeat(auto-fill,minmax(200px,1fr))]">
              {folders.map((folder) => (
                <div
                  key={folder.id}
                  className="rounded-lg border bg-background p-3 cursor-pointer hover:border-primary/50 transition-colors"
                  onClick={() => handleFolderClick(folder)}
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 shrink-0 flex items-center justify-center rounded-md bg-muted">
                      <FolderIcon className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-medium">{folder.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {folder._count.assets} файлов
                        {folder._count.children > 0 &&
                          `, ${folder._count.children} папок`}
                      </div>
                    </div>
                    {mode === "manage" && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRenameFolder(folder);
                            }}
                          >
                            <Pencil className="mr-2 h-4 w-4" />
                            Переименовать
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              handleMoveFolder(folder);
                            }}
                          >
                            <Move className="mr-2 h-4 w-4" />
                            Переместить
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <DropdownMenuItem
                                className="text-destructive focus:text-destructive"
                                onSelect={(e) => e.preventDefault()}
                                onClick={(e) => e.stopPropagation()}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Удалить
                              </DropdownMenuItem>
                            </AlertDialogTrigger>
                            <AlertDialogContent
                              onClick={(e) => e.stopPropagation()}
                            >
                              <AlertDialogHeader>
                                <AlertDialogTitle>
                                  Удалить папку?
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                  Папка "{folder.name}" и все вложенные папки
                                  будут удалены. Файлы будут перемещены в
                                  корневую папку.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Отмена</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() =>
                                    deleteFolderMutation.mutate(folder.id)
                                  }
                                >
                                  Удалить
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Divider between folders and assets */}
          {folders.length > 0 && items.length > 0 && (
            <div className="border-t my-4" />
          )}

          {/* Assets */}
          <div className="grid gap-3 grid-cols-[repeat(auto-fill,minmax(280px,1fr))]">
            {items.map((asset) => {
              const isImage = asset.type === "IMAGE";
              const thumb = isImage ? getThumbUrl(asset) : null;

              return (
                <div key={asset.id} className="rounded-lg border bg-background p-3">
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
                          {isImage ? (
                            <ImageIcon size={18} />
                          ) : (
                            <FileIcon size={18} />
                          )}
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

                          {onPick && (
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => onPick(asset)}
                            >
                              Выбрать
                            </Button>
                          )}

                          {mode === "manage" && (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreVertical size={16} />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onClick={() => handleMoveAsset(asset)}
                                >
                                  <Move className="mr-2 h-4 w-4" />
                                  Переместить
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <DropdownMenuItem
                                      className="text-destructive focus:text-destructive"
                                      onSelect={(e) => e.preventDefault()}
                                    >
                                      <Trash2 className="mr-2 h-4 w-4" />
                                      Удалить
                                    </DropdownMenuItem>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>
                                        Удалить asset?
                                      </AlertDialogTitle>
                                      <AlertDialogDescription>
                                        Удалит запись и файлы из S3/MinIO.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>
                                        Отмена
                                      </AlertDialogCancel>
                                      <AlertDialogAction
                                        onClick={() =>
                                          deleteAssetMutation.mutate(asset.id)
                                        }
                                      >
                                        Удалить
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </DropdownMenuContent>
                            </DropdownMenu>
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

            {items.length === 0 && folders.length === 0 && (
              <div className="col-span-full rounded-lg border p-6 text-center text-muted-foreground">
                Ничего не найдено
              </div>
            )}
          </div>
        </>
      )}

      {/* Pagination */}
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

      {/* Folder Dialog */}
      <FolderDialog
        open={folderDialogOpen}
        onOpenChange={setFolderDialogOpen}
        mode={folderDialogMode}
        initialName={editingFolder?.name ?? ""}
        onSubmit={handleFolderDialogSubmit}
        isPending={
          createFolderMutation.isPending || renameFolderMutation.isPending
        }
      />

      {/* Move Dialog */}
      <MoveDialog
        open={moveDialogOpen}
        onOpenChange={(open) => {
          setMoveDialogOpen(open);
          if (!open) {
            setMovingFolder(null);
            setMovingAsset(null);
          }
        }}
        title={
          movingFolder
            ? `Переместить папку "${movingFolder.name}"`
            : movingAsset
              ? `Переместить "${movingAsset.originalName}"`
              : "Переместить"
        }
        currentFolderId={
          movingFolder?.parentId ?? movingAsset?.folderId ?? null
        }
        excludeFolderIds={getExcludeFolderIds()}
        onMove={handleMoveDialogSubmit}
        isPending={moveFolderMutation.isPending || moveAssetMutation.isPending}
      />
    </div>
  );
}
