import { prisma } from "../../config/prisma.js";
import { Prisma, type Merchant } from "../../generated/prisma/index.js";

export class MerchantRepository {
  async findById(merchantId: string) {
    return prisma.merchant.findUnique({
      where: { id: merchantId },
      include: { aliases: true },
    });
  }

  async findByNormalizedName(normalizedName: string) {
    return prisma.merchant.findUnique({
      where: { normalizedName },
      include: { aliases: true },
    });
  }

  async findByAlias(normalizedAlias: string) {
    return prisma.merchantAlias.findUnique({
      where: { normalizedAlias },
      include: { merchant: { include: { aliases: true } } },
    });
  }

  async search(query: string | undefined, limit: number) {
    const where: Prisma.MerchantWhereInput | undefined = query
      ? {
          OR: [
            { canonicalName: { contains: query, mode: "insensitive" } },
            { normalizedName: { contains: query, mode: "insensitive" } },
          ],
        }
      : undefined;

    return prisma.merchant.findMany({
      ...(where ? { where } : {}),
      include: { aliases: true },
      orderBy: [{ transactionCount: "desc" }, { canonicalName: "asc" }],
      take: limit,
    });
  }

  async createWithAlias(params: {
    canonicalName: string;
    normalizedName: string;
    alias: string;
    normalizedAlias: string;
    confidence: number;
  }): Promise<Merchant> {
    return prisma.merchant.create({
      data: {
        canonicalName: params.canonicalName,
        normalizedName: params.normalizedName,
        confidence: params.confidence,
        aliases: {
          create: {
            alias: params.alias,
            normalizedAlias: params.normalizedAlias,
            confidence: params.confidence,
            source: "SYSTEM",
            hitCount: 1,
          },
        },
      },
    });
  }

  async addAlias(params: {
    merchantId: string;
    alias: string;
    normalizedAlias: string;
    confidence: number;
    source: string;
  }) {
    return prisma.merchantAlias.upsert({
      where: { normalizedAlias: params.normalizedAlias },
      create: params,
      update: {
        merchantId: params.merchantId,
        alias: params.alias,
        confidence: { increment: Math.min(0.05, 1 - params.confidence) },
        hitCount: { increment: 1 },
      },
    });
  }

  async incrementAliasHit(aliasId: string) {
    return prisma.merchantAlias.update({
      where: { id: aliasId },
      data: { hitCount: { increment: 1 } },
    });
  }

  async updateIntelligence(
    merchantId: string,
    data: Prisma.MerchantUpdateInput,
  ) {
    return prisma.merchant.update({
      where: { id: merchantId },
      data,
    });
  }
}

export const merchantRepository = new MerchantRepository();
