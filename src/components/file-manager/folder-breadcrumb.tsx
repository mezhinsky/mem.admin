import { ChevronRight, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { FolderPathItem } from "@/lib/folders-api";

export interface FolderBreadcrumbProps {
  path: FolderPathItem[];
  onNavigate: (folderId: string | null) => void;
}

export function FolderBreadcrumb({ path, onNavigate }: FolderBreadcrumbProps) {
  return (
    <nav className="flex items-center gap-1 text-sm">
      <Button
        variant="ghost"
        size="sm"
        className="h-7 px-2"
        onClick={() => onNavigate(null)}
      >
        <Home className="h-4 w-4" />
      </Button>
      {path.map((item, index) => (
        <div key={item.id} className="flex items-center gap-1">
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2"
            onClick={() => onNavigate(item.id)}
            disabled={index === path.length - 1}
          >
            {item.name}
          </Button>
        </div>
      ))}
    </nav>
  );
}
