import "server-only";
import { createGitHubApp } from "./app";

export interface GitHubInstallationClient {
  request: (route: string, parameters?: Record<string, unknown>) => Promise<{ data: unknown }>;
}

export async function getInstallationOctokit(installationId: number) {
  if (!installationId) {
    throw new Error("Missing GitHub installation ID.");
  }

  const app = createGitHubApp();
  const octokit = await app.getInstallationOctokit(installationId);
  return octokit as unknown as GitHubInstallationClient;
}
