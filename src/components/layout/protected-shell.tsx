import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { AppHeader } from "./app-header";
import { AppSidebar } from "./app-sidebar";
import { getAuthenticatedUser } from "@/lib/supabase/server";

export async function ProtectedShell({ children }: { children: React.ReactNode }) {
  const { user } = await getAuthenticatedUser();
  if (!user) redirect("/login");

  const headerStore = await headers();
  const pathname = headerStore.get("x-pathname") || undefined;

  return (
    <div className="min-h-screen bg-slate-950/30">
      <div className="flex">
        <AppSidebar pathname={pathname} />
        <div className="min-w-0 flex-1">
          <AppHeader email={user.email} />
          <main className="mx-auto w-full max-w-7xl px-4 py-8 lg:px-8">{children}</main>
        </div>
      </div>
    </div>
  );
}
