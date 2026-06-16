import { createClient } from "@/lib/supabase/server";
import type { Category } from "@/lib/types";

export async function listCategories(
  householdId: string,
  kind?: "expense" | "income",
): Promise<Category[]> {
  const supabase = await createClient();
  let q = supabase
    .from("categories")
    .select("id, parent_id, name, kind, icon, color")
    .eq("household_id", householdId)
    .order("name");
  if (kind) q = q.eq("kind", kind);

  const { data } = await q;
  return (data as Category[]) ?? [];
}
