import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getAuthenticatedUser } from "@/lib/supabase/server";
import { getInstallationOctokit } from "@/lib/github/octokit";
import { postReviewComments } from "@/lib/github/comments";
import { AppError, jsonError } from "@/lib/utils/errors";
import { loadReviewWithRelations } from "@/lib/reviews/data";

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
    if (!review.repositories.installation_id) throw new AppError("Repository installation ID is missing.", 400);

    const { data: settings } = await admin.from("user_settings").select("*").eq("user_id", user.id).maybeSingle();
    const octokit = await getInstallationOctokit(review.repositories.installation_id);
    const pr = await octokit.request("GET /repos/{owner}/{repo}/pulls/{pull_number}", {
      owner: review.repositories.owner,
      repo: review.repositories.name,
      pull_number: review.pr_number
    });

    const result = await postReviewComments(octokit, {
      owner: review.repositories.owner,
      repo: review.repositories.name,
      pullNumber: review.pr_number,
      commitSha: pr.data.head.sha,
      reviewId: review.id,
      reviewUrl: review.pr_url,
      summary: review.summary || "PR Sentinel AI completed the review.",
      riskScore: review.risk_score || 0,
      shouldBlockMerge: Boolean(review.should_block_merge),
      findings: review.review_findings || [],
      largeDiffLimited: Boolean(review.large_diff_limited),
      settings: settings || {
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
      }
    });

    for (const comment of result.inlineComments) {
      await admin
        .from("review_findings")
        .update({ github_comment_id: comment.commentId, comment_posted: true })
        .eq("id", comment.findingId);
    }

    return Response.json({ status: "ok", ...result });
  } catch (error) {
    return jsonError(error, "Unable to post comments.");
  }
}
