create table if not exists public.github_installations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  installation_id bigint unique not null,
  account_login text,
  account_type text,
  html_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists github_installations_user_id_idx
on public.github_installations(user_id);

create index if not exists github_installations_installation_id_idx
on public.github_installations(installation_id);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists github_installations_set_updated_at on public.github_installations;
create trigger github_installations_set_updated_at
before update on public.github_installations
for each row execute function public.set_updated_at();

alter table public.github_installations enable row level security;

drop policy if exists "Users can select their github installations" on public.github_installations;
create policy "Users can select their github installations"
on public.github_installations for select
using (user_id = auth.uid());

drop policy if exists "Users can insert their github installations" on public.github_installations;
create policy "Users can insert their github installations"
on public.github_installations for insert
with check (user_id = auth.uid());

drop policy if exists "Users can update their github installations" on public.github_installations;
create policy "Users can update their github installations"
on public.github_installations for update
using (user_id = auth.uid())
with check (user_id = auth.uid());
