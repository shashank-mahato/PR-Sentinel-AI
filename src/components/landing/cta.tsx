import Link from "next/link";
import { ArrowRight, ShieldCheck } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";

export function FinalCta() {
  return (
    <section className="mx-auto max-w-7xl px-6 py-20">
      <div className="rounded-lg border border-teal-400/25 bg-slate-950/80 p-8 md:p-12">
        <ShieldCheck className="mb-5 h-8 w-8 text-teal-300" />
        <h2 className="max-w-3xl text-3xl font-bold text-white md:text-5xl">
          Ship pull requests with sharper review coverage.
        </h2>
        <p className="mt-4 max-w-2xl text-slate-300">
          Connect the GitHub App, configure Supabase and Gemini, then let PR Sentinel AI review live pull requests
          before risky code reaches production.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link className={cn(buttonVariants({ size: "lg" }))} href="/login">
            Get Started <ArrowRight className="h-4 w-4" />
          </Link>
          <Link className={cn(buttonVariants({ variant: "outline", size: "lg" }))} href="/repositories">
            Install GitHub App
          </Link>
        </div>
      </div>
    </section>
  );
}
