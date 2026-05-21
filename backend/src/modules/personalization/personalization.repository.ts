import { prisma } from "../../config/prisma.js";
import type { Prisma, TransactionCategory } from "../../generated/prisma/index.js";

export class PersonalizationRepository {
  async findPreference(userId: string, merchantId: string) {
    return prisma.userMerchantPreference.findUnique({
      where: { userId_merchantId: { userId, merchantId } },
    });
  }

  async upsertPreference(params: {
    userId: string;
    merchantId: string;
    category: TransactionCategory;
  }) {
    const preference = await prisma.userMerchantPreference.upsert({
      where: {
        userId_merchantId: {
          userId: params.userId,
          merchantId: params.merchantId,
        },
      },
      create: {
        userId: params.userId,
        merchantId: params.merchantId,
        preferredCategory: params.category,
        confidence: 0.65,
        correctionCount: 1,
      },
      update: {
        preferredCategory: params.category,
        correctionCount: { increment: 1 },
        confidence: { increment: 0.08 },
        lastCorrectedAt: new Date(),
      },
    });

    if (preference.confidence <= 1) return preference;

    return prisma.userMerchantPreference.update({
      where: { id: preference.id },
      data: { confidence: 1 },
    });
  }

  async createCorrection(data: Prisma.TransactionCorrectionCreateInput) {
    return prisma.transactionCorrection.create({ data });
  }
}

export const personalizationRepository = new PersonalizationRepository();
