-- Migration: add 'monthly' to subscription_type constraint
-- Applied: 2026-05-28 (subscriptions table had 0 rows — safe)
-- Purpose: support monthly flat-rate subscription ($37/month) alongside
--          the existing 'unit' (per-unit) and 'annual' types.

BEGIN;

ALTER TABLE subscriptions DROP CONSTRAINT subscriptions_subscription_type_check;
ALTER TABLE subscriptions DROP CONSTRAINT chk_unit_code_consistency;

-- Allow unit, monthly, and annual subscription types
ALTER TABLE subscriptions ADD CONSTRAINT subscriptions_subscription_type_check
  CHECK (subscription_type = ANY (ARRAY['unit'::text, 'monthly'::text, 'annual'::text]));

-- monthly and annual must have null unit_code; unit must have non-null unit_code
ALTER TABLE subscriptions ADD CONSTRAINT chk_unit_code_consistency
  CHECK (
    (subscription_type = 'unit' AND unit_code IS NOT NULL)
    OR
    (subscription_type = ANY (ARRAY['monthly'::text, 'annual'::text]) AND unit_code IS NULL)
  );

COMMIT;
