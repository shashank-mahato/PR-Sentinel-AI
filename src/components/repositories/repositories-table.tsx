"use client";

import { useState } from "react";
import { ExternalLink } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { formatRelativeTime } from "@/lib/utils/formatting";
import type { RepositoryRow } from "@/types/database";

export type RepositoryWithCount = RepositoryRow & { total_reviews: number };

export function RepositoriesTable({ repositories }: { repositories: RepositoryWithCount[] }) {
  const [rows, setRows] = useState(repositories);

  async function toggleRepository(repository: RepositoryWithCount, checked: boolean) {
    setRows((current) => current.map((row) => (row.id === repository.id ? { ...row, is_active: checked } : row)));
    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase.from("repositories").update({ is_active: checked }).eq("id", repository.id);
    if (error) {
      setRows((current) => current.map((row) => (row.id === repository.id ? { ...row, is_active: repository.is_active } : row)));
    }
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-slate-800 bg-slate-950/70">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Owner</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Full name</TableHead>
            <TableHead>Visibility</TableHead>
            <TableHead>Default branch</TableHead>
            <TableHead>Active</TableHead>
            <TableHead>Installation ID</TableHead>
            <TableHead>Last reviewed</TableHead>
            <TableHead>Total reviews</TableHead>
            <TableHead>GitHub</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((repository) => (
            <TableRow key={repository.id}>
              <TableCell>{repository.owner}</TableCell>
              <TableCell>{repository.name}</TableCell>
              <TableCell>{repository.full_name}</TableCell>
              <TableCell>
                <Badge>{repository.private ? "private" : "public"}</Badge>
              </TableCell>
              <TableCell>{repository.default_branch || "main"}</TableCell>
              <TableCell>
                <Switch
                  checked={Boolean(repository.is_active)}
                  onCheckedChange={(checked) => toggleRepository(repository, checked)}
                  label={`Enable AI review for ${repository.full_name}`}
                />
              </TableCell>
              <TableCell>{repository.installation_id || "Unknown"}</TableCell>
              <TableCell>{formatRelativeTime(repository.last_reviewed_at)}</TableCell>
              <TableCell>{repository.total_reviews}</TableCell>
              <TableCell>
                {repository.html_url ? (
                  <a className="text-teal-300 hover:text-teal-200" href={repository.html_url} rel="noreferrer" target="_blank">
                    <ExternalLink className="h-4 w-4" />
                  </a>
                ) : (
                  "Unavailable"
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
