import { CheckCircle2, MessageSquareWarning } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SeverityBadge } from "@/components/ui/status-badge";
import type { FindingRow } from "@/types/database";

export function ReviewFindingCard({ finding }: { finding: FindingRow }) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-center gap-2">
          <SeverityBadge severity={finding.severity} />
          <Badge>{finding.category}</Badge>
          {finding.comment_posted ? (
            <Badge variant="success">
              <CheckCircle2 className="mr-1 h-3 w-3" />
              posted
            </Badge>
          ) : (
            <Badge variant="warning">
              <MessageSquareWarning className="mr-1 h-3 w-3" />
              not posted
            </Badge>
          )}
        </div>
        <CardTitle className="pt-2 text-lg">{finding.title}</CardTitle>
        <p className="text-sm text-slate-400">
          {finding.file_path || "Unknown file"}
          {finding.line_number ? `:${finding.line_number}` : ""}
        </p>
      </CardHeader>
      <CardContent className="space-y-4 text-sm leading-6 text-slate-300">
        <div>
          <h4 className="font-semibold text-slate-100">Explanation</h4>
          <p>{finding.explanation}</p>
        </div>
        <div>
          <h4 className="font-semibold text-slate-100">Why it matters</h4>
          <p>{finding.why_it_matters}</p>
        </div>
        <div>
          <h4 className="font-semibold text-slate-100">Suggested fix</h4>
          <p>{finding.suggested_fix}</p>
        </div>
        {finding.suggested_code ? (
          <pre className="overflow-x-auto rounded-lg border border-slate-800 bg-slate-950 p-4 text-xs text-slate-200">
            <code>{finding.suggested_code}</code>
          </pre>
        ) : null}
      </CardContent>
    </Card>
  );
}
