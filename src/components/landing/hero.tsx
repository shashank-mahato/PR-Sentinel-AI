import Link from "next/link";
import { ArrowRight, GitPullRequestArrow, ShieldCheck } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";

export function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="mx-auto grid min-h-[88vh] max-w-7xl items-center gap-12 px-6 py-24 lg:grid-cols-[1fr_0.9fr]">
        <div>
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-teal-400/25 bg-teal-400/10 px-3 py-1 text-sm font-medium text-teal-100">
            <ShieldCheck className="h-4 w-4" />
            Gemini-powered pull request intelligence
          </div>
          <h1 className="text-balance text-5xl font-bold tracking-normal text-white md:text-7xl">
            AI Code Reviews Before Bugs Reach Production
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">
            PR Sentinel AI reviews GitHub pull requests in real time, detects bugs, security risks,
            performance issues, and posts actionable comments automatically.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link className={cn(buttonVariants({ size: "lg" }))} href="/login">
              Get Started <ArrowRight className="h-4 w-4" />
            </Link>
            <Link className={cn(buttonVariants({ variant: "outline", size: "lg" }))} href="/dashboard">
              View Dashboard
            </Link>
          </div>
        </div>
        <div className="rounded-lg border border-slate-800 bg-slate-950/70 p-4 shadow-2xl shadow-teal-950/30">
          <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-5">
            <div className="mb-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-teal-400 p-2 text-slate-950">
                  <GitPullRequestArrow className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-semibold text-white">Pull request #128</p>
                  <p className="text-sm text-slate-400">auth: tighten session checks</p>
                </div>
              </div>
              <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-semibold text-emerald-200">
                completed
              </span>
            </div>
            <div className="space-y-3">
              {[
                ["Critical", "Authorization bypass in admin route", "bg-red-500/15 text-red-200"],
                ["High", "Missing validation on webhook payload", "bg-orange-500/15 text-orange-200"],
                ["Medium", "Retry path lacks rate-limit handling", "bg-yellow-500/15 text-yellow-100"]
              ].map(([severity, title, colorClass]) => (
                <div key={title} className="rounded-lg border border-slate-800 bg-slate-950 p-4">
                  <div className="flex items-center justify-between gap-4">
                    <p className="font-medium text-slate-100">{title}</p>
                    <span className={`rounded-full px-2 py-1 text-xs ${colorClass}`}>
                      {severity}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-slate-400">
                    Posted to GitHub with line-level guidance and a safer implementation path.
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
