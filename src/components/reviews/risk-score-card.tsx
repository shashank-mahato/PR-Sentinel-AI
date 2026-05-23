import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getRiskLevel } from "@/lib/utils/scoring";

export function RiskScoreCard({ score, shouldBlockMerge }: { score: number; shouldBlockMerge: boolean }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Risk score</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-end gap-2">
          <span className="text-5xl font-bold text-white">{score}</span>
          <span className="pb-2 text-slate-400">/100</span>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <Badge variant={score >= 81 ? "critical" : score >= 61 ? "high" : score >= 31 ? "medium" : "low"}>
            {getRiskLevel(score)}
          </Badge>
          <Badge variant={shouldBlockMerge ? "failed" : "success"}>
            {shouldBlockMerge ? "Block merge" : "No block"}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}
