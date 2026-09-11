-- Participant completion is session-local; only the deadline makes a survey globally past.

update public.polls
set
  status = 'completed',
  completed_at = deadline,
  completion_reason = 'deadline'
where completion_reason = 'manual'
  and deadline is not null
  and deadline <= now();
update public.polls
set
  status = 'active',
  completed_at = null,
  completion_reason = null
where completion_reason = 'manual'
  and (deadline is null or deadline > now());
drop function if exists public.complete_poll(uuid);
drop policy if exists "Poll questions can be created for active surveys" on public.poll_questions;
create policy "Poll questions can be created for active surveys"
  on public.poll_questions
  for insert
  to anon, authenticated
  with check (
    exists (
      select 1
      from public.polls
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
