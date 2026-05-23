"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { GitPullRequestArrow, RefreshCw, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import type { ReviewWithRelations } from "@/types/review";
import { ReviewsTable } from "./reviews-table";

export function ReviewsClient() {
  const [reviews, setReviews] = useState<ReviewWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState("all");
  const [severity, setSeverity] = useState("all");
  const [repository, setRepository] = useState("all");
  const [search, setSearch] = useState("");

  const loadReviews = useCallback(async () => {
    setError(null);
    const params = new URLSearchParams();
    if (status !== "all") params.set("status", status);
    if (severity !== "all") params.set("severity", severity);
    if (repository !== "all") params.set("repository", repository);
    if (search) params.set("search", search);
    const response = await fetch(`/api/reviews?${params.toString()}`, { cache: "no-store" });
    if (!response.ok) throw new Error("Unable to load reviews.");
    const json = (await response.json()) as { reviews: ReviewWithRelations[] };
    setReviews(json.reviews);
    setLoading(false);
  }, [repository, search, severity, status]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      loadReviews().catch((loadError: Error) => {
        setError(loadError.message);
        setLoading(false);
      });
    }, 150);
    return () => window.clearTimeout(timeout);
  }, [loadReviews]);

  const repositories = useMemo(() => {
    const map = new Map<string, string>();
    for (const review of reviews) {
      if (review.repositories?.id) map.set(review.repositories.id, review.repositories.full_name);
    }
    return Array.from(map.entries());
  }, [reviews]);

  if (loading) return <Skeleton className="h-96" />;

  if (error) {
    return (
      <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-5 text-red-100">
        <p>{error}</p>
        <Button className="mt-4" variant="outline" onClick={() => loadReviews().catch(() => null)}>
          <RefreshCw className="h-4 w-4" />
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="grid gap-3 rounded-lg border border-slate-800 bg-slate-950/70 p-4 lg:grid-cols-[1fr_auto_auto_auto]">
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
          <Input className="pl-9" placeholder="Search by PR title or repository" value={search} onChange={(event) => setSearch(event.target.value)} />
        </div>
        <Select value={status} onChange={(event) => setStatus(event.target.value)}>
          <option value="all">All statuses</option>
          <option value="pending">Pending</option>
          <option value="analyzing">Analyzing</option>
          <option value="completed">Completed</option>
          <option value="failed">Failed</option>
        </Select>
        <Select value={severity} onChange={(event) => setSeverity(event.target.value)}>
          <option value="all">All severities</option>
          <option value="critical">Critical+</option>
          <option value="high">High+</option>
          <option value="medium">Medium+</option>
          <option value="low">Low+</option>
        </Select>
        <Select value={repository} onChange={(event) => setRepository(event.target.value)}>
          <option value="all">All repositories</option>
          {repositories.map(([id, name]) => (
            <option key={id} value={id}>
              {name}
            </option>
          ))}
        </Select>
      </div>
      {reviews.length === 0 ? (
        <EmptyState
          icon={GitPullRequestArrow}
          title="No reviews match these filters"
          description="PR Sentinel AI only lists real reviews persisted from GitHub pull request webhook processing."
        />
      ) : (
        <ReviewsTable reviews={reviews} />
      )}
    </div>
  );
}
