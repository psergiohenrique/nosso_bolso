"use client";

import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";

type Opt = { id: string; name: string };

const selectClass =
  "h-9 rounded-lg border bg-background px-2 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50";

export function FilterBar({
  accounts,
  categories,
  initial,
}: {
  accounts: Opt[];
  categories: Opt[];
  initial: Record<string, string | undefined>;
}) {
  const router = useRouter();

  function apply(patch: Record<string, string>) {
    const params = new URLSearchParams();
    const merged = { ...initial, ...patch };
    for (const [k, v] of Object.entries(merged)) {
      if (v) params.set(k, v);
    }
    router.push(`/transactions?${params.toString()}`);
  }

  return (
    <div className="flex flex-wrap gap-2">
      <select
        className={selectClass}
        defaultValue={initial.type ?? ""}
        onChange={(e) => apply({ type: e.target.value })}
      >
        <option value="">Todos os tipos</option>
        <option value="expense">Despesas</option>
        <option value="income">Receitas</option>
        <option value="transfer">Transferências</option>
      </select>

      <select
        className={selectClass}
        defaultValue={initial.categoryId ?? ""}
        onChange={(e) => apply({ categoryId: e.target.value })}
      >
        <option value="">Todas categorias</option>
        {categories.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </select>

      <select
        className={selectClass}
        defaultValue={initial.accountId ?? ""}
        onChange={(e) => apply({ accountId: e.target.value })}
      >
        <option value="">Todas contas</option>
        {accounts.map((a) => (
          <option key={a.id} value={a.id}>
            {a.name}
          </option>
        ))}
      </select>

      <Input
        placeholder="Buscar..."
        defaultValue={initial.search ?? ""}
        className="h-9 w-36"
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            apply({ search: (e.target as HTMLInputElement).value });
          }
        }}
      />
    </div>
  );
}
