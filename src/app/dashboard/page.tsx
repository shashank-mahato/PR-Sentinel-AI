import { ProtectedShell } from "@/components/layout/protected-shell";
import { DashboardClient } from "@/components/dashboard/dashboard-client";

export const dynamic = "force-dynamic";

export default function DashboardPage() {
  return (
    <ProtectedShell>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">Dashboard</h1>
        <p className="mt-2 text-slate-400">Live pull request review activity from Supabase.</p>
      </div>
      <DashboardClient />
    </ProtectedShell>
  );
}
