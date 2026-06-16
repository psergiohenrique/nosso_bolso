"use client";

import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

export function BasisToggle({ basis }: { basis: "competencia" | "caixa" }) {
  const router = useRouter();
  const opts = [
    { key: "competencia", label: "Competência" },
    { key: "caixa", label: "Caixa" },
  ] as const;

  return (
    <div className="inline-grid grid-cols-2 gap-1 rounded-lg bg-muted p-1 text-sm">
      {opts.map((o) => (
        <button
          key={o.key}
          onClick={() => router.push(`/reports?basis=${o.key}`)}
          className={cn(
            "rounded-md px-3 py-1.5 transition-colors",
            basis === o.key
              ? "bg-background font-medium shadow-sm"
              : "text-muted-foreground",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
