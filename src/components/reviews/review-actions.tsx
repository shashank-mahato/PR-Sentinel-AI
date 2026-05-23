"use client";

import { useState } from "react";
import { RefreshCw, Send } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ReviewActions({ reviewId, status }: { reviewId: string; status?: string | null }) {
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function callAction(action: "retry" | "post-comments") {
    setBusy(action);
    setMessage(null);
    const response = await fetch(`/api/reviews/${reviewId}/${action}`, { method: "POST" });
    setBusy(null);
    setMessage(response.ok ? "Action completed." : "Action failed. Check the review state and integration settings.");
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      {status === "failed" ? (
        <Button onClick={() => callAction("retry")} disabled={busy !== null}>
          <RefreshCw className={busy === "retry" ? "h-4 w-4 animate-spin" : "h-4 w-4"} />
          Retry review
        </Button>
      ) : null}
      <Button variant="outline" onClick={() => callAction("post-comments")} disabled={busy !== null}>
        <Send className={busy === "post-comments" ? "h-4 w-4 animate-pulse" : "h-4 w-4"} />
        Repost comments
      </Button>
      {message ? <span className="text-sm text-slate-400">{message}</span> : null}
    </div>
  );
}
