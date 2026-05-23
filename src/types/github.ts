export interface PullRequestWebhookPayload {
  action: string;
  installation?: {
    id?: number;
  };
  repository?: {
    id: number;
    name: string;
    full_name: string;
    private: boolean;
    html_url: string;
    default_branch?: string | null;
    owner: {
      login: string;
    };
  };
  pull_request?: {
    id: number;
    number: number;
    title: string;
    body?: string | null;
    html_url: string;
    draft: boolean;
    user?: {
      login: string;
    } | null;
    head: {
      ref: string;
      sha: string;
    };
    base: {
      ref: string;
      sha: string;
    };
  };
}

export interface ReviewableFile {
  filename: string;
  status: string;
  additions: number;
  deletions: number;
  changes: number;
  patch: string;
  blob_url?: string | null;
  raw_url?: string | null;
  contents_url?: string | null;
  priority: number;
}
