import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, RepositoryRow } from "@/types/database";

type SupabaseAdmin = SupabaseClient<Database>;

export interface GitHubRepositoryLinkInput {
  userId: string | null;
  installationId: number;
  githubRepoId: number;
  owner: string;
  name: string;
  fullName: string;
  private: boolean;
  defaultBranch?: string | null;
  htmlUrl?: string | null;
}

interface RepositoryLookupFilters {
  userId?: string | null;
  requireUserId?: boolean;
  githubRepoId?: number;
  fullName?: string;
  installationId?: number;
}

async function findRepository(
  supabase: SupabaseAdmin,
  filters: RepositoryLookupFilters
): Promise<RepositoryRow | null> {
  let query = supabase.from("repositories").select("*").order("updated_at", { ascending: false }).limit(1);

  if ("userId" in filters) {
    query = filters.userId ? query.eq("user_id", filters.userId) : query.is("user_id", null);
  }

  if (filters.requireUserId) {
    query = query.not("user_id", "is", null);
  }

  if (typeof filters.githubRepoId === "number") {
    query = query.eq("github_repo_id", filters.githubRepoId);
  }

  if (filters.fullName) {
    query = query.eq("full_name", filters.fullName);
  }

  if (typeof filters.installationId === "number") {
    query = query.eq("installation_id", filters.installationId);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data?.[0] || null;
}

export async function resolveUserIdForInstallationRepository(
  supabase: SupabaseAdmin,
  installationId: number,
  githubRepoId: number,
  repositoryFullName: string
) {
  const { data: installation, error: installationError } = await supabase
    .from("github_installations")
    .select("user_id")
    .eq("installation_id", installationId)
    .maybeSingle();

  if (installationError) throw installationError;
  if (installation?.user_id) return installation.user_id;

  const repositoryByInstallationAndId = await findRepository(supabase, {
    requireUserId: true,
    installationId,
    githubRepoId
  });
  if (repositoryByInstallationAndId?.user_id) return repositoryByInstallationAndId.user_id;

  const repositoryByInstallationAndName = await findRepository(supabase, {
    requireUserId: true,
    installationId,
    fullName: repositoryFullName
  });
  if (repositoryByInstallationAndName?.user_id) return repositoryByInstallationAndName.user_id;

  const repositoryById = await findRepository(supabase, {
    requireUserId: true,
    githubRepoId
  });
  if (repositoryById?.user_id) return repositoryById.user_id;

  const repositoryByName = await findRepository(supabase, {
    requireUserId: true,
    fullName: repositoryFullName
  });

  return repositoryByName?.user_id || null;
}

async function findBestRepositoryMatch(supabase: SupabaseAdmin, input: GitHubRepositoryLinkInput) {
  const attempts: RepositoryLookupFilters[] = [];

  if (input.userId) {
    attempts.push(
      { userId: input.userId, installationId: input.installationId, githubRepoId: input.githubRepoId },
      { userId: input.userId, installationId: input.installationId, fullName: input.fullName },
      { userId: input.userId, githubRepoId: input.githubRepoId },
      { userId: input.userId, fullName: input.fullName }
    );
  }

  attempts.push(
    { requireUserId: true, installationId: input.installationId, githubRepoId: input.githubRepoId },
    { requireUserId: true, installationId: input.installationId, fullName: input.fullName },
    { requireUserId: true, githubRepoId: input.githubRepoId },
    { requireUserId: true, fullName: input.fullName },
    { userId: null, installationId: input.installationId, githubRepoId: input.githubRepoId },
    { userId: null, installationId: input.installationId, fullName: input.fullName },
    { userId: null, githubRepoId: input.githubRepoId },
    { userId: null, fullName: input.fullName }
  );

  for (const filters of attempts) {
    const repository = await findRepository(supabase, filters);
    if (repository) return repository;
  }

  return null;
}

async function listDuplicateRepositories(
  supabase: SupabaseAdmin,
  canonicalRepositoryId: string,
  githubRepoId: number,
  fullName: string
) {
  const [byFullName, byGitHubId] = await Promise.all([
    supabase.from("repositories").select("*").eq("full_name", fullName).neq("id", canonicalRepositoryId),
    supabase.from("repositories").select("*").eq("github_repo_id", githubRepoId).neq("id", canonicalRepositoryId)
  ]);

  if (byFullName.error) throw byFullName.error;
  if (byGitHubId.error) throw byGitHubId.error;

  const duplicates = new Map<string, RepositoryRow>();
  for (const repository of [...(byFullName.data || []), ...(byGitHubId.data || [])]) {
    duplicates.set(repository.id, repository);
  }

  return Array.from(duplicates.values());
}

export async function reconcileDuplicateRepositories(
  supabase: SupabaseAdmin,
  canonicalRepository: RepositoryRow,
  userId: string | null
) {
  const resolvedUserId = userId || canonicalRepository.user_id;
  if (!resolvedUserId || !canonicalRepository.github_repo_id) return;

  await supabase
    .from("pull_request_reviews")
    .update({ user_id: resolvedUserId })
    .eq("repository_id", canonicalRepository.id)
    .is("user_id", null);

  const duplicates = await listDuplicateRepositories(
    supabase,
    canonicalRepository.id,
    canonicalRepository.github_repo_id,
    canonicalRepository.full_name
  );

  for (const duplicate of duplicates) {
    if (duplicate.user_id && duplicate.user_id !== resolvedUserId) continue;

    const { error: reviewMoveError } = await supabase
      .from("pull_request_reviews")
      .update({ repository_id: canonicalRepository.id, user_id: resolvedUserId })
      .eq("repository_id", duplicate.id);

    if (reviewMoveError) throw reviewMoveError;

    const { error: repositoryUpdateError } = await supabase
      .from("repositories")
      .update({ is_active: false })
      .eq("id", duplicate.id);

    if (repositoryUpdateError) throw repositoryUpdateError;
  }
}

export async function upsertLinkedRepository(supabase: SupabaseAdmin, input: GitHubRepositoryLinkInput) {
  const existing = await findBestRepositoryMatch(supabase, input);
  const linkedUserId = input.userId || existing?.user_id || null;
  const values: Database["public"]["Tables"]["repositories"]["Insert"] = {
    user_id: linkedUserId,
    github_repo_id: input.githubRepoId,
    owner: input.owner,
    name: input.name,
    full_name: input.fullName,
    private: input.private,
    default_branch: input.defaultBranch || null,
    installation_id: input.installationId,
    html_url: input.htmlUrl || null,
    is_active: true
  };

  if (existing) {
    const { data, error } = await supabase.from("repositories").update(values).eq("id", existing.id).select().single();
    if (error) throw error;
    await reconcileDuplicateRepositories(supabase, data, linkedUserId);
    return { repository: data, userId: data.user_id || linkedUserId };
  }

  const { data, error } = await supabase.from("repositories").insert(values).select().single();
  if (error) throw error;
  await reconcileDuplicateRepositories(supabase, data, linkedUserId);
  return { repository: data, userId: data.user_id || linkedUserId };
}
