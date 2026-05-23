import { z } from "zod";
import { generateGeminiJson } from "./gemini";
import { buildRepairPrompt, buildReviewPrompt, type ReviewPromptInput } from "./prompts";
import { GeminiReviewSchema, type GeminiReview } from "./schema";
import { DEFAULT_REVIEW_LIMITS, getNumberEnv } from "@/lib/utils/constants";
import { calculateRiskScore, normalizeSeverity, shouldBlockMerge } from "@/lib/utils/scoring";
import type { FindingCategory } from "@/types/database";

function extractJsonObject(text: string) {
  const trimmed = text.trim().replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```$/i, "").trim();
  if (trimmed.startsWith("{") && trimmed.endsWith("}")) return trimmed;

  const first = trimmed.indexOf("{");
  const last = trimmed.lastIndexOf("}");
  if (first >= 0 && last > first) {
    return trimmed.slice(first, last + 1);
  }

  throw new Error("Gemini response did not contain a JSON object.");
}

function normalizeCategory(category: string) {
  const normalized = category?.toLowerCase().replace(/[\s-]/g, "_");
  const allowed = new Set([
    "bug",
    "security",
    "performance",
    "maintainability",
    "code_smell",
    "testing",
    "documentation",
    "reliability"
  ]);
  return (allowed.has(normalized) ? normalized : "maintainability") as FindingCategory;
}

function normalizeReview(review: GeminiReview, threshold: number): GeminiReview {
  const maxFindings = getNumberEnv("REVIEW_MAX_FINDINGS", DEFAULT_REVIEW_LIMITS.maxFindings);
  const findings = review.findings.slice(0, maxFindings).map((finding) => ({
    ...finding,
    severity: normalizeSeverity(finding.severity),
    category: normalizeCategory(finding.category),
    line: finding.line || null,
    suggestedCode: finding.suggestedCode || null
  }));
  const riskScore = calculateRiskScore(findings, review.riskScore);

  return {
    summary: review.summary,
    riskScore,
    shouldBlockMerge: shouldBlockMerge(findings, riskScore, threshold),
    findings
  };
}

async function parseGeminiReview(rawResponse: string, repairPromptBuilder: (message: string) => string) {
  try {
    const parsed = JSON.parse(extractJsonObject(rawResponse));
    return GeminiReviewSchema.parse(parsed);
  } catch (error) {
    const message = error instanceof z.ZodError ? z.prettifyError(error) : error instanceof Error ? error.message : "Invalid JSON";
    const repaired = await generateGeminiJson(repairPromptBuilder(message));
    const parsed = JSON.parse(extractJsonObject(repaired));
    return GeminiReviewSchema.parse(parsed);
  }
}

export async function reviewPullRequestWithGemini(input: ReviewPromptInput, blockMergeThreshold = 70) {
  if (input.files.length === 0) {
    return normalizeReview(
      {
        summary: "No reviewable text patches were available in this pull request.",
        riskScore: 0,
        shouldBlockMerge: false,
        findings: []
      },
      blockMergeThreshold
    );
  }

  const prompt = buildReviewPrompt(input);
  const rawResponse = await generateGeminiJson(prompt);
  const parsed = await parseGeminiReview(rawResponse, (message) => buildRepairPrompt(rawResponse, message));
  return normalizeReview(parsed, blockMergeThreshold);
}
