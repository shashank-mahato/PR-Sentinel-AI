import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, FindingRow, RepositoryRow, ReviewRow } from "@/types/database";
import type { ReviewWithRelations } from "@/types/review";

export async function attachReviewRelations(
  supabase: SupabaseClient<Database>,
  reviews: ReviewRow[]
): Promise<ReviewWithRelations[]> {
  if (reviews.length === 0) return [];

  const repositoryIds = Array.from(new Set(reviews.map((review) => review.repository_id).filter(Boolean))) as string[];
  const reviewIds = reviews.map((review) => review.id);

  const [repositoriesResult, findingsResult] = await Promise.all([
    repositoryIds.length
      ? supabase.from("repositories").select("*").in("id", repositoryIds)
      : Promise.resolve({ data: [] as RepositoryRow[], error: null }),
    supabase.from("review_findings").select("*").in("review_id", reviewIds)
  ]);

  if (repositoriesResult.error) throw repositoriesResult.error;
  if (findingsResult.error) throw findingsResult.error;

  const repositories = new Map((repositoriesResult.data || []).map((repository) => [repository.id, repository]));
  const findingsByReview = new Map<string, FindingRow[]>();

  for (const finding of findingsResult.data || []) {
    if (!finding.review_id) continue;
    const list = findingsByReview.get(finding.review_id) || [];
    list.push(finding);
    findingsByReview.set(finding.review_id, list);
  }

  return reviews.map((review) => ({
    ...review,
    repositories: review.repository_id ? repositories.get(review.repository_id) || null : null,
    review_findings: findingsByReview.get(review.id) || []
  }));
}

export async function loadReviewWithRelations(
  supabase: SupabaseClient<Database>,
  reviewId: string,
  userId: string
) {
  const { data: review, error } = await supabase
    .from("pull_request_reviews")
    .select("*")
    .eq("id", reviewId)
    .eq("user_id", userId)
    .single();

  if (error) throw error;
  const [withRelations] = await attachReviewRelations(supabase, [review]);
  return withRelations;
}
