"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Github, LogOut, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export function AppHeader({ email }: { email?: string | null }) {
  const router = useRouter();

  async function signOut() {
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-20 border-b border-slate-800 bg-slate-950/85 backdrop-blur">
      <div className="flex h-16 items-center justify-between px-4 lg:px-8">
        <Link className="flex items-center gap-3 lg:hidden" href="/dashboard">
          <div className="rounded-lg bg-teal-400 p-2 text-slate-950">
            <ShieldCheck className="h-4 w-4" />
          </div>
          <span className="font-semibold text-white">PR Sentinel AI</span>
        </Link>
        <div className="hidden text-sm text-slate-400 lg:block">{email || "Signed in"}</div>
        <div className="flex items-center gap-2">
          <a
            className="inline-flex h-10 items-center justify-center rounded-lg border border-slate-800 px-3 text-sm text-slate-200 hover:bg-slate-900"
            href={process.env.NEXT_PUBLIC_GITHUB_APP_INSTALL_URL || "/settings"}
            rel="noreferrer"
          >
            <Github className="mr-2 h-4 w-4" />
            Install App
          </a>
          <Button variant="ghost" onClick={signOut} aria-label="Sign out">
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </header>
  );
}
