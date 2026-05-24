import "server-only";
import type { ReviewableFile } from "@/types/github";
import { DEFAULT_REVIEW_LIMITS, getNumberEnv } from "@/lib/utils/constants";

interface GitHubRequestClient {
  request: (
    route: "GET /repos/{owner}/{repo}/pulls/{pull_number}/files",
    parameters: {
      owner: string;
      repo: string;
      pull_number: number;
      per_page: number;
      page: number;
    }
  ) => Promise<{ data: unknown }>;
}

interface PullRequestFile {
  filename: string;
  status: string;
  additions: number;
  deletions: number;
  changes: number;
  patch?: string | null;
  blob_url?: string | null;
  raw_url?: string | null;
  contents_url?: string | null;
}

const SKIP_PATTERNS = [
  /(^|\/)(dist|build|coverage|vendor|node_modules|\.next|out)\//i,
  /\.min\.(js|css)$/i,
  /\.(png|jpg|jpeg|gif|webp|ico|svg|pdf|zip|gz|tar|mp4|mov|woff2?|ttf|eot)$/i,
  /(^|\/)(package-lock\.json|pnpm-lock\.yaml|yarn\.lock)$/i
];

const IMPORTANT_PATTERNS = [
  /api|route|server|middleware/i,
  /auth|session|jwt|oauth|permission|policy|acl|admin/i,
  /db|database|supabase|sql|schema|migration|repository/i,
  /payment|billing|stripe|checkout/i,
  /security|crypto|secret|token|password/i,
  /form|input|validation|request/i,
  /service|worker|queue|job/i,
  /config|env/i,
  /test|spec/i
];

function isUsefulPatch(filename: string, patch?: string | null) {
  if (!patch?.trim()) return false;
  return !SKIP_PATTERNS.some((pattern) => pattern.test(filename));
}

function priorityFor(filename: string, additions: number, changes: number) {
  const importance = IMPORTANT_PATTERNS.reduce((score, pattern) => score + (pattern.test(filename) ? 20 : 0), 0);
  const sizeScore = Math.min(30, Math.ceil(additions / 20) + Math.ceil(changes / 50));
  return importance + sizeScore;
}

async function listPullRequestFiles(
  octokit: GitHubRequestClient,
  input: { owner: string; repo: string; pullNumber: number }
) {
  const allFiles: PullRequestFile[] = [];
  let page = 1;

  while (true) {
    const response = await octokit.request("GET /repos/{owner}/{repo}/pulls/{pull_number}/files", {
      owner: input.owner,
      repo: input.repo,
      pull_number: input.pullNumber,
      per_page: 100,
      page
    });

    const files = Array.isArray(response.data) ? (response.data as PullRequestFile[]) : [];
    allFiles.push(...files);

    if (files.length < 100) break;
    page += 1;
    if (page > 10) break;
  }

  return allFiles;
}

export async function fetchAndPreparePullRequestFiles(
  octokit: GitHubRequestClient,
  input: { owner: string; repo: string; pullNumber: number }
) {
  const files = await listPullRequestFiles(octokit, input);

  const maxFiles = getNumberEnv("REVIEW_MAX_FILES", DEFAULT_REVIEW_LIMITS.maxFiles);
  const maxTotalDiffChars = getNumberEnv("REVIEW_MAX_TOTAL_DIFF_CHARS", DEFAULT_REVIEW_LIMITS.maxTotalDiffChars);
  let usedChars = 0;
  let largeDiffLimited = false;

  const reviewable = files
    .filter((file) => isUsefulPatch(file.filename, file.patch))
    .map((file) => ({
      filename: file.filename,
      status: file.status,
      additions: file.additions,
      deletions: file.deletions,
      changes: file.changes,
      patch: file.patch || "",
      blob_url: file.blob_url,
      raw_url: file.raw_url,
      contents_url: file.contents_url,
      priority: priorityFor(file.filename, file.additions, file.changes)
    }))
    .sort((a, b) => b.priority - a.priority);

  const selected: ReviewableFile[] = [];
  for (const file of reviewable) {
    if (selected.length >= maxFiles) {
      largeDiffLimited = true;
      break;
    }
    if (usedChars + file.patch.length > maxTotalDiffChars) {
      largeDiffLimited = true;
      break;
    }
    usedChars += file.patch.length;
    selected.push(file);
  }

  if (reviewable.length > selected.length) {
    largeDiffLimited = true;
  }

  return { files: selected, largeDiffLimited, totalChangedFiles: files.length };
}
