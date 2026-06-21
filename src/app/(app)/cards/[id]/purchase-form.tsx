"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { createCardPurchase, type CardState } from "@/lib/actions/cards";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CategorySelect } from "@/components/category-select";
import { formatCents } from "@/lib/money";
import { toCents } from "@/lib/money";
import type { Category } from "@/lib/types";

type Opt = { id: string; name: string };

const initial: CardState = {};
const today = () => new Date().toISOString().slice(0, 10);
const selectClass =
  "h-9 w-full rounded-lg border bg-background px-3 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50";

export function PurchaseForm({
  cardId,
  categories,
  members,
}: {
  cardId: string;
  categories: Category[];
  members: Opt[];
}) {
  const [state, action, pending] = useActionState(createCardPurchase, initial);
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [installments, setInstallments] = useState(1);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (!state.ok) return;
    toast.success("Compra lançada");
    formRef.current?.reset();
    /* eslint-disable react-hooks/set-state-in-effect */
    setAmount("");
    setInstallments(1);
    setOpen(false);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [state.ok]);

  if (!open) {
    return <Button onClick={() => setOpen(true)}>Nova compra</Button>;
  }

  const totalCents = toCents(amount || "0");
  const per = installments > 0 ? Math.floor(totalCents / installments) : 0;

  return (
    <form
      ref={formRef}
      action={action}
      className="space-y-4 rounded-xl border p-4"
    >
      <input type="hidden" name="cardId" value={cardId} />

      <div className="space-y-2">
        <Label htmlFor="amount">Valor total</Label>
        <Input
          id="amount"
          name="amount"
          inputMode="decimal"
          placeholder="0,00"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="installments">Parcelas</Label>
        <Input
          id="installments"
          name="installments"
          type="number"
          min={1}
          max={48}
          value={installments}
          onChange={(e) => setInstallments(Number(e.target.value) || 1)}
        />
        {installments > 1 && totalCents > 0 && (
          <p className="text-xs text-muted-foreground">
            {installments}x de {formatCents(per)}
          </p>
        )}
      </div>

      <CategorySelect categories={categories} />

      {members.length > 0 && (
        <div className="space-y-2">
          <Label htmlFor="paidBy">Quem comprou</Label>
          <select id="paidBy" name="paidBy" className={selectClass}>
            {members.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="date">Data da compra</Label>
        <Input id="date" name="date" type="date" defaultValue={today()} required />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Descrição (opcional)</Label>
        <Input id="description" name="description" placeholder="Ex: Tênis" />
      </div>

      {state.error && <p className="text-sm text-red-600">{state.error}</p>}

      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          className="flex-1"
          onClick={() => setOpen(false)}
        >
          Cancelar
        </Button>
        <Button type="submit" className="flex-1" disabled={pending}>
          {pending ? "Salvando..." : "Lançar compra"}
        </Button>
      </div>
    </form>
  );
}
