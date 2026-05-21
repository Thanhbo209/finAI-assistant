import { z } from "zod";

export const MerchantLookupSchema = z.object({
  name: z.string().min(1).max(200),
});

export type MerchantLookupDTO = z.infer<typeof MerchantLookupSchema>;

export const ListMerchantsQuerySchema = z.object({
  q: z.string().max(200).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(25),
});

export type ListMerchantsQuery = z.infer<typeof ListMerchantsQuerySchema>;

export interface MerchantResolutionDTO {
  merchantId: string;
  canonicalName: string;
  normalizedName: string;
  confidence: number;
  source: "CANONICAL" | "ALIAS" | "CREATED" | "NONE";
}
