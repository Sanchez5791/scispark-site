-- ============================================================
-- SciSpark · 家长周报 — 快照表 weekly_reports
-- 2026-06-16  feat/parent-weekly-report
-- 每周一 cron 为「有学习记录」的孩子生成一份周报快照并(可)发邮件。
-- 红线:本周没学习的孩子不写入、不发邮件(空周 skip)。
-- 隐私:家长只能读自己绑定孩子的周报(RLS);cron 用 service key 绕过 RLS 写入。
-- ============================================================

create table if not exists public.weekly_reports (
  id              uuid primary key default gen_random_uuid(),
  child_id        uuid not null references public.children(id) on delete cascade,
  parent_id       uuid,                       -- 冗余存一份,方便按家长查
  week_start      date not null,              -- 本周一(Mon)
  week_end        date not null,              -- 本周日(Sun)
  report          jsonb not null,             -- WeeklyReportCore.computeReport 算出的模型(真数据)
  lessons_completed int  not null default 0,
  avg_score       int,                        -- 百分比,可空(无评分→null)
  study_minutes   int,                        -- 估算分钟,可空
  email_status    text not null default 'pending',  -- pending | sent | skipped_empty | no_email_service | no_recipient | failed
  email_to        text,
  email_sent_at   timestamptz,
  email_error     text,
  generated_at    timestamptz not null default now(),
  unique (child_id, week_start)
);

create index if not exists weekly_reports_child_week_idx
  on public.weekly_reports (child_id, week_start desc);
create index if not exists weekly_reports_parent_idx
  on public.weekly_reports (parent_id);

-- RLS: 家长只读自己绑定孩子的周报
alter table public.weekly_reports enable row level security;

drop policy if exists "parents read own children weekly reports" on public.weekly_reports;
create policy "parents read own children weekly reports"
  on public.weekly_reports
  for select
  using (
    exists (
      select 1 from public.children c
      where c.id = public.weekly_reports.child_id
        and c.parent_id = auth.uid()
    )
  );

-- 没有 INSERT/UPDATE policy → 只有 service role(cron)能写,普通家长改不了。
