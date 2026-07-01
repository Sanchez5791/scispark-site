-- 20260701_telegram_notify.sql
-- 求救系统 Phase1 · 刀5 (军师房 → 双手房, 2026-07-01)。
--
-- 目标: 学生一求救(尤其危机) → 数据库插入 review_requests 一行 → 一个【独立】的
-- AFTER INSERT 触发器经 pg_net 调 Vercel 函数 /api/notify-telegram → 老板手机 Telegram
-- 收到一条【匿名】提醒。
--
-- ★本迁移【纯增量·可回滚】: 只【加列 + 加表 + 加一个新触发器】, ★完全不动★现有的
--   邮件/WhatsApp 触发器 trg_notify_review_request 与其函数 —— 那条老链路照常工作。★
--
-- ★密钥不进本文件★: Vercel 函数 URL + 共享密钥由部署者用数据库设置(GUC)带进来:
--     app.telegram_notify_url     e.g. https://<域名>/api/notify-telegram
--     app.telegram_notify_secret  随机串, 同时设成 Vercel 环境变量 TELEGRAM_NOTIFY_SECRET
--   URL 为空 → 触发器安全 no-op (没配好之前跑本迁移也无害)。
--
-- 卡⑫ 提醒老板: 本迁移不删不改任何现有数据, 纯加东西, 可回滚 (见文末)。

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
-- 复核台里的原始求救记录永远是唯一真相源 (review_requests), 永不丢。本表只是"通知这一层"
-- 的失败账本, 方便老板看哪些没推出去 + 触发补发。
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

-- 只给服务角色写 (Vercel 函数用 service key); 不开给学生/匿名。
alter table public.notify_failures enable row level security;
revoke all on table public.notify_failures from anon, authenticated;

-- ============================================================
-- 3 · 触发器函数: 经 pg_net 异步 POST 到 Vercel 函数 (不拖慢插入)
-- ============================================================
create or replace function public.notify_telegram()
returns trigger
language plpgsql
security definer
set search_path = public, net, extensions
as $$
declare
  fn_url  text := current_setting('app.telegram_notify_url', true);
  secret  text := current_setting('app.telegram_notify_secret', true);
begin
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
-- 4 · 触发器: 只在新提交的求救上跑 (与邮件触发器同条件, 但【另建一个】, 互不影响)
-- ============================================================
drop trigger if exists trg_notify_telegram on public.review_requests;
create trigger trg_notify_telegram
  after insert on public.review_requests
  for each row
  when (new.status = 'submitted')
  execute function public.notify_telegram();

-- ============================================================
-- 部署者要跑的设置 (把 <域名> 换成真预览/生产域名, 密钥用一条强随机串, 与 Vercel 的
-- TELEGRAM_NOTIFY_SECRET 相同):
--
--   alter database postgres
--     set app.telegram_notify_url = 'https://<域名>/api/notify-telegram';
--   alter database postgres
--     set app.telegram_notify_secret = '<和 Vercel TELEGRAM_NOTIFY_SECRET 一样的随机串>';
--   select pg_reload_conf();
--
-- (pg_net 扩展 20260620_review_notify_trigger.sql 已装; 这里直接用。)
-- ============================================================

-- ============================================================
-- ROLLBACK (若要撤掉刀5, 完全不影响邮件/WhatsApp 老链路)
-- ============================================================
--   drop trigger if exists trg_notify_telegram on public.review_requests;
--   drop function if exists public.notify_telegram();
--   drop table if exists public.notify_failures;
--   alter table public.review_requests drop column if exists tg_notified_at;
--   -- GUC 清理 (可选):
--   --   alter database postgres reset app.telegram_notify_url;
--   --   alter database postgres reset app.telegram_notify_secret;
