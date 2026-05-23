"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export function AccountSettings({
  email,
  githubUsername
}: {
  email?: string | null;
  githubUsername?: string | null;
}) {
  const router = useRouter();

  async function signOut() {
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Account</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 text-sm text-slate-300">
        <div>
          <p className="text-slate-500">Email</p>
          <p className="text-slate-100">{email || "Not available"}</p>
        </div>
        <div>
          <p className="text-slate-500">GitHub username</p>
          <p className="text-slate-100">{githubUsername || "Not available"}</p>
        </div>
        <Button variant="outline" onClick={signOut}>
          <LogOut className="h-4 w-4" />
          Sign out
        </Button>
      </CardContent>
    </Card>
  );
}
