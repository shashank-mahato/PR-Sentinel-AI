import type { ReviewableFile } from "@/types/github";

export const GEMINI_SYSTEM_PROMPT = `You are a senior staff software engineer, production code reviewer, and application security reviewer.

You review only the changed code from this GitHub pull request.

Your job is to identify real, actionable issues that could affect correctness, security, performance, reliability, maintainability, or test coverage.

Focus on:
- Bugs
- Security vulnerabilities
- Unsafe user input
- Authentication or authorization flaws
- Hardcoded secrets
- Data leaks
- Performance bottlenecks
- Inefficient queries
- Race conditions
- Missing error handling
- Missing important tests
- Risky logic
- Production reliability problems

Avoid:
- Formatting nitpicks
- Personal preference comments
- Generic advice
- Duplicate findings
- Findings unrelated to the diff
- Weak or speculative issues

Return only valid JSON matching the required schema.
Do not include markdown outside JSON.
Do not include explanations outside JSON.
Every finding must be specific, actionable, and tied to a file path.
Include a line number when possible.
Prefer fewer high-quality findings over many weak findings.`;

const schemaDescription = `{
  "summary": "Short overall review summary",
  "riskScore": 72,
  "shouldBlockMerge": true,
  "findings": [
    {
      "severity": "critical",
      "category": "security",
      "title": "SQL Injection Risk",
      "filePath": "src/api/users.ts",
      "line": 42,
      "explanation": "User input is directly concatenated into a SQL query.",
      "whyItMatters": "Attackers may execute arbitrary SQL commands.",
      "suggestedFix": "Use parameterized queries instead of string concatenation.",
      "suggestedCode": "await db.query('SELECT * FROM users WHERE id = ?', [userId])"
    }
  ]
}`;

export interface ReviewPromptInput {
  owner: string;
  repo: string;
  prNumber: number;
  prTitle: string;
  prBody?: string | null;
  prAuthor?: string | null;
  baseBranch?: string | null;
  headBranch?: string | null;
  files: ReviewableFile[];
  largeDiffLimited: boolean;
}

export function buildReviewPrompt(input: ReviewPromptInput) {
  const fileSections = input.files
    .map((file, index) => {
      return `### File ${index + 1}: ${file.filename}
Status: ${file.status}
Additions: ${file.additions}
Deletions: ${file.deletions}
Changes: ${file.changes}

\`\`\`diff
${file.patch}
\`\`\``;
    })
    .join("\n\n");

  return `Review this GitHub pull request diff and return JSON only.

Repository: ${input.owner}/${input.repo}
Pull request: #${input.prNumber}
Title: ${input.prTitle}
Author: ${input.prAuthor || "unknown"}
Base branch: ${input.baseBranch || "unknown"}
Head branch: ${input.headBranch || "unknown"}
Large diff limited: ${input.largeDiffLimited ? "yes" : "no"}

Pull request body:
${input.prBody || "No body provided."}

Required JSON schema:
${schemaDescription}

Allowed severity values: critical, high, medium, low.
Allowed category values: bug, security, performance, maintainability, code_smell, testing, documentation, reliability.

Review only issues visible in these changed patches:

${fileSections}`;
}

export function buildRepairPrompt(rawResponse: string, validationError: string) {
  return `The previous response was not valid JSON for the required schema.

Validation error:
${validationError}

Convert the response below into valid JSON only. Do not add markdown or commentary.

Required JSON schema:
${schemaDescription}

Previous response:
${rawResponse}`;
}
