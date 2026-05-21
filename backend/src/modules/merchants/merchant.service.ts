import { TransactionCategory } from "../../generated/prisma/index.js";
import { merchantRepository } from "./merchant.repository.js";
import {
  normalizeMerchantName,
  scoreAliasMatch,
} from "./merchant-normalizer.js";
import type { MerchantResolutionDTO } from "./merchant.dto.js";

export type CategoryTendencies = Partial<Record<TransactionCategory, number>>;

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

export class MerchantService {
  async resolveMerchant(input: string | null): Promise<MerchantResolutionDTO> {
    if (!input?.trim()) {
      return {
        merchantId: "",
        canonicalName: "",
        normalizedName: "",
        confidence: 0,
        source: "NONE",
      };
    }

    const normalized = normalizeMerchantName(input);

    const canonical = await merchantRepository.findByNormalizedName(
      normalized.normalized,
    );
    if (canonical) {
      return {
        merchantId: canonical.id,
        canonicalName: canonical.canonicalName,
        normalizedName: canonical.normalizedName,
        confidence: 1,
        source: "CANONICAL",
      };
    }

    const alias = await merchantRepository.findByAlias(normalized.compact);
    if (alias) {
      await merchantRepository.incrementAliasHit(alias.id);
      return {
        merchantId: alias.merchant.id,
        canonicalName: alias.merchant.canonicalName,
        normalizedName: alias.merchant.normalizedName,
        confidence: Math.max(
          alias.confidence,
          scoreAliasMatch(normalized, alias.normalizedAlias),
        ),
        source: "ALIAS",
      };
    }

    const merchant = await merchantRepository.createWithAlias({
      canonicalName: normalized.canonicalCandidate,
      normalizedName: normalized.normalized,
      alias: normalized.raw,
      normalizedAlias: normalized.compact,
      confidence: 0.55,
    });

    return {
      merchantId: merchant.id,
      canonicalName: merchant.canonicalName,
      normalizedName: merchant.normalizedName,
      confidence: 0.55,
      source: "CREATED",
    };
  }

  async listMerchants(query: string | undefined, limit: number) {
    return merchantRepository.search(query, limit);
  }

  async recordTransactionCategory(
    merchantId: string | null,
    category: TransactionCategory | null,
  ) {
    if (!merchantId || !category) return;

    const merchant = await merchantRepository.findById(merchantId);
    if (!merchant) return;

    await this.updateCategoryTendency({
      merchantId,
      category,
      transactionCount: merchant.transactionCount,
      currentTendencies: merchant.categoryTendencies as CategoryTendencies,
    });
  }

  async updateCategoryTendency(params: {
    merchantId: string;
    category: TransactionCategory;
    transactionCount: number;
    currentTendencies: CategoryTendencies;
  }) {
    const current = params.currentTendencies;
    const next: CategoryTendencies = { ...current };
    next[params.category] = (next[params.category] ?? 0) + 1;

    const total = Object.values(next).reduce((sum, value) => sum + value, 0);
    const dominantShare = total > 0 ? (next[params.category] ?? 0) / total : 0;

    await merchantRepository.updateIntelligence(params.merchantId, {
      categoryTendencies: next,
      transactionCount: { increment: 1 },
      confidence: clamp01(0.5 + dominantShare * 0.45),
    });
  }

  async addAlias(params: {
    merchantId: string;
    alias: string;
    confidence?: number;
    source?: string;
  }) {
    const normalized = normalizeMerchantName(params.alias);
    return merchantRepository.addAlias({
      merchantId: params.merchantId,
      alias: normalized.raw,
      normalizedAlias: normalized.compact,
      confidence: params.confidence ?? 0.8,
      source: params.source ?? "USER_CORRECTION",
    });
  }
}

export const merchantService = new MerchantService();
