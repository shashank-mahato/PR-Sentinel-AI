import { getAuthenticatedUser } from "@/lib/supabase/server";
import { AppError, jsonError } from "@/lib/utils/errors";
import { loadReviewWithRelations } from "@/lib/reviews/data";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const { supabase, user } = await getAuthenticatedUser();
    if (!user) throw new AppError("Authentication required.", 401);

    const review = await loadReviewWithRelations(supabase, id, user.id);
    return Response.json({ review });
  } catch (error) {
    return jsonError(error, "Unable to load review.");
  }
}
