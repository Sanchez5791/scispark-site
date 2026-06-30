-- 20260630_rescue_phase1_columns.sql
-- Order: 求救系统 Phase 1 · 第二刀 (军师锁定施工单, 2026-06-30).
-- 老板拍板: 不建新表 rescue_records, 改【扩充现有 review_requests】(闭环+纯文字快照+匿名
-- auth.uid 已具备; 哈希会弄坏 RLS 权限控制, 故不哈希)。本迁移只【加列】, 纯增量, 不删不改
-- 任何现有数据/策略, 完全可回滚。
--
-- 加 3 列, 给第三刀(红色)/第四刀(危机)当骨架:
--   trigger_type  — 这条记录怎么来的 (学生申诉 / 系统红A崩 / 系统红B疑作弊 / 危机)
--   is_crisis     — 危机侦测命中=true → 最高优先 (第四刀写, 现在默认 false)
--   expires_at    — 数据保留期限, 到期由 Cron 删 (Cron 另做, 见文末 TODO)
--
-- 红线: 不存真名/email (本表本来就只存 auth.uid 这个匿名 UUID); 快照只存纯文字 (本表
-- 本来就只有 text 列, 无 base64); 红色永不自动记0 (本表无该列/触发器)。

-- ============================================================
-- 1 · 加列 (全部带默认值, 现有行自动安全填充)
-- ============================================================
alter table public.review_requests
  add column if not exists trigger_type text not null default 'STUDENT_APPEAL'
    check (trigger_type in ('STUDENT_APPEAL','SYSTEM_RED_A','SYSTEM_RED_B','CRISIS'));

alter table public.review_requests
  add column if not exists is_crisis boolean not null default false;

alter table public.review_requests
  add column if not exists expires_at timestamptz;

-- 现有行 (件23 之前的申诉): 给一个合理的到期日 = 当初创建 + 1 年。
update public.review_requests
  set expires_at = created_at + interval '1 year'
  where expires_at is null;

-- 新行默认 1 年后到期 (普通申诉; 危机记录第四刀可单独设更久)。
alter table public.review_requests
  alter column expires_at set default (now() + interval '1 year');

comment on column public.review_requests.trigger_type is
  '记录来源: STUDENT_APPEAL(学生申诉) / SYSTEM_RED_A(判分崩) / SYSTEM_RED_B(疑作弊) / CRISIS(危机侦测). 求救Phase1.';
comment on column public.review_requests.is_crisis is
  '危机侦测命中=true → 最高优先转真人 (第四刀写入, 绝不让 AI 自动回危机内容).';
comment on column public.review_requests.expires_at is
  '数据保留到期日; 到期 Cron 删理由+快照, 留结构化分数 (合规, 不满14岁特殊保护).';

-- ============================================================
-- 2 · 索引: 危机记录要能被最高优先捞出来
-- ============================================================
create index if not exists review_requests_crisis_idx
  on public.review_requests (is_crisis, created_at desc)
  where is_crisis = true;

create index if not exists review_requests_trigger_idx
  on public.review_requests (trigger_type, status, created_at desc);

-- ============================================================
-- TODO (后续刀, 非本迁移):
--   * 保留期 Cron: 到期自动删 justification + snapshot, 保留结构化分数 (需 pg_cron 或
--     Supabase Scheduled Function; 危机记录可设更长保留供审计/法律)。
--   * RLS 不变: 学生只看自己 (student_id=auth.uid), 老师看全部 (is_staff()); 本迁移没动策略。
-- ============================================================

-- ============================================================
-- ROLLBACK (纯增量, 安全可回滚)
-- ============================================================
--   drop index if exists public.review_requests_trigger_idx;
--   drop index if exists public.review_requests_crisis_idx;
--   alter table public.review_requests drop column if exists expires_at;
--   alter table public.review_requests drop column if exists is_crisis;
--   alter table public.review_requests drop column if exists trigger_type;
