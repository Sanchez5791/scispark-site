-- 20260622_staff_read_analytics.sql
-- Order: 派工卡 复核回复搬到看板 (军师房 → 双手房, 2026-06-21).
--
-- PART C of that order ("FULL teacher board") shows a per-student health flag
-- (🔴 red / 🟡 yellow / 🟢 green) computed from data that ALREADY exists:
--   * lesson_question_attempts — wrong count + re-takes per question
--   * lesson_progress          — completion / re-take signals
--   * children                 — the learner's name + year_group for the board
--
-- Today's RLS only lets the teacher (is_staff()) read review_requests across all
-- students. It does NOT let staff read the three tables above for other students,
-- so the flags would come back empty. This migration adds the missing staff-only
-- SELECT access — and nothing else.
--
-- Red lines honoured:
--   * ADDITIVE ONLY. Each policy has a NEW, distinct name and is added ALONGSIDE the
--     existing "own-row" policies. PostgreSQL ORs permissive policies, so students are
--     unchanged; only staff gain the extra read.
--   * SELECT ONLY. No insert / update / delete granted here. The teacher reads health
--     signals; the only write the console performs is on review_requests / lesson_progress,
--     both already covered by the 2026-06-20 review_requests migration.
--   * Reuses public.is_staff() (created 2026-06-20) — no new helper, no recursion.
--   * No data is moved or deleted. Display/visibility change only.

-- ============================================================
-- UP
-- ============================================================

-- children: staff may read every learner (name + year_group) for the board roster.
drop policy if exists children_select_staff on public.children;
create policy children_select_staff on public.children
  for select to authenticated
  using (public.is_staff());

-- lesson_question_attempts: staff may read all attempts (wrong count / re-takes / time).
drop policy if exists lqa_select_staff on public.lesson_question_attempts;
create policy lqa_select_staff on public.lesson_question_attempts
  for select to authenticated
  using (public.is_staff());

-- lesson_progress: staff may read all progress rows (completion / trend / re-takes).
drop policy if exists progress_select_staff on public.lesson_progress;
create policy progress_select_staff on public.lesson_progress
  for select to authenticated
  using (public.is_staff());

-- ============================================================
-- ROLLBACK (run manually to revert)
-- ============================================================
--   drop policy if exists children_select_staff on public.children;
--   drop policy if exists lqa_select_staff on public.lesson_question_attempts;
--   drop policy if exists progress_select_staff on public.lesson_progress;
