"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { addContribution, deleteGoal } from "@/lib/actions/goals";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function Contribute({ id }: { id: string }) {
  const [amount, setAmount] = useState("");
  const [pending, start] = useTransition();
  const [removing, startRemove] = useTransition();

  return (
    <div className="flex items-center gap-2">
      <Input
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        placeholder="Aportar (R$)"
        inputMode="decimal"
        className="h-8 flex-1"
      />
      <Button
        size="sm"
        disabled={pending || !amount}
        onClick={() =>
          start(async () => {
            await addContribution(id, amount);
            setAmount("");
            toast.success("Aporte registrado");
          })
        }
      >
        {pending ? "..." : "Aportar"}
      </Button>
      <Button
        size="sm"
        variant="outline"
        disabled={removing}
        onClick={() =>
          startRemove(async () => {
            await deleteGoal(id);
            toast.success("Meta removida");
          })
        }
      >
        Excluir
      </Button>
    </div>
  );
}
