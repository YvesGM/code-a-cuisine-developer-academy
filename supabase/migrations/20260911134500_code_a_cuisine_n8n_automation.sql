-- Code-a-Cuisine n8n automation hardening.
-- Recipe generation is now persisted server-side by n8n with the existing Supabase service credential.
-- Browser access stays read-only for the public library.

drop policy if exists "recipes_public_insert" on code_a_cuisine.recipes;
revoke insert on table code_a_cuisine.recipes from anon, authenticated;
grant insert on table code_a_cuisine.recipes to service_role;

create table if not exists code_a_cuisine.generation_quota_claims (
  request_id text primary key,
  day_key date not null,
  client_ip inet not null,
  recipe_count smallint not null default 3,
  status text not null default 'claimed',
  created_at timestamptz not null default now(),
  completed_at timestamptz,
  released_at timestamptz,

  constraint generation_quota_recipe_count_check check (recipe_count between 1 and 3),
  constraint generation_quota_status_check check (status in ('claimed', 'completed', 'released'))
);

create index if not exists generation_quota_day_ip_idx
  on code_a_cuisine.generation_quota_claims (day_key, client_ip, status);

create index if not exists generation_quota_day_status_idx
  on code_a_cuisine.generation_quota_claims (day_key, status);

alter table code_a_cuisine.generation_quota_claims enable row level security;
revoke all on table code_a_cuisine.generation_quota_claims from anon, authenticated;
grant all on table code_a_cuisine.generation_quota_claims to service_role;

create table if not exists code_a_cuisine.workflow_runs (
  id bigint generated always as identity primary key,
  request_id text,
  client_ip inet,
  status text not null,
  stage text not null,
  error_code text,
  error_message text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),

  constraint workflow_runs_status_check check (
    status in ('success', 'rejected', 'failed', 'quota_rejected')
  ),
  constraint workflow_runs_stage_check check (length(btrim(stage)) > 0),
  constraint workflow_runs_metadata_object_check check (jsonb_typeof(metadata) = 'object')
);

create index if not exists workflow_runs_created_at_idx
  on code_a_cuisine.workflow_runs (created_at desc);

create index if not exists workflow_runs_request_id_idx
  on code_a_cuisine.workflow_runs (request_id)
  where request_id is not null;

alter table code_a_cuisine.workflow_runs enable row level security;
revoke all on table code_a_cuisine.workflow_runs from anon, authenticated;
grant all on table code_a_cuisine.workflow_runs to service_role;
grant usage, select on sequence code_a_cuisine.workflow_runs_id_seq to service_role;

create or replace function code_a_cuisine.claim_generation_quota(
  p_request_id text,
  p_client_ip text,
  p_day_key date,
  p_recipe_count integer default 3,
  p_ip_limit integer default 3,
  p_global_limit integer default 12,
  p_min_interval_seconds integer default 10
)
returns jsonb
language plpgsql
security definer
set search_path = code_a_cuisine, public
as $$
declare
  v_ip inet;
  v_ip_used integer;
  v_global_used integer;
  v_existing code_a_cuisine.generation_quota_claims%rowtype;
  v_last_claim timestamptz;
  v_retry_after integer := 0;
begin
  if p_request_id is null or length(btrim(p_request_id)) = 0 then
    raise exception 'request_id is required';
  end if;
  if p_day_key is null then
    raise exception 'day_key is required';
  end if;
  if p_recipe_count <= 0 or p_ip_limit <= 0 or p_global_limit <= 0 then
    raise exception 'quota values must be positive';
  end if;
  if p_recipe_count > p_ip_limit or p_recipe_count > p_global_limit then
    raise exception 'recipe_count exceeds configured quota';
  end if;
  if p_min_interval_seconds < 0 then
    raise exception 'minimum interval must not be negative';
  end if;

  begin
    v_ip := p_client_ip::inet;
  exception when others then
    raise exception 'invalid client ip';
  end;

  -- One lock per calendar day serializes the tiny quota decision and prevents concurrent overspend.
  perform pg_advisory_xact_lock(hashtext('code_a_cuisine:' || p_day_key::text));

  select *
    into v_existing
    from code_a_cuisine.generation_quota_claims
   where request_id = p_request_id
   for update;

  if found and v_existing.status in ('claimed', 'completed') then
    if v_existing.client_ip <> v_ip
       or v_existing.day_key <> p_day_key
       or v_existing.recipe_count <> p_recipe_count then
      raise exception 'request_id already belongs to another quota claim';
    end if;

    select coalesce(sum(recipe_count), 0)::integer
      into v_ip_used
      from code_a_cuisine.generation_quota_claims
     where day_key = p_day_key
       and client_ip = v_ip
       and status in ('claimed', 'completed');

    select coalesce(sum(recipe_count), 0)::integer
      into v_global_used
      from code_a_cuisine.generation_quota_claims
     where day_key = p_day_key
       and status in ('claimed', 'completed');

    -- Reusing a request id must never trigger another paid AI call.
    return jsonb_build_object(
      'allowed', false,
      'reason', 'duplicate_request',
      'dayKey', p_day_key,
      'ipUsedRecipes', v_ip_used,
      'ipLimitRecipes', p_ip_limit,
      'ipRemainingRecipes', greatest(p_ip_limit - v_ip_used, 0),
      'globalUsedRecipes', v_global_used,
      'globalLimitRecipes', p_global_limit,
      'globalRemainingRecipes', greatest(p_global_limit - v_global_used, 0),
      'retryAfterSeconds', 0
    );
  end if;

  select max(created_at)
    into v_last_claim
    from code_a_cuisine.generation_quota_claims
   where day_key = p_day_key
     and client_ip = v_ip;

  if v_last_claim is not null
     and p_min_interval_seconds > 0
     and v_last_claim > now() - make_interval(secs => p_min_interval_seconds) then
    v_retry_after := greatest(
      ceil(
        extract(
          epoch from (
            v_last_claim + make_interval(secs => p_min_interval_seconds) - now()
          )
        )
      )::integer,
      1
    );

    select coalesce(sum(recipe_count), 0)::integer
      into v_ip_used
      from code_a_cuisine.generation_quota_claims
     where day_key = p_day_key
       and client_ip = v_ip
       and status in ('claimed', 'completed');

    select coalesce(sum(recipe_count), 0)::integer
      into v_global_used
      from code_a_cuisine.generation_quota_claims
     where day_key = p_day_key
       and status in ('claimed', 'completed');

    return jsonb_build_object(
      'allowed', false,
      'reason', 'throttled',
      'dayKey', p_day_key,
      'ipUsedRecipes', v_ip_used,
      'ipLimitRecipes', p_ip_limit,
      'ipRemainingRecipes', greatest(p_ip_limit - v_ip_used, 0),
      'globalUsedRecipes', v_global_used,
      'globalLimitRecipes', p_global_limit,
      'globalRemainingRecipes', greatest(p_global_limit - v_global_used, 0),
      'retryAfterSeconds', v_retry_after
    );
  end if;

  select coalesce(sum(recipe_count), 0)::integer
    into v_ip_used
    from code_a_cuisine.generation_quota_claims
   where day_key = p_day_key
     and client_ip = v_ip
     and status in ('claimed', 'completed');

  select coalesce(sum(recipe_count), 0)::integer
    into v_global_used
    from code_a_cuisine.generation_quota_claims
   where day_key = p_day_key
     and status in ('claimed', 'completed');

  if v_ip_used + p_recipe_count > p_ip_limit then
    return jsonb_build_object(
      'allowed', false,
      'reason', 'ip_limit_reached',
      'dayKey', p_day_key,
      'ipUsedRecipes', v_ip_used,
      'ipLimitRecipes', p_ip_limit,
      'ipRemainingRecipes', greatest(p_ip_limit - v_ip_used, 0),
      'globalUsedRecipes', v_global_used,
      'globalLimitRecipes', p_global_limit,
      'globalRemainingRecipes', greatest(p_global_limit - v_global_used, 0),
      'retryAfterSeconds', 0
    );
  end if;

  if v_global_used + p_recipe_count > p_global_limit then
    return jsonb_build_object(
      'allowed', false,
      'reason', 'global_limit_reached',
      'dayKey', p_day_key,
      'ipUsedRecipes', v_ip_used,
      'ipLimitRecipes', p_ip_limit,
      'ipRemainingRecipes', greatest(p_ip_limit - v_ip_used, 0),
      'globalUsedRecipes', v_global_used,
      'globalLimitRecipes', p_global_limit,
      'globalRemainingRecipes', greatest(p_global_limit - v_global_used, 0),
      'retryAfterSeconds', 0
    );
  end if;

  insert into code_a_cuisine.generation_quota_claims (
    request_id,
    day_key,
    client_ip,
    recipe_count,
    status,
    created_at,
    completed_at,
    released_at
  )
  values (
    p_request_id,
    p_day_key,
    v_ip,
    p_recipe_count,
    'claimed',
    now(),
    null,
    null
  )
  on conflict (request_id) do update
    set day_key = excluded.day_key,
        client_ip = excluded.client_ip,
        recipe_count = excluded.recipe_count,
        status = 'claimed',
        created_at = now(),
        completed_at = null,
        released_at = null
    where code_a_cuisine.generation_quota_claims.status = 'released';

  v_ip_used := v_ip_used + p_recipe_count;
  v_global_used := v_global_used + p_recipe_count;

  return jsonb_build_object(
    'allowed', true,
    'reason', null,
    'dayKey', p_day_key,
    'ipUsedRecipes', v_ip_used,
    'ipLimitRecipes', p_ip_limit,
    'ipRemainingRecipes', greatest(p_ip_limit - v_ip_used, 0),
    'globalUsedRecipes', v_global_used,
    'globalLimitRecipes', p_global_limit,
    'globalRemainingRecipes', greatest(p_global_limit - v_global_used, 0),
    'retryAfterSeconds', 0
  );
end;
$$;

create or replace function code_a_cuisine.complete_generation_quota(p_request_id text)
returns jsonb
language plpgsql
security definer
set search_path = code_a_cuisine, public
as $$
declare
  v_changed integer;
begin
  update code_a_cuisine.generation_quota_claims
     set status = 'completed',
         completed_at = now(),
         released_at = null
   where request_id = p_request_id
     and status = 'claimed';

  get diagnostics v_changed = row_count;
  return jsonb_build_object('completed', v_changed = 1, 'requestId', p_request_id);
end;
$$;

create or replace function code_a_cuisine.release_generation_quota(p_request_id text)
returns jsonb
language plpgsql
security definer
set search_path = code_a_cuisine, public
as $$
declare
  v_changed integer;
begin
  update code_a_cuisine.generation_quota_claims
     set status = 'released',
         released_at = now(),
         completed_at = null
   where request_id = p_request_id
     and status = 'claimed';

  get diagnostics v_changed = row_count;
  return jsonb_build_object('released', v_changed = 1, 'requestId', p_request_id);
end;
$$;

create or replace function code_a_cuisine.get_generation_quota(
  p_client_ip text,
  p_day_key date,
  p_recipe_count integer default 3,
  p_ip_limit integer default 3,
  p_global_limit integer default 12
)
returns jsonb
language plpgsql
security definer
set search_path = code_a_cuisine, public
as $$
declare
  v_ip inet;
  v_ip_used integer;
  v_global_used integer;
begin
  begin
    v_ip := p_client_ip::inet;
  exception when others then
    raise exception 'invalid client ip';
  end;

  select coalesce(sum(recipe_count), 0)::integer
    into v_ip_used
    from code_a_cuisine.generation_quota_claims
   where day_key = p_day_key
     and client_ip = v_ip
     and status in ('claimed', 'completed');

  select coalesce(sum(recipe_count), 0)::integer
    into v_global_used
    from code_a_cuisine.generation_quota_claims
   where day_key = p_day_key
     and status in ('claimed', 'completed');

  return jsonb_build_object(
    'dayKey', p_day_key,
    'ipUsedRecipes', v_ip_used,
    'ipLimitRecipes', p_ip_limit,
    'ipRemainingRecipes', greatest(p_ip_limit - v_ip_used, 0),
    'globalUsedRecipes', v_global_used,
    'globalLimitRecipes', p_global_limit,
    'globalRemainingRecipes', greatest(p_global_limit - v_global_used, 0),
    'generationAllowed',
      v_ip_used + p_recipe_count <= p_ip_limit
      and v_global_used + p_recipe_count <= p_global_limit,
    'reason',
      case
        when v_ip_used + p_recipe_count > p_ip_limit then 'ip_limit_reached'
        when v_global_used + p_recipe_count > p_global_limit then 'global_limit_reached'
        else null
      end
  );
end;
$$;

revoke all on function code_a_cuisine.claim_generation_quota(text, text, date, integer, integer, integer, integer) from public, anon, authenticated;
revoke all on function code_a_cuisine.complete_generation_quota(text) from public, anon, authenticated;
revoke all on function code_a_cuisine.release_generation_quota(text) from public, anon, authenticated;
revoke all on function code_a_cuisine.get_generation_quota(text, date, integer, integer, integer) from public, anon, authenticated;

grant execute on function code_a_cuisine.claim_generation_quota(text, text, date, integer, integer, integer, integer) to service_role;
grant execute on function code_a_cuisine.complete_generation_quota(text) to service_role;
grant execute on function code_a_cuisine.release_generation_quota(text) to service_role;
grant execute on function code_a_cuisine.get_generation_quota(text, date, integer, integer, integer) to service_role;

comment on table code_a_cuisine.generation_quota_claims is
  'Atomic daily recipe quota claims. Three recipes equal one generation request.';
comment on table code_a_cuisine.workflow_runs is
  'Server-side n8n audit log for validation, quota, AI and persistence outcomes.';
