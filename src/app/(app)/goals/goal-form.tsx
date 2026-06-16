"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { createGoal, type GoalState } from "@/lib/actions/goals";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initial: GoalState = {};

export function GoalForm() {
  const [state, action, pending] = useActionState(createGoal, initial);
  const [open, setOpen] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (!state.ok) return;
    toast.success("Meta criada");
    formRef.current?.reset();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setOpen(false);
  }, [state.ok]);

  if (!open) {
    return <Button onClick={() => setOpen(true)}>Nova meta</Button>;
  }

  return (
    <form ref={formRef} action={action} className="space-y-3 rounded-xl border p-4">
      <div className="space-y-2">
        <Label htmlFor="name">Nome</Label>
        <Input id="name" name="name" placeholder="Ex: Viagem" required />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="target">Valor alvo</Label>
          <Input id="target" name="target" inputMode="decimal" placeholder="0,00" required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="targetDate">Prazo (opcional)</Label>
          <Input id="targetDate" name="targetDate" type="date" />
        </div>
      </div>
      {state.error && <p className="text-sm text-red-600">{state.error}</p>}
      <div className="flex gap-2">
        <Button type="button" variant="outline" className="flex-1" onClick={() => setOpen(false)}>
          Cancelar
        </Button>
        <Button type="submit" className="flex-1" disabled={pending}>
          {pending ? "Salvando..." : "Criar meta"}
        </Button>
      </div>
    </form>
  );
}
