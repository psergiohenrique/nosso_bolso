"use client";

import { useActionState } from "react";
import { createHousehold, type ActionState } from "@/lib/actions/household";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initial: ActionState = {};

export function OnboardingForm() {
  const [state, action, pending] = useActionState(createHousehold, initial);

  return (
    <form action={action} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Nome do espaço</Label>
        <Input
          id="name"
          name="name"
          placeholder="Ex: Casa do Sergio & Ana"
          required
        />
      </div>
      {state.error && <p className="text-sm text-red-600">{state.error}</p>}
      <Button className="w-full" type="submit" disabled={pending}>
        {pending ? "Criando..." : "Criar e começar"}
      </Button>
    </form>
  );
}
