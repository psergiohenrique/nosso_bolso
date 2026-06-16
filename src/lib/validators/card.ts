import { z } from "zod";

export const cardSchema = z.object({
  name: z.string().min(1, "Informe um nome."),
  brand: z.string().optional(),
  last4: z
    .string()
    .regex(/^\d{4}$/, "Use os 4 últimos dígitos.")
    .optional()
    .or(z.literal("")),
  limitCents: z.number().int().nonnegative().optional(),
  closingDay: z.number().int().min(1).max(31),
  dueDay: z.number().int().min(1).max(31),
});

export const cardPurchaseSchema = z.object({
  cardId: z.string().uuid(),
  amountCents: z.number().int().positive(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  categoryId: z.string().uuid().optional(),
  description: z.string().max(140).optional(),
  paidBy: z.string().uuid().optional(),
  installments: z.number().int().min(1).max(48),
});
