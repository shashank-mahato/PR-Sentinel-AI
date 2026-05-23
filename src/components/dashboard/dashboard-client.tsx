"use client";

import { useCallback, useEffect, useState } from "react";
import { Github, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type { ReviewWithRelations } from "@/types/review";
import { OverviewCards } from "./overview-cards";
import { RecentReviews } from "./recent-reviews";
import { ReviewsOverTime } from "./reviews-over-time";
import { RiskScoreTrend } from "./risk-score-trend";
import { SeverityChart } from "./severity-chart";

export function DashboardClient() {
  const [reviews, setReviews] = useState<ReviewWithRelations[]>([]);
  const [repositoryCount, setRepositoryCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setError(null);
    const [reviewsResponse, repositoriesResponse] = await Promise.all([
      fetch("/api/reviews", { cache: "no-store" }),
      fetch("/api/github/repositories", { cache: "no-store" })
    ]);

    if (!reviewsResponse.ok) throw new Error("Unable to load reviews.");
    if (!repositoriesResponse.ok) throw new Error("Unable to load repositories.");

    const reviewsJson = (await reviewsResponse.json()) as { reviews: ReviewWithRelations[] };
    const repositoriesJson = (await repositoriesResponse.json()) as { repositories: unknown[] };
    setReviews(reviewsJson.reviews);
    setRepositoryCount(repositoriesJson.repositories.length);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadData().catch((loadError: Error) => {
      setError(loadError.message);
      setLoading(false);
    });
  }, [loadData]);

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    const channel = supabase
      .channel("dashboard-live-reviews")
      .on("postgres_changes", { event: "*", schema: "public", table: "pull_request_reviews" }, () => {
        loadData().catch(() => null);
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "review_findings" }, () => {
        loadData().catch(() => null);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadData]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 7 }).map((_, index) => (
            <Skeleton key={index} className="h-28" />
          ))}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-5 text-red-100">
        <p>{error}</p>
        <Button className="mt-4" variant="outline" onClick={() => loadData().catch(() => null)}>
          <RefreshCw className="h-4 w-4" />
          Retry
        </Button>
      </div>
    );
  }

  if (reviews.length === 0) {
    return (
      <EmptyState
        icon={Github}
        title="No reviews yet"
        description="Connect GitHub and open a pull request to start. The dashboard will update in real time when webhook events arrive."
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
    );
  }

  return (
    <div className="space-y-6">
      <OverviewCards reviews={reviews} repositoryCount={repositoryCount} />
      <div className="grid gap-6 xl:grid-cols-3">
        <SeverityChart reviews={reviews} />
        <ReviewsOverTime reviews={reviews} />
        <RiskScoreTrend reviews={reviews} />
      </div>
      <RecentReviews reviews={reviews} />
    </div>
  );
}
