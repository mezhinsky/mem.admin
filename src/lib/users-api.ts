import { api } from "./api/client";

export type Role = "USER" | "ADMIN";

export interface User {
  id: string;
  email: string | null;
  name: string | null;
  avatar: string | null;
  role: Role;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UsersListResponse {
  users: User[];
  total: number;
}

export interface UsersQueryParams {
  search?: string;
  role?: Role;
  isActive?: boolean;
  skip?: number;
  take?: number;
}

export interface UpdateUserDto {
  role?: Role;
  isActive?: boolean;
  name?: string;
  avatar?: string;
}

export const usersApi = {
  getAll: async (params: UsersQueryParams = {}): Promise<UsersListResponse> => {
    const searchParams = new URLSearchParams();

    if (params.search) searchParams.set("search", params.search);
    if (params.role) searchParams.set("role", params.role);
    if (params.isActive !== undefined) searchParams.set("isActive", String(params.isActive));
    if (params.skip !== undefined) searchParams.set("skip", String(params.skip));
    if (params.take !== undefined) searchParams.set("take", String(params.take));

    const query = searchParams.toString();
    return api.get<UsersListResponse>(`/users${query ? `?${query}` : ""}`);
  },

  getById: async (id: string): Promise<User> => {
    return api.get<User>(`/users/${id}`);
  },

  update: async (id: string, data: UpdateUserDto): Promise<User> => {
    return api.patch<User>(`/users/${id}`, data);
  },

  deactivate: async (id: string): Promise<User> => {
    return api.delete<User>(`/users/${id}`);
  },
};
