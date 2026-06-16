import { redirect } from "next/navigation";
import { getSessionContext } from "@/lib/queries/household";
import { OnboardingForm } from "./form";

export default async function OnboardingPage() {
  const { user, membership } = await getSessionContext();
  if (!user) redirect("/login");
  if (membership) redirect("/dashboard");

  return (
    <div className="flex min-h-dvh items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="space-y-1 text-center">
          <h1 className="text-2xl font-semibold">Criar espaço do casal</h1>
          <p className="text-sm text-muted-foreground">
            Esse é o espaço compartilhado onde vocês dois vão organizar tudo.
          </p>
        </div>
        <OnboardingForm />
      </div>
    </div>
  );
}
