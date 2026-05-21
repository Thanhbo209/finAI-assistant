import type { TransactionCategory } from "../../generated/prisma/index.js";

export interface AiParseAssistanceRequest {
  userId: string;
  normalizedInput: string;
  parserMerchantName: string | null;
  parserCategory: TransactionCategory | null;
  parserConfidence: number;
  missingFields: string[];
}

export interface AiParseAssistanceResult {
  merchantName?: string;
  category?: TransactionCategory;
  confidence: number;
  provider: string;
  costUnits: number;
  reasoning: string;
}

export interface AiAssistanceProvider {
  readonly name: string;
  suggest(request: AiParseAssistanceRequest): Promise<AiParseAssistanceResult | null>;
}

export interface AiAssistanceDecision {
  shouldCallAi: boolean;
  reason: string;
}
