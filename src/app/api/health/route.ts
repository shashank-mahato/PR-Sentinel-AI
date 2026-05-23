import { APP_NAME } from "@/lib/utils/constants";

export async function GET() {
  return Response.json({
    status: "ok",
    service: APP_NAME,
    timestamp: new Date().toISOString(),
    supabase:
      process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY && process.env.SUPABASE_SERVICE_ROLE_KEY
        ? "configured"
        : "missing_env",
    gemini: process.env.GEMINI_API_KEY ? "configured" : "missing_env",
    github:
      process.env.GITHUB_APP_ID && process.env.GITHUB_APP_PRIVATE_KEY && process.env.GITHUB_WEBHOOK_SECRET
        ? "configured"
        : "missing_env"
  });
}
