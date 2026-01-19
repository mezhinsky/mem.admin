/**
 * Auth-related type definitions
 */

import type { User } from "../api/types";

export type { User };

export interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface AuthContextValue extends AuthState {
  login: () => void;
  logout: () => Promise<void>;
  logoutAll: () => Promise<void>;
  setAuth: (accessToken: string, user: User) => void;
  clearAuth: () => void;
  getAccessToken: () => string | null;
}

export interface JwtPayload {
  sub: string;
  email?: string;
  name?: string;
  exp: number;
  iat: number;
}
