"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getSessionContext } from "@/lib/queries/household";
import { toCents } from "@/lib/money";

export type GoalState = { error?: string; ok?: boolean };

export async function createGoal(
  _prev: GoalState,
  formData: FormData,
): Promise<GoalState> {
  const { membership } = await getSessionContext();
  if (!membership) return { error: "Sessão inválida." };

  const name = String(formData.get("name") ?? "").trim();
  const targetCents = toCents(String(formData.get("target") ?? "0"));
  const targetDate = (formData.get("targetDate") as string) || null;
  if (!name) return { error: "Informe um nome." };
  if (targetCents <= 0) return { error: "Informe um valor alvo." };

  const supabase = await createClient();
  const { error } = await supabase.from("goals").insert({
    household_id: membership.household_id,
    name,
    target_cents: targetCents,
    target_date: targetDate,
  });
  if (error) return { error: "Não foi possível criar a meta." };

  revalidatePath("/goals");
  return { ok: true };
}

export async function addContribution(
  id: string,
  amount: string,
): Promise<void> {
  const cents = toCents(amount);
  if (cents <= 0) return;
  const supabase = await createClient();
  const { data: goal } = await supabase
    .from("goals")
    .select("saved_cents")
    .eq("id", id)
    .maybeSingle();
  if (!goal) return;
  await supabase
    .from("goals")
    .update({ saved_cents: (goal.saved_cents as number) + cents })
    .eq("id", id);
  revalidatePath("/goals");
}

export async function deleteGoal(id: string): Promise<void> {
  const supabase = await createClient();
  await supabase.from("goals").delete().eq("id", id);
  revalidatePath("/goals");
}
