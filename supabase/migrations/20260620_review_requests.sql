-- 20260620_review_requests.sql
-- Order: 派工卡 求救按钮 MVP (军师房 → 双手房, 2026-06-20).
--
-- One new table for the "请老师复核" (Review my answer) chain:
--   student presses 请老师复核 after a graded question → a row lands here →
--   Sanchez clears it from the admin console → the student sees the resolution.
--
-- 存快照铁律 (snapshot rule): the AI's ORIGINAL judgment (verdict / score / reason /
-- model answer) is frozen into this row at insert time, so the appeal still shows the
-- original even if the lesson/question is edited later.
--
-- MVP red lines honoured here:
--   * NO auto-0, NO auto-cheat flag — there is no such column or trigger.
--   * student answers are sensitive → RLS keeps a student to their OWN rows; only staff
--     (profiles.role in 'teacher','admin') can read all / resolve.
--   * plugs into the existing account system (auth.users / profiles / lesson_progress
--     from PR#53), no parallel user model.

-- ============================================================
-- 1 · TABLE
-- ============================================================
create table if not exists public.review_requests (
  id                  uuid primary key default gen_random_uuid(),
  student_id          uuid not null references auth.users(id) on delete cascade,

  -- which lesson / which question (human-readable; no FK to keep it lesson-variant agnostic)
  lesson_path         text not null,            -- e.g. /lessons/y7/u1/l01
  lesson_label        text,                     -- e.g. "Y7 U1 L01 — States of Matter"
  question_id         text not null,            -- e.g. Q01
  question_stem       text,                     -- frozen snapshot of the question text

  -- frozen snapshot of the AI's ORIGINAL judgment (存快照铁律)
  student_answer      text,                     -- what the student wrote / chose
  ai_verdict          text,                     -- 'correct' | 'wrong'
  ai_score            integer,                  -- marks the AI awarded
  ai_max              integer,                  -- max marks for this question
  ai_reason           text,                     -- the feedback the student saw
  model_answer        text,                     -- standard / model answer

  -- the student's gated input
  student_reason_code text not null,            -- think_correct | ai_marked_wrong_spot | question_problem | system_broken
  student_reason      text not null,            -- the >=10 char written reason

  -- lifecycle: submitted → in_review → resolved
  status              text not null default 'submitted'
                      check (status in ('submitted','in_review','resolved')),

  -- Sanchez's resolution (one of the 5 buttons)
  resolution_action   text check (resolution_action in
                        ('keep','raise','full','redo','bad_question')),
  resolved_score      integer,                  -- teacher's new marks (when changed)
  resolved_message    text,                     -- templated reply the student sees
  resolved_by         uuid references auth.users(id),

  created_at          timestamptz not null default now(),
  resolved_at         timestamptz
);

comment on table public.review_requests is
  'Student "请老师复核" appeals. AI original judgment frozen at insert. MVP — no auto-0, no auto-cheat.';

create index if not exists review_requests_status_created_idx
  on public.review_requests (status, created_at desc);
create index if not exists review_requests_student_idx
  on public.review_requests (student_id, created_at desc);

-- ============================================================
-- 2 · STAFF HELPER  (teacher / admin)
-- ============================================================
-- SECURITY DEFINER so the policy can read profiles without recursing through
-- profiles' own RLS. Returns true for Sanchez once his profiles.role = 'teacher' (or 'admin').
create or replace function public.is_staff()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid()
      and role in ('teacher','admin')
  );
$$;

revoke all on function public.is_staff() from public;
grant execute on function public.is_staff() to authenticated;

-- ============================================================
-- 3 · RLS — review_requests
-- ============================================================
alter table public.review_requests enable row level security;

-- student may file an appeal for THEMSELVES only, always starting at 'submitted'
drop policy if exists review_insert_own on public.review_requests;
create policy review_insert_own on public.review_requests
  for insert to authenticated
  with check (student_id = auth.uid() and status = 'submitted');

-- student sees own appeals; staff sees all
drop policy if exists review_select_own_or_staff on public.review_requests;
create policy review_select_own_or_staff on public.review_requests
  for select to authenticated
  using (student_id = auth.uid() or public.is_staff());

-- ONLY staff can resolve (students never update their own appeal)
drop policy if exists review_update_staff on public.review_requests;
create policy review_update_staff on public.review_requests
  for update to authenticated
  using (public.is_staff())
  with check (public.is_staff());

-- ============================================================
-- 4 · lesson_progress — let staff write a score adjustment through to the account
-- ============================================================
-- Additive policy only (existing progress_*_own policies are untouched). Lets the review
-- console bump a student's aggregate lesson score when Sanchez raises/maxes a question, so
-- the grade change "真的改到学生成绩". No DELETE granted.
drop policy if exists progress_update_staff on public.lesson_progress;
create policy progress_update_staff on public.lesson_progress
  for update to authenticated
  using (public.is_staff())
  with check (public.is_staff());

-- ============================================================
-- ROLLBACK (if ever needed)
-- ============================================================
--   drop policy if exists progress_update_staff on public.lesson_progress;
--   drop table if exists public.review_requests;
--   drop function if exists public.is_staff();
