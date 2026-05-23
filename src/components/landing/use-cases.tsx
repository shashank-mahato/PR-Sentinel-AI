import { Code2, Rocket, Shield, Users, Wrench, Workflow } from "lucide-react";

const useCases = [
  ["Startups", Rocket],
  ["Engineering teams", Users],
  ["Open-source maintainers", Code2],
  ["QA teams", Shield],
  ["Hackathon teams", Workflow],
  ["DevOps teams", Wrench]
];

export function UseCases() {
  return (
    <section className="mx-auto max-w-7xl px-6 py-20">
      <div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr]">
        <div>
          <h2 className="text-3xl font-bold text-white md:text-4xl">Built for real delivery pressure</h2>
          <p className="mt-4 text-slate-300">
            PR Sentinel AI helps teams catch risky changes while preserving the reviewer’s attention for product
            judgment, architecture, and edge cases.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {useCases.map(([title, Icon]) => (
            <div key={title as string} className="flex items-center gap-3 rounded-lg border border-slate-800 bg-slate-950/70 p-4">
              <Icon className="h-5 w-5 text-amber-300" />
              <span className="font-medium text-slate-100">{title as string}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
