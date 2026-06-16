"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getSessionContext } from "@/lib/queries/household";
import { transactionSchema } from "@/lib/validators/transaction";
import { toCents } from "@/lib/money";

export type TxState = { error?: string; ok?: boolean };

function orNull(v: FormDataEntryValue | null): string | undefined {
  const s = typeof v === "string" ? v.trim() : "";
  return s.length ? s : undefined;
}

export async function createTransaction(
  _prev: TxState,
  formData: FormData,
): Promise<TxState> {
  const { user, membership } = await getSessionContext();
  if (!user || !membership) return { error: "Sessão inválida." };

  const type = String(formData.get("type") ?? "expense");

  const parsed = transactionSchema.safeParse({
    type,
    amountCents: toCents(String(formData.get("amount") ?? "0")),
    date: formData.get("date"),
    description: orNull(formData.get("description")),
    categoryId: type === "transfer" ? undefined : orNull(formData.get("categoryId")),
    accountId: orNull(formData.get("accountId")),
    transferAccountId:
      type === "transfer" ? orNull(formData.get("transferAccountId")) : undefined,
    paidBy: orNull(formData.get("paidBy")) ?? user.id,
    splitMode: "none",
    installments: 1,
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const d = parsed.data;
  if (d.type === "transfer" && !d.transferAccountId) {
    return { error: "Escolha a conta de destino." };
  }
  if (d.type === "transfer" && d.accountId === d.transferAccountId) {
    return { error: "Conta de origem e destino devem ser diferentes." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("transactions").insert({
    household_id: membership.household_id,
    type: d.type,
    amount_cents: d.amountCents,
    date: d.date,
    description: d.description ?? null,
    category_id: d.categoryId ?? null,
    account_id: d.accountId ?? null,
    transfer_account_id: d.transferAccountId ?? null,
    paid_by: d.paidBy ?? null,
    created_by: user.id,
  });
  if (error) return { error: "Não foi possível salvar o lançamento." };

  revalidatePath("/transactions");
  revalidatePath("/dashboard");
  return { ok: true };
}

export async function deleteTransaction(id: string): Promise<void> {
  const supabase = await createClient();
  await supabase.from("transactions").delete().eq("id", id);
  revalidatePath("/transactions");
  revalidatePath("/dashboard");
}
