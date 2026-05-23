import type { FindingRow, RepositoryRow, ReviewRow } from "./database";

export interface ReviewWithRelations extends ReviewRow {
  repositories: RepositoryRow | null;
  review_findings: FindingRow[];
}

export interface SeverityCounts {
  critical: number;
  high: number;
  medium: number;
  low: number;
}

export type RiskLevel = "Low" | "Medium" | "High" | "Critical";
