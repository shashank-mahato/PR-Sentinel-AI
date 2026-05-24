import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getAuthenticatedUser } from "@/lib/supabase/server";
import { getInstallationOctokit } from "@/lib/github/octokit";
import { processPullRequestPayload } from "@/lib/github/webhook";
import { AppError, jsonError } from "@/lib/utils/errors";
import { loadReviewWithRelations } from "@/lib/reviews/data";
import type { PullRequestWebhookPayload } from "@/types/github";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface GitHubPullRequestDetails {
  id: number;
  number: number;
  title: string;
  body: string | null;
  html_url: string;
  draft?: boolean;
  user?: { login: string } | null;
  head: { ref: string; sha: string };
  base: { ref: string; sha: string };
}

export async function POST(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const { user } = await getAuthenticatedUser();
    if (!user) throw new AppError("Authentication required.", 401);

    const admin = createSupabaseAdminClient();
    const review = await loadReviewWithRelations(admin, id, user.id);
    if (!review.repositories) throw new AppError("Review not found.", 404);
    if (review.status !== "failed") throw new AppError("Only failed reviews can be retried.", 400);
    if (!review.repositories.installation_id) throw new AppError("Repository installation ID is missing.", 400);

    const octokit = await getInstallationOctokit(review.repositories.installation_id);
    const pr = await octokit.request("GET /repos/{owner}/{repo}/pulls/{pull_number}", {
      owner: review.repositories.owner,
      repo: review.repositories.name,
      pull_number: review.pr_number
    });
    const prData = pr.data as GitHubPullRequestDetails;

    const payload: PullRequestWebhookPayload = {
      action: "synchronize",
      installation: { id: review.repositories.installation_id },
      repository: {
        id: review.repositories.github_repo_id || 0,
        name: review.repositories.name,
        full_name: review.repositories.full_name,
        private: Boolean(review.repositories.private),
        html_url: review.repositories.html_url || "",
        default_branch: review.repositories.default_branch || "main",
        owner: { login: review.repositories.owner }
      },
      pull_request: {
        id: prData.id,
        number: prData.number,
        title: prData.title,
        body: prData.body,
        html_url: prData.html_url,
        draft: prData.draft || false,
        user: prData.user ? { login: prData.user.login } : null,
        head: { ref: prData.head.ref, sha: prData.head.sha },
        base: { ref: prData.base.ref, sha: prData.base.sha }
      }
    };

    const result = await processPullRequestPayload(payload, id);
    return Response.json({ status: "ok", ...result });
  } catch (error) {
    return jsonError(error, "Unable to retry review.");
  }
}
