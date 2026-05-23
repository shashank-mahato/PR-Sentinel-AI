import { Card, CardContent } from "@/components/ui/card";
import { countSeverities } from "@/lib/utils/scoring";
import type { FindingRow } from "@/types/database";

export function SeveritySummary({ findings }: { findings: FindingRow[] }) {
  const counts = countSeverities(findings);
  return (
    <div className="grid gap-4 sm:grid-cols-4">
      {Object.entries(counts).map(([severity, count]) => (
        <Card key={severity}>
          <CardContent className="p-4">
            <p className="text-sm capitalize text-slate-400">{severity}</p>
            <p className="mt-2 text-2xl font-bold text-white">{count}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
