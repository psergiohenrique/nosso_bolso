import Link from "next/link";
import { notFound } from "next/navigation";
import { getSessionContext, listMembers } from "@/lib/queries/household";
import { getCard, listInvoices } from "@/lib/queries/cards";
import { listCategories } from "@/lib/queries/categories";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCents } from "@/lib/money";
import { formatDate } from "@/lib/dates";
import { PurchaseForm } from "./purchase-form";
import type { InvoiceStatus } from "@/lib/types";

const statusLabel: Record<InvoiceStatus, string> = {
  open: "Aberta",
  closed: "Fechada",
  paid: "Paga",
};

export default async function CardDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { membership } = await getSessionContext();
  if (!membership) return null;

  const card = await getCard(id);
  if (!card) notFound();

  const [invoices, categories, members] = await Promise.all([
    listInvoices(id),
    listCategories(membership.household_id, "expense"),
    listMembers(membership.household_id),
  ]);

  return (
    <div className="space-y-5">
      <div>
        <Link
          href="/cards"
          className="text-sm text-muted-foreground hover:underline"
        >
          ← Cartões
        </Link>
        <h1 className="mt-1 text-2xl font-semibold">{card.name}</h1>
        <p className="text-sm text-muted-foreground">
          Fecha dia {card.closing_day} · vence dia {card.due_day}
          {card.limit_cents ? ` · limite ${formatCents(card.limit_cents)}` : ""}
        </p>
      </div>

      <PurchaseForm
        cardId={card.id}
        categories={categories}
        members={members.map((m) => ({ id: m.user_id, name: m.display_name }))}
      />

      <div className="space-y-2">
        <h2 className="text-sm font-medium text-muted-foreground">Faturas</h2>
        {invoices.length === 0 ? (
          <Card className="p-6 text-center text-sm text-muted-foreground">
            Nenhuma fatura ainda. Lance uma compra.
          </Card>
        ) : (
          <div className="space-y-2">
            {invoices.map((inv) => (
              <Link
                key={inv.id}
                href={`/cards/${card.id}/invoice/${inv.id}`}
              >
                <Card className="transition-colors hover:border-primary">
                  <CardContent className="flex items-center justify-between py-4">
                    <div>
                      <p className="text-sm font-medium">
                        Venc. {formatDate(inv.due_date, "dd/MM/yyyy")}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(inv.period_start, "dd/MM")} –{" "}
                        {formatDate(inv.period_end, "dd/MM")}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-semibold tabular-nums">
                        {formatCents(inv.total_cents)}
                      </span>
                      <Badge
                        variant={inv.status === "paid" ? "secondary" : "default"}
                      >
                        {statusLabel[inv.status]}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
