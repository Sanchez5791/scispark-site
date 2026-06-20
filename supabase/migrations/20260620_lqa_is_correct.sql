-- 20260620_lqa_is_correct.sql
-- Order: 派工卡 打字题「判对错」= 关键词闸 (军师房 → 双手房, 2026-06-20).
--
-- The shared engine (public/lesson-shell-v4.js) now auto-grades typed answers
-- (fill-in / short-answer) with a keyword gate. When a question carries a gate
-- ("料" in the lesson HTML), the engine writes the verdict into
-- lesson_question_attempts so the student data dashboard can light up
-- per-question right/wrong.
--
-- This migration adds the ONE new column the verdict needs.
--
-- Red lines honoured:
--   * Additive only — PR#65 capture columns are untouched.
--   * Column is NULLABLE: ungated / self-reported reveals keep score=NULL and
--     leave is_correct NULL (correctness unknown, marked later). The engine only
--     attaches is_correct when an actual verdict exists, so inserts that predate
--     this column still succeed.
--   * No data backfill, no trigger, no RLS change (existing lqa_insert_own /
--     read policies already cover this column).

-- ============================================================
-- UP
-- ============================================================
alter table public.lesson_question_attempts
  add column if not exists is_correct boolean;

comment on column public.lesson_question_attempts.is_correct is
  'Typed-answer keyword-gate verdict (Order 2026-06-20). true=correct, false=wrong, '
  'NULL=ungated/self-reported (unknown, mark later). MCQ rows also use score 1/0.';

-- ============================================================
-- ROLLBACK (run manually to revert)
-- ============================================================
-- alter table public.lesson_question_attempts drop column if exists is_correct;
