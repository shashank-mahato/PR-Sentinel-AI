import { NextResponse, type NextRequest } from "next/server";
import { getInstallationOctokit } from "@/lib/github/octokit";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getAuthenticatedUser } from "@/lib/supabase/server";
import { AppError, jsonError } from "@/lib/utils/errors";
import { getPublicAppUrl } from "@/lib/utils/constants";

interface InstallationRepository {
  id: number;
  name: string;
  full_name: string;
  private: boolean;
  default_branch?: string | null;
  html_url?: string | null;
  owner?: {
    login?: string | null;
    type?: string | null;
    html_url?: string | null;
  } | null;
}

async function listInstallationRepositories(installationId: number) {
  const octokit = await getInstallationOctokit(installationId);
  const repositories: InstallationRepository[] = [];
  let page = 1;

  while (true) {
    const response = await octokit.request("GET /installation/repositories", {
      per_page: 100,
      page
    });
    const data = response.data as { repositories?: InstallationRepository[] };
    const pageRepositories = Array.isArray(data.repositories) ? data.repositories : [];
    repositories.push(...pageRepositories);

    if (pageRepositories.length < 100) break;
    page += 1;
    if (page > 10) break;
  }

  return repositories;
}

async function persistInstallation(installationId: number) {
  const { user } = await getAuthenticatedUser();
  if (!user) throw new AppError("Sign in before installing the GitHub App.", 401);

  const admin = createSupabaseAdminClient();
  const repositories = await listInstallationRepositories(installationId);
  const account = repositories[0]?.owner;

  const { error: installationError } = await admin.from("github_installations").upsert(
    {
      user_id: user.id,
      installation_id: installationId,
      account_login: account?.login || null,
      account_type: account?.type || null,
      html_url: account?.html_url || null
    },
    { onConflict: "installation_id" }
  );

  if (installationError) throw installationError;

  for (const repository of repositories) {
    const values = {
      user_id: user.id,
      github_repo_id: repository.id,
      owner: repository.owner?.login || repository.full_name.split("/")[0],
      name: repository.name,
      full_name: repository.full_name,
      private: repository.private,
      default_branch: repository.default_branch || null,
      installation_id: installationId,
      html_url: repository.html_url || null,
      is_active: true
    };

    const { data: existing, error: existingError } = await admin
      .from("repositories")
      .select("id")
      .eq("installation_id", installationId)
      .eq("github_repo_id", repository.id)
      .limit(1);

    if (existingError) throw existingError;

    if (existing?.[0]) {
      const { error } = await admin.from("repositories").update(values).eq("id", existing[0].id);
      if (error) throw error;
    } else {
      const { error } = await admin.from("repositories").insert(values);
      if (error) throw error;
    }
  }

  await admin.from("user_settings").upsert({ user_id: user.id }, { onConflict: "user_id" });
  return repositories.length;
}

export async function GET(request: NextRequest) {
  const installationId = Number(request.nextUrl.searchParams.get("installation_id"));
  const setupAction = request.nextUrl.searchParams.get("setup_action");
  const destination = new URL("/repositories", getPublicAppUrl());

  if (!Number.isFinite(installationId)) {
    destination.searchParams.set("error", "missing_installation");
    return NextResponse.redirect(destination);
  }

  try {
    const count = await persistInstallation(installationId);
    destination.searchParams.set("installed", "true");
    destination.searchParams.set("repositories", String(count));
    return NextResponse.redirect(destination);
  } catch (error) {
    if (error instanceof AppError && error.status === 401) {
      const loginUrl = new URL("/login", getPublicAppUrl());
      const next = new URL("/api/github/install", getPublicAppUrl());
      next.searchParams.set("installation_id", String(installationId));
      if (setupAction) next.searchParams.set("setup_action", setupAction);
      loginUrl.searchParams.set("next", `${next.pathname}${next.search}`);
      return NextResponse.redirect(loginUrl);
    }

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
