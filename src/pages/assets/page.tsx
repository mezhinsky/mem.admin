import { useEffect } from "react";
import { useBreadcrumb } from "@/hooks/use-breadcrumb";
import FileManager from "@/components/file-manager/file-manager";

export default function AssetsPage() {
  const { setPage: setBreadcrumbPage } = useBreadcrumb();

  useEffect(() => {
    setBreadcrumbPage([
      { link: "/", label: "Главная" },
      { link: "/assets", label: "Assets" },
    ]);
  }, [setBreadcrumbPage]);

  return (
    <div className="container mx-auto p-4 space-y-4">
      <FileManager />
    </div>
  );
}
