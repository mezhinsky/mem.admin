import { api } from "./api/client";

export interface Channel {
  id: string;
  key: string;
  chatId: string;
  username: string | null;
  title: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ChannelsListResponse {
  data: Channel[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ChannelsQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  isActive?: boolean;
}

export interface CreateChannelDto {
  key: string;
  chatId: string;
  username?: string;
  title?: string;
  isActive?: boolean;
}

export interface UpdateChannelDto {
  chatId?: string;
  username?: string;
  title?: string;
  isActive?: boolean;
}

export const channelsApi = {
  getAll: async (params: ChannelsQueryParams = {}): Promise<ChannelsListResponse> => {
    const searchParams = new URLSearchParams();

    if (params.page) searchParams.set("page", String(params.page));
    if (params.limit) searchParams.set("limit", String(params.limit));
    if (params.search) searchParams.set("search", params.search);
    if (params.isActive !== undefined) searchParams.set("isActive", String(params.isActive));

    const query = searchParams.toString();
    return api.get<ChannelsListResponse>(`/tg/channels${query ? `?${query}` : ""}`);
  },

  getById: async (id: string): Promise<Channel> => {
    return api.get<Channel>(`/tg/channels/${id}`);
  },

  create: async (data: CreateChannelDto): Promise<Channel> => {
    return api.post<Channel>("/tg/channels", data);
  },

  update: async (id: string, data: UpdateChannelDto): Promise<Channel> => {
    return api.patch<Channel>(`/tg/channels/${id}`, data);
  },

  delete: async (id: string): Promise<Channel> => {
    return api.delete<Channel>(`/tg/channels/${id}`);
  },
};
