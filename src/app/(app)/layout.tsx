import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { BottomNav } from "@/components/bottom-nav";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) {
    redirect("/sign-in");
  }

  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col">
      <div className="flex-1 overflow-y-auto pb-4">{children}</div>
      <BottomNav />
    </div>
  );
}
