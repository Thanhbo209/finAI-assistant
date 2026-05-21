import type { ApiResponse } from "@/types/api";
import type {
  CreateSmartRulePayload,
  MerchantInsight,
  MerchantListItem,
  MerchantResolution,
  SmartRule,
  SubscriptionInsight,
} from "@/types/intelligence";
import { api } from "./axios";

export const intelligenceApi = {
  lookupMerchant: async (name: string): Promise<MerchantResolution> => {
    const { data } = await api.get<ApiResponse<MerchantResolution>>(
      "/merchants/lookup",
      { params: { name } },
    );
    return data.data;
  },

  listMerchants: async (params?: {
    q?: string;
    limit?: number;
  }): Promise<MerchantListItem[]> => {
    const { data } = await api.get<ApiResponse<MerchantListItem[]>>(
      "/merchants",
      { params },
    );
    return data.data;
  },

  listRules: async (): Promise<SmartRule[]> => {
    const { data } = await api.get<ApiResponse<SmartRule[]>>("/rules");
    return data.data;
  },

  createRule: async (payload: CreateSmartRulePayload): Promise<SmartRule> => {
    const { data } = await api.post<ApiResponse<SmartRule>>("/rules", payload);
    return data.data;
  },

  updateRule: async (
    id: string,
    payload: Partial<Pick<SmartRule, "category" | "priority" | "isActive">>,
  ): Promise<SmartRule> => {
    const { data } = await api.patch<ApiResponse<SmartRule>>(
      `/rules/${id}`,
      payload,
    );
    return data.data;
  },

  deleteRule: async (id: string): Promise<void> => {
    await api.delete(`/rules/${id}`);
  },

  subscriptions: async (params?: {
    minConfidence?: number;
  }): Promise<SubscriptionInsight[]> => {
    const { data } = await api.get<ApiResponse<SubscriptionInsight[]>>(
      "/subscriptions",
      { params },
    );
    return data.data;
  },

  merchantInsights: async (params?: {
    months?: number;
    limit?: number;
  }): Promise<MerchantInsight[]> => {
    const { data } = await api.get<ApiResponse<MerchantInsight[]>>(
      "/analytics/merchant-insights",
      { params },
    );
    return data.data;
  },
};
