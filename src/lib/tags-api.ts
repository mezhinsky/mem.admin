import { api } from "./api/client";

export interface Tag {
  id: number;
  name: string;
  slug: string;
  createdAt: string;
  updatedAt: string;
}

export interface TagsQueryParams {
  search?: string;
}

export interface CreateTagDto {
  name: string;
  slug: string;
}

export type UpdateTagDto = Partial<CreateTagDto>;

export const tagsApi = {
  getAll: async (params: TagsQueryParams = {}): Promise<Tag[]> => {
    const searchParams = new URLSearchParams();

    if (params.search) searchParams.set("search", params.search);

    const query = searchParams.toString();
    return api.get<Tag[]>(`/tags${query ? `?${query}` : ""}`);
  },

  getById: async (id: number | string): Promise<Tag> => {
    return api.get<Tag>(`/tags/${id}`);
  },

  getBySlug: async (slug: string): Promise<Tag> => {
    return api.get<Tag>(`/tags/by-slug/${slug}`);
  },

  create: async (data: CreateTagDto): Promise<Tag> => {
    return api.post<Tag>("/tags", data);
  },

  update: async (id: number | string, data: UpdateTagDto): Promise<Tag> => {
    return api.patch<Tag>(`/tags/${id}`, data);
  },

  delete: async (id: number | string): Promise<Tag> => {
    return api.delete<Tag>(`/tags/${id}`);
  },
};
