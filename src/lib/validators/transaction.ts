import { z } from "zod";

export const transactionTypeEnum = z.enum(["expense", "income", "transfer"]);
export const splitModeEnum = z.enum(["none", "equal", "custom"]);

export const transactionSchema = z
  .object({
    type: transactionTypeEnum,
    amountCents: z.number().int().positive(),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    description: z.string().max(140).optional(),
    categoryId: z.string().uuid().optional(),
    accountId: z.string().uuid().optional(),
    cardId: z.string().uuid().optional(),
    transferAccountId: z.string().uuid().optional(),
    paidBy: z.string().uuid().optional(),
    splitMode: splitModeEnum.default("none"),
    installments: z.number().int().min(1).max(48).default(1),
    notes: z.string().max(500).optional(),
  })
  // origem do dinheiro: conta XOR cartão
  .refine((d) => Boolean(d.accountId) !== Boolean(d.cardId) || d.type === "transfer", {
    message: "Informe conta OU cartão (não ambos).",
    path: ["accountId"],
  })
  // parcela só faz sentido em cartão
  .refine((d) => d.installments === 1 || Boolean(d.cardId), {
    message: "Parcelamento só em cartão.",
    path: ["installments"],
  });

export type TransactionInput = z.infer<typeof transactionSchema>;
