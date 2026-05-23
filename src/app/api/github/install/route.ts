import { NextResponse, type NextRequest } from "next/server";
import { getInstallationOctokit } from "@/lib/github/octokit";
import { getAuthenticatedUser } from "@/lib/supabase/server";
import { AppError, jsonError } from "@/lib/utils/errors";
import { getPublicAppUrl } from "@/lib/utils/constants";

async function persistInstallation(installationId: number) {
  const { supabase, user } = await getAuthenticatedUser();
  if (!user) throw new AppError("Sign in before installing the GitHub App.", 401);

  const octokit = await getInstallationOctokit(installationId);
  const response = await octokit.apps.listReposAccessibleToInstallation({ per_page: 100 });
  const repositories = response.data.repositories;

  for (const repository of repositories) {
    await supabase.from("repositories").upsert(
      {
        user_id: user.id,
        github_repo_id: repository.id,
        owner: repository.owner?.login || repository.full_name.split("/")[0],
        name: repository.name,
        full_name: repository.full_name,
        private: repository.private,
        default_branch: repository.default_branch,
        installation_id: installationId,
        html_url: repository.html_url,
        is_active: true
      },
      { onConflict: "user_id,github_repo_id,installation_id" }
    );
  }

  await supabase.from("user_settings").upsert({ user_id: user.id }, { onConflict: "user_id" });
  return repositories.length;
}

export async function GET(request: NextRequest) {
  const installationId = Number(request.nextUrl.searchParams.get("installation_id"));
  const destination = new URL("/repositories", getPublicAppUrl());

  if (!Number.isFinite(installationId)) {
    destination.searchParams.set("error", "missing_installation");
    return NextResponse.redirect(destination);
  }

  try {
    const count = await persistInstallation(installationId);
    destination.searchParams.set("installed", String(count));
    return NextResponse.redirect(destination);
  } catch {
    destination.searchParams.set("error", "install_failed");
    return NextResponse.redirect(destination);
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { installation_id?: number };
    const installationId = Number(body.installation_id);
    if (!Number.isFinite(installationId)) throw new AppError("Missing installation_id.", 400);
    const count = await persistInstallation(installationId);
    return Response.json({ status: "ok", repositories: count });
  } catch (error) {
    return jsonError(error, "Unable to install GitHub App.");
  }
}
