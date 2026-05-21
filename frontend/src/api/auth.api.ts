import type { ApiResponse } from "@/types/api";
import type {
  AuthResponse,
  LoginPayload,
  RegisterPayload,
  RegisterResponse,
  User,
} from "../types/auth";
import type { CurrencyCode } from "@/types/currency.types";
import { api } from "./axios";

export const authApi = {
  register: async (payload: RegisterPayload): Promise<RegisterResponse> => {
    const { data } = await api.post<ApiResponse<RegisterResponse>>(
      "/auth/register",
      payload,
    );
    return data.data;
  },

  login: async (payload: LoginPayload): Promise<AuthResponse> => {
    const response = await api.post<ApiResponse<AuthResponse>>(
      "/auth/login",
      payload,
    );

    return response.data.data;
  },

  me: async (): Promise<User> => {
    const { data } = await api.get<ApiResponse<User>>("/auth/me");
    return data.data;
  },

  updateCurrency: async (currency: CurrencyCode): Promise<User> => {
    const { data } = await api.patch<ApiResponse<User>>("/auth/me/currency", {
      currency,
    });
    return data.data;
  },
};
