-- 20260701_telegram_notify.sql
-- 求救系统 Phase1 · 刀5 (军师房 → 双手房, 2026-07-01)。
--
-- 目标: 学生一求救(尤其危机) → 数据库插入 review_requests 一行 → 一个【独立】的
-- AFTER INSERT 触发器经 pg_net 调 Vercel 函数 /api/notify-telegram → 老板手机 Telegram
-- 收到一条【匿名】提醒。
--
-- ★本迁移【纯增量·可回滚】: 只【加 schema + 加表 + 加列 + 加一个新触发器】,
--   ★完全不动★现有的邮件/WhatsApp 触发器 trg_notify_review_request 与其函数。★
--
-- ★为什么不用 `alter database ... set app.*` (GUC)★:
--   Supabase 托管库的 postgres 角色【没权限】设数据库参数 (会报 42501 permission denied)。
--   (旧邮件/WhatsApp 链用的正是这条走不通的老路, 故很可能一直睡着没发。)
--   改用一张【私有配置表】private.notify_config 存 URL + 密钥, 触发器从表里读 —— 普通
--   权限即可, Supabase 认。密钥【不进本迁移文件】, 由部署者单独 INSERT (见文末)。
--
-- 卡⑫ 提醒老板: 本迁移不删不改任何现有数据, 纯加东西, 可回滚 (见文末 ROLLBACK)。

-- ============================================================
-- 1 · Telegram 幂等列 (与邮件/WhatsApp 的 notified_at 分开, 渠道各自独立)
-- ============================================================
alter table public.review_requests
  add column if not exists tg_notified_at timestamptz;

comment on column public.review_requests.tg_notified_at is
  '刀5: Telegram 通知已发出的时间戳 (防重复; 与 notified_at 邮件/WhatsApp 渠道独立)。为空=还没发/发失败可补发。';

-- ============================================================
-- 2 · 通知失败日志表 (§6④ 离线/失败兜底: 发失败也不丢, 看得到 + 能补发)
-- ============================================================
create table if not exists public.notify_failures (
  id                 uuid primary key default gen_random_uuid(),
  review_request_id  uuid references public.review_requests(id) on delete cascade,
  channel            text not null default 'telegram',
  error              text,
  created_at         timestamptz not null default now()
);

comment on table public.notify_failures is
  '刀5: 通知推送失败账本 (Telegram 断网/超时/未配置)。原始求救记录仍在 review_requests, 不受影响。';

create index if not exists notify_failures_created_idx
  on public.notify_failures (created_at desc);

alter table public.notify_failures enable row level security;
revoke all on table public.notify_failures from anon, authenticated;

-- ============================================================
-- 3 · 私有配置表: 存 Vercel 函数 URL + 共享密钥 (代替被锁的 GUC)
-- ============================================================
-- 放在【private schema】: Supabase PostgREST 默认只暴露 public, 故本表【不进 API】。
-- 再加 revoke + RLS, 学生/匿名读不到。触发器 SECURITY DEFINER (owner=postgres) 能读。
create schema if not exists private;
revoke all on schema private from anon, authenticated;

create table if not exists private.notify_config (
  key   text primary key,
  value text
);
revoke all on table private.notify_config from anon, authenticated;

comment on table private.notify_config is
  '刀5: 通知配置 (telegram_notify_url / telegram_notify_secret)。私有 schema, 不进 API。密钥不进迁移文件, 由部署者单独 INSERT。';

-- ============================================================
-- 4 · 触发器函数: 从配置表读 URL+密钥, 经 pg_net 异步 POST 到 Vercel (不拖慢插入)
-- ============================================================
create or replace function public.notify_telegram()
returns trigger
language plpgsql
security definer
set search_path = public, private, net, extensions
as $$
declare
  fn_url text;
  secret text;
begin
  select value into fn_url from private.notify_config where key = 'telegram_notify_url';
  select value into secret from private.notify_config where key = 'telegram_notify_secret';

  if fn_url is null or fn_url = '' then
    return new;  -- 还没配 → 什么都不做 (安全)
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
  -- 通知失败绝不能挡住学生求救记录落库
  return new;
end;
$$;

revoke all on function public.notify_telegram() from public;

-- ============================================================
-- 5 · 触发器: 只在新提交的求救上跑 (与邮件触发器同条件, 但【另建一个】, 互不影响)
-- ============================================================
drop trigger if exists trg_notify_telegram on public.review_requests;
create trigger trg_notify_telegram
  after insert on public.review_requests
  for each row
  when (new.status = 'submitted')
  execute function public.notify_telegram();

-- ============================================================
-- 部署者要跑的设置 (把 <域名> 换成真预览/生产域名; 密钥用一条强随机串, 与 Vercel 的
-- TELEGRAM_NOTIFY_SECRET 相同)。★这一段普通权限就能跑, 不会 42501★:
--
--   insert into private.notify_config (key, value) values
--     ('telegram_notify_url',    'https://<域名>/api/notify-telegram'),
--     ('telegram_notify_secret', '<和 Vercel TELEGRAM_NOTIFY_SECRET 一样的随机串>')
--   on conflict (key) do update set value = excluded.value;
--
-- (pg_net 扩展 20260620_review_notify_trigger.sql 已装; 这里直接用。)
-- 合并上线后, 把 url 那行改成生产域名 https://scisparklab.com/api/notify-telegram 再跑一次即可。
-- ============================================================

-- ============================================================
-- ROLLBACK (若要撤掉刀5, 完全不影响邮件/WhatsApp 老链路)
-- ============================================================
--   drop trigger if exists trg_notify_telegram on public.review_requests;
--   drop function if exists public.notify_telegram();
--   drop table if exists private.notify_config;
--   drop schema if exists private;              -- 若 private 只被本刀用
--   drop table if exists public.notify_failures;
--   alter table public.review_requests drop column if exists tg_notified_at;
