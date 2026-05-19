import { z } from "zod";
import { TransactionCategory } from "../../generated/prisma/index.js";

// ─────────────────────────────────────────────────────────────────────────────
// Shared primitives
// ─────────────────────────────────────────────────────────────────────────────

const CategoryEnum = z.nativeEnum(TransactionCategory);

/** YYYY-MM-DD — validated and kept as string; DB receives Date but API uses string */
const IsoDateString = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD")
  .refine((s) => !isNaN(new Date(s).getTime()), "Invalid date value");

const PositiveDecimal = z
  .number()
  .positive("Amount must be a positive number")
  .multipleOf(0.01, "Amount must have at most 2 decimal places");

const Confidence = z.number().min(0).max(1);

// POST /transactions/parse

export const ParseInputSchema = z.object({
  input: z
    .string()
    .min(1, "input is required")
    .max(500, "input must be at most 500 characters"),
});

export type ParseInputDTO = z.infer<typeof ParseInputSchema>;

// Parser result embedded in create request
const ParserResultSchema = z.object({
  amount: z.number().nullable(),
  currency: z.string().default("USD"), // Default to USD if not provided
  merchantName: z.string().nullable(),
  category: CategoryEnum.nullable(),
  confidenceScore: Confidence,
  missingFields: z.array(z.string()),
  followUpQuestion: z.string().nullable().optional(),
  parserVersion: z.string(),
  aiProcessed: z.boolean(),
  descriptionRaw: z.string(),
  descriptionNormalized: z.string(),
});

// POST /transactions — create confirmed transaction
export const CreateTransactionSchema = z.object({
  parserResult: ParserResultSchema,

  finalValues: z.object({
    amount: PositiveDecimal,
    merchantName: z.string().min(1).max(200).nullable().default(null),
    category: CategoryEnum,
    transactionDate: IsoDateString,
    currency: z.string().default("USD"),
  }),
});

export type CreateTransactionDTO = z.infer<typeof CreateTransactionSchema>;

// PATCH /transactions/:id — partial update (user corrections)
export const UpdateTransactionSchema = z
  .object({
    amount: PositiveDecimal,
    merchantName: z.string().min(1).max(200).nullable(),
    category: CategoryEnum,
    transactionDate: IsoDateString,
  })
  .partial() // All fields optional for PATCH
  .refine(
    (data) => Object.keys(data).length > 0,
    "At least one field must be provided for update",
  );

export type UpdateTransactionDTO = z.infer<typeof UpdateTransactionSchema>;

// GET /transactions — list query params
export const ListTransactionsQuerySchema = z
  .object({
    // Pagination
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().min(1).max(100).default(20),

    // Sorting
    sortBy: z
      .enum(["transactionDate", "amount", "createdAt"])
      .default("transactionDate"),
    sortOrder: z.enum(["asc", "desc"]).default("desc"),

    // Date range filtering
    dateFrom: IsoDateString.optional(),
    dateTo: IsoDateString.optional(),

    // Filters
    category: CategoryEnum.optional(),
    merchantName: z.string().max(200).optional(),
    amountMin: z.coerce.number().positive().optional(),
    amountMax: z.coerce.number().positive().optional(),
    confidenceMin: z.coerce.number().min(0).max(1).optional(),
    currency: z.string().length(3).optional(), // ISO currency code
  })
  .refine(
    (data) => {
      if (data.amountMin !== undefined && data.amountMax !== undefined) {
        return data.amountMin <= data.amountMax;
      }
      return true;
    },
    {
      message: "amountMin cannot be greater than amountMax",
      path: ["amountMin"],
    },
  );

export type ListTransactionsQuery = z.infer<typeof ListTransactionsQuerySchema>;

// GET /transactions/summary/monthly

export const MonthlySummaryQuerySchema = z.object({
  year: z.coerce
    .number()
    .int()
    .min(2000)
    .max(2100)
    .default(new Date().getFullYear()),
  currency: z.string().length(3).default("USD"),
});

export type MonthlySummaryQuery = z.infer<typeof MonthlySummaryQuerySchema>;

// GET /transactions/summary/category

export const CategorySummaryQuerySchema = z.object({
  dateFrom: IsoDateString.optional(),
  dateTo: IsoDateString.optional(),
  currency: z.string().length(3).default("USD"),
});

export type CategorySummaryQuery = z.infer<typeof CategorySummaryQuerySchema>;

// GET /transactions/summary/merchant

export const MerchantSummaryQuerySchema = z.object({
  dateFrom: IsoDateString.optional(),
  dateTo: IsoDateString.optional(),
  limit: z.coerce.number().int().min(1).max(50).default(10),
  currency: z.string().length(3).default("USD"),
});

export type MerchantSummaryQuery = z.infer<typeof MerchantSummaryQuerySchema>;
