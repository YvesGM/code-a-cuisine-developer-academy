-- Fix ambiguous PL/pgSQL column references in Issue Collector quota RPCs.
-- The n8n request body stays unchanged:
-- { "p_day_key": "YYYY-MM-DD", "p_limit": 10 }

begin;
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
  v_usage public.issue_collector_usage%rowtype;
begin
  if p_day_key is null then
    raise exception 'p_day_key is required';
  end if;

  if p_limit <= 0 then
    raise exception 'p_limit must be positive';
  end if;

  insert into public.issue_collector_usage (
    day_key,
    used,
    request_limit
  )
  values (
    p_day_key,
    0,
    p_limit
  )
  on conflict on constraint issue_collector_usage_pkey
  do nothing;

  update public.issue_collector_usage as usage
     set used = usage.used + 1,
         updated_at = now()
   where usage.day_key = p_day_key
     and usage.used < usage.request_limit
  returning usage.*
       into v_usage;

  if found then
    return query
    select
      true,
      v_usage.used,
      v_usage.request_limit,
      v_usage.day_key;
    return;
  end if;

  select usage.*
    into v_usage
    from public.issue_collector_usage as usage
   where usage.day_key = p_day_key;

  return query
  select
    false,
    v_usage.used,
    v_usage.request_limit,
    v_usage.day_key;
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
  v_usage public.issue_collector_usage%rowtype;
begin
  update public.issue_collector_usage as usage
     set used = greatest(usage.used - 1, 0),
         updated_at = now()
   where usage.day_key = p_day_key
  returning usage.*
       into v_usage;

  if not found then
    insert into public.issue_collector_usage (
      day_key,
      used,
      request_limit
    )
    values (
      p_day_key,
      0,
      10
    )
    on conflict on constraint issue_collector_usage_pkey
    do update
       set updated_at = now()
    returning issue_collector_usage.*
         into v_usage;
  end if;

  return query
  select
    v_usage.used,
    v_usage.request_limit,
    v_usage.day_key;
end;
$$;
revoke all on function public.issue_collector_claim_daily_slot(date, integer) from public;
revoke all on function public.issue_collector_release_daily_slot(date) from public;
grant execute on function public.issue_collector_claim_daily_slot(date, integer) to service_role;
grant execute on function public.issue_collector_release_daily_slot(date) to service_role;
commit;
