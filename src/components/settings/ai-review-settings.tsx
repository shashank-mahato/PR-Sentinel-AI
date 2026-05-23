"use client";

import { useState } from "react";
import { Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type { UserSettingsRow } from "@/types/database";

export function AiReviewSettings({ settings, userId }: { settings: UserSettingsRow; userId: string }) {
  const [form, setForm] = useState({
    review_draft_prs: Boolean(settings.review_draft_prs),
    post_inline_comments: settings.post_inline_comments !== false,
    post_summary_comment: settings.post_summary_comment !== false,
    max_inline_comments: settings.max_inline_comments || 10,
    minimum_inline_severity: settings.minimum_inline_severity || "medium",
    block_merge_threshold: settings.block_merge_threshold || 70
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function saveSettings() {
    setSaving(true);
    setMessage(null);
    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase
      .from("user_settings")
      .upsert({ user_id: userId, ...form }, { onConflict: "user_id" });
    setSaving(false);
    setMessage(error ? "Unable to save settings." : "Settings saved.");
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>AI review preferences</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <SettingToggle
          label="Review draft PRs"
          checked={form.review_draft_prs}
          onChange={(value) => setForm((current) => ({ ...current, review_draft_prs: value }))}
        />
        <SettingToggle
          label="Post inline comments"
          checked={form.post_inline_comments}
          onChange={(value) => setForm((current) => ({ ...current, post_inline_comments: value }))}
        />
        <SettingToggle
          label="Post summary comment"
          checked={form.post_summary_comment}
          onChange={(value) => setForm((current) => ({ ...current, post_summary_comment: value }))}
        />
        <div className="grid gap-4 md:grid-cols-3">
          <label className="space-y-2 text-sm text-slate-300">
            <span>Maximum inline comments per PR</span>
            <Input
              type="number"
              min={0}
              max={50}
              value={form.max_inline_comments}
              onChange={(event) => setForm((current) => ({ ...current, max_inline_comments: Number(event.target.value) }))}
            />
          </label>
          <label className="space-y-2 text-sm text-slate-300">
            <span>Minimum severity for inline comments</span>
            <Select
              value={form.minimum_inline_severity}
              onChange={(event) => setForm((current) => ({ ...current, minimum_inline_severity: event.target.value }))}
            >
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </Select>
          </label>
          <label className="space-y-2 text-sm text-slate-300">
            <span>Block merge recommendation threshold</span>
            <Input
              type="number"
              min={0}
              max={100}
              value={form.block_merge_threshold}
              onChange={(event) => setForm((current) => ({ ...current, block_merge_threshold: Number(event.target.value) }))}
            />
          </label>
        </div>
        <div className="flex items-center gap-3">
          <Button onClick={saveSettings} disabled={saving}>
            <Save className="h-4 w-4" />
            Save preferences
          </Button>
          {message ? <span className="text-sm text-slate-400">{message}</span> : null}
        </div>
      </CardContent>
    </Card>
  );
}

function SettingToggle({
  label,
  checked,
  onChange
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-lg border border-slate-800 bg-slate-950 p-4">
      <span className="text-sm font-medium text-slate-200">{label}</span>
      <Switch checked={checked} onCheckedChange={onChange} label={label} />
    </div>
  );
}
