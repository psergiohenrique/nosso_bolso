"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { generateThisMonth } from "@/lib/actions/recurring";
import { Button } from "@/components/ui/button";

export function GenerateButton() {
  const [pending, start] = useTransition();

  return (
    <Button
      variant="outline"
      disabled={pending}
      onClick={() =>
        start(async () => {
          const { created } = await generateThisMonth();
          toast.success(
            created > 0
              ? `${created} lançamento(s) gerado(s)`
              : "Tudo já lançado neste mês",
          );
        })
      }
    >
      {pending ? "Gerando..." : "Gerar lançamentos do mês"}
    </Button>
  );
}
