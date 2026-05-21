import type { Request, Response } from "express";
import { SubscriptionQuerySchema } from "./subscription.dto.js";
import { subscriptionService } from "./subscription.service.js";

export class SubscriptionController {
  async list(req: Request, res: Response) {
    const userId = req.user!.userId;
    const query = SubscriptionQuerySchema.parse(req.query);
    const subscriptions = await subscriptionService.getSubscriptions(
      userId,
      query.minConfidence,
    );

    return res.status(200).json({
      success: true,
      data: subscriptions,
    });
  }
}

export const subscriptionController = new SubscriptionController();
