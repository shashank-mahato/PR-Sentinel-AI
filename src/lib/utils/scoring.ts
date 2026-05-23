import type { Severity } from "@/types/database";
import type { RiskLevel, SeverityCounts } from "@/types/review";

export const SEVERITY_WEIGHTS: Record<Severity, number> = {
  critical: 30,
  high: 20,
  medium: 10,
  low: 3
};

export function emptySeverityCounts(): SeverityCounts {
  return { critical: 0, high: 0, medium: 0, low: 0 };
}

export function countSeverities(findings: Array<{ severity: string }>): SeverityCounts {
  return findings.reduce((counts, finding) => {
    const severity = normalizeSeverity(finding.severity);
    counts[severity] += 1;
    return counts;
  }, emptySeverityCounts());
}

export function normalizeSeverity(severity: string): Severity {
  const normalized = severity?.toLowerCase();
  if (normalized === "critical" || normalized === "high" || normalized === "medium" || normalized === "low") {
    return normalized;
  }
  return "low";
}

export function calculateRiskScore(findings: Array<{ severity: string }>, geminiRiskScore?: number | null) {
  const backendScore = Math.min(
    100,
    findings.reduce((sum, finding) => sum + SEVERITY_WEIGHTS[normalizeSeverity(finding.severity)], 0)
  );
  const aiScore =
    typeof geminiRiskScore === "number" && Number.isFinite(geminiRiskScore)
      ? Math.min(100, Math.max(0, Math.round(geminiRiskScore)))
      : null;

  return aiScore === null ? backendScore : Math.max(backendScore, aiScore);
}

export function getRiskLevel(score: number): RiskLevel {
  if (score >= 81) return "Critical";
  if (score >= 61) return "High";
  if (score >= 31) return "Medium";
  return "Low";
}

export function shouldBlockMerge(
  findings: Array<{ severity: string }>,
  riskScore: number,
  threshold = 70
) {
  return findings.some((finding) => normalizeSeverity(finding.severity) === "critical") || riskScore >= threshold;
}
