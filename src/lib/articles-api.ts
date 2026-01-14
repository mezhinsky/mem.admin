import { api } from "./api/client";

export interface Tag {
  id: number;
  name: string;
  slug: string;
  createdAt: string;
  updatedAt: string;
}

export interface Article {
  id: number;
  weight: number;
  slug: string | null;
  title: string;
  description: string | null;
  content: unknown;
  thumbnailAssetId: string | null;
  ogImageAssetId: string | null;
  published: boolean;
  createdAt: string;
  updatedAt: string;
  tags?: Tag[];
}

export interface ArticlesListResponse {
  items: Article[];
  total: number;
  totalPages: number;
  page: number;
  limit: number;
}

export interface ArticlesQueryParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  order?: "asc" | "desc";
  search?: string;
}

export interface CreateArticleDto {
  title: string;
  slug?: string;
  description?: string;
  content?: unknown;
  thumbnailAssetId?: string;
  ogImageAssetId?: string;
  published?: boolean;
  weight?: number;
  tagIds?: number[];
}

export interface UpdateArticleDto extends Partial<CreateArticleDto> {
  id?: number;
}

export const articlesApi = {
  getAll: async (params: ArticlesQueryParams = {}): Promise<ArticlesListResponse> => {
    const searchParams = new URLSearchParams();

    if (params.page) searchParams.set("page", String(params.page));
    if (params.limit) searchParams.set("limit", String(params.limit));
    if (params.sortBy) searchParams.set("sortBy", params.sortBy);
    if (params.order) searchParams.set("order", params.order);
    if (params.search) searchParams.set("search", params.search);

    const query = searchParams.toString();
    return api.get<ArticlesListResponse>(`/articles${query ? `?${query}` : ""}`);
  },

  getById: async (id: number | string): Promise<Article> => {
    return api.get<Article>(`/articles/${id}`);
  },

  create: async (data: CreateArticleDto): Promise<Article> => {
    return api.post<Article>("/articles", data);
  },

  update: async (id: number | string, data: UpdateArticleDto): Promise<Article> => {
    return api.patch<Article>(`/articles/${id}`, data);
  },

  delete: async (id: number | string): Promise<Article> => {
    return api.delete<Article>(`/articles/${id}`);
  },
};
