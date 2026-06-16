import { z } from "zod";

export const signInSchema = z.object({
  email: z.string().email("E-mail inválido."),
  password: z.string().min(6, "Senha de no mínimo 6 caracteres."),
});

export const signUpSchema = signInSchema.extend({
  name: z.string().min(1, "Informe seu nome."),
});

export const householdSchema = z.object({
  name: z.string().min(1, "Dê um nome para o espaço do casal."),
});
