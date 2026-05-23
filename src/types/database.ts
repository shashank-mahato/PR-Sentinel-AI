export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type ReviewStatus = "pending" | "analyzing" | "completed" | "failed";
export type Severity = "critical" | "high" | "medium" | "low";
export type FindingCategory =
  | "bug"
  | "security"
  | "performance"
  | "maintainability"
  | "code_smell"
  | "testing"
  | "documentation"
  | "reliability";

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          user_id: string | null;
          full_name: string | null;
          avatar_url: string | null;
          github_username: string | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          full_name?: string | null;
          avatar_url?: string | null;
          github_username?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Insert"]>;
        Relationships: [];
      };
      repositories: {
        Row: {
          id: string;
          user_id: string | null;
          github_repo_id: number | null;
          owner: string;
          name: string;
          full_name: string;
          private: boolean | null;
          default_branch: string | null;
          installation_id: number | null;
          html_url: string | null;
          is_active: boolean | null;
          last_reviewed_at: string | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          github_repo_id?: number | null;
          owner: string;
          name: string;
          full_name: string;
          private?: boolean | null;
          default_branch?: string | null;
          installation_id?: number | null;
          html_url?: string | null;
          is_active?: boolean | null;
          last_reviewed_at?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["repositories"]["Insert"]>;
        Relationships: [];
      };
      pull_request_reviews: {
        Row: {
          id: string;
          user_id: string | null;
          repository_id: string | null;
          github_pr_id: number | null;
          pr_number: number;
          pr_title: string | null;
          pr_body: string | null;
          pr_author: string | null;
          pr_url: string | null;
          base_branch: string | null;
          head_branch: string | null;
          status: ReviewStatus | string | null;
          risk_score: number | null;
          should_block_merge: boolean | null;
          summary: string | null;
          error_message: string | null;
          large_diff_limited: boolean | null;
          files_analyzed: number | null;
          started_at: string | null;
          completed_at: string | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          repository_id?: string | null;
          github_pr_id?: number | null;
          pr_number: number;
          pr_title?: string | null;
          pr_body?: string | null;
          pr_author?: string | null;
          pr_url?: string | null;
          base_branch?: string | null;
          head_branch?: string | null;
          status?: ReviewStatus | string | null;
          risk_score?: number | null;
          should_block_merge?: boolean | null;
          summary?: string | null;
          error_message?: string | null;
          large_diff_limited?: boolean | null;
          files_analyzed?: number | null;
          started_at?: string | null;
          completed_at?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["pull_request_reviews"]["Insert"]>;
        Relationships: [];
      };
      review_findings: {
        Row: {
          id: string;
          review_id: string | null;
          severity: Severity | string;
          category: FindingCategory | string;
          title: string;
          file_path: string | null;
          line_number: number | null;
          explanation: string | null;
          why_it_matters: string | null;
          suggested_fix: string | null;
          suggested_code: string | null;
          github_comment_id: number | null;
          comment_posted: boolean | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          review_id?: string | null;
          severity: Severity | string;
          category: FindingCategory | string;
          title: string;
          file_path?: string | null;
          line_number?: number | null;
          explanation?: string | null;
          why_it_matters?: string | null;
          suggested_fix?: string | null;
          suggested_code?: string | null;
          github_comment_id?: number | null;
          comment_posted?: boolean | null;
          created_at?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["review_findings"]["Insert"]>;
        Relationships: [];
      };
      webhook_events: {
        Row: {
          id: string;
          github_delivery_id: string | null;
          event_type: string | null;
          action: string | null;
          repository_full_name: string | null;
          pr_number: number | null;
          payload: Json | null;
          processed: boolean | null;
          error_message: string | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          github_delivery_id?: string | null;
          event_type?: string | null;
          action?: string | null;
          repository_full_name?: string | null;
          pr_number?: number | null;
          payload?: Json | null;
          processed?: boolean | null;
          error_message?: string | null;
          created_at?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["webhook_events"]["Insert"]>;
        Relationships: [];
      };
      user_settings: {
        Row: {
          id: string;
          user_id: string | null;
          review_draft_prs: boolean | null;
          post_inline_comments: boolean | null;
          post_summary_comment: boolean | null;
          max_inline_comments: number | null;
          minimum_inline_severity: Severity | string | null;
          block_merge_threshold: number | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          review_draft_prs?: boolean | null;
          post_inline_comments?: boolean | null;
          post_summary_comment?: boolean | null;
          max_inline_comments?: number | null;
          minimum_inline_severity?: Severity | string | null;
          block_merge_threshold?: number | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["user_settings"]["Insert"]>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}

export type RepositoryRow = Database["public"]["Tables"]["repositories"]["Row"];
export type ReviewRow = Database["public"]["Tables"]["pull_request_reviews"]["Row"];
export type FindingRow = Database["public"]["Tables"]["review_findings"]["Row"];
export type UserSettingsRow = Database["public"]["Tables"]["user_settings"]["Row"];
