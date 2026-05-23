import { ProtectedShell } from "@/components/layout/protected-shell";
import { AccountSettings } from "@/components/settings/account-settings";
import { AiReviewSettings } from "@/components/settings/ai-review-settings";
import { EnvironmentHelp } from "@/components/settings/environment-help";
import { GitHubSettings } from "@/components/settings/github-settings";
import { getAuthenticatedUser } from "@/lib/supabase/server";
import type { UserSettingsRow } from "@/types/database";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const { supabase, user } = await getAuthenticatedUser();
  if (!user) return null;

  const [{ data: repositories }, { data: settings }] = await Promise.all([
    supabase.from("repositories").select("id").eq("user_id", user.id),
    supabase.from("user_settings").select("*").eq("user_id", user.id).maybeSingle()
  ]);

  const defaults: UserSettingsRow = {
    id: "defaults",
    user_id: user.id,
    review_draft_prs: false,
    post_inline_comments: true,
    post_summary_comment: true,
    max_inline_comments: 10,
    minimum_inline_severity: "medium",
    block_merge_threshold: 70,
    created_at: null,
    updated_at: null
  };

  return (
    <ProtectedShell>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">Settings</h1>
        <p className="mt-2 text-slate-400">Account, GitHub integration, Gemini review behavior, and production env setup.</p>
      </div>
      <div className="grid gap-6">
        <AccountSettings
          email={user.email}
          githubUsername={(user.user_metadata?.user_name as string | undefined) || (user.user_metadata?.preferred_username as string | undefined)}
        />
        <GitHubSettings repositoryCount={repositories?.length || 0} />
        <AiReviewSettings settings={settings || defaults} userId={user.id} />
        <EnvironmentHelp />
      </div>
    </ProtectedShell>
  );
}
