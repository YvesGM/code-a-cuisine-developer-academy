-- Code-a-Cuisine owns a dedicated schema inside the existing shared Supabase database.
-- Existing Poll App / Join Issue Collector schemas and migrations are intentionally untouched.

create schema if not exists code_a_cuisine;

revoke all on schema code_a_cuisine from public;
grant usage on schema code_a_cuisine to anon, authenticated, service_role;

create table if not exists code_a_cuisine.recipes (
  id text primary key,
  schema_version integer not null,
  title text not null,
  cuisine text not null,
  difficulty text not null,
  diet text not null,
  cooking_time_minutes integer not null,
  servings integer not null,
  cook_count integer not null,
  rank integer not null,
  payload jsonb not null,
  created_at timestamptz not null default now(),

  constraint recipes_schema_version_check check (schema_version = 2),
  constraint recipes_title_check check (length(btrim(title)) > 0),
  constraint recipes_cuisine_check check (
    cuisine in ('german', 'italian', 'indian', 'japanese', 'gourmet', 'fusion')
  ),
  constraint recipes_difficulty_check check (difficulty in ('quick', 'medium', 'complex')),
  constraint recipes_diet_check check (diet in ('vegetarian', 'vegan', 'keto', 'none')),
  constraint recipes_cooking_time_check check (
    (difficulty = 'quick' and cooking_time_minutes between 1 and 20)
    or (difficulty = 'medium' and cooking_time_minutes between 20 and 45)
    or (difficulty = 'complex' and cooking_time_minutes >= 45)
  ),
  constraint recipes_servings_check check (servings between 1 and 12),
  constraint recipes_cook_count_check check (cook_count between 1 and 3),
  constraint recipes_rank_check check (rank between 1 and 3),
  constraint recipes_payload_object_check check (jsonb_typeof(payload) = 'object'),
  constraint recipes_payload_required_arrays_check check (
    jsonb_typeof(payload -> 'ingredients') = 'array'
    and jsonb_array_length(payload -> 'ingredients') >= 1
    and jsonb_typeof(payload -> 'additionalIngredients') = 'array'
    and jsonb_array_length(payload -> 'additionalIngredients') <= 3
    and jsonb_typeof(payload -> 'directions') = 'array'
    and jsonb_array_length(payload -> 'directions') >= 1
  ),
  constraint recipes_payload_matches_columns_check check (
    payload ->> 'id' = id
    and payload ->> 'title' = title
    and payload ->> 'cuisine' = cuisine
    and payload ->> 'difficulty' = difficulty
    and payload ->> 'diet' = diet
    and (payload ->> 'cookingTimeMinutes')::integer = cooking_time_minutes
    and (payload ->> 'servings')::integer = servings
    and (payload ->> 'cookCount')::integer = cook_count
    and (payload ->> 'rank')::integer = rank
  )
);

create index if not exists recipes_created_at_idx
  on code_a_cuisine.recipes (created_at desc, id asc);

create index if not exists recipes_cuisine_created_at_idx
  on code_a_cuisine.recipes (cuisine, created_at desc, id asc);

alter table code_a_cuisine.recipes enable row level security;

revoke all on table code_a_cuisine.recipes from anon, authenticated;
grant select, insert on table code_a_cuisine.recipes to anon, authenticated;
grant all on table code_a_cuisine.recipes to service_role;

create policy "recipes_public_read"
  on code_a_cuisine.recipes
  for select
  to anon, authenticated
  using (true);

create policy "recipes_public_insert"
  on code_a_cuisine.recipes
  for insert
  to anon, authenticated
  with check (schema_version = 2);

comment on schema code_a_cuisine is
  'Code-a-Cuisine application schema. Kept separate from other projects in the shared Supabase database.';

comment on table code_a_cuisine.recipes is
  'Public library of validated Code-a-Cuisine recipes. Writes move behind n8n in the hardening phase.';
