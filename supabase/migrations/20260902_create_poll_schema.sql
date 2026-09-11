create extension if not exists pgcrypto;
create table if not exists public.polls (
  id uuid primary key default gen_random_uuid(),
  question text not null,
  closed boolean not null default false,
  created_at timestamptz not null default now(),
  constraint polls_question_length_check
    check (char_length(trim(question)) between 3 and 250)
);
create table if not exists public.poll_options (
  id uuid primary key default gen_random_uuid(),
  poll_id uuid not null references public.polls(id) on delete cascade,
  text text not null,
  created_at timestamptz not null default now(),
  constraint poll_options_text_length_check
    check (char_length(trim(text)) between 1 and 120)
);
create index if not exists poll_options_poll_id_idx
  on public.poll_options(poll_id);
create unique index if not exists poll_options_poll_text_unique_idx
  on public.poll_options(poll_id, lower(trim(text)));
create table if not exists public.votes (
  id uuid primary key default gen_random_uuid(),
  option_id uuid not null references public.poll_options(id) on delete cascade,
  created_at timestamptz not null default now()
);
create index if not exists votes_option_id_idx
  on public.votes(option_id);
alter table public.polls enable row level security;
alter table public.poll_options enable row level security;
alter table public.votes enable row level security;
revoke all on table public.polls from anon, authenticated;
revoke all on table public.poll_options from anon, authenticated;
revoke all on table public.votes from anon, authenticated;
grant select, insert, delete on table public.polls to anon, authenticated;
grant update (closed) on table public.polls to anon, authenticated;
grant select, insert on table public.poll_options to anon, authenticated;
grant select, insert on table public.votes to anon, authenticated;
drop policy if exists "Polls are publicly readable" on public.polls;
drop policy if exists "Polls can be created publicly" on public.polls;
drop policy if exists "Polls can be closed publicly" on public.polls;
drop policy if exists "Polls can be deleted publicly" on public.polls;
drop policy if exists "Poll options are publicly readable" on public.poll_options;
drop policy if exists "Poll options can be created for open polls" on public.poll_options;
drop policy if exists "Votes are publicly readable" on public.votes;
drop policy if exists "Votes can be created for open polls" on public.votes;
create policy "Polls are publicly readable"
  on public.polls
  for select
  to anon, authenticated
  using (true);
create policy "Polls can be created publicly"
  on public.polls
  for insert
  to anon, authenticated
  with check (closed = false);
create policy "Polls can be closed publicly"
  on public.polls
  for update
  to anon, authenticated
  using (true)
  with check (closed = true);
create policy "Polls can be deleted publicly"
  on public.polls
  for delete
  to anon, authenticated
  using (true);
create policy "Poll options are publicly readable"
  on public.poll_options
  for select
  to anon, authenticated
  using (true);
create policy "Poll options can be created for open polls"
  on public.poll_options
  for insert
  to anon, authenticated
  with check (
    exists (
      select 1
      from public.polls
      where polls.id = poll_options.poll_id
        and polls.closed = false
    )
  );
create policy "Votes are publicly readable"
  on public.votes
  for select
  to anon, authenticated
  using (true);
create policy "Votes can be created for open polls"
  on public.votes
  for insert
  to anon, authenticated
  with check (
    exists (
      select 1
      from public.poll_options
      join public.polls on polls.id = poll_options.poll_id
      where poll_options.id = votes.option_id
        and polls.closed = false
    )
  );
