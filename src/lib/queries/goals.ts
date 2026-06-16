import { createClient } from "@/lib/supabase/server";

export type Goal = {
  id: string;
  name: string;
  target_cents: number;
  saved_cents: number;
  target_date: string | null;
};

export async function listGoals(householdId: string): Promise<Goal[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("goals")
    .select("id, name, target_cents, saved_cents, target_date")
    .eq("household_id", householdId)
    .order("created_at");
  return (data as Goal[]) ?? [];
}
