import {
  Activity,
  Bot,
  Bug,
  Gauge,
  GitPullRequestArrow,
  History,
  Lock,
  MessageSquareCode,
  SearchCheck,
  ShieldAlert,
  TestTube,
  Zap
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const features = [
  ["Real-time PR reviews", Activity],
  ["Gemini-powered code analysis", Bot],
  ["Security vulnerability detection", ShieldAlert],
  ["Performance bottleneck detection", Zap],
  ["Bug detection", Bug],
  ["Code smell detection", SearchCheck],
  ["Missing test detection", TestTube],
  ["Automated GitHub comments", MessageSquareCode],
  ["Review history dashboard", History],
  ["Risk scoring", Gauge],
  ["Merge recommendation", GitPullRequestArrow],
  ["Large diff handling", Lock]
];

export function Features() {
  return (
    <section className="mx-auto max-w-7xl px-6 py-20">
      <div className="max-w-3xl">
        <h2 className="text-3xl font-bold text-white md:text-4xl">Production review automation for busy teams</h2>
        <p className="mt-4 text-slate-300">
          Every card maps to a live capability in the deployed app: webhooks, Gemini analysis, Supabase storage,
          realtime dashboards, and GitHub comments.
        </p>
      </div>
      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {features.map(([title, Icon]) => (
          <Card key={title as string} className="bg-slate-950/65">
            <CardContent className="p-5">
              <Icon className="mb-4 h-6 w-6 text-teal-300" />
              <h3 className="font-semibold text-slate-100">{title as string}</h3>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
