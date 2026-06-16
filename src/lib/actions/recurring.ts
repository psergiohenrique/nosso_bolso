"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getSessionContext } from "@/lib/queries/household";
import { recurringSchema } from "@/lib/validators/recurring";
import { toCents } from "@/lib/money";

export type RecurringState = { error?: string; ok?: boolean };

export async function createRecurring(
  _prev: RecurringState,
  formData: FormData,
): Promise<RecurringState> {
  const { membership } = await getSessionContext();
  if (!membership) return { error: "Sessão inválida." };

  const parsed = recurringSchema.safeParse({
    description: formData.get("description"),
    amountCents: toCents(String(formData.get("amount") ?? "0")),
    type: formData.get("type"),
    categoryId: (formData.get("categoryId") as string) || undefined,
    accountId: (formData.get("accountId") as string) || undefined,
    dayOfMonth: Number(formData.get("dayOfMonth")),
    startDate: formData.get("startDate"),
    endDate: (formData.get("endDate") as string) || "",
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const supabase = await createClient();
  const { error } = await supabase.from("recurring_rules").insert({
    household_id: membership.household_id,
    description: parsed.data.description,
    amount_cents: parsed.data.amountCents,
    type: parsed.data.type,
    category_id: parsed.data.categoryId ?? null,
    account_id: parsed.data.accountId ?? null,
    frequency: "monthly",
    day_of_month: parsed.data.dayOfMonth,
    start_date: parsed.data.startDate,
    end_date: parsed.data.endDate || null,
  });
  if (error) return { error: "Não foi possível criar a conta fixa." };

  revalidatePath("/recurring");
  return { ok: true };
}

export async function deactivateRecurring(id: string): Promise<void> {
  const supabase = await createClient();
  await supabase.from("recurring_rules").update({ active: false }).eq("id", id);
  revalidatePath("/recurring");
}

/** Gera os lançamentos das regras para o mês atual (idempotente). */
export async function generateThisMonth(): Promise<{ created: number }> {
  const supabase = await createClient();
  const month = new Date().toISOString().slice(0, 10);
  const { data } = await supabase.rpc("generate_recurring", { p_month: month });
  revalidatePath("/recurring");
  revalidatePath("/dashboard");
  return { created: (data as number) ?? 0 };
}
