-- Add first-class multi-question surveys while preserving existing survey data.
create table if not exists public.poll_questions (
  id uuid primary key default gen_random_uuid(),
  poll_id uuid not null references public.polls(id) on delete cascade,
  text text not null,
  position integer not null default 0,
  created_at timestamptz not null default now(),
  constraint poll_questions_text_length_check
    check (char_length(trim(text)) between 3 and 250),
  constraint poll_questions_position_check
    check (position >= 0)
);
create index if not exists poll_questions_poll_id_idx
  on public.poll_questions(poll_id);
create unique index if not exists poll_questions_poll_position_unique_idx
  on public.poll_questions(poll_id, position);
insert into public.poll_questions (poll_id, text, position)
select polls.id, polls.question, 0
from public.polls
where not exists (
  select 1 from public.poll_questions where poll_questions.poll_id = polls.id
);
alter table public.poll_options
  add column if not exists question_id uuid;
update public.poll_options
set question_id = poll_questions.id
from public.poll_questions
where poll_questions.poll_id = poll_options.poll_id
  and poll_questions.position = 0
  and poll_options.question_id is null;
alter table public.poll_options
  alter column question_id set not null;
create index if not exists poll_options_question_id_idx
  on public.poll_options(question_id);
alter table public.poll_options
  drop constraint if exists poll_options_question_id_fkey,
  add constraint poll_options_question_id_fkey
    foreign key (question_id)
    references public.poll_questions(id)
    on delete cascade;
drop index if exists public.poll_options_poll_text_unique_idx;
create unique index if not exists poll_options_question_text_unique_idx
  on public.poll_options(question_id, lower(trim(text)));
alter table public.votes
  add column if not exists question_id uuid;
update public.votes
set question_id = poll_options.question_id
from public.poll_options
where public.votes.option_id = poll_options.id
  and public.votes.question_id is null;
alter table public.votes
  alter column question_id set not null;
create index if not exists votes_question_id_idx
  on public.votes(question_id);
alter table public.votes
  drop constraint if exists votes_question_id_fkey,
  add constraint votes_question_id_fkey
    foreign key (question_id)
    references public.poll_questions(id)
    on delete cascade;
drop index if exists public.votes_poll_voter_unique_idx;
create unique index if not exists votes_poll_question_voter_unique_idx
  on public.votes(poll_id, question_id, voter_token);
alter table public.poll_questions enable row level security;
revoke all on table public.poll_questions from anon, authenticated;
grant select, insert on table public.poll_questions to anon, authenticated;
drop policy if exists "Poll questions are publicly readable" on public.poll_questions;
drop policy if exists "Poll questions can be created for active surveys" on public.poll_questions;
create policy "Poll questions are publicly readable"
  on public.poll_questions
  for select
  to anon, authenticated
  using (true);
create policy "Poll questions can be created for active surveys"
  on public.poll_questions
  for insert
  to anon, authenticated
  with check (
    exists (
      select 1 from public.polls
      where polls.id = poll_questions.poll_id
        and (polls.deadline is null or polls.deadline > now())
    )
  );
drop policy if exists "Poll options can be created for active surveys" on public.poll_options;
create policy "Poll options can be created for active surveys"
  on public.poll_options
  for insert
  to anon, authenticated
  with check (
    exists (
      select 1
      from public.poll_questions
      join public.polls on polls.id = poll_questions.poll_id
      where poll_questions.id = poll_options.question_id
        and poll_questions.poll_id = poll_options.poll_id
        and (polls.deadline is null or polls.deadline > now())
    )
  );
drop policy if exists "Votes can be created for active surveys" on public.votes;
create policy "Votes can be created for active surveys"
  on public.votes
  for insert
  to anon, authenticated
  with check (
    exists (
      select 1
      from public.poll_options
      join public.poll_questions on poll_questions.id = poll_options.question_id
      join public.polls on polls.id = poll_options.poll_id
      where poll_options.id = votes.option_id
        and poll_options.poll_id = votes.poll_id
        and poll_options.question_id = votes.question_id
        and poll_questions.poll_id = votes.poll_id
        and (polls.deadline is null or polls.deadline > now())
    )
  );
revoke select on table public.votes from anon, authenticated;
revoke insert on table public.votes from anon, authenticated;
grant select (id, poll_id, question_id, option_id, created_at)
  on table public.votes
  to anon, authenticated;
grant insert (poll_id, question_id, option_id, voter_token)
  on table public.votes
  to anon, authenticated;
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'poll_questions'
  ) then
    alter publication supabase_realtime add table public.poll_questions;
  end if;
end
$$;
