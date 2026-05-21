import type { Request, Response } from "express";
import {
  ListMerchantsQuerySchema,
  MerchantLookupSchema,
} from "./merchant.dto.js";
import { merchantService } from "./merchant.service.js";

export class MerchantController {
  async lookup(req: Request, res: Response) {
    const dto = MerchantLookupSchema.parse(req.query);
    const result = await merchantService.resolveMerchant(dto.name);

    return res.status(200).json({
      success: true,
      data: result,
    });
  }

  async list(req: Request, res: Response) {
    const query = ListMerchantsQuerySchema.parse(req.query);
    const merchants = await merchantService.listMerchants(query.q, query.limit);

    return res.status(200).json({
      success: true,
      data: merchants,
    });
  }
}

export const merchantController = new MerchantController();
