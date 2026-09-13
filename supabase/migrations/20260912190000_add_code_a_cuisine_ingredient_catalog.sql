-- Dynamic Ingredient autocomplete catalog for Code-a-Cuisine.
-- Browser access remains behind n8n; only service_role can read/write this table and its RPCs.

create table if not exists code_a_cuisine.ingredient_catalog (
  id bigint generated always as identity primary key,
  name text not null,
  normalized_name text not null unique,
  usage_count bigint not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint ingredient_catalog_name_check check (
    length(btrim(name)) between 1 and 80
  ),
  constraint ingredient_catalog_normalized_name_check check (
    length(btrim(normalized_name)) between 1 and 80
  ),
  constraint ingredient_catalog_usage_count_check check (usage_count >= 0)
);

create index if not exists ingredient_catalog_usage_idx
  on code_a_cuisine.ingredient_catalog (usage_count desc, id asc);

alter table code_a_cuisine.ingredient_catalog enable row level security;
revoke all on table code_a_cuisine.ingredient_catalog from anon, authenticated;
grant select, insert, update on table code_a_cuisine.ingredient_catalog to service_role;
grant usage, select on sequence code_a_cuisine.ingredient_catalog_id_seq to service_role;

insert into code_a_cuisine.ingredient_catalog (name, normalized_name, usage_count)
select seed.name, lower(seed.name), 0
from unnest(array[
  'Pasta',
  'Pastrami',
  'Passionsfruit',
  'Potatoes',
  'Tomatoes',
  'Spinach',
  'Rice',
  'Chicken',
  'Salmon',
  'Onion',
  'Garlic',
  'Eggs',
  'Carrots',
  'Broccoli',
  'Bell pepper',
  'Cucumber',
  'Zucchini',
  'Mushrooms',
  'Avocado',
  'Lettuce',
  'Beef',
  'Pork',
  'Tofu',
  'Lentils',
  'Chickpeas',
  'Beans',
  'Corn',
  'Peas',
  'Milk',
  'Cream',
  'Yogurt',
  'Cheese',
  'Butter',
  'Flour',
  'Bread',
  'Oats',
  'Apples',
  'Bananas',
  'Lemons',
  'Limes',
  'Sunfloweroil'
]) as seed(name)
on conflict (normalized_name) do nothing;

create or replace function code_a_cuisine.list_ingredient_catalog()
returns jsonb
language sql
stable
security definer
set search_path = code_a_cuisine, public
as $$
  select jsonb_build_object(
    'items',
    coalesce(
      jsonb_agg(
        jsonb_build_object('name', name, 'usageCount', usage_count)
        order by usage_count desc, id asc
      ),
      '[]'::jsonb
    )
  )
  from code_a_cuisine.ingredient_catalog;
$$;

create or replace function code_a_cuisine.register_ingredient(p_name text)
returns jsonb
language plpgsql
security definer
set search_path = code_a_cuisine, public
as $$
declare
  v_name text;
  v_normalized text;
  v_stored_name text;
  v_usage_count bigint;
begin
  v_name := regexp_replace(btrim(coalesce(p_name, '')), '\s+', ' ', 'g');
  v_normalized := lower(v_name);

  if length(v_name) < 1 or length(v_name) > 80 then
    raise exception 'ingredient name must contain between 1 and 80 characters';
  end if;

  insert into code_a_cuisine.ingredient_catalog (name, normalized_name, usage_count)
  values (v_name, v_normalized, 1)
  on conflict (normalized_name) do update
    set usage_count = ingredient_catalog.usage_count + 1,
        updated_at = now()
  returning name, usage_count into v_stored_name, v_usage_count;

  return jsonb_build_object(
    'item',
    jsonb_build_object('name', v_stored_name, 'usageCount', v_usage_count)
  );
end;
$$;

revoke all on function code_a_cuisine.list_ingredient_catalog() from public, anon, authenticated;
revoke all on function code_a_cuisine.register_ingredient(text) from public, anon, authenticated;
grant execute on function code_a_cuisine.list_ingredient_catalog() to service_role;
grant execute on function code_a_cuisine.register_ingredient(text) to service_role;

comment on table code_a_cuisine.ingredient_catalog is
  'Dynamic ingredient autocomplete catalog with usage counters. Accessed only server-side through n8n.';
