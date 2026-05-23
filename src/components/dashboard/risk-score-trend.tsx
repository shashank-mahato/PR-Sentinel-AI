"use client";

import { format } from "date-fns";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ReviewWithRelations } from "@/types/review";

export function RiskScoreTrend({ reviews }: { reviews: ReviewWithRelations[] }) {
  const data = reviews
    .filter((review) => review.created_at)
    .slice()
    .reverse()
    .map((review) => ({
      date: format(new Date(review.created_at as string), "MMM d"),
      risk: review.risk_score || 0
    }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Risk score trend</CardTitle>
      </CardHeader>
      <CardContent className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid stroke="#1e293b" vertical={false} />
            <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} />
            <YAxis stroke="#94a3b8" fontSize={12} domain={[0, 100]} />
            <Tooltip contentStyle={{ background: "#020617", border: "1px solid #1e293b", borderRadius: 8 }} />
            <Line type="monotone" dataKey="risk" stroke="#f59e0b" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
