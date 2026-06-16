import Link from "next/link";
import { getSessionContext, listMembers } from "@/lib/queries/household";
import { listAccounts } from "@/lib/queries/accounts";
import { listCategories } from "@/lib/queries/categories";
import { listTransactions, type TxFilters } from "@/lib/queries/transactions";
import { formatCents } from "@/lib/money";
import { formatDate } from "@/lib/dates";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FilterBar } from "./filter-bar";
import { DeleteButton } from "./delete-button";
import type { TransactionRow } from "@/lib/types";

export default async function TransactionsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const sp = await searchParams;
  const { membership } = await getSessionContext();
  if (!membership) return null;
  const hid = membership.household_id;

  const filters: TxFilters = {
    type: sp.type as TxFilters["type"],
    categoryId: sp.categoryId,
    accountId: sp.accountId,
    search: sp.search,
  };

  const [accounts, categories, txs, members] = await Promise.all([
    listAccounts(hid),
    listCategories(hid),
    listTransactions(hid, filters),
    listMembers(hid),
  ]);

  const memberMap = new Map(
    members.map((m) => [m.user_id, { name: m.display_name, color: m.color }]),
  );
  const groups = groupByDay(txs);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Transações</h1>
        <Link href="/transactions/new" className={buttonVariants({})}>
          Lançar
        </Link>
      </div>

      <FilterBar
        accounts={accounts.map((a) => ({ id: a.account_id, name: a.name }))}
        categories={categories.map((c) => ({ id: c.id, name: c.name }))}
        initial={sp}
      />

      {txs.length === 0 ? (
        <Card className="p-8 text-center text-sm text-muted-foreground">
          Nenhum lançamento. Toque em “Lançar” para começar.
        </Card>
      ) : (
        <div className="space-y-6">
          {groups.map(([day, rows]) => (
            <div key={day} className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground">
                {formatDate(day, "EEEE, dd 'de' MMMM")}
              </p>
              <Card className="divide-y p-0">
                {rows.map((t) => (
                  <Row
                    key={t.id}
                    t={t}
                    member={t.paid_by ? memberMap.get(t.paid_by) : undefined}
                  />
                ))}
              </Card>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Row({
  t,
  member,
}: {
  t: TransactionRow;
  member?: { name: string; color: string | null };
}) {
  const sign = t.type === "income" ? "+" : t.type === "expense" ? "−" : "";
  const tone =
    t.type === "income"
      ? "text-[var(--success)]"
      : t.type === "expense"
        ? "text-[var(--destructive)]"
        : "text-muted-foreground";
  const label =
    t.description ||
    t.category?.name ||
    (t.type === "transfer" ? "Transferência" : "Lançamento");
  const color = t.category?.color ?? "#94A3B8";

  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <span
        className="flex size-10 shrink-0 items-center justify-center rounded-xl text-xl"
        style={{ background: `${color}22` }}
      >
        {t.category?.icon ?? (t.type === "transfer" ? "🔄" : "📌")}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{label}</p>
        <div className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
          <span className="truncate">
            {t.category?.name ?? (t.type === "transfer" ? "Transferência" : "—")}
          </span>
          {member && (
            <>
              <span
                className="size-[7px] shrink-0 rounded-full"
                style={{ background: member.color ?? "#ccc" }}
              />
              <span className="truncate">{member.name}</span>
            </>
          )}
        </div>
      </div>
      <span className={`text-sm font-semibold tabular-nums ${tone}`}>
        {sign}
        {formatCents(t.amount_cents)}
      </span>
      <DeleteButton id={t.id} />
    </div>
  );
}

function groupByDay(txs: TransactionRow[]): [string, TransactionRow[]][] {
  const map = new Map<string, TransactionRow[]>();
  for (const t of txs) {
    const arr = map.get(t.date) ?? [];
    arr.push(t);
    map.set(t.date, arr);
  }
  return [...map.entries()];
}
