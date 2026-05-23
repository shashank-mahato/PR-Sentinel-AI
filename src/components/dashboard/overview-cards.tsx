import { AlertTriangle, CheckCircle2, GitBranch, ShieldAlert, TrendingUp, XCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { ReviewWithRelations } from "@/types/review";
import { countSeverities } from "@/lib/utils/scoring";

export function OverviewCards({
  reviews,
  repositoryCount
}: {
  reviews: ReviewWithRelations[];
  repositoryCount: number;
}) {
  const findings = reviews.flatMap((review) => review.review_findings || []);
  const counts = countSeverities(findings);
  const averageRisk = reviews.length
    ? Math.round(reviews.reduce((sum, review) => sum + (review.risk_score || 0), 0) / reviews.length)
    : 0;
  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const reviewsThisWeek = reviews.filter((review) => review.created_at && new Date(review.created_at).getTime() >= weekAgo).length;
  const failed = reviews.filter((review) => review.status === "failed").length;

  const cards = [
    ["Total PRs reviewed", reviews.length, GitBranch, "text-teal-300"],
    ["Critical issues found", counts.critical, ShieldAlert, "text-red-300"],
    ["High severity issues", counts.high, AlertTriangle, "text-orange-300"],
    ["Average risk score", `${averageRisk}/100`, TrendingUp, "text-amber-300"],
    ["Connected repositories", repositoryCount, CheckCircle2, "text-emerald-300"],
    ["Reviews this week", reviewsThisWeek, GitBranch, "text-sky-300"],
    ["Failed reviews", failed, XCircle, "text-red-300"]
  ] as const;

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map(([label, value, Icon, color]) => (
        <Card key={label}>
          <CardContent className="flex items-center justify-between p-5">
            <div>
              <p className="text-sm text-slate-400">{label}</p>
              <p className="mt-2 text-2xl font-bold text-white">{value}</p>
            </div>
            <Icon className={`h-6 w-6 ${color}`} />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
