import { CheckCircle2, LockKeyhole, RadioTower } from "lucide-react";
import { Hero } from "@/components/landing/hero";
import { Features } from "@/components/landing/features";
import { HowItWorks } from "@/components/landing/how-it-works";
import { UseCases } from "@/components/landing/use-cases";
import { FinalCta } from "@/components/landing/cta";

export default function LandingPage() {
  return (
    <main>
      <Hero />
      <Features />
      <HowItWorks />
      <section className="mx-auto grid max-w-7xl gap-5 px-6 py-20 lg:grid-cols-3">
        {[
          ["Why engineering teams need it", "Manual reviews miss race conditions, data leaks, and edge cases when teams are moving quickly.", CheckCircle2],
          ["Security and reliability", "Webhook signatures, server-only secrets, RLS, retry paths, and safe comment fallbacks are built in.", LockKeyhole],
          ["Live workflow", "Open or update a real pull request and watch Supabase realtime move the dashboard from analyzing to complete.", RadioTower]
        ].map(([title, description, Icon]) => (
          <div key={title as string} className="rounded-lg border border-slate-800 bg-slate-950/70 p-6">
            <Icon className="mb-5 h-6 w-6 text-teal-300" />
            <h2 className="text-xl font-semibold text-white">{title as string}</h2>
            <p className="mt-3 text-sm leading-6 text-slate-400">{description as string}</p>
          </div>
        ))}
      </section>
      <UseCases />
      <FinalCta />
    </main>
  );
}
