import Link from "next/link";
import { getSessionContext } from "@/lib/queries/household";
import { listCards } from "@/lib/queries/cards";
import { Card } from "@/components/ui/card";
import { formatCents } from "@/lib/money";
import { cardGradient } from "@/lib/brand";
import { CardForm } from "./card-form";

export default async function CardsPage() {
  const { membership } = await getSessionContext();
  if (!membership) return null;
  const cards = await listCards(membership.household_id);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Cartões</h1>
        <CardForm />
      </div>

      {cards.length === 0 ? (
        <Card className="p-8 text-center text-sm text-muted-foreground">
          Nenhum cartão cadastrado.
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {cards.map((c) => {
            const pct =
              c.limit_cents && c.limit_cents > 0
                ? Math.min(100, Math.round((c.used_cents / c.limit_cents) * 100))
                : null;
            return (
              <Link key={c.id} href={`/cards/${c.id}`} className="group">
                <div
                  className="relative min-h-[148px] overflow-hidden rounded-2xl p-5 text-white shadow-md transition-transform group-hover:-translate-y-0.5"
                  style={{ background: cardGradient(c.brand) }}
                >
                  <div className="pointer-events-none absolute -right-12 -top-12 size-44 rounded-full bg-white/[0.09]" />
                  <div className="pointer-events-none absolute -bottom-14 -left-8 size-48 rounded-full bg-white/[0.06]" />
                  <div className="relative">
                    <div className="text-lg font-extrabold">{c.name}</div>
                    <div className="mt-0.5 text-[13px] text-white/70">
                      •••• •••• •••• {c.last4 ?? "••••"}
                    </div>
                    <div className="mt-5 flex items-end justify-between">
                      <div>
                        <div className="text-[11px] text-white/70">Usado</div>
                        <div className="text-lg font-extrabold tabular-nums">
                          {formatCents(c.used_cents)}
                        </div>
                      </div>
                      {c.limit_cents != null && (
                        <div className="text-right">
                          <div className="text-[11px] text-white/70">Disponível</div>
                          <div className="text-sm font-semibold tabular-nums">
                            {formatCents(c.limit_cents - c.used_cents)}
                          </div>
                        </div>
                      )}
                    </div>
                    {pct !== null && (
                      <div className="mt-3 h-1 overflow-hidden rounded-full bg-white/20">
                        <div
                          className="h-full rounded-full bg-white"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    )}
                    <div className="mt-2 flex justify-between text-[11px] text-white/80">
                      <span>Fecha dia {c.closing_day}</span>
                      <span>Vence dia {c.due_day}</span>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
