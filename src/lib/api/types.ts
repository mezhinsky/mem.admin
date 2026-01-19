// Common API types - centralized to avoid duplication

// Pagination
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  order?: "asc" | "desc";
}

// Statuses
export type DeliveryStatus = "PENDING" | "SENT" | "FAILED" | "CANCELLED";
export type PostStatus = "PENDING" | "SENT" | "PARTIAL" | "FAILED";
export type Role = "USER" | "ADMIN";

// Common references
export interface ChannelRef {
  id: string;
  key: string;
  title: string | null;
  username?: string | null;
}

// User (extended version compatible with both auth and users-api)
export interface User {
  id: string;
  email: string | null;
  name: string | null;
  avatar: string | null;
  role?: Role;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}
