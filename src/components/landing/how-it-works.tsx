import { Bot, Database, Github, MessageSquareText, RadioTower } from "lucide-react";

const steps = [
  ["GitHub webhook", "Pull request events arrive with verified HMAC signatures.", Github],
  ["Diff intelligence", "Relevant changed files are prioritized and safely limited.", RadioTower],
  ["Gemini review", "Structured findings are validated and risk-scored server-side.", Bot],
  ["Supabase realtime", "Reviews and findings are persisted for live dashboard updates.", Database],
  ["GitHub comments", "Summary and important inline comments are posted back to the PR.", MessageSquareText]
];

export function HowItWorks() {
  return (
    <section className="border-y border-slate-800 bg-slate-950/55">
      <div className="mx-auto max-w-7xl px-6 py-20">
        <h2 className="text-3xl font-bold text-white md:text-4xl">How it works</h2>
        <div className="mt-10 grid gap-5 lg:grid-cols-5">
          {steps.map(([title, description, Icon], index) => (
            <div key={title as string} className="rounded-lg border border-slate-800 bg-slate-950 p-5">
              <div className="mb-5 flex items-center justify-between">
                <Icon className="h-6 w-6 text-teal-300" />
                <span className="text-sm font-semibold text-slate-500">{String(index + 1).padStart(2, "0")}</span>
              </div>
              <h3 className="font-semibold text-slate-100">{title as string}</h3>
              <p className="mt-3 text-sm leading-6 text-slate-400">{description as string}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
