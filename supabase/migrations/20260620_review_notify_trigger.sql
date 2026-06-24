-- 20260620_review_notify_trigger.sql
-- Order: ③ 免费通知 (军师房 → 双手房, 2026-06-20).
--
-- When a student files a 「请老师复核」 appeal (INSERT into public.review_requests)
-- the boss should get a free Gmail + WhatsApp ping. This migration wires the
-- server-side half: an AFTER INSERT trigger that calls the `notify-review-request`
-- Edge Function once, via pg_net (async HTTP, does not slow the insert).
--
-- 别重复发 / no double-send:
--   * the trigger fires exactly ONCE per inserted row;
--   * the Edge Function is idempotent — it stamps review_requests.notified_at and
--     refuses to send again if that column is already set.
--
-- No secret is committed here. The function URL + shared secret are read from
-- database settings (GUCs) that the deployer sets out-of-band (see runbook
-- supabase/functions/notify-review-request/DEPLOY.md). If the URL setting is
-- blank the trigger safely no-ops, so this migration is harmless before config.

-- ============================================================
-- 1 · idempotency column
-- ============================================================
alter table public.review_requests
  add column if not exists notified_at timestamptz;

comment on column public.review_requests.notified_at is
  'Set by the notify-review-request Edge Function once the boss has been pinged. Guards against double-send.';

-- ============================================================
-- 2 · pg_net (async HTTP from Postgres) — Supabase ships this extension
-- ============================================================
create extension if not exists pg_net;

-- ============================================================
-- 3 · trigger function
-- ============================================================
-- Reads two GUCs the deployer sets:
--   app.notify_function_url  e.g. https://<ref>.supabase.co/functions/v1/notify-review-request
--   app.notify_secret        random shared secret, also set as the function's NOTIFY_TRIGGER_SECRET
-- Blank url → no-op (safe).
create or replace function public.notify_review_request()
returns trigger
language plpgsql
security definer
set search_path = public, net, extensions
as $$
declare
  fn_url  text := current_setting('app.notify_function_url', true);
  secret  text := current_setting('app.notify_secret', true);
begin
  if fn_url is null or fn_url = '' then
    return new;  -- not configured yet → do nothing
  end if;

  perform net.http_post(
    url     := fn_url,
    headers := jsonb_build_object(
                 'Content-Type',    'application/json',
                 'x-notify-secret', coalesce(secret, '')
               ),
    body    := jsonb_build_object('id', new.id)
  );

  return new;
exception when others then
  -- never let a notification failure block the student's appeal from being saved
  return new;
end;
$$;

revoke all on function public.notify_review_request() from public;

-- ============================================================
-- 4 · trigger — only on a fresh submitted appeal
-- ============================================================
drop trigger if exists trg_notify_review_request on public.review_requests;
create trigger trg_notify_review_request
  after insert on public.review_requests
  for each row
  when (new.status = 'submitted')
  execute function public.notify_review_request();

-- ============================================================
-- ROLLBACK (if ever needed)
-- ============================================================
--   drop trigger if exists trg_notify_review_request on public.review_requests;
--   drop function if exists public.notify_review_request();
--   alter table public.review_requests drop column if exists notified_at;
--   -- (leave pg_net installed; other features may use it)
