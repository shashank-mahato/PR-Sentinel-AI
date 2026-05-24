create index if not exists repositories_github_repo_id_idx
on public.repositories(github_repo_id);

with duplicate_pairs as (
  select
    orphan.id as orphan_id,
    owned.id as owned_id,
    owned.user_id as owned_user_id
  from public.repositories orphan
  join lateral (
    select candidate.id, candidate.user_id, candidate.updated_at, candidate.created_at
    from public.repositories candidate
    where candidate.user_id is not null
      and candidate.id <> orphan.id
      and (
        candidate.full_name = orphan.full_name
        or (
          candidate.github_repo_id is not null
          and orphan.github_repo_id is not null
          and candidate.github_repo_id = orphan.github_repo_id
        )
      )
    order by candidate.updated_at desc nulls last, candidate.created_at desc nulls last
    limit 1
  ) owned on true
  where orphan.user_id is null
)
update public.pull_request_reviews review
set
  repository_id = duplicate_pairs.owned_id,
  user_id = coalesce(review.user_id, duplicate_pairs.owned_user_id),
  updated_at = now()
from duplicate_pairs
where review.repository_id = duplicate_pairs.orphan_id;

with duplicate_pairs as (
  select
    orphan.id as orphan_id,
    owned.id as owned_id
  from public.repositories orphan
  join lateral (
    select candidate.id, candidate.updated_at, candidate.created_at
    from public.repositories candidate
    where candidate.user_id is not null
      and candidate.id <> orphan.id
      and (
        candidate.full_name = orphan.full_name
        or (
          candidate.github_repo_id is not null
          and orphan.github_repo_id is not null
          and candidate.github_repo_id = orphan.github_repo_id
        )
      )
    order by candidate.updated_at desc nulls last, candidate.created_at desc nulls last
    limit 1
  ) owned on true
  where orphan.user_id is null
)
update public.repositories orphan
set
  is_active = false,
  updated_at = now()
from duplicate_pairs
where orphan.id = duplicate_pairs.orphan_id;

update public.pull_request_reviews review
set
  user_id = repository.user_id,
  updated_at = now()
from public.repositories repository
where review.repository_id = repository.id
  and review.user_id is null
  and repository.user_id is not null;
