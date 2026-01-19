import { api } from "./api/client";
import type { PaginatedResponse, DeliveryStatus, ChannelRef } from "./api/types";

export type { DeliveryStatus };

export interface DeliveryPostRef {
  id: string;
  articleId: string;
  status: string;
}

export interface TgDelivery {
  id: string;
  postId: string;
  channelId: string;
  revision: number;
  status: DeliveryStatus;
  telegramMessageId: string | null;
  attempts: number;
  lastError: string | null;
  sentAt: string | null;
  createdAt: string;
  updatedAt: string;
  post?: DeliveryPostRef;
  channel?: ChannelRef;
}

export interface DeliveriesQueryParams {
  page?: number;
  limit?: number;
  postId?: string;
  channelId?: string;
  status?: DeliveryStatus;
  sortBy?: string;
  order?: "asc" | "desc";
}

export const deliveriesApi = {
  getAll: async (
    params: DeliveriesQueryParams = {}
  ): Promise<PaginatedResponse<TgDelivery>> => {
    const searchParams = new URLSearchParams();

    if (params.page) searchParams.set("page", String(params.page));
    if (params.limit) searchParams.set("limit", String(params.limit));
    if (params.postId) searchParams.set("postId", params.postId);
    if (params.channelId) searchParams.set("channelId", params.channelId);
    if (params.status) searchParams.set("status", params.status);
    if (params.sortBy) searchParams.set("sortBy", params.sortBy);
    if (params.order) searchParams.set("order", params.order);

    const query = searchParams.toString();
    return api.get<PaginatedResponse<TgDelivery>>(
      `/tg/deliveries${query ? `?${query}` : ""}`
    );
  },

  retry: async (id: string): Promise<TgDelivery> => {
    return api.post<TgDelivery>(`/tg/deliveries/${id}/retry`);
  },

  cancel: async (id: string): Promise<TgDelivery> => {
    return api.post<TgDelivery>(`/tg/deliveries/${id}/cancel`);
  },
};
