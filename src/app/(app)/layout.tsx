import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { BottomNav } from "@/components/bottom-nav";
import { LogoWordmark } from "@/components/logo";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) {
    redirect("/sign-in");
  }

  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col">
      <header className="flex items-center justify-center border-b border-divider bg-surface px-5 py-3">
        <LogoWordmark height={20} />
      </header>
      <div className="flex-1 overflow-y-auto pb-4">{children}</div>
      <BottomNav />
    </div>
  );
}
