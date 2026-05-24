import { after } from "next/server";
import { handleGitHubWebhook, processPullRequestReviewInBackground } from "@/lib/github/webhook";
import { safeErrorMessage } from "@/lib/utils/errors";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    const rawBody = await request.text();
    return await handleGitHubWebhook(rawBody, request.headers, (job) => {
      after(async () => {
        try {
          await processPullRequestReviewInBackground(job);
        } catch (error) {
          console.error("Background PR review failed:", safeErrorMessage(error, "Review processing failed."));
        }
      });
    });
  } catch (error) {
    return Response.json({ error: safeErrorMessage(error, "Webhook failed.") }, { status: 500 });
  }
}
