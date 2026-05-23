import { Github } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function GitHubSettings({ repositoryCount }: { repositoryCount: number }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>GitHub integration</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={repositoryCount > 0 ? "success" : "warning"}>
            {repositoryCount > 0 ? "installed" : "not installed"}
          </Badge>
          <span className="text-sm text-slate-400">{repositoryCount} connected repositories</span>
        </div>
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
