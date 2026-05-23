import { ProtectedShell } from "@/components/layout/protected-shell";
import { ReviewsClient } from "@/components/reviews/reviews-client";

export const dynamic = "force-dynamic";

export default function ReviewsPage() {
  return (
    <ProtectedShell>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">Reviews</h1>
        <p className="mt-2 text-slate-400">Search and filter real Gemini reviews saved in Supabase.</p>
      </div>
      <ReviewsClient />
    </ProtectedShell>
  );
}
