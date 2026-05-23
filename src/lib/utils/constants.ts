export const APP_NAME = "PR Sentinel AI";
export const APP_TAGLINE = "AI code reviews before bugs reach production.";

export const PROTECTED_ROUTES = ["/dashboard", "/repositories", "/reviews", "/settings"];

export const REVIEWABLE_ACTIONS = new Set(["opened", "synchronize", "reopened", "ready_for_review"]);

export const DEFAULT_REVIEW_LIMITS = {
  maxTotalDiffChars: 60000,
  maxFiles: 20,
  maxFindings: 30,
  maxInlineComments: 10
};

export function getPublicAppUrl() {
  return process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") || "http://localhost:3000";
}

export function getNumberEnv(name: string, fallback: number) {
  const value = process.env[name];
  if (!value) return fallback;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}
