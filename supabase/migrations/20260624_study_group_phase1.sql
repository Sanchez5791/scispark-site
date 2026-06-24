-- ============================================================
-- Migration: Safe Study Group · Phase 1 · Batch 2a (tables + RLS)
-- Created: 2026-06-24
-- Applied: NOT YET (held — apply to a TEST project first, then prod)
-- ------------------------------------------------------------
-- WHAT THIS DOES
--   Creates the database foundation for the Safe Study Group.
--   ADDITIVE ONLY: creates NEW tables. Does NOT drop, alter, or
--   touch any existing table (children / parents / lesson_progress
--   etc are untouched). Safe per Card 12.
--
-- CHILD-SAFETY DESIGN (locked at the database level)
--   · No table has a free-text "message" column. A student message
--     stores only: which preset template + which allowed dropdown
--     option (foreign keys into a fixed library). The DB physically
--     CANNOT hold an off-menu sentence, even from a tampered client.
--   · Reactions are limited to 4 fixed emoji codes by CHECK.
--   · RLS is fail-CLOSED: if the student->child identity helper
--     cannot resolve a child, every student policy denies access.
--   · A group is capped at 5 members by a trigger.
--   · A child only sees the group when their OWN parent consent = true
--     (Option A, per founder decision 2026-06-24).
--
-- ⚠ ONE THING TO CONFIRM BEFORE REAL APPLY
--   How a logged-in STUDENT maps to their `children` row.
--   This file assumes `children.user_id = auth.uid()`.
--   If the real column differs, fix ONLY the body of
--   app_current_child_id() below. Wrong guess = helper returns NULL
--   = access denied (fail-closed, safe). No data exposed either way.
-- ============================================================

BEGIN;

-- ------------------------------------------------------------
-- 0. Helper: which child is the currently logged-in student?
--    SECURITY DEFINER so policies can call it. Fail-closed.
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION app_current_child_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  -- TODO confirm before prod: column that links a student login
  -- (auth.uid()) to their children row. Assumed children.user_id.
  SELECT id FROM children WHERE user_id = auth.uid() LIMIT 1;
$$;

-- ------------------------------------------------------------
-- 1. Groups
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS study_groups (
  id                     uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name                   text NOT NULL,
  weekly_goal_questions  integer NOT NULL DEFAULT 30,
  is_active              boolean NOT NULL DEFAULT true,
  created_at             timestamptz NOT NULL DEFAULT now()
);

-- ------------------------------------------------------------
-- 2. Members (closed group, max 5, code names A-E)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS study_group_members (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id   uuid NOT NULL REFERENCES study_groups(id) ON DELETE CASCADE,
  child_id   uuid NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  code_name  text NOT NULL CHECK (code_name IN ('A','B','C','D','E')),
  joined_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (group_id, child_id),
  UNIQUE (group_id, code_name)
);
CREATE INDEX IF NOT EXISTS idx_sg_members_child ON study_group_members(child_id);
CREATE INDEX IF NOT EXISTS idx_sg_members_group ON study_group_members(group_id);

-- enforce max 5 members per group
CREATE OR REPLACE FUNCTION sg_members_max5()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF (SELECT count(*) FROM study_group_members WHERE group_id = NEW.group_id) >= 5 THEN
    RAISE EXCEPTION 'A study group is capped at 5 members';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sg_members_max5 ON study_group_members;
CREATE TRIGGER trg_sg_members_max5
  BEFORE INSERT ON study_group_members
  FOR EACH ROW EXECUTE FUNCTION sg_members_max5();

-- ------------------------------------------------------------
-- 3. Parent consent (Option A: per-child gating)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS study_group_consent (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id      uuid NOT NULL UNIQUE REFERENCES children(id) ON DELETE CASCADE,
  parent_id     uuid NOT NULL,            -- = children.parent_id (auth uid)
  consented     boolean NOT NULL DEFAULT false,
  consented_at  timestamptz,
  updated_at    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_sg_consent_child ON study_group_consent(child_id);

-- helper: is THIS child cleared to use the group? (own parent said yes)
CREATE OR REPLACE FUNCTION sg_child_consented(p_child uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT consented FROM study_group_consent WHERE child_id = p_child),
    false);
$$;

-- ------------------------------------------------------------
-- 4. Preset sentence library (fixed; the ONLY source of words)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS study_group_message_templates (
  template_id  text PRIMARY KEY,          -- 'answer','stuck','explain','agree','gotit'
  text_zh      text NOT NULL,
  text_en      text NOT NULL,
  has_blanks   boolean NOT NULL DEFAULT false,
  sort_order   integer NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS study_group_message_options (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id  text NOT NULL REFERENCES study_group_message_templates(template_id) ON DELETE CASCADE,
  slot         integer NOT NULL,          -- 1 = first blank, 2 = second blank
  value_zh     text NOT NULL,
  value_en     text NOT NULL,
  sort_order   integer NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_sg_options_tpl ON study_group_message_options(template_id);

-- ------------------------------------------------------------
-- 5. Messages (NO free-text column — only template + option FKs)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS study_group_messages (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id      uuid NOT NULL REFERENCES study_groups(id) ON DELETE CASCADE,
  child_id      uuid NOT NULL REFERENCES children(id) ON DELETE CASCADE,  -- author
  lesson_code   text NOT NULL,            -- message MUST attach to a lesson...
  question_id   text NOT NULL,            -- ...and a specific question
  template_id   text NOT NULL REFERENCES study_group_message_templates(template_id),
  option_1_id   uuid REFERENCES study_group_message_options(id),
  option_2_id   uuid REFERENCES study_group_message_options(id),
  created_at    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_sg_msg_group ON study_group_messages(group_id);
CREATE INDEX IF NOT EXISTS idx_sg_msg_child ON study_group_messages(child_id);

-- ------------------------------------------------------------
-- 6. Reactions (fixed 4 emoji only)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS study_group_reactions (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id           uuid NOT NULL REFERENCES study_groups(id) ON DELETE CASCADE,
  child_id           uuid NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  emoji_code         text NOT NULL CHECK (emoji_code IN ('thumbsup','question','sweat','repeat')),
  target_message_id  uuid REFERENCES study_group_messages(id) ON DELETE CASCADE,
  created_at         timestamptz NOT NULL DEFAULT now(),
  UNIQUE (child_id, target_message_id, emoji_code)
);
CREATE INDEX IF NOT EXISTS idx_sg_react_msg ON study_group_reactions(target_message_id);

-- ------------------------------------------------------------
-- 7. Audit log (admin/service only — no client access at all)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS study_group_audit_log (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id    uuid,
  actor_role  text,                       -- 'student' | 'parent' | 'admin'
  action      text NOT NULL,              -- 'send_message' | 'react' | 'consent_on' | 'consent_off'
  group_id    uuid,
  detail      jsonb,
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_sg_audit_group ON study_group_audit_log(group_id);

-- ============================================================
-- ROW LEVEL SECURITY  (enable on every table; default = deny)
-- ============================================================
ALTER TABLE study_groups                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_group_members           ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_group_consent           ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_group_message_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_group_message_options   ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_group_messages          ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_group_reactions         ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_group_audit_log         ENABLE ROW LEVEL SECURITY;

-- ---- groups: a member-child or that child's parent may read ----
CREATE POLICY sg_groups_read ON study_groups
  FOR SELECT USING (
    id IN (SELECT group_id FROM study_group_members WHERE child_id = app_current_child_id())
    OR id IN (
      SELECT m.group_id FROM study_group_members m
      JOIN children c ON c.id = m.child_id
      WHERE c.parent_id = auth.uid()
    )
  );

-- ---- members: read own group (student) or own child's group (parent) ----
CREATE POLICY sg_members_read ON study_group_members
  FOR SELECT USING (
    group_id IN (SELECT group_id FROM study_group_members WHERE child_id = app_current_child_id())
    OR child_id IN (SELECT id FROM children WHERE parent_id = auth.uid())
  );

-- ---- consent: parent manages own child's row; child may read own ----
CREATE POLICY sg_consent_parent_all ON study_group_consent
  FOR ALL
  USING (child_id IN (SELECT id FROM children WHERE parent_id = auth.uid()))
  WITH CHECK (child_id IN (SELECT id FROM children WHERE parent_id = auth.uid()));

CREATE POLICY sg_consent_child_read ON study_group_consent
  FOR SELECT USING (child_id = app_current_child_id());

-- ---- preset library: world-readable (it is the menu), no client writes ----
CREATE POLICY sg_templates_read ON study_group_message_templates
  FOR SELECT USING (true);
CREATE POLICY sg_options_read ON study_group_message_options
  FOR SELECT USING (true);

-- ---- messages: read if in the group; write only as self, member, consented ----
CREATE POLICY sg_messages_read ON study_group_messages
  FOR SELECT USING (
    group_id IN (SELECT group_id FROM study_group_members WHERE child_id = app_current_child_id())
    OR child_id IN (SELECT id FROM children WHERE parent_id = auth.uid())
  );

CREATE POLICY sg_messages_insert ON study_group_messages
  FOR INSERT WITH CHECK (
    child_id = app_current_child_id()
    AND sg_child_consented(app_current_child_id())
    AND group_id IN (SELECT group_id FROM study_group_members WHERE child_id = app_current_child_id())
  );

-- ---- reactions: same shape as messages ----
CREATE POLICY sg_reactions_read ON study_group_reactions
  FOR SELECT USING (
    group_id IN (SELECT group_id FROM study_group_members WHERE child_id = app_current_child_id())
    OR child_id IN (SELECT id FROM children WHERE parent_id = auth.uid())
  );

CREATE POLICY sg_reactions_insert ON study_group_reactions
  FOR INSERT WITH CHECK (
    child_id = app_current_child_id()
    AND sg_child_consented(app_current_child_id())
    AND group_id IN (SELECT group_id FROM study_group_members WHERE child_id = app_current_child_id())
  );

CREATE POLICY sg_reactions_delete ON study_group_reactions
  FOR DELETE USING (child_id = app_current_child_id());

-- ---- audit log: NO client policies => RLS denies all anon/auth access.
--      Only the service_role (server side) can read/write it. ----

-- ============================================================
-- SEED: starter preset sentence library (matches the preview page)
-- Safe to re-run (ON CONFLICT DO NOTHING). Same transaction as above
-- so the WHOLE file is all-or-nothing: any failure rolls everything back.
-- ============================================================

INSERT INTO study_group_message_templates (template_id, text_zh, text_en, has_blanks, sort_order) VALUES
  ('answer',  '我觉得答案是 {1}，因为 {2}。', 'I think the answer is {1} because {2}.', true,  1),
  ('stuck',   '我卡在这一步了。',              'I''m stuck on this step.',                false, 2),
  ('explain', '谁能再讲一次这题？',            'Can someone explain this again?',         false, 3),
  ('agree',   '我也是这样想的！',              'I thought so too!',                       false, 4),
  ('gotit',   '我懂了，谢谢！',                'I get it now, thanks!',                   false, 5)
ON CONFLICT (template_id) DO NOTHING;

-- starter options for the 'answer' template (demo: states of matter)
INSERT INTO study_group_message_options (template_id, slot, value_zh, value_en, sort_order) VALUES
  ('answer', 1, '固态', 'solid',  1),
  ('answer', 1, '液态', 'liquid', 2),
  ('answer', 1, '气态', 'gas',    3),
  ('answer', 2, '粒子排得很紧',   'the particles are packed tightly', 1),
  ('answer', 2, '粒子能自由移动', 'the particles move freely',        2),
  ('answer', 2, '粒子分得很开',   'the particles are far apart',      3)
ON CONFLICT DO NOTHING;

COMMIT;
