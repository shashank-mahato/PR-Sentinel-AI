import { formatDistanceToNowStrict } from "date-fns";
import type { Severity } from "@/types/database";

export function formatDateTime(value?: string | null) {
  if (!value) return "Not available";
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

export function formatRelativeTime(value?: string | null) {
  if (!value) return "Never";
  return `${formatDistanceToNowStrict(new Date(value))} ago`;
}

export function pluralize(count: number, singular: string, plural = `${singular}s`) {
  return `${count} ${count === 1 ? singular : plural}`;
}

export function severityLabel(severity?: string | null) {
  if (!severity) return "Low";
  return severity.charAt(0).toUpperCase() + severity.slice(1);
}

export function severityRank(severity?: string | null) {
  const ranks: Record<Severity, number> = {
    low: 1,
    medium: 2,
    high: 3,
    critical: 4
  };
  return ranks[(severity || "low").toLowerCase() as Severity] || 1;
}
