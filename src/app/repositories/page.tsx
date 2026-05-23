import { ProtectedShell } from "@/components/layout/protected-shell";
import { RepositoriesClient } from "@/components/repositories/repositories-client";

export const dynamic = "force-dynamic";

export default function RepositoriesPage() {
  return (
    <ProtectedShell>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">Repositories</h1>
        <p className="mt-2 text-slate-400">Connected GitHub repositories from your real GitHub App installation.</p>
      </div>
      <RepositoriesClient />
    </ProtectedShell>
  );
}
