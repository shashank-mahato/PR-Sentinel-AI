"use client";

import { format } from "date-fns";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ReviewWithRelations } from "@/types/review";

export function ReviewsOverTime({ reviews }: { reviews: ReviewWithRelations[] }) {
  const buckets = new Map<string, number>();
  for (const review of reviews) {
    if (!review.created_at) continue;
    const key = format(new Date(review.created_at), "MMM d");
    buckets.set(key, (buckets.get(key) || 0) + 1);
  }
  const data = Array.from(buckets.entries()).map(([date, count]) => ({ date, count }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Reviews over time</CardTitle>
      </CardHeader>
      <CardContent className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid stroke="#1e293b" vertical={false} />
            <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} />
            <YAxis stroke="#94a3b8" fontSize={12} allowDecimals={false} />
            <Tooltip contentStyle={{ background: "#020617", border: "1px solid #1e293b", borderRadius: 8 }} />
            <Bar dataKey="count" fill="#2dd4bf" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
