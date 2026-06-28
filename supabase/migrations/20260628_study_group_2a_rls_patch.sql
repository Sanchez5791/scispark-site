-- ============================================================
-- Migration: Safe Study Group · Phase 1 · Batch 2a — RLS SECURITY PATCH
-- File    : 20260628_study_group_2a_rls_patch.sql
-- Created : 2026-06-28
-- Applies ON TOP OF: 20260624_study_group_phase1.sql (Batch 2a base)
-- Applied : NOT YET — apply to a TEST project first, confirm 0 errors, THEN prod.
-- Branch  : feat/study-group-phase1  (PR #76, DO-NOT-MERGE)
-- Source  : SciSpark_StudyGroup_2a_RLS_PatchDirective_HandsRoom_2026-06-28
--           (synthesis of 6 independent AI security audits + Strategist review)
-- ------------------------------------------------------------
-- WHY THIS EXISTS
--   The Batch 2a tables + RLS are live but NOT child-ready. This patch
--   closes the two hard blockers (Tier 1) and five defense-in-depth gaps
--   (Tier 2) before any real under-14 child can use the feature.
--
-- ADDITIVE ONLY — this file does NOT drop any table or any row of data.
--   It only: (a) adds CHECK / FOREIGN KEY constraints, (b) replaces RLS
--   POLICY objects (drop + recreate the policy — never the table), and
--   (c) replaces helper FUNCTIONS / TRIGGERS (CREATE OR REPLACE).
--   The WHOLE file is ONE transaction: any error rolls everything back.
--   Re-runnable: every change guards with IF EXISTS / OR REPLACE.
--
-- NOT INCLUDED (on purpose, per the directive)
--   · Tier 3 optional hardening  — listed for Sanchez to choose; not applied.
--   · Parent-visibility scope     — PRODUCT DECISION PENDING; do NOT touch.
--   · No new INSERT policy on study_groups / study_group_members — those stay
--     default-DENY (service_role only). The "anyone can insert" audit was a
--     FALSE ALARM; we deliberately do NOT loosen them.
-- ============================================================

BEGIN;

-- ============================================================
-- TIER 1 — HARD BLOCKERS
-- ============================================================

-- ── T1-1  Kill the free-text hole on study_group_messages ──────────────────
-- lesson_code / question_id are unconstrained text today, client-writable,
-- and readable by every group member — a tampered client could smuggle
-- arbitrary free text (contact info, grooming) to other children.
--
-- We constrain them with CHECK (not FK): there is NO lessons table to point
-- a FK at — these HTML lessons have no row in lesson_content (the engine sets
-- lesson_id = NULL and stores lesson_code from the URL path instead).
--
-- The regex MATCHES THE REAL ID FORMAT the engine already produces:
--   · lesson_code  e.g. "y7/u8/l01"  (URL-path form, lowercase, contains '/')
--                  — see _pqLessonCode() in the lesson engine.
--   · question_id  e.g. "Q01" / "air_has_mass" (alphanumeric + underscore)
--                  — see api/mark-lesson.js  /^[A-Z0-9_]+$/i .
--   NOTE: the Strategist's *example* regex ^[A-Z0-9_-]{1,32}$ would WRONGLY
--   reject the real lesson_code (it has '/' and lowercase). These CHECKs match
--   reality yet still block free text: no spaces, no . @ : ; , ? ! etc, and a
--   tight length cap → the column physically cannot carry a sentence.
ALTER TABLE study_group_messages DROP CONSTRAINT IF EXISTS sg_msg_lesson_code_fmt;
ALTER TABLE study_group_messages DROP CONSTRAINT IF EXISTS sg_msg_question_id_fmt;
ALTER TABLE study_group_messages
  ADD CONSTRAINT sg_msg_lesson_code_fmt CHECK (lesson_code ~ '^[A-Za-z0-9_/-]{1,40}$'),
  ADD CONSTRAINT sg_msg_question_id_fmt CHECK (question_id ~ '^[A-Za-z0-9_-]{1,64}$');
-- T1-1(b) is a CLIENT rule (enforced in the Phase-2 UI, not in SQL):
--   the UI must NEVER render lesson_code / question_id as display text to a
--   child. They are internal pointers only.

-- ── T1-2  Enforce parent CONSENT on READ, not just on write ────────────────
-- Today the four read policies let an activated-but-NOT-consented child read
-- the whole group. Reading is participation. We append
--   AND sg_child_consented(app_current_child_id())
-- to the STUDENT branch of each read policy ONLY. The PARENT branch is left
-- exactly as-is (a parent's own oversight does not depend on child consent,
-- and the parent-visibility scope is a pending product decision).

DROP POLICY IF EXISTS sg_groups_read ON study_groups;
CREATE POLICY sg_groups_read ON study_groups
  FOR SELECT USING (
    (
      id IN (SELECT group_id FROM study_group_members WHERE child_id = app_current_child_id())
      AND sg_child_consented(app_current_child_id())
    )
    OR id IN (
      SELECT m.group_id FROM study_group_members m
      JOIN children c ON c.id = m.child_id
      WHERE c.parent_id IN (SELECT id FROM parents WHERE auth_user_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS sg_members_read ON study_group_members;
CREATE POLICY sg_members_read ON study_group_members
  FOR SELECT USING (
    (
      group_id IN (SELECT group_id FROM study_group_members WHERE child_id = app_current_child_id())
      AND sg_child_consented(app_current_child_id())
    )
    OR child_id IN (SELECT id FROM children WHERE parent_id IN (SELECT id FROM parents WHERE auth_user_id = auth.uid()))
  );

DROP POLICY IF EXISTS sg_messages_read ON study_group_messages;
CREATE POLICY sg_messages_read ON study_group_messages
  FOR SELECT USING (
    (
      group_id IN (SELECT group_id FROM study_group_members WHERE child_id = app_current_child_id())
      AND sg_child_consented(app_current_child_id())
    )
    OR child_id IN (SELECT id FROM children WHERE parent_id IN (SELECT id FROM parents WHERE auth_user_id = auth.uid()))
  );

DROP POLICY IF EXISTS sg_reactions_read ON study_group_reactions;
CREATE POLICY sg_reactions_read ON study_group_reactions
  FOR SELECT USING (
    (
      group_id IN (SELECT group_id FROM study_group_members WHERE child_id = app_current_child_id())
      AND sg_child_consented(app_current_child_id())
    )
    OR child_id IN (SELECT id FROM children WHERE parent_id IN (SELECT id FROM parents WHERE auth_user_id = auth.uid()))
  );

-- ============================================================
-- TIER 2 — DEFENSE IN DEPTH
-- ============================================================

-- ── T2-1  Validate the parent on consent rows ─────────────────────────────
-- parent_id had no FK and was not checked against the logged-in parent.
-- Add the FK, and split the FOR ALL policy into SELECT / INSERT / UPDATE
-- (NO client DELETE) with a WITH CHECK that also pins parent_id to the
-- caller's own parents.id.
ALTER TABLE study_group_consent DROP CONSTRAINT IF EXISTS sg_consent_parent_fk;
ALTER TABLE study_group_consent
  ADD CONSTRAINT sg_consent_parent_fk
  FOREIGN KEY (parent_id) REFERENCES parents(id) ON DELETE CASCADE;

DROP POLICY IF EXISTS sg_consent_parent_all    ON study_group_consent;
DROP POLICY IF EXISTS sg_consent_parent_select ON study_group_consent;
DROP POLICY IF EXISTS sg_consent_parent_insert ON study_group_consent;
DROP POLICY IF EXISTS sg_consent_parent_update ON study_group_consent;

CREATE POLICY sg_consent_parent_select ON study_group_consent
  FOR SELECT USING (
    child_id IN (SELECT id FROM children WHERE parent_id IN (SELECT id FROM parents WHERE auth_user_id = auth.uid()))
  );

CREATE POLICY sg_consent_parent_insert ON study_group_consent
  FOR INSERT WITH CHECK (
    child_id IN (SELECT id FROM children WHERE parent_id IN (SELECT id FROM parents WHERE auth_user_id = auth.uid()))
    AND parent_id IN (SELECT id FROM parents WHERE auth_user_id = auth.uid())
  );

CREATE POLICY sg_consent_parent_update ON study_group_consent
  FOR UPDATE
  USING (
    child_id IN (SELECT id FROM children WHERE parent_id IN (SELECT id FROM parents WHERE auth_user_id = auth.uid()))
  )
  WITH CHECK (
    child_id IN (SELECT id FROM children WHERE parent_id IN (SELECT id FROM parents WHERE auth_user_id = auth.uid()))
    AND parent_id IN (SELECT id FROM parents WHERE auth_user_id = auth.uid())
  );
-- (sg_consent_child_read is UNCHANGED: a child may still read their own row.)

-- ── T2-2  Tie message options to their template + slot ────────────────────
-- An option from a different template (or wrong slot) could be attached,
-- producing a mismatched preset. A BEFORE INSERT/UPDATE trigger rejects it.
CREATE OR REPLACE FUNCTION sg_messages_options_match()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.option_1_id IS NOT NULL THEN
    PERFORM 1 FROM study_group_message_options o
      WHERE o.id = NEW.option_1_id
        AND o.template_id = NEW.template_id
        AND o.slot = 1;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'option_1_id % does not belong to template % slot 1',
        NEW.option_1_id, NEW.template_id;
    END IF;
  END IF;

  IF NEW.option_2_id IS NOT NULL THEN
    PERFORM 1 FROM study_group_message_options o
      WHERE o.id = NEW.option_2_id
        AND o.template_id = NEW.template_id
        AND o.slot = 2;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'option_2_id % does not belong to template % slot 2',
        NEW.option_2_id, NEW.template_id;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sg_messages_options_match ON study_group_messages;
CREATE TRIGGER trg_sg_messages_options_match
  BEFORE INSERT OR UPDATE ON study_group_messages
  FOR EACH ROW EXECUTE FUNCTION sg_messages_options_match();

-- ── T2-3  Close the 5-member race (serialize per group) ───────────────────
-- Two concurrent inserts could both read count = 4 and both pass. Take a
-- row lock on the parent group first so membership inserts serialize.
CREATE OR REPLACE FUNCTION sg_members_max5()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  -- serialize concurrent inserts for THIS group (race fix)
  PERFORM 1 FROM study_groups WHERE id = NEW.group_id FOR UPDATE;

  IF (SELECT count(*) FROM study_group_members WHERE group_id = NEW.group_id) >= 5 THEN
    RAISE EXCEPTION 'A study group is capped at 5 members';
  END IF;
  RETURN NEW;
END;
$$;
-- (trigger trg_sg_members_max5 already points at this function — unchanged.)

-- ── T2-4  Stop cross-group reaction targeting ─────────────────────────────
-- A reaction could point at a message UUID from another group. Reject when
-- the target message's group_id differs from the reaction's group_id.
CREATE OR REPLACE FUNCTION sg_reactions_same_group()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  target_group uuid;
BEGIN
  IF NEW.target_message_id IS NOT NULL THEN
    SELECT group_id INTO target_group
      FROM study_group_messages
      WHERE id = NEW.target_message_id;
    IF target_group IS NULL OR target_group <> NEW.group_id THEN
      RAISE EXCEPTION 'reaction target message % is not in group %',
        NEW.target_message_id, NEW.group_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sg_reactions_same_group ON study_group_reactions;
CREATE TRIGGER trg_sg_reactions_same_group
  BEFORE INSERT OR UPDATE ON study_group_reactions
  FOR EACH ROW EXECUTE FUNCTION sg_reactions_same_group();

-- ── T2-5  Lock down the consent-status helper from public RPC ──────────────
-- sg_child_consented is SECURITY DEFINER; if auto-exposed as a Supabase RPC,
-- any authenticated user could query ANY child's consent status.
--
-- We choose the directive's OWNERSHIP-GUARD option over REVOKE EXECUTE.
-- Reason: this function is called *inside* the INSERT policies as
--   sg_child_consented(app_current_child_id())
-- and RLS evaluates policy functions with the CALLER's privileges — revoking
-- EXECUTE from `authenticated` risks breaking those inserts. The guard makes
-- the function harmless instead: it only returns a truthful answer for the
-- caller's OWN child (student) or a child of the calling parent; for anyone
-- else it returns false. The policies still work (they always pass the
-- caller's own child); a direct RPC with someone else's child_id leaks
-- nothing (always false).
CREATE OR REPLACE FUNCTION sg_child_consented(p_child uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE((
    SELECT c.consented
    FROM study_group_consent c
    WHERE c.child_id = p_child
      AND (
        p_child = app_current_child_id()
        OR p_child IN (
          SELECT ch.id FROM children ch
          WHERE ch.parent_id IN (SELECT id FROM parents WHERE auth_user_id = auth.uid())
        )
      )
  ), false);
$$;

COMMIT;

-- ============================================================
-- TIER 3 — OPTIONAL HARDENING (NOT applied here — Sanchez decides)
-- Listed only, per the directive ("do NOT block on them").
--   · Kill switch: also require study_groups.is_active = true in every policy.
--   · Audit log: AFTER triggers that actually write study_group_audit_log.
--   · app_current_child_id(): UNIQUE(student_user_id) on student_accounts
--     OR ORDER BY in the LIMIT 1, to avoid ambiguous identity.
--   · SET search_path = '' + schema-qualify everything (extra hardening).
--   · Per-child rate limit on messages / reactions (spam control).
--   · A members view exposing only code_name + joined_at (hide raw child_id).
-- ============================================================
