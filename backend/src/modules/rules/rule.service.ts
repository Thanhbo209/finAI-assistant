import { AppError } from "../../common/error/app.error.js";
import type { Prisma } from "../../generated/prisma/index.js";
import { merchantService } from "../merchants/merchant.service.js";
import { normalizeMerchantName } from "../merchants/merchant-normalizer.js";
import { ruleRepository } from "./rule.repository.js";
import { evaluateSmartRules, type RuleEvaluationContext } from "./rule-engine.js";
import type { CreateSmartRuleDTO, UpdateSmartRuleDTO } from "./rule.dto.js";

export class RuleService {
  async createRule(userId: string, dto: CreateSmartRuleDTO) {
    const merchant = await merchantService.resolveMerchant(dto.merchantName);
    const normalized = normalizeMerchantName(dto.merchantName);

    const data: Prisma.SmartRuleCreateInput = {
      user: { connect: { id: userId } },
      merchantNamePattern: dto.merchantName,
      normalizedMerchantName: normalized.normalized,
      category: dto.category,
      priority: dto.priority,
      confidence: 1,
    };

    if (merchant.source !== "NONE") {
      data.merchant = { connect: { id: merchant.merchantId } };
    }

    return ruleRepository.create(data);
  }

  async listRules(userId: string) {
    return ruleRepository.findMany(userId);
  }

  async updateRule(userId: string, ruleId: string, dto: UpdateSmartRuleDTO) {
    const data: Prisma.SmartRuleUpdateInput = {};
    if (dto.category !== undefined) data.category = dto.category;
    if (dto.priority !== undefined) data.priority = dto.priority;
    if (dto.isActive !== undefined) data.isActive = dto.isActive;

    const rule = await ruleRepository.update(userId, ruleId, data);
    if (!rule) throw new AppError(404, "NOT_FOUND", "Rule not found");
    return rule;
  }

  async deleteRule(userId: string, ruleId: string) {
    const result = await ruleRepository.delete(userId, ruleId);
    if (result.count === 0) throw new AppError(404, "NOT_FOUND", "Rule not found");
  }

  async evaluate(userId: string, context: RuleEvaluationContext) {
    const rules = await ruleRepository.findActiveForUser(userId);
    return evaluateSmartRules(rules, context);
  }
}

export const ruleService = new RuleService();
