import type { TransactionCategory } from "@/types/category";

export type MerchantResolutionSource = "CANONICAL" | "ALIAS" | "CREATED" | "NONE";

export interface MerchantResolution {
  merchantId: string;
  canonicalName: string;
  normalizedName: string;
  confidence: number;
  source: MerchantResolutionSource;
}

export interface MerchantListItem {
  id: string;
  canonicalName: string;
  normalizedName: string;
  transactionCount: number;
  recurringLikelihood: number;
  confidence: number;
  aliases: Array<{
    id: string;
    alias: string;
    normalizedAlias: string;
    confidence: number;
    hitCount: number;
  }>;
}

export interface CategorySuggestion {
  category: TransactionCategory;
  confidence: number;
  source: "SMART_RULE" | "USER_PREFERENCE" | "MERCHANT_TENDENCY" | "NONE";
  reason: string;
}

export interface AiSuggestion {
  merchantName?: string;
  category?: TransactionCategory;
  confidence: number;
  provider: string;
  costUnits: number;
  reasoning: string;
}

export interface ParseIntelligence {
  merchantId: string | null;
  categorySuggestion: CategorySuggestion | null;
  aiSuggestion: AiSuggestion | null;
}

export interface SmartRule {
  id: string;
  merchantId: string | null;
  merchantNamePattern: string | null;
  normalizedMerchantName: string | null;
  category: TransactionCategory;
  priority: number;
  isActive: boolean;
  confidence: number;
  createdAt: string;
  updatedAt: string;
  merchant?: {
    id: string;
    canonicalName: string;
  } | null;
}

export interface CreateSmartRulePayload {
  merchantName: string;
  category: TransactionCategory;
  priority?: number;
}

export interface SubscriptionInsight {
  merchant: {
    id: string | null;
    name: string;
  };
  currency: string;
  estimatedMonthlyCost: number;
  nextExpectedCharge: string;
  recurrenceConfidence: number;
  cadenceDays: number;
  transactionCount: number;
  lastSeenAt: string;
}

export interface MerchantInsight {
  merchant: {
    id: string | null;
    name: string;
  };
  totalSpend: number;
  averageSpend: number;
  frequency: number;
  latestTransactionDate: string;
  monthlyChangePercent: number | null;
  confidenceInsights: {
    averageParserConfidence: number | null;
    correctionCount: number;
    personalized: boolean;
  };
}
