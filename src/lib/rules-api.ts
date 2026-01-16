import { api } from "./api/client";

export type RuleType = "TAG" | "CATEGORY" | "ALL";

export interface RuleChannelRef {
  id: string;
  key: string;
  title: string | null;
}

export interface Rule {
  id: string;
  channelId: string;
  type: RuleType;
  value: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  channel?: RuleChannelRef;
}

export interface RulesListResponse {
  data: Rule[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface RulesQueryParams {
  page?: number;
  limit?: number;
  channelId?: string;
  type?: RuleType;
  value?: string;
  isActive?: boolean;
  sortBy?: string;
  order?: "asc" | "desc";
}

export interface CreateRuleDto {
  channelId: string;
  type?: RuleType;
  value: string;
  isActive?: boolean;
}

export interface UpdateRuleDto {
  value?: string;
  isActive?: boolean;
}

export const rulesApi = {
  getAll: async (params: RulesQueryParams = {}): Promise<RulesListResponse> => {
    const searchParams = new URLSearchParams();

    if (params.page) searchParams.set("page", String(params.page));
    if (params.limit) searchParams.set("limit", String(params.limit));
    if (params.channelId) searchParams.set("channelId", params.channelId);
    if (params.type) searchParams.set("type", params.type);
    if (params.value) searchParams.set("value", params.value);
    if (params.isActive !== undefined)
      searchParams.set("isActive", String(params.isActive));
    if (params.sortBy) searchParams.set("sortBy", params.sortBy);
    if (params.order) searchParams.set("order", params.order);

    const query = searchParams.toString();
    return api.get<RulesListResponse>(`/tg/rules${query ? `?${query}` : ""}`);
  },

  getById: async (id: string): Promise<Rule> => {
    return api.get<Rule>(`/tg/rules/${id}`);
  },

  create: async (data: CreateRuleDto): Promise<Rule> => {
    return api.post<Rule>("/tg/rules", data);
  },

  update: async (id: string, data: UpdateRuleDto): Promise<Rule> => {
    return api.patch<Rule>(`/tg/rules/${id}`, data);
  },

  delete: async (id: string): Promise<Rule> => {
    return api.delete<Rule>(`/tg/rules/${id}`);
  },
};

