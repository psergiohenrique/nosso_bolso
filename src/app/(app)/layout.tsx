import { redirect } from "next/navigation";
import { getSessionContext } from "@/lib/queries/household";
import { BottomNav, Sidebar } from "@/components/nav";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, membership } = await getSessionContext();
  if (!user) redirect("/login");
  if (!membership) redirect("/onboarding");

  return (
    <div className="flex min-h-dvh">
      <Sidebar />
      <main className="flex-1 pb-24 md:pb-0">
        <div className="mx-auto w-full max-w-5xl p-4 md:p-8">{children}</div>
      </main>
      <BottomNav />
    </div>
  );
}
