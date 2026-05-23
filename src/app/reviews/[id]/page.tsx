import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { notFound } from "next/navigation";
import { ProtectedShell } from "@/components/layout/protected-shell";
import { ReviewActions } from "@/components/reviews/review-actions";
import { ReviewFindingCard } from "@/components/reviews/review-finding-card";
import { RiskScoreCard } from "@/components/reviews/risk-score-card";
import { SeveritySummary } from "@/components/reviews/severity-summary";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { getAuthenticatedUser } from "@/lib/supabase/server";
import { loadReviewWithRelations } from "@/lib/reviews/data";
import { formatDateTime } from "@/lib/utils/formatting";
import type { ReviewWithRelations } from "@/types/review";

export const dynamic = "force-dynamic";

export default async function ReviewDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase, user } = await getAuthenticatedUser();
  if (!user) notFound();

  let typedReview: ReviewWithRelations;
  try {
    typedReview = await loadReviewWithRelations(supabase, id, user.id);
  } catch {
    notFound();
  }
  const findings = typedReview.review_findings || [];

  return (
    <ProtectedShell>
      <div className="mb-8 flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={typedReview.status} />
            {typedReview.large_diff_limited ? <Badge variant="warning">large diff limited</Badge> : null}
          </div>
          <h1 className="mt-3 text-3xl font-bold text-white">
            #{typedReview.pr_number} {typedReview.pr_title}
          </h1>
          <p className="mt-2 text-slate-400">{typedReview.repositories?.full_name || "Unknown repository"}</p>
        </div>
        <div className="flex flex-wrap gap-3">
          {typedReview.pr_url ? (
            <a href={typedReview.pr_url} rel="noreferrer" target="_blank">
              <Button variant="outline">
                <ExternalLink className="h-4 w-4" />
                Open GitHub PR
              </Button>
            </a>
          ) : null}
          <Link href="/reviews">
            <Button variant="ghost">All reviews</Button>
          </Link>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.7fr_1.3fr]">
        <div className="space-y-6">
          <RiskScoreCard score={typedReview.risk_score || 0} shouldBlockMerge={Boolean(typedReview.should_block_merge)} />
          <Card>
            <CardHeader>
              <CardTitle>PR metadata</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-slate-300">
              <Metadata label="Repository" value={typedReview.repositories?.full_name} />
              <Metadata label="PR number" value={`#${typedReview.pr_number}`} />
              <Metadata label="Author" value={typedReview.pr_author} />
              <Metadata label="Source branch" value={typedReview.head_branch} />
              <Metadata label="Target branch" value={typedReview.base_branch} />
              <Metadata label="Started at" value={formatDateTime(typedReview.started_at)} />
              <Metadata label="Completed at" value={formatDateTime(typedReview.completed_at)} />
              <Metadata label="Files analyzed" value={String(typedReview.files_analyzed || 0)} />
            </CardContent>
          </Card>
          <ReviewActions reviewId={typedReview.id} status={typedReview.status} />
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Overall review</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-slate-300">
              {typedReview.error_message ? (
                <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-red-100">{typedReview.error_message}</div>
              ) : null}
              <p>{typedReview.summary || "Review summary is not available yet."}</p>
              <p className="text-sm text-slate-400">
                Merge recommendation:{" "}
                <span className="text-slate-100">
                  {typedReview.should_block_merge ? "Review required before merging" : "No blocking issues detected"}
                </span>
              </p>
            </CardContent>
          </Card>
          <SeveritySummary findings={findings} />
          <div className="space-y-4">
            {findings.length > 0 ? (
              findings.map((finding) => <ReviewFindingCard key={finding.id} finding={finding} />)
            ) : (
              <Card>
                <CardContent className="p-8 text-center text-slate-400">No findings were stored for this review.</CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </ProtectedShell>
  );
}

function Metadata({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="flex justify-between gap-4 border-b border-slate-800 pb-2 last:border-0">
      <span className="text-slate-500">{label}</span>
      <span className="text-right text-slate-200">{value || "Not available"}</span>
    </div>
  );
}
