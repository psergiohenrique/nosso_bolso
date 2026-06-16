import Link from "next/link";
import { notFound } from "next/navigation";
import { getSessionContext } from "@/lib/queries/household";
import { getInvoice } from "@/lib/queries/cards";
import { listTransactions } from "@/lib/queries/transactions";
import { listAccounts } from "@/lib/queries/accounts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCents } from "@/lib/money";
import { formatDate } from "@/lib/dates";
import { PayInvoice } from "./pay-invoice";

export default async function InvoiceDetailPage({
  params,
}: {
  params: Promise<{ id: string; invoiceId: string }>;
}) {
  const { id, invoiceId } = await params;
  const { membership } = await getSessionContext();
  if (!membership) return null;

  const invoice = await getInvoice(invoiceId);
  if (!invoice) notFound();

  const [txs, accounts] = await Promise.all([
    listTransactions(membership.household_id, { invoiceId, limit: 500 }),
    listAccounts(membership.household_id),
  ]);

  return (
    <div className="space-y-5">
      <div>
        <Link
          href={`/cards/${id}`}
          className="text-sm text-muted-foreground hover:underline"
        >
          ← Cartão
        </Link>
        <h1 className="mt-1 text-2xl font-semibold">Fatura</h1>
        <p className="text-sm text-muted-foreground">
          {formatDate(invoice.period_start, "dd/MM")} –{" "}
          {formatDate(invoice.period_end, "dd/MM/yyyy")} · vence{" "}
          {formatDate(invoice.due_date, "dd/MM/yyyy")}
        </p>
      </div>

      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle className="text-sm font-normal text-muted-foreground">
            Total
          </CardTitle>
          <Badge variant={invoice.status === "paid" ? "secondary" : "default"}>
            {invoice.status === "paid" ? "Paga" : "Em aberto"}
          </Badge>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-3xl font-semibold tabular-nums">
            {formatCents(invoice.total_cents)}
          </p>
          {invoice.status !== "paid" && (
            <PayInvoice
              invoiceId={invoice.id}
              accounts={accounts.map((a) => ({
                id: a.account_id,
                name: a.name,
              }))}
            />
          )}
        </CardContent>
      </Card>

      <div className="space-y-2">
        <h2 className="text-sm font-medium text-muted-foreground">
          Lançamentos
        </h2>
        <Card className="divide-y p-0">
          {txs.map((t) => (
            <div
              key={t.id}
              className="flex items-center justify-between gap-3 px-4 py-3"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">
                  {t.description || t.category?.name || "Compra"}
                  {t.installment_total && t.installment_total > 1 && (
                    <span className="ml-1 text-xs text-muted-foreground">
                      ({t.installment_no}/{t.installment_total})
                    </span>
                  )}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatDate(t.date, "dd/MM")} · {t.category?.name ?? "—"}
                </p>
              </div>
              <span className="text-sm font-semibold tabular-nums">
                {formatCents(t.amount_cents)}
              </span>
            </div>
          ))}
        </Card>
      </div>
    </div>
  );
}
