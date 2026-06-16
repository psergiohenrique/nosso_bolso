"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { createRecurring, type RecurringState } from "@/lib/actions/recurring";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Category } from "@/lib/types";

type Opt = { id: string; name: string };

const initial: RecurringState = {};
const today = () => new Date().toISOString().slice(0, 10);
const selectClass =
  "h-9 w-full rounded-lg border bg-background px-3 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50";

export function RecurringForm({
  expenseCategories,
  incomeCategories,
  accounts,
}: {
  expenseCategories: Category[];
  incomeCategories: Category[];
  accounts: Opt[];
}) {
  const [state, action, pending] = useActionState(createRecurring, initial);
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<"expense" | "income">("expense");
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (!state.ok) return;
    toast.success("Conta fixa criada");
    formRef.current?.reset();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setOpen(false);
  }, [state.ok]);

  if (!open) {
    return <Button onClick={() => setOpen(true)}>Nova conta fixa</Button>;
  }

  const categories = type === "income" ? incomeCategories : expenseCategories;

  return (
    <form ref={formRef} action={action} className="space-y-4 rounded-xl border p-4">
      <input type="hidden" name="type" value={type} />

      <div className="grid grid-cols-2 gap-1 rounded-lg bg-muted p-1">
        {(["expense", "income"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setType(t)}
            className={
              "rounded-md py-1.5 text-sm transition-colors " +
              (type === t ? "bg-background font-medium shadow-sm" : "text-muted-foreground")
            }
          >
            {t === "expense" ? "Despesa" : "Receita"}
          </button>
        ))}
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Descrição</Label>
        <Input id="description" name="description" placeholder="Ex: Aluguel" required />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="amount">Valor</Label>
          <Input id="amount" name="amount" inputMode="decimal" placeholder="0,00" required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="dayOfMonth">Dia do mês</Label>
          <Input id="dayOfMonth" name="dayOfMonth" type="number" min={1} max={31} required />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="categoryId">Categoria</Label>
        <select id="categoryId" name="categoryId" className={selectClass}>
          <option value="">Sem categoria</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.parent_id ? "— " : ""}
              {c.name}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="accountId">Conta (opcional)</Label>
        <select id="accountId" name="accountId" className={selectClass}>
          <option value="">Nenhuma</option>
          {accounts.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="startDate">Início</Label>
          <Input id="startDate" name="startDate" type="date" defaultValue={today()} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="endDate">Fim (opcional)</Label>
          <Input id="endDate" name="endDate" type="date" />
        </div>
      </div>

      {state.error && <p className="text-sm text-red-600">{state.error}</p>}

      <div className="flex gap-2">
        <Button type="button" variant="outline" className="flex-1" onClick={() => setOpen(false)}>
          Cancelar
        </Button>
        <Button type="submit" className="flex-1" disabled={pending}>
          {pending ? "Salvando..." : "Criar"}
        </Button>
      </div>
    </form>
  );
}
