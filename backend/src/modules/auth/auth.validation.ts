import { z } from "zod";
import {
  normalizeCurrencyCode,
  SUPPORTED_CURRENCIES,
} from "../../common/constants/currency.constants.js";

const CurrencyCodeSchema = z.preprocess(
  (value) => (typeof value === "string" ? normalizeCurrencyCode(value) : value),
  z.enum(SUPPORTED_CURRENCIES),
);

export const registerSchema = z.object({
  email: z.email("Email is invalid"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const loginSchema = z.object({
  email: z.email("Email is invalid"),
  password: z.string().min(1, "Please fill out password field"),
});

export const updateCurrencySchema = z.object({
  currency: CurrencyCodeSchema,
});
