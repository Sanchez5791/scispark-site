-- 20260619_lesson_progress_resume_and_score.sql
-- Order: 派工单 2026-06-19 — move lesson "进度/给分" out of localStorage into the account.
--
-- Adds two ADDITIVE, NULLABLE columns to the existing lesson_progress table so the
-- functional master template can persist:
--   * last_screen — the screen the student left off on (hook/learn/try/test/wrap), for cross-device resume
--   * score       — the lesson XP/points earned ("给分"), NOT the assessment marking (that lives elsewhere)
--
-- Safe: both columns are nullable with no default, so existing rows and the live site
-- are untouched. The current dashboards SELECT explicit column lists, so they are unaffected.
-- RLS is unchanged: the existing progress_{insert,select,update}_own policies already cover
-- these columns (they gate by row ownership, not by column).

alter table public.lesson_progress
  add column if not exists last_screen text,
  add column if not exists score integer;

-- Rollback (only if you need to fully revert):
--   alter table public.lesson_progress drop column if exists last_screen;
--   alter table public.lesson_progress drop column if exists score;
