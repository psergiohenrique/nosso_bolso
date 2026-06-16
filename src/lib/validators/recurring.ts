import { z } from "zod";

export const recurringSchema = z.object({
  description: z.string().min(1, "Informe uma descrição."),
  amountCents: z.number().int().positive(),
  type: z.enum(["expense", "income"]),
  categoryId: z.string().uuid().optional(),
  accountId: z.string().uuid().optional(),
  dayOfMonth: z.number().int().min(1).max(31),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional()
    .or(z.literal("")),
});
