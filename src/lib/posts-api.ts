import { api } from "./api/client";

export type PostStatus = "PENDING" | "SENT" | "PARTIAL" | "FAILED";
export type DeliveryStatus = "PENDING" | "SENT" | "FAILED" | "CANCELLED";

export interface PostChannelRef {
  id: string;
  key: string;
  title: string | null;
}

export interface PostDelivery {
  id: string;
  postId: string;
  channelId: string;
  status: DeliveryStatus;
  telegramMessageId: string | null;
  attempts: number;
  lastError: string | null;
  sentAt: string | null;
  createdAt: string;
  updatedAt: string;
  channel?: PostChannelRef;
}

export interface ArticlePayload {
  title: string;
  excerpt?: string;
  url: string;
  coverUrl?: string;
  mediaUrls?: string[];
  tags: string[];
}

export interface TgPost {
  id: string;
  articleId: string;
  status: PostStatus;
  payload: ArticlePayload | Record<string, unknown>;
  payloadHash: string | null;
  createdAt: string;
  updatedAt: string;
  deliveries?: PostDelivery[];
  _count?: {
    deliveries: number;
  };
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface PostsQueryParams {
  page?: number;
  limit?: number;
  articleId?: string;
  status?: PostStatus;
  from?: string;
  to?: string;
  sortBy?: string;
  order?: "asc" | "desc";
}

export const postsApi = {
  getAll: async (params: PostsQueryParams = {}): Promise<PaginatedResponse<TgPost>> => {
    const searchParams = new URLSearchParams();

    if (params.page) searchParams.set("page", String(params.page));
    if (params.limit) searchParams.set("limit", String(params.limit));
    if (params.articleId) searchParams.set("articleId", params.articleId);
    if (params.status) searchParams.set("status", params.status);
    if (params.from) searchParams.set("from", params.from);
    if (params.to) searchParams.set("to", params.to);
    if (params.sortBy) searchParams.set("sortBy", params.sortBy);
    if (params.order) searchParams.set("order", params.order);

    const query = searchParams.toString();
    return api.get<PaginatedResponse<TgPost>>(
      `/tg/posts${query ? `?${query}` : ""}`
    );
  },

  getById: async (id: string): Promise<TgPost> => {
    return api.get<TgPost>(`/tg/posts/${id}`);
  },

  getByArticleId: async (articleId: string): Promise<TgPost> => {
    return api.get<TgPost>(`/tg/posts/by-article/${articleId}`);
  },

  retry: async (id: string): Promise<{ retriedCount: number }> => {
    return api.post<{ retriedCount: number }>(`/tg/posts/${id}/retry`);
  },
};

