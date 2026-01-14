import { api } from "./api/client";

export interface Tag {
  id: number;
  name: string;
  slug: string;
  createdAt: string;
  updatedAt: string;
}

export interface TagsQueryParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  order?: "asc" | "desc";
  search?: string;
}

export interface TagsListResponse {
  items: Tag[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CreateTagDto {
  name: string;
  slug: string;
}

export type UpdateTagDto = Partial<CreateTagDto>;

export const tagsApi = {
  getAll: async (params: TagsQueryParams = {}): Promise<TagsListResponse> => {
    const searchParams = new URLSearchParams();

    if (params.page != null) searchParams.set("page", String(params.page));
    if (params.limit != null) searchParams.set("limit", String(params.limit));
    if (params.sortBy) searchParams.set("sortBy", params.sortBy);
    if (params.order) searchParams.set("order", params.order);
    if (params.search) searchParams.set("search", params.search);

    const query = searchParams.toString();
    return api.get<TagsListResponse>(`/tags${query ? `?${query}` : ""}`);
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
