import { prisma } from "../../config/prisma.js";
import type { Prisma } from "../../generated/prisma/index.js";

export class RuleRepository {
  async create(data: Prisma.SmartRuleCreateInput) {
    return prisma.smartRule.create({ data });
  }

  async findActiveForUser(userId: string) {
    return prisma.smartRule.findMany({
      where: { userId, isActive: true },
      orderBy: [{ priority: "asc" }, { createdAt: "asc" }],
    });
  }

  async findMany(userId: string) {
    return prisma.smartRule.findMany({
      where: { userId },
      orderBy: [{ isActive: "desc" }, { priority: "asc" }],
      include: { merchant: true },
    });
  }

  async update(userId: string, ruleId: string, data: Prisma.SmartRuleUpdateInput) {
    const result = await prisma.smartRule.updateMany({
      where: { id: ruleId, userId },
      data,
    });
    if (result.count === 0) return null;

    return prisma.smartRule.findFirst({ where: { id: ruleId, userId } });
  }

  async delete(userId: string, ruleId: string) {
    return prisma.smartRule.deleteMany({
      where: { id: ruleId, userId },
    });
  }
}

export const ruleRepository = new RuleRepository();
