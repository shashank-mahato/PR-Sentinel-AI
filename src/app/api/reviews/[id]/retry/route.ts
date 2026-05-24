import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getAuthenticatedUser } from "@/lib/supabase/server";
import { getInstallationOctokit } from "@/lib/github/octokit";
import { processPullRequestPayload } from "@/lib/github/webhook";
import { AppError, jsonError } from "@/lib/utils/errors";
import { loadReviewWithRelations } from "@/lib/reviews/data";
import type { PullRequestWebhookPayload } from "@/types/github";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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
        id: pr.data.id,
        number: pr.data.number,
        title: pr.data.title,
        body: pr.data.body,
        html_url: pr.data.html_url,
        draft: pr.data.draft || false,
        user: pr.data.user ? { login: pr.data.user.login } : null,
        head: { ref: pr.data.head.ref, sha: pr.data.head.sha },
        base: { ref: pr.data.base.ref, sha: pr.data.base.sha }
      }
    };

    const result = await processPullRequestPayload(payload, id);
    return Response.json({ status: "ok", ...result });
  } catch (error) {
    return jsonError(error, "Unable to retry review.");
  }
}
