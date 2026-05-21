import type { Request, Response } from "express";
import {
  CreateSmartRuleSchema,
  UpdateSmartRuleSchema,
} from "./rule.dto.js";
import { ruleService } from "./rule.service.js";

export class RuleController {
  async create(req: Request, res: Response) {
    const userId = req.user!.userId;
    const dto = CreateSmartRuleSchema.parse(req.body);
    const rule = await ruleService.createRule(userId, dto);
    return res.status(201).json({ success: true, data: rule });
  }

  async list(req: Request, res: Response) {
    const userId = req.user!.userId;
    const rules = await ruleService.listRules(userId);
    return res.status(200).json({ success: true, data: rules });
  }

  async update(req: Request, res: Response) {
    const userId = req.user!.userId;
    const ruleId = req.params.id;
    if (!ruleId || Array.isArray(ruleId)) {
      return res.status(400).json({ message: "Invalid rule id" });
    }
    const dto = UpdateSmartRuleSchema.parse(req.body);
    const rule = await ruleService.updateRule(userId, ruleId, dto);
    return res.status(200).json({ success: true, data: rule });
  }

  async delete(req: Request, res: Response) {
    const userId = req.user!.userId;
    const ruleId = req.params.id;
    if (!ruleId || Array.isArray(ruleId)) {
      return res.status(400).json({ message: "Invalid rule id" });
    }
    await ruleService.deleteRule(userId, ruleId);
    return res.status(204).send();
  }
}

export const ruleController = new RuleController();
