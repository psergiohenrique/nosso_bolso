"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getSessionContext } from "@/lib/queries/household";
import { toCents } from "@/lib/money";
import { monthRange } from "@/lib/dates";

export type BudgetState = { error?: string; ok?: boolean };

export async function upsertBudget(
  _prev: BudgetState,
  formData: FormData,
): Promise<BudgetState> {
  const { membership } = await getSessionContext();
  if (!membership) return { error: "Sessão inválida." };

  const categoryId = String(formData.get("categoryId") ?? "");
  const limitCents = toCents(String(formData.get("limit") ?? "0"));
  if (!categoryId) return { error: "Escolha uma categoria." };
  if (limitCents <= 0) return { error: "Informe um limite válido." };

  const { start } = monthRange(new Date());
  const supabase = await createClient();
  const { error } = await supabase.from("budgets").upsert(
    {
      household_id: membership.household_id,
      category_id: categoryId,
      month: start,
      limit_cents: limitCents,
    },
    { onConflict: "household_id,category_id,month" },
  );
  if (error) return { error: "Não foi possível salvar o orçamento." };

  revalidatePath("/budgets");
  return { ok: true };
}

export async function deleteBudget(
  categoryId: string,
  month: string,
): Promise<void> {
  const { membership } = await getSessionContext();
  if (!membership) return;
  const supabase = await createClient();
  await supabase
    .from("budgets")
    .delete()
    .eq("household_id", membership.household_id)
    .eq("category_id", categoryId)
    .eq("month", month);
  revalidatePath("/budgets");
}
