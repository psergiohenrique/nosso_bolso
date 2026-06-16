"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getSessionContext } from "@/lib/queries/household";
import { accountSchema } from "@/lib/validators/account";
import { toCents } from "@/lib/money";

export type AccountState = { error?: string; ok?: boolean };

export async function createAccount(
  _prev: AccountState,
  formData: FormData,
): Promise<AccountState> {
  const { membership } = await getSessionContext();
  if (!membership) return { error: "Sessão inválida." };

  const parsed = accountSchema.safeParse({
    name: formData.get("name"),
    type: formData.get("type"),
    initialBalanceCents: toCents(String(formData.get("initialBalance") ?? "0")),
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const supabase = await createClient();
  const { error } = await supabase.from("accounts").insert({
    household_id: membership.household_id,
    name: parsed.data.name,
    type: parsed.data.type,
    initial_balance_cents: parsed.data.initialBalanceCents,
  });
  if (error) return { error: "Não foi possível criar a conta." };

  revalidatePath("/settings");
  revalidatePath("/dashboard");
  return { ok: true };
}

export async function archiveAccount(id: string): Promise<void> {
  const supabase = await createClient();
  await supabase.from("accounts").update({ archived: true }).eq("id", id);
  revalidatePath("/settings");
}
