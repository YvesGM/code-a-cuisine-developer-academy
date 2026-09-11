-- Ensure deleting a poll removes all dependent survey data.
-- This migration re-applies the intended cascade behavior to the current schema.

alter table public.poll_questions
  drop constraint if exists poll_questions_poll_id_fkey,
  add constraint poll_questions_poll_id_fkey
    foreign key (poll_id)
    references public.polls(id)
    on delete cascade;
alter table public.poll_options
  drop constraint if exists poll_options_poll_id_fkey,
  add constraint poll_options_poll_id_fkey
    foreign key (poll_id)
    references public.polls(id)
    on delete cascade;
alter table public.poll_options
  drop constraint if exists poll_options_question_id_fkey,
  add constraint poll_options_question_id_fkey
    foreign key (question_id)
    references public.poll_questions(id)
    on delete cascade;
alter table public.votes
  drop constraint if exists votes_poll_id_fkey,
  add constraint votes_poll_id_fkey
    foreign key (poll_id)
    references public.polls(id)
    on delete cascade;
alter table public.votes
  drop constraint if exists votes_question_id_fkey,
  add constraint votes_question_id_fkey
    foreign key (question_id)
    references public.poll_questions(id)
    on delete cascade;
alter table public.votes
  drop constraint if exists votes_option_poll_fkey,
  add constraint votes_option_poll_fkey
    foreign key (option_id, poll_id)
    references public.poll_options(id, poll_id)
    on delete cascade;
-- Persist the survey lifecycle instead of deriving completion only in the client.
alter table public.polls
  add column if not exists status text not null default 'active',
  add column if not exists completed_at timestamptz,
  add column if not exists completion_reason text;
alter table public.polls
  drop constraint if exists polls_status_check,
  add constraint polls_status_check
    check (status in ('active', 'completed')),
  drop constraint if exists polls_completion_reason_check,
  add constraint polls_completion_reason_check
    check (completion_reason is null or completion_reason in ('manual', 'deadline')),
  drop constraint if exists polls_completion_state_check,
  add constraint polls_completion_state_check
    check (
      (status = 'active' and completed_at is null and completion_reason is null)
      or
      (status = 'completed' and completed_at is not null and completion_reason is not null)
    );
update public.polls
set
  status = 'completed',
  completed_at = deadline,
  completion_reason = 'deadline'
where status = 'active'
  and deadline is not null
  and deadline <= now();
create or replace function public.complete_poll(target_poll_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  changed_count integer;
begin
  update public.polls
  set status = 'completed', completed_at = now(), completion_reason = 'manual'
  where id = target_poll_id and status = 'active';
  get diagnostics changed_count = row_count;
  return changed_count = 1;
end;
$$;
create or replace function public.complete_expired_polls()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  changed_count integer;
begin
  update public.polls
  set status = 'completed', completed_at = deadline, completion_reason = 'deadline'
  where status = 'active' and deadline is not null and deadline <= now();
  get diagnostics changed_count = row_count;
  return changed_count;
end;
$$;
revoke all on function public.complete_poll(uuid) from public;
revoke all on function public.complete_expired_polls() from public;
grant execute on function public.complete_poll(uuid) to anon, authenticated;
grant execute on function public.complete_expired_polls() to anon, authenticated;
-- Active-survey writes must also respect the persisted lifecycle state.
drop policy if exists "Polls can be created publicly" on public.polls;
create policy "Polls can be created publicly"
  on public.polls
  for insert
  to anon, authenticated
  with check (
    status = 'active'
    and completed_at is null
    and completion_reason is null
    and char_length(trim(category)) between 1 and 60
    and char_length(trim(title)) between 1 and 120
    and char_length(trim(question)) between 3 and 250
  );
drop policy if exists "Poll questions can be created for active surveys" on public.poll_questions;
create policy "Poll questions can be created for active surveys"
  on public.poll_questions
  for insert
  to anon, authenticated
  with check (
    exists (
      select 1 from public.polls
      where polls.id = poll_questions.poll_id
        and polls.status = 'active'
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
        and polls.status = 'active'
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
        and polls.status = 'active'
        and (polls.deadline is null or polls.deadline > now())
    )
  );
