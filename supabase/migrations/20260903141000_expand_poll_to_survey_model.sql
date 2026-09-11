-- Expand the existing poll schema to the Academy survey model.
-- This migration is intentionally self-contained and repairs the vote columns
-- used by the current Angular service if they are missing remotely.

alter table public.polls
  add column if not exists category text,
  add column if not exists title text,
  add column if not exists description text,
  add column if not exists deadline timestamptz;
update public.polls
set
  category = coalesce(nullif(trim(category), ''), 'Other'),
  title = coalesce(nullif(trim(title), ''), question),
  deadline = case
    when closed = true and deadline is null then now() - interval '1 minute'
    else deadline
  end;
alter table public.polls
  alter column category set default 'Other',
  alter column category set not null,
  alter column title set not null;
alter table public.polls
  drop constraint if exists polls_category_length_check,
  add constraint polls_category_length_check
    check (char_length(trim(category)) between 1 and 60),
  drop constraint if exists polls_title_length_check,
  add constraint polls_title_length_check
    check (char_length(trim(title)) between 1 and 120),
  drop constraint if exists polls_description_length_check,
  add constraint polls_description_length_check
    check (description is null or char_length(description) <= 1000);
-- The current Angular service inserts poll_id and voter_token into votes.
-- Make sure the remote schema actually contains both columns before any
-- policies or seed data reference them.
alter table public.votes
  add column if not exists poll_id uuid,
  add column if not exists voter_token uuid;
update public.votes
set poll_id = poll_options.poll_id
from public.poll_options
where public.votes.option_id = poll_options.id
  and public.votes.poll_id is null;
update public.votes
set voter_token = gen_random_uuid()
where voter_token is null;
alter table public.votes
  alter column poll_id set not null,
  alter column voter_token set not null;
create index if not exists votes_poll_id_idx
  on public.votes(poll_id);
create unique index if not exists poll_options_id_poll_id_unique_idx
  on public.poll_options(id, poll_id);
create unique index if not exists votes_poll_voter_unique_idx
  on public.votes(poll_id, voter_token);
do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'votes_poll_id_fkey'
      and conrelid = 'public.votes'::regclass
  ) then
    alter table public.votes
      add constraint votes_poll_id_fkey
      foreign key (poll_id)
      references public.polls(id)
      on delete cascade;
  end if;
end
$$;
do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'votes_option_poll_fkey'
      and conrelid = 'public.votes'::regclass
  ) then
    alter table public.votes
      add constraint votes_option_poll_fkey
      foreign key (option_id, poll_id)
      references public.poll_options(id, poll_id)
      on delete cascade;
  end if;
end
$$;
-- Replace old closed-based write policies with deadline-based survey rules.
drop policy if exists "Polls can be created publicly" on public.polls;
drop policy if exists "Polls can be closed publicly" on public.polls;
drop policy if exists "Poll options can be created for open polls" on public.poll_options;
drop policy if exists "Poll options can be created for active surveys" on public.poll_options;
drop policy if exists "Votes can be created for open polls" on public.votes;
drop policy if exists "Votes can be created for active surveys" on public.votes;
create policy "Polls can be created publicly"
  on public.polls
  for insert
  to anon, authenticated
  with check (
    char_length(trim(category)) between 1 and 60
    and char_length(trim(title)) between 1 and 120
    and char_length(trim(question)) between 3 and 250
  );
create policy "Poll options can be created for active surveys"
  on public.poll_options
  for insert
  to anon, authenticated
  with check (
    exists (
      select 1
      from public.polls
      where polls.id = poll_options.poll_id
        and (polls.deadline is null or polls.deadline > now())
    )
  );
create policy "Votes can be created for active surveys"
  on public.votes
  for insert
  to anon, authenticated
  with check (
    exists (
      select 1
      from public.poll_options
      join public.polls on polls.id = poll_options.poll_id
      where poll_options.id = votes.option_id
        and poll_options.poll_id = votes.poll_id
        and (polls.deadline is null or polls.deadline > now())
    )
  );
-- Keep the column-level grants aligned with the current Angular vote insert.
revoke select on table public.votes from anon, authenticated;
revoke insert on table public.votes from anon, authenticated;
grant select (id, poll_id, option_id, created_at)
  on table public.votes
  to anon, authenticated;
grant insert (poll_id, option_id, voter_token)
  on table public.votes
  to anon, authenticated;
revoke update on table public.polls from anon, authenticated;
alter table public.polls
  drop column if exists closed;
-- Academy test data: active, soon-ending and expired surveys.
insert into public.polls (
  id,
  category,
  title,
  question,
  description,
  deadline,
  created_at
)
values
  (
    '10000000-0000-4000-8000-000000000001',
    'Technology',
    'Frontend Framework 2026',
    'Which frontend framework do you currently prefer?',
    'A short survey about current frontend development preferences.',
    now() + interval '3 hours',
    now() - interval '1 day'
  ),
  (
    '10000000-0000-4000-8000-000000000002',
    'Lifestyle',
    'Remote Work Routine',
    'Where do you prefer to work most days?',
    null,
    now() + interval '3 days',
    now() - interval '2 days'
  ),
  (
    '10000000-0000-4000-8000-000000000003',
    'Education',
    'Learning Format',
    'Which learning format helps you most?',
    'This survey is intentionally expired for testing the Past Surveys view.',
    now() - interval '1 day',
    now() - interval '5 days'
  ),
  (
    '10000000-0000-4000-8000-000000000004',
    'Entertainment',
    'Evening Entertainment',
    'What do you most often choose for an evening at home?',
    null,
    now() - interval '7 days',
    now() - interval '10 days'
  )
on conflict (id) do nothing;
insert into public.poll_options (id, poll_id, text)
values
  ('20000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', 'Angular'),
  ('20000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000001', 'React'),
  ('20000000-0000-4000-8000-000000000003', '10000000-0000-4000-8000-000000000001', 'Vue'),
  ('20000000-0000-4000-8000-000000000004', '10000000-0000-4000-8000-000000000002', 'Home'),
  ('20000000-0000-4000-8000-000000000005', '10000000-0000-4000-8000-000000000002', 'Office'),
  ('20000000-0000-4000-8000-000000000006', '10000000-0000-4000-8000-000000000002', 'Hybrid'),
  ('20000000-0000-4000-8000-000000000007', '10000000-0000-4000-8000-000000000003', 'Video lessons'),
  ('20000000-0000-4000-8000-000000000008', '10000000-0000-4000-8000-000000000003', 'Documentation'),
  ('20000000-0000-4000-8000-000000000009', '10000000-0000-4000-8000-000000000003', 'Hands-on projects'),
  ('20000000-0000-4000-8000-000000000010', '10000000-0000-4000-8000-000000000004', 'Movies'),
  ('20000000-0000-4000-8000-000000000011', '10000000-0000-4000-8000-000000000004', 'Gaming'),
  ('20000000-0000-4000-8000-000000000012', '10000000-0000-4000-8000-000000000004', 'Reading')
on conflict (id) do nothing;
insert into public.votes (id, poll_id, option_id, voter_token)
values
  ('30000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000001', '40000000-0000-4000-8000-000000000001'),
  ('30000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000001', '40000000-0000-4000-8000-000000000002'),
  ('30000000-0000-4000-8000-000000000003', '10000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000002', '40000000-0000-4000-8000-000000000003'),
  ('30000000-0000-4000-8000-000000000004', '10000000-0000-4000-8000-000000000003', '20000000-0000-4000-8000-000000000009', '40000000-0000-4000-8000-000000000004'),
  ('30000000-0000-4000-8000-000000000005', '10000000-0000-4000-8000-000000000004', '20000000-0000-4000-8000-000000000011', '40000000-0000-4000-8000-000000000005')
on conflict (id) do nothing;
