import type {
  AiAssistanceDecision,
  AiAssistanceProvider,
  AiParseAssistanceRequest,
  AiParseAssistanceResult,
} from "./ai-assistance.types.js";

const LOW_CONFIDENCE_THRESHOLD = 0.45;
const DAILY_COST_UNIT_LIMIT = 1_000;

class NoopAiAssistanceProvider implements AiAssistanceProvider {
  readonly name = "noop";

  async suggest(): Promise<AiParseAssistanceResult | null> {
    return null;
  }
}

export class AiAssistanceService {
  constructor(private readonly provider: AiAssistanceProvider = new NoopAiAssistanceProvider()) {}

  decide(request: AiParseAssistanceRequest): AiAssistanceDecision {
    if (request.parserConfidence >= LOW_CONFIDENCE_THRESHOLD) {
      return { shouldCallAi: false, reason: "Parser confidence is sufficient" };
    }

    if (request.parserMerchantName && request.parserCategory) {
      return { shouldCallAi: false, reason: "Core merchant and category are present" };
    }

    return {
      shouldCallAi: true,
      reason: "Low confidence with unknown merchant or uncertain category",
    };
  }

  async suggestWithRetry(
    request: AiParseAssistanceRequest,
    currentDailyCostUnits = 0,
  ): Promise<AiParseAssistanceResult | null> {
    const decision = this.decide(request);
    if (!decision.shouldCallAi) return null;
    if (currentDailyCostUnits >= DAILY_COST_UNIT_LIMIT) return null;

    for (let attempt = 1; attempt <= 2; attempt += 1) {
      try {
        const result = await this.provider.suggest(request);
        if (!result) return null;
        if (result.costUnits + currentDailyCostUnits > DAILY_COST_UNIT_LIMIT) {
          return null;
        }
        return result;
      } catch (error) {
        if (attempt === 2) throw error;
      }
    }

    return null;
  }
}

export const aiAssistanceService = new AiAssistanceService();
