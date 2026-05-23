import Link from "next/link";
import { Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { ReviewWithRelations } from "@/types/review";
import { formatRelativeTime } from "@/lib/utils/formatting";

export function RecentReviews({ reviews }: { reviews: ReviewWithRelations[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent reviews</CardTitle>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Repository</TableHead>
              <TableHead>Pull Request</TableHead>
              <TableHead>Author</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Risk Score</TableHead>
              <TableHead>Findings</TableHead>
              <TableHead>Created At</TableHead>
              <TableHead>Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {reviews.slice(0, 8).map((review) => (
              <TableRow key={review.id}>
                <TableCell>{review.repositories?.full_name || "Unknown"}</TableCell>
                <TableCell>
                  <div className="max-w-xs truncate">
                    #{review.pr_number} {review.pr_title}
                  </div>
                </TableCell>
                <TableCell>{review.pr_author || "Unknown"}</TableCell>
                <TableCell>
                  <StatusBadge status={review.status} />
                </TableCell>
                <TableCell>{review.risk_score || 0}/100</TableCell>
                <TableCell>{review.review_findings?.length || 0}</TableCell>
                <TableCell>{formatRelativeTime(review.created_at)}</TableCell>
                <TableCell>
                  <Link href={`/reviews/${review.id}`}>
                    <Button variant="ghost" size="sm" aria-label="View review">
                      <Eye className="h-4 w-4" />
                    </Button>
                  </Link>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
