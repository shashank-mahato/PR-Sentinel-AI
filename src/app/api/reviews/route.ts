import { getAuthenticatedUser } from "@/lib/supabase/server";
import { AppError, jsonError } from "@/lib/utils/errors";
import { severityRank } from "@/lib/utils/formatting";
import { attachReviewRelations } from "@/lib/reviews/data";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { supabase, user } = await getAuthenticatedUser();
    if (!user) throw new AppError("Authentication required.", 401);

    const url = new URL(request.url);
    const status = url.searchParams.get("status");
    const repositoryId = url.searchParams.get("repository");
    const search = url.searchParams.get("search");
    const severity = url.searchParams.get("severity");
    const from = url.searchParams.get("from");
    const to = url.searchParams.get("to");

    let query = supabase
      .from("pull_request_reviews")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (status && status !== "all") query = query.eq("status", status);
    if (repositoryId && repositoryId !== "all") query = query.eq("repository_id", repositoryId);
    if (from) query = query.gte("created_at", from);
    if (to) query = query.lte("created_at", to);
    const { data, error } = await query;
    if (error) throw error;

    const withRelations = await attachReviewRelations(supabase, data || []);
    const searched = search
      ? withRelations.filter(
          (review) =>
            review.pr_title?.toLowerCase().includes(search.toLowerCase()) ||
            review.repositories?.full_name.toLowerCase().includes(search.toLowerCase())
        )
      : withRelations;
    const reviews =
      severity && severity !== "all"
        ? searched.filter((review) =>
            review.review_findings?.some((finding) => severityRank(finding.severity) >= severityRank(severity))
          )
        : searched;

    return Response.json({ reviews });
  } catch (error) {
    return jsonError(error, "Unable to load reviews.");
  }
}
