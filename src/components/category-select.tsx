"use client";

import { useMemo, useState } from "react";
import { Label } from "@/components/ui/label";
import type { Category } from "@/lib/types";

const selectClass =
  "h-9 w-full rounded-lg border bg-background px-3 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50";

/**
 * Dois campos encadeados: Categoria (raiz) + Subcategoria.
 * Subcategoria só popula após escolher uma categoria com filhos.
 * Emite o id final em <input hidden name={name}>: subcategoria se escolhida,
 * senão a própria categoria raiz.
 */
export function CategorySelect({
  categories,
  name = "categoryId",
}: {
  categories: Category[];
  name?: string;
}) {
  const roots = useMemo(
    () => categories.filter((c) => !c.parent_id),
    [categories],
  );
  const childrenByParent = useMemo(() => {
    const map = new Map<string, Category[]>();
    for (const c of categories) {
      if (!c.parent_id) continue;
      const arr = map.get(c.parent_id) ?? [];
      arr.push(c);
      map.set(c.parent_id, arr);
    }
    return map;
  }, [categories]);

  const [parentId, setParentId] = useState("");
  const [childId, setChildId] = useState("");

  const children = parentId ? childrenByParent.get(parentId) ?? [] : [];
  const finalId = childId || parentId;

  return (
    <>
      <input type="hidden" name={name} value={finalId} />

      <div className="space-y-2">
        <Label htmlFor={`${name}-parent`}>Categoria</Label>
        <select
          id={`${name}-parent`}
          className={selectClass}
          value={parentId}
          onChange={(e) => {
            setParentId(e.target.value);
            setChildId("");
          }}
        >
          <option value="">Sem categoria</option>
          {roots.map((c) => (
            <option key={c.id} value={c.id}>
              {c.icon ? `${c.icon} ` : ""}
              {c.name}
            </option>
          ))}
        </select>
      </div>

      {children.length > 0 && (
        <div className="space-y-2">
          <Label htmlFor={`${name}-child`}>Subcategoria</Label>
          <select
            id={`${name}-child`}
            className={selectClass}
            value={childId}
            onChange={(e) => setChildId(e.target.value)}
          >
            <option value="">Toda a categoria</option>
            {children.map((c) => (
              <option key={c.id} value={c.id}>
                {c.icon ? `${c.icon} ` : ""}
                {c.name}
              </option>
            ))}
          </select>
        </div>
      )}
    </>
  );
}
