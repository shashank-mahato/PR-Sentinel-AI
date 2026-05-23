import { getAuthenticatedUser } from "@/lib/supabase/server";
import { jsonError, AppError } from "@/lib/utils/errors";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { supabase, user } = await getAuthenticatedUser();
    if (!user) throw new AppError("Authentication required.", 401);

    const { data: repositories, error } = await supabase
      .from("repositories")
      .select("*")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false });

    if (error) throw error;
    const repositoryIds = (repositories || []).map((repository) => repository.id);
    const { data: reviews, error: reviewError } = repositoryIds.length
      ? await supabase.from("pull_request_reviews").select("id, repository_id").in("repository_id", repositoryIds)
      : { data: [], error: null };

    if (reviewError) throw reviewError;
    const counts = new Map<string, number>();
    for (const review of reviews || []) {
      if (review.repository_id) counts.set(review.repository_id, (counts.get(review.repository_id) || 0) + 1);
    }

    return Response.json({
      repositories:
        repositories?.map((repository) => ({
          ...repository,
          total_reviews: counts.get(repository.id) || 0
        })) || []
    });
  } catch (error) {
    return jsonError(error, "Unable to load repositories.");
  }
}
