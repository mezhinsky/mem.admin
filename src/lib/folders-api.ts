import { api } from "./api/client";

export interface Folder {
  id: string;
  name: string;
  parentId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface FolderWithCounts extends Folder {
  _count: {
    assets: number;
    children: number;
  };
}

export interface FolderWithChildren extends FolderWithCounts {
  children: Folder[];
}

export interface FolderPathItem {
  id: string;
  name: string;
}

export interface CreateFolderDto {
  name: string;
  parentId?: string;
}

export interface UpdateFolderDto {
  name?: string;
}

export interface MoveFolderDto {
  parentId?: string | null;
}

export interface QueryFoldersParams {
  parentId?: string;
}

export const foldersApi = {
  getAll: async (params: QueryFoldersParams = {}): Promise<FolderWithCounts[]> => {
    const searchParams = new URLSearchParams();
    if (params.parentId) {
      searchParams.set("parentId", params.parentId);
    }
    const query = searchParams.toString();
    return api.get<FolderWithCounts[]>(`/folders${query ? `?${query}` : ""}`);
  },

  getById: async (id: string): Promise<FolderWithChildren> => {
    return api.get<FolderWithChildren>(`/folders/${id}`);
  },

  getPath: async (id: string): Promise<FolderPathItem[]> => {
    return api.get<FolderPathItem[]>(`/folders/${id}/path`);
  },

  create: async (data: CreateFolderDto): Promise<Folder> => {
    return api.post<Folder>("/folders", data);
  },

  update: async (id: string, data: UpdateFolderDto): Promise<Folder> => {
    return api.patch<Folder>(`/folders/${id}`, data);
  },

  move: async (id: string, data: MoveFolderDto): Promise<Folder> => {
    return api.patch<Folder>(`/folders/${id}/move`, data);
  },

  delete: async (id: string): Promise<Folder> => {
    return api.delete<Folder>(`/folders/${id}`);
  },
};
