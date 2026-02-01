import { api, apiRequest } from "./api/client";
import type { PaginatedResponse } from "./api/types";

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

export interface Asset {
  id: string;
  type: AssetType;
  bucket: string;
  key: string;
  url: string;
  originalName: string;
  mimeType: string;
  size: number;
  metadata: JsonObject | null;
  folderId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AssetsListResponse extends PaginatedResponse<Asset> {
  nextCursor?: string | null;
}

export interface AssetsQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: "createdAt" | "updatedAt" | "originalName" | "size";
  order?: "asc" | "desc";
  folderId?: string | null;
}

export interface UpdateAssetDto {
  originalName?: string;
  metadata?: JsonObject | null;
  folderId?: string | null;
}

export interface BulkMoveAssetsDto {
  assetIds: string[];
  folderId?: string | null;
}

export const assetsApi = {
  getById: async (id: string): Promise<Asset> => {
    return api.get<Asset>(`/assets/${id}`);
  },

  getAll: async (params: AssetsQueryParams = {}): Promise<AssetsListResponse> => {
    const searchParams = new URLSearchParams();

    if (params.page) searchParams.set("page", String(params.page));
    if (params.limit) searchParams.set("limit", String(params.limit));
    if (params.search) searchParams.set("search", params.search);
    if (params.sortBy) searchParams.set("sortBy", params.sortBy);
    if (params.order) searchParams.set("order", params.order);
    if (params.folderId !== undefined) {
      searchParams.set("folderId", params.folderId === null ? "null" : params.folderId);
    }

    const query = searchParams.toString();
    return api.get<AssetsListResponse>(`/assets${query ? `?${query}` : ""}`);
  },

  upload: async (file: File): Promise<Asset> => {
    const formData = new FormData();
    formData.append("file", file);

    return apiRequest<Asset>("/assets", {
      method: "POST",
      body: formData,
    });
  },

  update: async (id: string, data: UpdateAssetDto): Promise<Asset> => {
    return api.patch<Asset>(`/assets/${id}`, data);
  },

  delete: async (id: string): Promise<Asset> => {
    return api.delete<Asset>(`/assets/${id}`);
  },

  bulkMove: async (data: BulkMoveAssetsDto): Promise<{ count: number }> => {
    return api.post<{ count: number }>("/assets/bulk-move", data);
  },
};

// Legacy exports for backward compatibility
export const getAsset = assetsApi.getById;
export const listAssets = assetsApi.getAll;
export const uploadAsset = (params: { file: File }) => assetsApi.upload(params.file);
export const updateAsset = (id: string, payload: UpdateAssetDto) => assetsApi.update(id, payload);
export const deleteAsset = assetsApi.delete;
