-- Allow a survey question to accept more than one answer per voter.
alter table public.poll_questions
  add column if not exists allow_multiple boolean not null default false;
drop index if exists public.votes_poll_question_voter_unique_idx;
create unique index if not exists votes_poll_question_option_voter_unique_idx
  on public.votes(poll_id, question_id, option_id, voter_token);
create or replace function public.enforce_question_vote_cardinality()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  multiple_allowed boolean;
begin
  select poll_questions.allow_multiple
    into multiple_allowed
  from public.poll_questions
  where poll_questions.id = new.question_id
    and poll_questions.poll_id = new.poll_id;

  if multiple_allowed is null then
    raise exception 'Question does not belong to survey';
  end if;

  if not multiple_allowed and exists (
    select 1
    from public.votes
    where votes.poll_id = new.poll_id
      and votes.question_id = new.question_id
      and votes.voter_token = new.voter_token
  ) then
    raise exception 'Only one answer is allowed for this question'
      using errcode = '23505';
  end if;

  return new;
end;
$$;
revoke all on function public.enforce_question_vote_cardinality() from public;
drop trigger if exists enforce_question_vote_cardinality on public.votes;
create trigger enforce_question_vote_cardinality
before insert on public.votes
for each row
execute function public.enforce_question_vote_cardinality();
