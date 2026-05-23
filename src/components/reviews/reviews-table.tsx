import Link from "next/link";
import { Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { ReviewWithRelations } from "@/types/review";
import { countSeverities } from "@/lib/utils/scoring";
import { formatRelativeTime } from "@/lib/utils/formatting";

export function ReviewsTable({ reviews }: { reviews: ReviewWithRelations[] }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-slate-800 bg-slate-950/70">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Repository</TableHead>
            <TableHead>PR number</TableHead>
            <TableHead>PR title</TableHead>
            <TableHead>Author</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Risk score</TableHead>
            <TableHead>Critical</TableHead>
            <TableHead>High</TableHead>
            <TableHead>Medium</TableHead>
            <TableHead>Low</TableHead>
            <TableHead>Created at</TableHead>
            <TableHead>View</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {reviews.map((review) => {
            const counts = countSeverities(review.review_findings || []);
            return (
              <TableRow key={review.id}>
                <TableCell>{review.repositories?.full_name || "Unknown"}</TableCell>
                <TableCell>#{review.pr_number}</TableCell>
                <TableCell>
                  <div className="max-w-sm truncate">{review.pr_title}</div>
                </TableCell>
                <TableCell>{review.pr_author || "Unknown"}</TableCell>
                <TableCell>
                  <StatusBadge status={review.status} />
                </TableCell>
                <TableCell>{review.risk_score || 0}/100</TableCell>
                <TableCell>{counts.critical}</TableCell>
                <TableCell>{counts.high}</TableCell>
                <TableCell>{counts.medium}</TableCell>
                <TableCell>{counts.low}</TableCell>
                <TableCell>{formatRelativeTime(review.created_at)}</TableCell>
                <TableCell>
                  <Link href={`/reviews/${review.id}`}>
                    <Button variant="ghost" size="sm" aria-label="View review details">
                      <Eye className="h-4 w-4" />
                    </Button>
                  </Link>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
