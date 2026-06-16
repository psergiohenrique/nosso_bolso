import { getSessionContext, listMembers } from "@/lib/queries/household";
import { listAccounts } from "@/lib/queries/accounts";
import { listCategories } from "@/lib/queries/categories";
import { TransactionForm } from "./form";

export default async function NewTransactionPage() {
  const { membership } = await getSessionContext();
  if (!membership) return null;
  const hid = membership.household_id;

  const [accounts, categories, members] = await Promise.all([
    listAccounts(hid),
    listCategories(hid),
    listMembers(hid),
  ]);

  return (
    <div className="mx-auto max-w-md space-y-6">
      <h1 className="text-2xl font-semibold">Lançar</h1>
      <TransactionForm
        accounts={accounts.map((a) => ({ id: a.account_id, name: a.name }))}
        expenseCategories={categories.filter((c) => c.kind === "expense")}
        incomeCategories={categories.filter((c) => c.kind === "income")}
        members={members.map((m) => ({ id: m.user_id, name: m.display_name }))}
      />
    </div>
  );
}
