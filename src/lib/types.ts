// Tipos de domínio. Espelham o schema (SPEC §5). Substituir por tipos
// gerados (`supabase gen types`) quando o projeto remoto existir.

export type TxType = "expense" | "income" | "transfer";
export type SplitMode = "none" | "equal" | "custom";

export type Category = {
  id: string;
  parent_id: string | null;
  name: string;
  kind: "expense" | "income";
  icon: string | null;
  color: string | null;
};

export type AccountBalance = {
  account_id: string;
  name: string;
  type: string;
  archived: boolean;
  balance_cents: number;
};

export type Member = {
  user_id: string;
  display_name: string;
  color: string | null;
  role: "owner" | "member";
};

export type TransactionRow = {
  id: string;
  type: TxType;
  amount_cents: number;
  date: string;
  description: string | null;
  category_id: string | null;
  account_id: string | null;
  card_id: string | null;
  transfer_account_id: string | null;
  paid_by: string | null;
  installment_no: number | null;
  installment_total: number | null;
  category: { name: string; color: string | null; icon: string | null } | null;
};

export type MonthSummary = {
  income_cents: number;
  expense_cents: number;
};

export type Card = {
  id: string;
  name: string;
  brand: string | null;
  last4: string | null;
  limit_cents: number | null;
  closing_day: number;
  due_day: number;
  default_account_id: string | null;
  archived: boolean;
};

export type InvoiceStatus = "open" | "closed" | "paid";

export type Invoice = {
  id: string;
  card_id: string;
  period_start: string;
  period_end: string;
  due_date: string;
  total_cents: number;
  status: InvoiceStatus;
  paid_at: string | null;
};
