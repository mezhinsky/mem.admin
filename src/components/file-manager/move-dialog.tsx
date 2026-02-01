import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";
import { foldersApi, type FolderWithCounts } from "@/lib/folders-api";
import { ChevronRight, Folder as FolderIcon, Home } from "lucide-react";

export interface MoveDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  currentFolderId: string | null;
  excludeFolderIds?: string[];
  onMove: (targetFolderId: string | null) => Promise<void>;
  isPending?: boolean;
}

export function MoveDialog({
  open,
  onOpenChange,
  title,
  description = "Выберите папку назначения",
  currentFolderId,
  excludeFolderIds = [],
  onMove,
  isPending = false,
}: MoveDialogProps) {
  const [browseFolderId, setBrowseFolderId] = useState<string | null>(null);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);

  const { data: folders = [], isLoading } = useQuery({
    queryKey: ["folders", { parentId: browseFolderId }],
    queryFn: () =>
      foldersApi.getAll(browseFolderId ? { parentId: browseFolderId } : {}),
    enabled: open,
  });

  const { data: pathData = [] } = useQuery({
    queryKey: ["folderPath", browseFolderId],
    queryFn: () => (browseFolderId ? foldersApi.getPath(browseFolderId) : []),
    enabled: open && !!browseFolderId,
  });

  const excludeSet = new Set(excludeFolderIds);
  const filteredFolders = folders.filter((f) => !excludeSet.has(f.id));

  const handleSubmit = async () => {
    await onMove(selectedFolderId);
  };

  const handleFolderClick = (folder: FolderWithCounts) => {
    if (folder._count.children > 0) {
      setBrowseFolderId(folder.id);
      setSelectedFolderId(folder.id);
    } else {
      setSelectedFolderId(folder.id);
    }
  };

  const handleFolderDoubleClick = (folder: FolderWithCounts) => {
    if (folder._count.children > 0) {
      setBrowseFolderId(folder.id);
    }
  };

  const canMoveHere =
    selectedFolderId !== currentFolderId &&
    (selectedFolderId !== null || currentFolderId !== null);

  return (
    <Dialog
      open={open}
      onOpenChange={(val) => {
        if (!val) {
          setBrowseFolderId(null);
          setSelectedFolderId(null);
        }
        onOpenChange(val);
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <nav className="flex items-center gap-1 text-sm border-b pb-2">
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "h-7 px-2",
                browseFolderId === null &&
                  selectedFolderId === null &&
                  "bg-accent"
              )}
              onClick={() => {
                setBrowseFolderId(null);
                setSelectedFolderId(null);
              }}
            >
              <Home className="h-4 w-4" />
            </Button>
            {pathData.map((item) => (
              <div key={item.id} className="flex items-center gap-1">
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "h-7 px-2",
                    selectedFolderId === item.id && "bg-accent"
                  )}
                  onClick={() => {
                    setBrowseFolderId(item.id);
                    setSelectedFolderId(item.id);
                  }}
                >
                  {item.name}
                </Button>
              </div>
            ))}
          </nav>

          <div className="min-h-[200px] max-h-[300px] overflow-y-auto border rounded-md">
            {isLoading ? (
              <div className="flex items-center justify-center h-[200px]">
                <Spinner className="h-6 w-6" />
              </div>
            ) : filteredFolders.length === 0 ? (
              <div className="flex items-center justify-center h-[200px] text-muted-foreground text-sm">
                {browseFolderId === null
                  ? "Нет папок"
                  : "Нет вложенных папок"}
              </div>
            ) : (
              <div className="p-2 space-y-1">
                {filteredFolders.map((folder) => (
                  <div
                    key={folder.id}
                    className={cn(
                      "flex items-center gap-2 px-3 py-2 rounded-md cursor-pointer hover:bg-accent transition-colors",
                      selectedFolderId === folder.id && "bg-accent"
                    )}
                    onClick={() => handleFolderClick(folder)}
                    onDoubleClick={() => handleFolderDoubleClick(folder)}
                  >
                    <FolderIcon className="h-4 w-4 text-muted-foreground" />
                    <span className="flex-1 truncate">{folder.name}</span>
                    {folder._count.children > 0 && (
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="text-sm text-muted-foreground">
            {selectedFolderId === null
              ? "Назначение: Корневая папка"
              : `Назначение: ${pathData[pathData.length - 1]?.name || "..."}`}
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
          >
            Отмена
          </Button>
          <Button onClick={handleSubmit} disabled={!canMoveHere || isPending}>
            {isPending && <Spinner className="mr-2 h-4 w-4" />}
            Переместить
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
