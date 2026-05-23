create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists repositories_set_updated_at on public.repositories;
create trigger repositories_set_updated_at
before update on public.repositories
for each row execute function public.set_updated_at();

drop trigger if exists pull_request_reviews_set_updated_at on public.pull_request_reviews;
create trigger pull_request_reviews_set_updated_at
before update on public.pull_request_reviews
for each row execute function public.set_updated_at();

drop trigger if exists user_settings_set_updated_at on public.user_settings;
create trigger user_settings_set_updated_at
before update on public.user_settings
for each row execute function public.set_updated_at();

alter table public.profiles enable row level security;
alter table public.repositories enable row level security;
alter table public.pull_request_reviews enable row level security;
alter table public.review_findings enable row level security;
alter table public.user_settings enable row level security;
alter table public.webhook_events enable row level security;

drop policy if exists "Users can select their own profile" on public.profiles;
create policy "Users can select their own profile"
on public.profiles for select
using (user_id = auth.uid());

drop policy if exists "Users can insert their own profile" on public.profiles;
create policy "Users can insert their own profile"
on public.profiles for insert
with check (user_id = auth.uid());

drop policy if exists "Users can update their own profile" on public.profiles;
create policy "Users can update their own profile"
on public.profiles for update
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists "Users can select their repositories" on public.repositories;
create policy "Users can select their repositories"
on public.repositories for select
using (user_id = auth.uid());

drop policy if exists "Users can update their repositories" on public.repositories;
create policy "Users can update their repositories"
on public.repositories for update
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists "Users can select their reviews" on public.pull_request_reviews;
create policy "Users can select their reviews"
on public.pull_request_reviews for select
using (user_id = auth.uid());

drop policy if exists "Users can select findings through owned reviews" on public.review_findings;
create policy "Users can select findings through owned reviews"
on public.review_findings for select
using (
  exists (
    select 1
    from public.pull_request_reviews
    where pull_request_reviews.id = review_findings.review_id
      and pull_request_reviews.user_id = auth.uid()
  )
);

drop policy if exists "Users can select their settings" on public.user_settings;
create policy "Users can select their settings"
on public.user_settings for select
using (user_id = auth.uid());

drop policy if exists "Users can insert their settings" on public.user_settings;
create policy "Users can insert their settings"
on public.user_settings for insert
with check (user_id = auth.uid());

drop policy if exists "Users can update their settings" on public.user_settings;
create policy "Users can update their settings"
on public.user_settings for update
using (user_id = auth.uid())
with check (user_id = auth.uid());

do $$
begin
  alter publication supabase_realtime add table public.pull_request_reviews;
exception
  when duplicate_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.review_findings;
exception
  when duplicate_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.repositories;
exception
  when duplicate_object then null;
end $$;
