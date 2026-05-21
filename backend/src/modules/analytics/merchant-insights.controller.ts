import type { Request, Response } from "express";
import { MerchantInsightsQuerySchema } from "./merchant-insights.dto.js";
import { merchantInsightsService } from "./merchant-insights.service.js";

export class MerchantInsightsController {
  async getMerchantInsights(req: Request, res: Response) {
    const userId = req.user!.userId;
    const query = MerchantInsightsQuerySchema.parse(req.query);
    const insights = await merchantInsightsService.getMerchantInsights({
      userId,
      months: query.months,
      limit: query.limit,
    });

    return res.status(200).json({
      success: true,
      data: insights,
    });
  }
}

export const merchantInsightsController = new MerchantInsightsController();
