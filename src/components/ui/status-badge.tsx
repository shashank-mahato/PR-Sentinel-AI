import { Badge } from "./badge";

export function StatusBadge({ status }: { status?: string | null }) {
  const value = status || "pending";
  const variant =
    value === "completed" ? "success" : value === "failed" ? "failed" : value === "analyzing" ? "low" : "warning";

  return <Badge variant={variant}>{value}</Badge>;
}

export function SeverityBadge({ severity }: { severity?: string | null }) {
  const value = (severity || "low") as "critical" | "high" | "medium" | "low";
  return <Badge variant={value}>{value}</Badge>;
}
