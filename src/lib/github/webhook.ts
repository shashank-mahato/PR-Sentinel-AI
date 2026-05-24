import "server-only";
import crypto from "node:crypto";
import { z } from "zod";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { reviewPullRequestWithGemini } from "@/lib/ai/review-engine";
import { REVIEWABLE_ACTIONS } from "@/lib/utils/constants";
import { safeErrorMessage } from "@/lib/utils/errors";
import type { Database, UserSettingsRow } from "@/types/database";
import type { PullRequestWebhookPayload } from "@/types/github";
import { fetchAndPreparePullRequestFiles } from "./diff";
import { getInstallationOctokit } from "./octokit";
import { postReviewComments } from "./comments";

const PullRequestPayloadSchema = z.object({
  action: z.string(),
  installation: z.object({ id: z.number() }).optional(),
  repository: z.object({
    id: z.number(),
    name: z.string(),
    full_name: z.string(),
    private: z.boolean(),
    html_url: z.string(),
    default_branch: z.string().optional().nullable(),
    owner: z.object({ login: z.string() })
  }),
  pull_request: z.object({
    id: z.number(),
    number: z.number(),
    title: z.string(),
    body: z.string().nullable().optional(),
    html_url: z.string(),
    draft: z.boolean().optional().default(false),
    user: z.object({ login: z.string() }).nullable().optional(),
    head: z.object({ ref: z.string(), sha: z.string() }),
    base: z.object({ ref: z.string(), sha: z.string() })
  })
});

type SupabaseAdmin = ReturnType<typeof createSupabaseAdminClient>;

export function verifyGitHubSignature(rawBody: string, signatureHeader: string | null) {
  const secret = process.env.GITHUB_WEBHOOK_SECRET;
  if (!secret) {
    throw new Error("GITHUB_WEBHOOK_SECRET is not configured.");
  }

  if (!signatureHeader?.startsWith("sha256=")) {
    return false;
  }

  const expected = `sha256=${crypto.createHmac("sha256", secret).update(rawBody, "utf8").digest("hex")}`;
  const providedBuffer = Buffer.from(signatureHeader, "utf8");
  const expectedBuffer = Buffer.from(expected, "utf8");

  if (providedBuffer.length !== expectedBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(providedBuffer, expectedBuffer);
}

async function findRepositoryOwner(
  supabase: SupabaseAdmin,
  installationId: number,
  githubRepoId: number
) {
  const { data } = await supabase
    .from("repositories")
    .select("user_id")
    .eq("installation_id", installationId)
    .eq("github_repo_id", githubRepoId)
    .not("user_id", "is", null)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return data?.user_id || null;
}

async function getSettings(supabase: SupabaseAdmin, userId: string | null): Promise<UserSettingsRow> {
  const defaults: UserSettingsRow = {
    id: "defaults",
    user_id: userId,
    review_draft_prs: false,
    post_inline_comments: true,
    post_summary_comment: true,
    max_inline_comments: 10,
    minimum_inline_severity: "medium",
    block_merge_threshold: 70,
    created_at: null,
    updated_at: null
  };

  if (!userId) return defaults;

  const { data, error } = await supabase.from("user_settings").select("*").eq("user_id", userId).maybeSingle();
  if (error || !data) return defaults;
  return data;
}

async function upsertRepository(
  supabase: SupabaseAdmin,
  payload: PullRequestWebhookPayload,
  installationId: number,
  userId: string | null
) {
  const repository = payload.repository;
  if (!repository) throw new Error("Missing repository payload.");

  const existingQuery = supabase
    .from("repositories")
    .select("*")
    .eq("installation_id", installationId)
    .eq("github_repo_id", repository.id);

  const { data: existingRows } = userId
    ? await existingQuery.eq("user_id", userId)
    : await existingQuery.is("user_id", null);

  const existing = existingRows?.[0];
  const values: Database["public"]["Tables"]["repositories"]["Insert"] = {
    user_id: userId,
    github_repo_id: repository.id,
    owner: repository.owner.login,
    name: repository.name,
    full_name: repository.full_name,
    private: repository.private,
    default_branch: repository.default_branch || null,
    installation_id: installationId,
    html_url: repository.html_url,
    is_active: true
  };

  if (existing) {
    const { data, error } = await supabase.from("repositories").update(values).eq("id", existing.id).select().single();
    if (error) throw error;
    return data;
  }

  const { data, error } = await supabase.from("repositories").insert(values).select().single();
  if (error) throw error;
  return data;
}

async function createOrUpdateReview(
  supabase: SupabaseAdmin,
  payload: PullRequestWebhookPayload,
  repositoryId: string,
  userId: string | null,
  existingReviewId?: string
) {
  const pr = payload.pull_request;
  if (!pr) throw new Error("Missing pull request payload.");

  const values: Database["public"]["Tables"]["pull_request_reviews"]["Insert"] = {
    user_id: userId,
    repository_id: repositoryId,
    github_pr_id: pr.id,
    pr_number: pr.number,
    pr_title: pr.title,
    pr_body: pr.body || null,
    pr_author: pr.user?.login || null,
    pr_url: pr.html_url,
    base_branch: pr.base.ref,
    head_branch: pr.head.ref,
    status: "analyzing",
    risk_score: 0,
    should_block_merge: false,
    summary: null,
    error_message: null,
    large_diff_limited: false,
    files_analyzed: 0,
    started_at: new Date().toISOString(),
    completed_at: null
  };

  if (existingReviewId) {
    const { error } = await supabase.from("review_findings").delete().eq("review_id", existingReviewId);
    if (error) throw error;
    const { data, error: updateError } = await supabase
      .from("pull_request_reviews")
      .update(values)
      .eq("id", existingReviewId)
      .select()
      .single();
    if (updateError) throw updateError;
    return data;
  }

  const { data, error } = await supabase.from("pull_request_reviews").insert(values).select().single();
  if (error) throw error;
  return data;
}

export async function processPullRequestPayload(payload: PullRequestWebhookPayload, existingReviewId?: string) {
  const parsed = PullRequestPayloadSchema.parse(payload);
  const installationId = parsed.installation?.id;
  if (!installationId) throw new Error("Missing installation ID.");

  const supabase = createSupabaseAdminClient();
  const userId = await findRepositoryOwner(supabase, installationId, parsed.repository.id);
  const settings = await getSettings(supabase, userId);

  if (parsed.pull_request.draft && !settings.review_draft_prs) {
    return { ignored: true, reason: "Draft pull request reviews are disabled." };
  }

  const repository = await upsertRepository(supabase, parsed, installationId, userId);
  if (repository.is_active === false) {
    return { ignored: true, reason: "Repository is inactive." };
  }

  const review = await createOrUpdateReview(supabase, parsed, repository.id, userId, existingReviewId);

  try {
    const octokit = await getInstallationOctokit(installationId);
    const prepared = await fetchAndPreparePullRequestFiles(octokit, {
      owner: parsed.repository.owner.login,
      repo: parsed.repository.name,
      pullNumber: parsed.pull_request.number
    });

    const aiReview = await reviewPullRequestWithGemini(
      {
        owner: parsed.repository.owner.login,
        repo: parsed.repository.name,
        prNumber: parsed.pull_request.number,
        prTitle: parsed.pull_request.title,
        prBody: parsed.pull_request.body,
        prAuthor: parsed.pull_request.user?.login,
        baseBranch: parsed.pull_request.base.ref,
        headBranch: parsed.pull_request.head.ref,
        files: prepared.files,
        largeDiffLimited: prepared.largeDiffLimited
      },
      settings.block_merge_threshold || 70
    );

    const { data: insertedFindings, error: findingsError } = await supabase
      .from("review_findings")
      .insert(
        aiReview.findings.map((finding) => ({
          review_id: review.id,
          severity: finding.severity,
          category: finding.category,
          title: finding.title,
          file_path: finding.filePath,
          line_number: finding.line || null,
          explanation: finding.explanation,
          why_it_matters: finding.whyItMatters,
          suggested_fix: finding.suggestedFix,
          suggested_code: finding.suggestedCode || null
        }))
      )
      .select();

    if (findingsError) throw findingsError;

    const completedAt = new Date().toISOString();
    const { error: reviewError } = await supabase
      .from("pull_request_reviews")
      .update({
        status: "completed",
        risk_score: aiReview.riskScore,
        should_block_merge: aiReview.shouldBlockMerge,
        summary: aiReview.summary,
        large_diff_limited: prepared.largeDiffLimited,
        files_analyzed: prepared.files.length,
        completed_at: completedAt
      })
      .eq("id", review.id);

    if (reviewError) throw reviewError;

    await supabase.from("repositories").update({ last_reviewed_at: completedAt }).eq("id", repository.id);

    try {
      const commentResult = await postReviewComments(octokit, {
        owner: parsed.repository.owner.login,
        repo: parsed.repository.name,
        pullNumber: parsed.pull_request.number,
        commitSha: parsed.pull_request.head.sha,
        reviewId: review.id,
        reviewUrl: review.pr_url,
        summary: aiReview.summary,
        riskScore: aiReview.riskScore,
        shouldBlockMerge: aiReview.shouldBlockMerge,
        findings: insertedFindings || [],
        largeDiffLimited: prepared.largeDiffLimited,
        settings
      });

      for (const comment of commentResult.inlineComments) {
        const { error: commentUpdateError } = await supabase
          .from("review_findings")
          .update({ github_comment_id: comment.commentId, comment_posted: true })
          .eq("id", comment.findingId);

        if (commentUpdateError) {
          commentResult.commentFailures.push(
            `Stored GitHub comment but failed to mark finding ${comment.findingId} as posted.`
          );
        }
      }

      if (commentResult.commentFailures.length > 0) {
        await supabase
          .from("pull_request_reviews")
          .update({
            error_message: `Review completed, but GitHub comment posting had warnings: ${commentResult.commentFailures
              .slice(0, 5)
              .join(" | ")}`
          })
          .eq("id", review.id);
      }
    } catch (error) {
      await supabase
        .from("pull_request_reviews")
        .update({
          error_message: `Review completed, but GitHub comment posting failed: ${safeErrorMessage(
            error,
            "GitHub comment posting failed."
          )}`
        })
        .eq("id", review.id);
    }

    return { ignored: false, reviewId: review.id };
  } catch (error) {
    const message = safeErrorMessage(error, "Review processing failed.");
    await supabase
      .from("pull_request_reviews")
      .update({
        status: "failed",
        error_message: message,
        completed_at: new Date().toISOString()
      })
      .eq("id", review.id);
    throw error;
  }
}

export async function handleGitHubWebhook(rawBody: string, headers: Headers) {
  const signature = headers.get("x-hub-signature-256");
  const deliveryId = headers.get("x-github-delivery");
  const eventType = headers.get("x-github-event");

  if (!verifyGitHubSignature(rawBody, signature)) {
    return Response.json({ error: "Invalid GitHub webhook signature." }, { status: 401 });
  }

  if (!deliveryId) {
    return Response.json({ error: "Missing GitHub delivery ID." }, { status: 400 });
  }

  const payload = JSON.parse(rawBody) as PullRequestWebhookPayload;
  const action = payload.action;
  const supabase = createSupabaseAdminClient();

  const { error: eventInsertError } = await supabase.from("webhook_events").insert({
    github_delivery_id: deliveryId,
    event_type: eventType,
    action,
    repository_full_name: payload.repository?.full_name,
    pr_number: payload.pull_request?.number,
    payload: payload as never,
    processed: false
  });

  if (eventInsertError) {
    if (eventInsertError.code === "23505") {
      return Response.json({ status: "ignored", reason: "Duplicate webhook delivery." });
    }
    throw eventInsertError;
  }

  if (eventType !== "pull_request" || !REVIEWABLE_ACTIONS.has(action)) {
    await supabase.from("webhook_events").update({ processed: true }).eq("github_delivery_id", deliveryId);
    return Response.json({ status: "ignored", reason: "Unsupported webhook event or action." });
  }

  try {
    const result = await processPullRequestPayload(payload);
    await supabase.from("webhook_events").update({ processed: true }).eq("github_delivery_id", deliveryId);
    return Response.json({ status: "ok", ...result });
  } catch (error) {
    const message = safeErrorMessage(error, "Webhook processing failed.");
    await supabase
      .from("webhook_events")
      .update({ processed: false, error_message: message })
      .eq("github_delivery_id", deliveryId);
    return Response.json({ error: message }, { status: 500 });
  }
}
