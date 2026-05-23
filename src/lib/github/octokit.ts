import "server-only";
import { Octokit } from "@octokit/rest";
import { createGitHubApp } from "./app";

export async function getInstallationOctokit(installationId: number) {
  if (!installationId) {
    throw new Error("Missing GitHub installation ID.");
  }

  const app = createGitHubApp();
  const octokit = await app.getInstallationOctokit(installationId);
  return octokit as unknown as Octokit;
}
