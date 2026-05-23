import "server-only";
import { App } from "@octokit/app";

export function normalizePrivateKey(privateKey: string) {
  return privateKey.replace(/\\n/g, "\n").replace(/^"|"$/g, "");
}

export function createGitHubApp() {
  const appId = process.env.GITHUB_APP_ID;
  const privateKey = process.env.GITHUB_APP_PRIVATE_KEY;

  if (!appId || !privateKey) {
    throw new Error("GitHub App credentials are not configured.");
  }

  return new App({
    appId,
    privateKey: normalizePrivateKey(privateKey)
  });
}
