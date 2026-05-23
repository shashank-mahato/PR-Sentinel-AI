import { handleGitHubWebhook } from "@/lib/github/webhook";
import { safeErrorMessage } from "@/lib/utils/errors";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const rawBody = await request.text();
    return await handleGitHubWebhook(rawBody, request.headers);
  } catch (error) {
    return Response.json({ error: safeErrorMessage(error, "Webhook failed.") }, { status: 500 });
  }
}
