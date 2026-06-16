"use client";

import { useTransition } from "react";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { deleteTransaction } from "@/lib/actions/transactions";

export function DeleteButton({ id }: { id: string }) {
  const [pending, start] = useTransition();

  return (
    <button
      type="button"
      aria-label="Excluir"
      disabled={pending}
      onClick={() =>
        start(async () => {
          await deleteTransaction(id);
          toast.success("Lançamento excluído");
        })
      }
      className="text-muted-foreground transition-colors hover:text-red-600 disabled:opacity-40"
    >
      <Trash2 className="size-4" />
    </button>
  );
}
