-- Join Issue Collector – Supabase automation state
-- Grounded against join2.0(9).zip.
-- Existing Join tasks remain in Firebase Realtime Database under /tasks.
-- Supabase stores only automation state for n8n.

begin;
create extension if not exists pgcrypto;
create table if not exists public.issue_collector_messages (
  id uuid primary key default gen_random_uuid(),
  message_id text not null,
  message_key text not null unique,
  sender_email text not null,
  task_id text,
  status text not null,
  received_at timestamptz,
  processed_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists issue_collector_messages_message_id_idx
  on public.issue_collector_messages (message_id);
create index if not exists issue_collector_messages_status_idx
  on public.issue_collector_messages (status);
create table if not exists public.issue_collector_usage (
  day_key date primary key,
  used integer not null default 0,
  request_limit integer not null default 10,
  updated_at timestamptz not null default now(),
  constraint issue_collector_usage_used_nonnegative check (used >= 0),
  constraint issue_collector_usage_limit_positive check (request_limit > 0),
  constraint issue_collector_usage_used_within_limit check (used <= request_limit)
);
create table if not exists public.issue_collector_manual_review (
  id uuid primary key default gen_random_uuid(),
  message_id text,
  sender_email text,
  subject text not null default '',
  normalized_body text not null default '',
  reason text not null,
  failure_stage text not null,
  status text not null default 'pending',
  created_at timestamptz not null default now()
);
create index if not exists issue_collector_manual_review_status_idx
  on public.issue_collector_manual_review (status);
create table if not exists public.issue_collector_runs (
  id uuid primary key default gen_random_uuid(),
  message_id text,
  task_id text,
  status text not null,
  stage text not null,
  error_code text,
  created_at timestamptz not null default now()
);
create index if not exists issue_collector_runs_message_id_idx
  on public.issue_collector_runs (message_id);
create index if not exists issue_collector_runs_status_idx
  on public.issue_collector_runs (status);
alter table public.issue_collector_messages enable row level security;
alter table public.issue_collector_usage enable row level security;
alter table public.issue_collector_manual_review enable row level security;
alter table public.issue_collector_runs enable row level security;
-- Intentionally no anon/authenticated policies.
-- n8n must use a server-side Supabase credential/service role.

create or replace function public.issue_collector_claim_daily_slot(
  p_day_key date,
  p_limit integer default 10
)
returns table (
  allowed boolean,
  used integer,
  request_limit integer,
  day_key date
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row public.issue_collector_usage%rowtype;
begin
  if p_day_key is null then
    raise exception 'p_day_key is required';
  end if;

  if p_limit <= 0 then
    raise exception 'p_limit must be positive';
  end if;

  insert into public.issue_collector_usage (day_key, used, request_limit)
  values (p_day_key, 0, p_limit)
  on conflict (day_key) do nothing;

  update public.issue_collector_usage
     set used = used + 1,
         updated_at = now()
   where issue_collector_usage.day_key = p_day_key
     and used < request_limit
  returning * into v_row;

  if found then
    return query select true, v_row.used, v_row.request_limit, v_row.day_key;
    return;
  end if;

  select *
    into v_row
    from public.issue_collector_usage
   where issue_collector_usage.day_key = p_day_key;

  return query select false, v_row.used, v_row.request_limit, v_row.day_key;
end;
$$;
create or replace function public.issue_collector_release_daily_slot(
  p_day_key date
)
returns table (
  used integer,
  request_limit integer,
  day_key date
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row public.issue_collector_usage%rowtype;
begin
  update public.issue_collector_usage
     set used = greatest(used - 1, 0),
         updated_at = now()
   where issue_collector_usage.day_key = p_day_key
  returning * into v_row;

  if not found then
    insert into public.issue_collector_usage (day_key, used, request_limit)
    values (p_day_key, 0, 10)
    on conflict (day_key) do update
      set updated_at = now()
    returning * into v_row;
  end if;

  return query select v_row.used, v_row.request_limit, v_row.day_key;
end;
$$;
create or replace function public.issue_collector_get_daily_usage(
  p_day_key date
)
returns table (
  used integer,
  request_limit integer,
  day_key date
)
language sql
security definer
set search_path = public
as $$
  select
    coalesce(u.used, 0)::integer as used,
    coalesce(u.request_limit, 10)::integer as request_limit,
    p_day_key as day_key
  from (select 1) seed
  left join public.issue_collector_usage u
    on u.day_key = p_day_key;
$$;
revoke all on function public.issue_collector_claim_daily_slot(date, integer) from public;
revoke all on function public.issue_collector_release_daily_slot(date) from public;
revoke all on function public.issue_collector_get_daily_usage(date) from public;
grant execute on function public.issue_collector_claim_daily_slot(date, integer) to service_role;
grant execute on function public.issue_collector_release_daily_slot(date) to service_role;
grant execute on function public.issue_collector_get_daily_usage(date) to service_role;
commit;
