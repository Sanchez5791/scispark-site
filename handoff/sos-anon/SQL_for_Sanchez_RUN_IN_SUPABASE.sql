-- ============================================================================
-- SciSpark · 匿名求救 (SOS) · 数据库指令单  —— ★只有 Sanchez 授权并执行★
-- 日期: 2026-07-02   来源: HandsRoom feat/sos-anonymous
-- ============================================================================
-- 这是「第二波(防灌爆)+存档」需要的唯一一段 SQL。跑之前, 先读 §7 铁律:
--   ⚠️ 此改动碰 supabase/ 。★不准★与「静音通知(notification-mute)」那条 supabase 活
--      同时开工 —— 要排队, 一次只做一条。
--   ⚠️ service_role 密钥永远只在 Vercel 环境变量, 绝不进浏览器、绝不贴聊天。
--
-- 跑法: Supabase → SQL Editor → 贴全文 → Run。跑完看最后的 SELECT 自检。
-- 不跑也不会要命: 没这张表, api/sos.js 的「渠道A(发老板手机)」照样工作(生命线不断),
--   只是没有存档、没有分钟级防灌爆。跑了之后, 存档 + 防灌爆自动生效, 前端/函数都不用改。
-- ============================================================================

-- 1) 匿名求救存档表 (只进不改、只给后台函数写) --------------------------------
create table if not exists public.sos_anonymous (
  id            uuid primary key default gen_random_uuid(),
  message       text,                       -- 小孩留言(可空)
  page_url      text,                       -- 从哪一页按的
  device_hint   text,                       -- 粗设备信息(排错用)
  anonymous_tag text,                       -- hash(IP+粗UA), ★仅供限流, 不是身份★
  minute_bucket text,                       -- UTC 到分钟, 配合下面的唯一约束防灌爆
  ref           text,                       -- 匿名参考号(与老板手机通知里的 #xxxx 对号)
  notify_status text,                       -- 'sent' / 'failed' (发老板手机的结果)
  created_at    timestamptz not null default now()
);

-- 2) 防灌爆核心 (指令 §3): 同一来源同一分钟只允许一行 -------------------------
--    api/sos.js 用 ON CONFLICT DO NOTHING, 第一条(最可能是真的)一定写入并通知;
--    同分钟其余的自动被这个唯一约束挡掉。坏人就算换 IP, 每标签每分钟也顶多一行。
create unique index if not exists sos_anonymous_tag_minute_uniq
  on public.sos_anonymous (anonymous_tag, minute_bucket);

-- 3) 权限: 开 RLS, 且★不开任何 anon/authenticated 的策略★ -----------------------
--    → 浏览器(anon/登录用户)一律读不到、写不进、改不了、删不了。
--    → 只有后台函数用的 service_role 能写(service_role 天生绕过 RLS)。
alter table public.sos_anonymous enable row level security;
-- (不建任何 policy = 除 service_role 外全部拒绝。这就是指令 §1「INSERT-only for this path」。)

-- 保险: 明确收回 anon / authenticated 对这张表的一切直接权限
revoke all on public.sos_anonymous from anon;
revoke all on public.sos_anonymous from authenticated;

-- ============================================================================
-- 自检 (跑完应看到: 表在、唯一索引在、RLS=true) --------------------------------
select
  (select count(*) from information_schema.tables
     where table_schema='public' and table_name='sos_anonymous')            as table_exists,
  (select count(*) from pg_indexes
     where schemaname='public' and indexname='sos_anonymous_tag_minute_uniq') as uniq_index_exists,
  (select relrowsecurity from pg_class where relname='sos_anonymous')        as rls_enabled;
-- 期望: table_exists=1, uniq_index_exists=1, rls_enabled=true
-- ============================================================================
