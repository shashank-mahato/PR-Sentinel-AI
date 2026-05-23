create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade unique,
  full_name text,
  avatar_url text,
  github_username text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.repositories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  github_repo_id bigint,
  owner text not null,
  name text not null,
  full_name text not null,
  private boolean default false,
  default_branch text,
  installation_id bigint,
  html_url text,
  is_active boolean default true,
  last_reviewed_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (user_id, github_repo_id, installation_id)
);

create table if not exists public.pull_request_reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  repository_id uuid references public.repositories(id) on delete cascade,
  github_pr_id bigint,
  pr_number int not null,
  pr_title text,
  pr_body text,
  pr_author text,
  pr_url text,
  base_branch text,
  head_branch text,
  status text default 'pending',
  risk_score int default 0,
  should_block_merge boolean default false,
  summary text,
  error_message text,
  large_diff_limited boolean default false,
  files_analyzed int default 0,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.review_findings (
  id uuid primary key default gen_random_uuid(),
  review_id uuid references public.pull_request_reviews(id) on delete cascade,
  severity text not null,
  category text not null,
  title text not null,
  file_path text,
  line_number int,
  explanation text,
  why_it_matters text,
  suggested_fix text,
  suggested_code text,
  github_comment_id bigint,
  comment_posted boolean default false,
  created_at timestamptz default now()
);

create table if not exists public.webhook_events (
  id uuid primary key default gen_random_uuid(),
  github_delivery_id text unique,
  event_type text,
  action text,
  repository_full_name text,
  pr_number int,
  payload jsonb,
  processed boolean default false,
  error_message text,
  created_at timestamptz default now()
);

create table if not exists public.user_settings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade unique,
  review_draft_prs boolean default false,
  post_inline_comments boolean default true,
  post_summary_comment boolean default true,
  max_inline_comments int default 10,
  minimum_inline_severity text default 'medium',
  block_merge_threshold int default 70,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists repositories_user_id_idx on public.repositories(user_id);
create index if not exists repositories_full_name_idx on public.repositories(full_name);
create index if not exists repositories_installation_id_idx on public.repositories(installation_id);
create index if not exists pull_request_reviews_user_id_idx on public.pull_request_reviews(user_id);
create index if not exists pull_request_reviews_repository_id_idx on public.pull_request_reviews(repository_id);
create index if not exists pull_request_reviews_status_idx on public.pull_request_reviews(status);
create index if not exists pull_request_reviews_created_at_idx on public.pull_request_reviews(created_at desc);
create index if not exists review_findings_review_id_idx on public.review_findings(review_id);
create index if not exists review_findings_severity_idx on public.review_findings(severity);
create index if not exists webhook_events_github_delivery_id_idx on public.webhook_events(github_delivery_id);
