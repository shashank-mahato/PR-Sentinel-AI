import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const envNames = [
  "NEXT_PUBLIC_APP_URL",
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "NEXT_PUBLIC_GITHUB_APP_INSTALL_URL",
  "GITHUB_APP_ID",
  "GITHUB_APP_PRIVATE_KEY",
  "GITHUB_WEBHOOK_SECRET",
  "GITHUB_CLIENT_ID",
  "GITHUB_CLIENT_SECRET",
  "GEMINI_API_KEY",
  "GEMINI_MODEL",
  "REVIEW_MAX_TOTAL_DIFF_CHARS",
  "REVIEW_MAX_FILES",
  "REVIEW_MAX_FINDINGS",
  "REVIEW_MAX_INLINE_COMMENTS"
];

export function EnvironmentHelp() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Environment setup help</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {envNames.map((name) => (
            <code key={name} className="rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-300">
              {name}
            </code>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
