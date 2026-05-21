import { useCallback, useEffect, useState } from "react";
import { intelligenceApi } from "@/api/intelligence.api";
import type {
  MerchantInsight,
  SmartRule,
  SubscriptionInsight,
} from "@/types/intelligence";

export function useIntelligence() {
  const [merchantInsights, setMerchantInsights] = useState<MerchantInsight[]>([]);
  const [subscriptions, setSubscriptions] = useState<SubscriptionInsight[]>([]);
  const [rules, setRules] = useState<SmartRule[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [insights, recurring, smartRules] = await Promise.all([
        intelligenceApi.merchantInsights({ months: 6, limit: 8 }),
        intelligenceApi.subscriptions({ minConfidence: 0.55 }),
        intelligenceApi.listRules(),
      ]);
      setMerchantInsights(insights);
      setSubscriptions(recurring);
      setRules(smartRules);
    } catch (err) {
      setError("Failed to load intelligence data");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void refresh();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [refresh]);

  return {
    merchantInsights,
    subscriptions,
    rules,
    isLoading,
    error,
    refresh,
  };
}
