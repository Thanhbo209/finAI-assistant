import { z } from "zod";
import { TransactionCategory } from "../../generated/prisma/index.js";

export const CreateSmartRuleSchema = z.object({
  merchantName: z.string().min(1).max(200),
  category: z.nativeEnum(TransactionCategory),
  priority: z.number().int().min(1).max(1000).default(100),
});

export type CreateSmartRuleDTO = z.infer<typeof CreateSmartRuleSchema>;

export const UpdateSmartRuleSchema = z
  .object({
    category: z.nativeEnum(TransactionCategory),
    priority: z.number().int().min(1).max(1000),
    isActive: z.boolean(),
  })
  .partial()
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one field must be provided",
  });

export type UpdateSmartRuleDTO = z.infer<typeof UpdateSmartRuleSchema>;
