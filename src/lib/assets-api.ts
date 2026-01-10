import { apiUrl } from "@/lib/api";

export type AssetType = "IMAGE" | "FILE";

export type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonObject
  | JsonValue[];

export type JsonObject = {
  [key: string]: JsonValue;
};

export type Asset = {
  id: string;
  type: AssetType;
  bucket: string;
  key: string;
  url: string;
  originalName: string;
  mimeType: string;
  size: number;
  metadata: JsonObject | null;
  createdAt: string;
  updatedAt: string;
};

export type AssetsListResponse = {
  items: Asset[];
  total: number;
  limit: number;
  page?: number;
  totalPages?: number;
  nextCursor?: string | null;
};

export async function listAssets(params: {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: "createdAt" | "updatedAt" | "originalName" | "size";
  order?: "asc" | "desc";
}): Promise<AssetsListResponse> {
  const url = new URL(apiUrl("/assets"));
  if (params.page) url.searchParams.set("page", String(params.page));
  if (params.limit) url.searchParams.set("limit", String(params.limit));
  if (params.search) url.searchParams.set("search", params.search);
  if (params.sortBy) url.searchParams.set("sortBy", params.sortBy);
  if (params.order) url.searchParams.set("order", params.order);

  const res = await fetch(url.toString());
  if (!res.ok) {
    throw new Error("Не удалось загрузить assets");
  }
  return res.json();
}

export async function uploadAsset(params: {
  file: File;
}): Promise<Asset> {
  const formData = new FormData();
  formData.append("file", params.file);

  const res = await fetch(apiUrl("/assets"), {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    throw new Error("Не удалось загрузить файл");
  }

  return res.json();
}

export async function deleteAsset(id: string): Promise<Asset> {
  const res = await fetch(apiUrl(`/assets/${id}`), {
    method: "DELETE",
  });
  if (!res.ok) {
    throw new Error("Не удалось удалить asset");
  }
  return res.json();
}

export async function updateAsset(
  id: string,
  payload: { originalName?: string; metadata?: JsonObject | null }
): Promise<Asset> {
  const res = await fetch(apiUrl(`/assets/${id}`), {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    throw new Error("Не удалось обновить asset");
  }
  return res.json();
}
