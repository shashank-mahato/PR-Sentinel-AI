import { Github } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function InstallGitHubAppCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Install GitHub App</CardTitle>
        <CardDescription>Connect real repositories so pull request webhooks can trigger Gemini reviews.</CardDescription>
      </CardHeader>
      <CardContent>
        <a
          className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-teal-400 px-4 text-sm font-semibold text-slate-950 hover:bg-teal-300"
          href={process.env.NEXT_PUBLIC_GITHUB_APP_INSTALL_URL || "/settings"}
          rel="noreferrer"
        >
          <Github className="h-4 w-4" />
          Install GitHub App
        </a>
      </CardContent>
    </Card>
  );
}
