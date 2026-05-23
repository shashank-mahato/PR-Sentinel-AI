import { z } from "zod";

export const SeveritySchema = z.enum(["critical", "high", "medium", "low"]);
export const CategorySchema = z.enum([
  "bug",
  "security",
  "performance",
  "maintainability",
  "code_smell",
  "testing",
  "documentation",
  "reliability"
]);

export const FindingSchema = z.object({
  severity: SeveritySchema,
  category: CategorySchema,
  title: z.string().min(3).max(160),
  filePath: z.string().min(1).max(500),
  line: z.number().int().positive().nullable().optional(),
  explanation: z.string().min(10).max(2000),
  whyItMatters: z.string().min(10).max(2000),
  suggestedFix: z.string().min(5).max(2000),
  suggestedCode: z.string().max(3000).nullable().optional()
});

export const GeminiReviewSchema = z.object({
  summary: z.string().min(5).max(3000),
  riskScore: z.number().int().min(0).max(100),
  shouldBlockMerge: z.boolean(),
  findings: z.array(FindingSchema).max(50)
});

export type GeminiReview = z.infer<typeof GeminiReviewSchema>;
export type GeminiFinding = z.infer<typeof FindingSchema>;
