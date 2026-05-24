"use client";

import { useEffect, useState } from "react";
import { Github, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { InstallGitHubAppCard } from "./install-github-app-card";
import { RepositoriesTable, type RepositoryWithCount } from "./repositories-table";

export function RepositoriesClient() {
  const [repositories, setRepositories] = useState<RepositoryWithCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [installed, setInstalled] = useState(false);

  async function loadRepositories() {
    setError(null);
    const response = await fetch("/api/github/repositories", { cache: "no-store" });
    if (!response.ok) throw new Error("Unable to load connected repositories.");
    const json = (await response.json()) as { repositories: RepositoryWithCount[] };
    setRepositories(json.repositories);
    setLoading(false);
  }

  useEffect(() => {
    setInstalled(new URLSearchParams(window.location.search).get("installed") === "true");
    loadRepositories().catch((loadError: Error) => {
      setError(loadError.message);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return <Skeleton className="h-96" />;
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-5 text-red-100">
        <p>{error}</p>
        <Button className="mt-4" variant="outline" onClick={() => loadRepositories().catch(() => null)}>
          <RefreshCw className="h-4 w-4" />
          Retry
        </Button>
      </div>
    );
  }

  if (repositories.length === 0) {
    return (
      <div className="space-y-4">
        {installed ? <InstallSuccessMessage /> : null}
        <EmptyState
          icon={Github}
          title="No repositories connected"
          description="Install GitHub App to connect repositories. PR Sentinel AI will only display real repositories returned by the GitHub installation."
          action={
            <a
              className="inline-flex h-10 items-center justify-center rounded-lg bg-teal-400 px-4 text-sm font-semibold text-slate-950 hover:bg-teal-300"
              href={process.env.NEXT_PUBLIC_GITHUB_APP_INSTALL_URL || "/settings"}
              rel="noreferrer"
            >
              Install GitHub App
            </a>
          }
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {installed ? <InstallSuccessMessage /> : null}
      <InstallGitHubAppCard />
      <RepositoriesTable repositories={repositories} />
    </div>
  );
}

function InstallSuccessMessage() {
  return (
    <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-100">
      GitHub App installed successfully. Your repositories are now connected.
    </div>
  );
}
