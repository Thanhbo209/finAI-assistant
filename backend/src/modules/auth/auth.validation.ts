import { z } from "zod";

export const registerSchema = z.object({
  email: z.email("Email is invalid"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const loginSchema = z.object({
  email: z.email("Email is invalid"),
  password: z.string().min(1, "Please fill out password field"),
});
