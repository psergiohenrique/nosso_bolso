"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { createCard, type CardState } from "@/lib/actions/cards";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initial: CardState = {};

export function CardForm() {
  const [state, action, pending] = useActionState(createCard, initial);
  const [open, setOpen] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (!state.ok) return;
    toast.success("Cartão criado");
    formRef.current?.reset();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setOpen(false);
  }, [state.ok]);

  if (!open) {
    return (
      <Button variant="outline" onClick={() => setOpen(true)}>
        Novo cartão
      </Button>
    );
  }

  return (
    <form
      ref={formRef}
      action={action}
      className="space-y-3 rounded-xl border p-4"
    >
      <div className="space-y-2">
        <Label htmlFor="name">Nome</Label>
        <Input id="name" name="name" placeholder="Ex: Nubank" required />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="brand">Bandeira</Label>
          <Input id="brand" name="brand" placeholder="Visa" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="last4">Final</Label>
          <Input id="last4" name="last4" placeholder="1234" maxLength={4} />
        </div>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div className="space-y-2">
          <Label htmlFor="limit">Limite (R$)</Label>
          <Input id="limit" name="limit" inputMode="decimal" placeholder="0,00" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="closingDay">Fecha dia</Label>
          <Input
            id="closingDay"
            name="closingDay"
            type="number"
            min={1}
            max={31}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="dueDay">Vence dia</Label>
          <Input
            id="dueDay"
            name="dueDay"
            type="number"
            min={1}
            max={31}
            required
          />
        </div>
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
          {pending ? "Salvando..." : "Criar cartão"}
        </Button>
      </div>
    </form>
  );
}
