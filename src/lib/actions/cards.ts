"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getSessionContext } from "@/lib/queries/household";
import { getCard } from "@/lib/queries/cards";
import { cardSchema, cardPurchaseSchema } from "@/lib/validators/card";
import { toCents, splitInstallments } from "@/lib/money";
import { computeInvoicePeriod, addMonthsISO } from "@/lib/dates";
import type { SupabaseClient } from "@supabase/supabase-js";

export type CardState = { error?: string; ok?: boolean };

export async function createCard(
  _prev: CardState,
  formData: FormData,
): Promise<CardState> {
  const { membership } = await getSessionContext();
  if (!membership) return { error: "Sessão inválida." };

  const limitRaw = String(formData.get("limit") ?? "").trim();
  const parsed = cardSchema.safeParse({
    name: formData.get("name"),
    brand: (formData.get("brand") as string) || undefined,
    last4: (formData.get("last4") as string) || "",
    limitCents: limitRaw ? toCents(limitRaw) : undefined,
    closingDay: Number(formData.get("closingDay")),
    dueDay: Number(formData.get("dueDay")),
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const supabase = await createClient();
  const { error } = await supabase.from("cards").insert({
    household_id: membership.household_id,
    name: parsed.data.name,
    brand: parsed.data.brand ?? null,
    last4: parsed.data.last4 || null,
    limit_cents: parsed.data.limitCents ?? null,
    closing_day: parsed.data.closingDay,
    due_day: parsed.data.dueDay,
  });
  if (error) return { error: "Não foi possível criar o cartão." };

  revalidatePath("/cards");
  return { ok: true };
}

export async function archiveCard(id: string): Promise<void> {
  const supabase = await createClient();
  await supabase.from("cards").update({ archived: true }).eq("id", id);
  revalidatePath("/cards");
}

/** Acha ou cria a fatura que recebe uma compra na data dada. */
async function getOrCreateInvoice(
  supabase: SupabaseClient,
  householdId: string,
  card: { id: string; closing_day: number; due_day: number },
  refDateISO: string,
): Promise<string | null> {
  const period = computeInvoicePeriod(
    card.closing_day,
    card.due_day,
    new Date(refDateISO),
  );

  const { data: existing } = await supabase
    .from("invoices")
    .select("id")
    .eq("card_id", card.id)
    .eq("period_start", period.period_start)
    .maybeSingle();
  if (existing) return existing.id as string;

  const { data: created, error } = await supabase
    .from("invoices")
    .insert({
      household_id: householdId,
      card_id: card.id,
      period_start: period.period_start,
      period_end: period.period_end,
      due_date: period.due_date,
    })
    .select("id")
    .single();

  if (error) {
    // corrida: refaz a busca
    const { data: again } = await supabase
      .from("invoices")
      .select("id")
      .eq("card_id", card.id)
      .eq("period_start", period.period_start)
      .maybeSingle();
    return (again?.id as string) ?? null;
  }
  return created.id as string;
}

/** Compra no cartão, com parcelamento. Gera N transações ligadas por purchase_id. */
export async function createCardPurchase(
  _prev: CardState,
  formData: FormData,
): Promise<CardState> {
  const { user, membership } = await getSessionContext();
  if (!user || !membership) return { error: "Sessão inválida." };

  const parsed = cardPurchaseSchema.safeParse({
    cardId: formData.get("cardId"),
    amountCents: toCents(String(formData.get("amount") ?? "0")),
    date: formData.get("date"),
    categoryId: (formData.get("categoryId") as string) || undefined,
    description: (formData.get("description") as string) || undefined,
    paidBy: (formData.get("paidBy") as string) || user.id,
    installments: Number(formData.get("installments") ?? 1),
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const card = await getCard(parsed.data.cardId);
  if (!card) return { error: "Cartão não encontrado." };

  const supabase = await createClient();
  const n = parsed.data.installments;
  const parts = splitInstallments(parsed.data.amountCents, n);
  const purchaseId = crypto.randomUUID();

  const rows = [];
  for (let i = 0; i < n; i++) {
    const refDate = addMonthsISO(parsed.data.date, i);
    const invoiceId = await getOrCreateInvoice(
      supabase,
      membership.household_id,
      card,
      refDate,
    );
    rows.push({
      household_id: membership.household_id,
      type: "expense",
      amount_cents: parts[i],
      date: refDate,
      description: parsed.data.description ?? null,
      category_id: parsed.data.categoryId ?? null,
      card_id: card.id,
      invoice_id: invoiceId,
      paid_by: parsed.data.paidBy ?? null,
      created_by: user.id,
      purchase_id: purchaseId,
      installment_no: i + 1,
      installment_total: n,
    });
  }

  const { error } = await supabase.from("transactions").insert(rows);
  if (error) return { error: "Não foi possível salvar a compra." };

  revalidatePath(`/cards/${card.id}`);
  revalidatePath("/dashboard");
  return { ok: true };
}

/** Paga a fatura: marca como paga e cria saída na conta (não dupla contagem). */
export async function payInvoice(
  invoiceId: string,
  accountId: string,
): Promise<void> {
  const { user, membership } = await getSessionContext();
  if (!user || !membership) return;

  const supabase = await createClient();
  const { data: invoice } = await supabase
    .from("invoices")
    .select("id, card_id, total_cents, status")
    .eq("id", invoiceId)
    .maybeSingle();
  if (!invoice || invoice.status === "paid") return;

  await supabase.from("transactions").insert({
    household_id: membership.household_id,
    type: "expense",
    amount_cents: invoice.total_cents,
    date: new Date().toISOString().slice(0, 10),
    description: "Pagamento de fatura",
    account_id: accountId,
    paid_by: user.id,
    created_by: user.id,
    is_invoice_payment: true,
  });

  await supabase
    .from("invoices")
    .update({
      status: "paid",
      paid_at: new Date().toISOString(),
      paid_from_account_id: accountId,
    })
    .eq("id", invoiceId);

  revalidatePath(`/cards/${invoice.card_id}`);
  revalidatePath("/dashboard");
}
