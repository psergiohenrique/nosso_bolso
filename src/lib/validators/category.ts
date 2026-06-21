import { z } from "zod";

export const categoryKindEnum = z.enum(["expense", "income"]);

export const categorySchema = z.object({
  name: z.string().min(1, "Informe um nome."),
  kind: categoryKindEnum,
  parentId: z
    .string()
    .uuid()
    .optional()
    .or(z.literal("").transform(() => undefined)),
  icon: z
    .string()
    .max(8)
    .optional()
    .or(z.literal("").transform(() => undefined)),
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, "Cor inválida.")
    .optional()
    .or(z.literal("").transform(() => undefined)),
});

export const categoryKindLabels: Record<
  z.infer<typeof categoryKindEnum>,
  string
> = {
  expense: "Despesa",
  income: "Receita",
};
