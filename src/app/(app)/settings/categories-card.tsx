"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
  createCategory,
  deleteCategory,
  type CategoryState,
} from "@/lib/actions/categories";
import { categoryKindLabels } from "@/lib/validators/category";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ConfirmDialog } from "@/components/confirm-dialog";

type Cat = {
  id: string;
  parent_id: string | null;
  name: string;
  kind: "expense" | "income";
  icon: string | null;
  color: string | null;
};

const initial: CategoryState = {};
const selectClass =
  "h-9 rounded-lg border bg-background px-2 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50";

export function CategoriesCard({ categories }: { categories: Cat[] }) {
  const [state, action, pending] = useActionState(createCategory, initial);
  const [kind, setKind] = useState<"expense" | "income">("expense");
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.ok) {
      toast.success("Categoria criada");
      formRef.current?.reset();
      setKind("expense");
    }
  }, [state.ok]);

  // Pais possíveis: categorias raiz do mesmo tipo.
  const parents = categories.filter((c) => !c.parent_id && c.kind === kind);

  // Ordena raiz seguida de suas subcategorias para exibição.
  const ordered = categories
    .filter((c) => !c.parent_id)
    .flatMap((root) => [
      root,
      ...categories.filter((c) => c.parent_id === root.id),
    ]);

  return (
    <div className="space-y-4">
      {ordered.length > 0 && (
        <ul className="space-y-1">
          {ordered.map((c) => (
            <li
              key={c.id}
              className="flex items-center justify-between gap-2 text-sm"
            >
              <span className="flex items-center gap-2">
                {c.parent_id && (
                  <span className="text-muted-foreground">—</span>
                )}
                {c.icon && <span>{c.icon}</span>}
                <span>{c.name}</span>
                <span className="text-xs text-muted-foreground">
                  {categoryKindLabels[c.kind]}
                </span>
              </span>
              <ConfirmDialog
                title="Excluir categoria?"
                description={
                  c.parent_id
                    ? `A subcategoria "${c.name}" será excluída.`
                    : `A categoria "${c.name}" e suas subcategorias serão excluídas. Lançamentos ligados ficam sem categoria.`
                }
                confirmLabel="Excluir"
                onConfirm={async () => {
                  await deleteCategory(c.id);
                  toast.success("Categoria excluída");
                }}
                trigger={
                  <button
                    type="button"
                    className="text-xs text-muted-foreground hover:text-red-600 disabled:opacity-40"
                  >
                    excluir
                  </button>
                }
              />
            </li>
          ))}
        </ul>
      )}

      <form ref={formRef} action={action} className="space-y-2">
        <div className="flex gap-2">
          <Input name="name" placeholder="Nome da categoria" className="flex-1" required />
          <select
            name="kind"
            className={selectClass}
            value={kind}
            onChange={(e) => setKind(e.target.value as "expense" | "income")}
          >
            {Object.entries(categoryKindLabels).map(([v, label]) => (
              <option key={v} value={v}>
                {label}
              </option>
            ))}
          </select>
        </div>
        <div className="flex gap-2">
          <select name="parentId" className={`${selectClass} flex-1`} defaultValue="">
            <option value="">Categoria raiz (sem pai)</option>
            {parents.map((p) => (
              <option key={p.id} value={p.id}>
                Subcategoria de {p.name}
              </option>
            ))}
          </select>
          <Input name="icon" placeholder="📦" className="w-16" maxLength={8} />
          <Input name="color" placeholder="#4F46E5" className="w-28" />
        </div>
        <div className="flex justify-end">
          <Button type="submit" disabled={pending}>
            {pending ? "..." : "Adicionar"}
          </Button>
        </div>
        {state.error && <p className="text-sm text-red-600">{state.error}</p>}
      </form>
    </div>
  );
}
