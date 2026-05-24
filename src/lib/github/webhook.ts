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
import { resolveUserIdForInstallationRepository, upsertLinkedRepository } from "./repository-linking";

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
type ParsedPullRequestPayload = z.infer<typeof PullRequestPayloadSchema>;

interface PullRequestReviewJob {
  payload: ParsedPullRequestPayload;
  reviewId: string;
  repositoryId: string;
  installationId: number;
  settings: UserSettingsRow;
}

interface QueuePullRequestReviewResult {
  ignored: boolean;
  reason?: string;
  reviewId?: string;
  job?: PullRequestReviewJob;
}

type ScheduleReviewJob = (job: PullRequestReviewJob) => void;

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

async function createOrUpdateReview(
  supabase: SupabaseAdmin,
  payload: ParsedPullRequestPayload,
  repositoryId: string,
  userId: string | null,
  userLinkWarning: string | null,
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
    status: "pending",
    risk_score: 0,
    should_block_merge: false,
    summary: null,
    error_message: userLinkWarning,
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

export async function queuePullRequestReview(
  payload: PullRequestWebhookPayload,
  existingReviewId?: string
): Promise<QueuePullRequestReviewResult> {
  const parsed = PullRequestPayloadSchema.parse(payload);
  const installationId = parsed.installation?.id;
  if (!installationId) throw new Error("Missing installation ID.");

  const supabase = createSupabaseAdminClient();
  const resolvedUserId = await resolveUserIdForInstallationRepository(
    supabase,
    installationId,
    parsed.repository.id,
    parsed.repository.full_name
  );
  const { repository, userId } = await upsertLinkedRepository(supabase, {
    userId: resolvedUserId,
    installationId,
    githubRepoId: parsed.repository.id,
    owner: parsed.repository.owner.login,
    name: parsed.repository.name,
    fullName: parsed.repository.full_name,
    private: parsed.repository.private,
    defaultBranch: parsed.repository.default_branch || null,
    htmlUrl: parsed.repository.html_url
  });

  const userLinkWarning = userId
    ? null
    : "GitHub installation is not linked to a Supabase user; dashboard visibility may be limited.";
  const settings = await getSettings(supabase, userId);

  if (parsed.pull_request.draft && !settings.review_draft_prs) {
    return { ignored: true, reason: "Draft pull request reviews are disabled." };
  }

  if (repository.is_active === false) {
    return { ignored: true, reason: "Repository is inactive." };
  }

  const review = await createOrUpdateReview(supabase, parsed, repository.id, userId, userLinkWarning, existingReviewId);

  return {
    ignored: false,
    reviewId: review.id,
    job: {
      payload: parsed,
      reviewId: review.id,
      repositoryId: repository.id,
      installationId,
      settings
    }
  };
}

export async function processPullRequestReviewInBackground(job: PullRequestReviewJob) {
  const parsed = job.payload;
  const supabase = createSupabaseAdminClient();

  try {
    await supabase
      .from("pull_request_reviews")
      .update({
        status: "analyzing"
      })
      .eq("id", job.reviewId);

    const octokit = await getInstallationOctokit(job.installationId);
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
      job.settings.block_merge_threshold || 70
    );

    const { data: insertedFindings, error: findingsError } = await supabase
      .from("review_findings")
      .insert(
        aiReview.findings.map((finding) => ({
          review_id: job.reviewId,
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
      .eq("id", job.reviewId);

    if (reviewError) throw reviewError;

    await supabase.from("repositories").update({ last_reviewed_at: completedAt }).eq("id", job.repositoryId);

    try {
      const commentResult = await postReviewComments(octokit, {
        owner: parsed.repository.owner.login,
        repo: parsed.repository.name,
        pullNumber: parsed.pull_request.number,
        commitSha: parsed.pull_request.head.sha,
        reviewId: job.reviewId,
        reviewUrl: parsed.pull_request.html_url,
        summary: aiReview.summary,
        riskScore: aiReview.riskScore,
        shouldBlockMerge: aiReview.shouldBlockMerge,
        findings: insertedFindings || [],
        largeDiffLimited: prepared.largeDiffLimited,
        settings: job.settings
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
          .eq("id", job.reviewId);
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
        .eq("id", job.reviewId);
    }
  } catch (error) {
    const message = safeErrorMessage(error, "Review processing failed.");
    await supabase
      .from("pull_request_reviews")
      .update({
        status: "failed",
        error_message: message,
        completed_at: new Date().toISOString()
      })
      .eq("id", job.reviewId);
    throw error;
  }
}

export async function processPullRequestPayload(payload: PullRequestWebhookPayload, existingReviewId?: string) {
  const queued = await queuePullRequestReview(payload, existingReviewId);
  if (queued.ignored || !queued.job) {
    return { ignored: true, reason: queued.reason };
  }

  await processPullRequestReviewInBackground(queued.job);
  return { ignored: false, reviewId: queued.reviewId };
}

export async function handleGitHubWebhook(rawBody: string, headers: Headers, scheduleReviewJob?: ScheduleReviewJob) {
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
    const result = await queuePullRequestReview(payload);
    await supabase.from("webhook_events").update({ processed: true }).eq("github_delivery_id", deliveryId);

    if (result.ignored || !result.job) {
      return Response.json({ status: "ignored", reason: result.reason });
    }

    if (scheduleReviewJob) {
      scheduleReviewJob(result.job);
    } else {
      await processPullRequestReviewInBackground(result.job);
    }

    return Response.json({
      status: "accepted",
      reviewId: result.reviewId,
      message: "Review queued"
    });
  } catch (error) {
    const message = safeErrorMessage(error, "Webhook processing failed.");
    await supabase
      .from("webhook_events")
      .update({ processed: false, error_message: message })
      .eq("github_delivery_id", deliveryId);
    return Response.json({ error: message }, { status: 500 });
  }
}
