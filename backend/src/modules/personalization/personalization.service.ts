import {
  CorrectionField,
  type Transaction,
  type TransactionCategory,
} from "../../generated/prisma/index.js";
import type { CreateTransactionDTO } from "../transaction/transaction.dto.js";
import type { UpdateTransactionDTO } from "../transaction/transaction.dto.js";
import { merchantService } from "../merchants/merchant.service.js";
import { personalizationRepository } from "./personalization.repository.js";
import { ruleService } from "../rules/rule.service.js";

export interface CategorySuggestion {
  category: TransactionCategory;
  confidence: number;
  source: "SMART_RULE" | "USER_PREFERENCE" | "MERCHANT_TENDENCY" | "NONE";
  reason: string;
}

export interface PersonalizationResolution {
  merchantId: string | null;
  merchantName: string | null;
  categorySuggestion: CategorySuggestion | null;
}

export class PersonalizationService {
  async resolveForParser(params: {
    userId: string;
    merchantName: string | null;
    normalizedInput: string;
    parserCategory: TransactionCategory | null;
    parserConfidence: number;
  }): Promise<PersonalizationResolution> {
    const merchant = await merchantService.resolveMerchant(params.merchantName);
    const rule = await ruleService.evaluate(params.userId, {
      merchantId: merchant.source === "NONE" ? null : merchant.merchantId,
      merchantName:
        merchant.source === "NONE" ? params.merchantName : merchant.canonicalName,
      normalizedInput: params.normalizedInput,
    });

    if (rule) {
      return {
        merchantId:
          merchant.source === "NONE" ? rule.merchantId : merchant.merchantId,
        merchantName:
          merchant.source === "NONE"
            ? rule.merchantName
            : merchant.canonicalName,
        categorySuggestion: {
          category: rule.category,
          confidence: Math.max(rule.confidence, 0.9),
          source: "SMART_RULE",
          reason: `Matched smart rule ${rule.ruleId}`,
        },
      };
    }

    if (merchant.source === "NONE") {
      return {
        merchantId: null,
        merchantName: params.merchantName,
        categorySuggestion: null,
      };
    }

    const preference = await personalizationRepository.findPreference(
      params.userId,
      merchant.merchantId,
    );
    if (preference && preference.confidence >= params.parserConfidence) {
      return {
        merchantId: merchant.merchantId,
        merchantName: merchant.canonicalName,
        categorySuggestion: {
          category: preference.preferredCategory,
          confidence: Math.min(preference.confidence, 0.98),
          source: "USER_PREFERENCE",
          reason: "Matched user-specific merchant preference",
        },
      };
    }

    return {
      merchantId: merchant.merchantId,
      merchantName: merchant.canonicalName,
      categorySuggestion: null,
    };
  }

  async learnFromConfirmation(params: {
    userId: string;
    transaction: Transaction;
    dto: CreateTransactionDTO;
  }) {
    const { parserResult, finalValues } = params.dto;
    const merchant = await merchantService.resolveMerchant(
      finalValues.merchantName ?? parserResult.merchantName,
    );
    const merchantId = merchant.source === "NONE" ? null : merchant.merchantId;

    if (merchantId && finalValues.merchantName) {
      await merchantService.addAlias({
        merchantId,
        alias: finalValues.merchantName,
        confidence: 0.95,
        source: "HUMAN_CONFIRMATION",
      });
      await merchantService.recordTransactionCategory(
        merchantId,
        finalValues.category,
      );
    }

    const merchantChanged =
      (parserResult.merchantName ?? null) !== (finalValues.merchantName ?? null);
    const categoryChanged =
      (parserResult.category ?? null) !== (finalValues.category ?? null);

    if (merchantChanged) {
      await personalizationRepository.createCorrection({
        user: { connect: { id: params.userId } },
        transaction: { connect: { id: params.transaction.id } },
        ...(merchantId ? { merchant: { connect: { id: merchantId } } } : {}),
        field: CorrectionField.MERCHANT,
        parserMerchantName: parserResult.merchantName,
        finalMerchantName: finalValues.merchantName,
        parserCategory: parserResult.category,
        finalCategory: finalValues.category,
        confidenceBefore: parserResult.confidenceScore,
      });
    }

    if (categoryChanged && merchantId) {
      await personalizationRepository.createCorrection({
        user: { connect: { id: params.userId } },
        transaction: { connect: { id: params.transaction.id } },
        merchant: { connect: { id: merchantId } },
        field: CorrectionField.CATEGORY,
        parserMerchantName: parserResult.merchantName,
        finalMerchantName: finalValues.merchantName,
        parserCategory: parserResult.category,
        finalCategory: finalValues.category,
        confidenceBefore: parserResult.confidenceScore,
      });

      await personalizationRepository.upsertPreference({
        userId: params.userId,
        merchantId,
        category: finalValues.category,
      });
    }
  }

  async learnFromTransactionUpdate(params: {
    userId: string;
    before: Transaction;
    after: Transaction;
    dto: UpdateTransactionDTO;
  }) {
    const merchant = await merchantService.resolveMerchant(
      params.after.merchantName ?? params.before.merchantName,
    );
    const merchantId = merchant.source === "NONE" ? null : merchant.merchantId;

    if (params.dto.merchantName !== undefined) {
      await personalizationRepository.createCorrection({
        user: { connect: { id: params.userId } },
        transaction: { connect: { id: params.after.id } },
        ...(merchantId ? { merchant: { connect: { id: merchantId } } } : {}),
        field: CorrectionField.MERCHANT,
        parserMerchantName: params.before.parserMerchantName,
        finalMerchantName: params.after.merchantName,
        parserCategory: params.before.parserCategory,
        finalCategory: params.after.category,
        confidenceBefore: params.before.confidenceScore,
        source: "TRANSACTION_EDIT",
      });
    }

    if (params.dto.category !== undefined && merchantId) {
      await personalizationRepository.createCorrection({
        user: { connect: { id: params.userId } },
        transaction: { connect: { id: params.after.id } },
        merchant: { connect: { id: merchantId } },
        field: CorrectionField.CATEGORY,
        parserMerchantName: params.before.parserMerchantName,
        finalMerchantName: params.after.merchantName,
        parserCategory: params.before.parserCategory,
        finalCategory: params.after.category,
        confidenceBefore: params.before.confidenceScore,
        source: "TRANSACTION_EDIT",
      });

      await personalizationRepository.upsertPreference({
        userId: params.userId,
        merchantId,
        category: params.after.category,
      });
    }
  }
}

export const personalizationService = new PersonalizationService();
