import { z } from "zod";

export const accountTypeEnum = z.enum([
  "checking",
  "savings",
  "cash",
  "wallet",
  "other",
]);

export const accountSchema = z.object({
  name: z.string().min(1, "Informe um nome."),
  type: accountTypeEnum,
  initialBalanceCents: z.number().int().default(0),
});

export const accountTypeLabels: Record<z.infer<typeof accountTypeEnum>, string> =
  {
    checking: "Conta corrente",
    savings: "Poupança",
    cash: "Dinheiro",
    wallet: "Carteira",
    other: "Outro",
  };
