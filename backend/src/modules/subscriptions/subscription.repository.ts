import { prisma } from "../../config/prisma.js";

export class SubscriptionRepository {
  async findSubscriptionCandidates(userId: string) {
    const since = new Date();
    since.setMonth(since.getMonth() - 18);

    return prisma.transaction.findMany({
      where: {
        userId,
        deletedAt: null,
        merchantName: { not: null },
        transactionDate: { gte: since },
      },
      select: {
        id: true,
        merchantId: true,
        merchantName: true,
        amount: true,
        currency: true,
        transactionDate: true,
      },
      orderBy: { transactionDate: "asc" },
    });
  }
}

export const subscriptionRepository = new SubscriptionRepository();
