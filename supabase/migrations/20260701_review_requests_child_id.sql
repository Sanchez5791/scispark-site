-- 20260701_review_requests_child_id.sql
-- Order: 引擎解冻期 · 第2件 全站身份修复 (军师 APPROVAL 2026-07-01)。
--
-- 给 review_requests 加一栏 child_id, 让「申诉/危机/系统红」记录能绑到【真正在上课的孩子】。
-- 引擎(v4/v8)的 resolveActiveChild 认出孩子就写真 child_id; 认不出(多孩子没带 child_id)
-- 就写 NULL = 待人工认领(复核台显示「待认领 UNRESOLVED」)。
--
-- ★救命铁律 (军师): 危机/申诉写入永远照写照响, 认不出孩子只是 child_id 留空, 绝不因此挡。★
--
-- 红线:
--   * 纯增量: 只加一栏(可空) + 一个索引。不改现有列/数据/策略/触发器。
--   * 可空: 旧行(件23 之前) + 认不出的新行 都 = NULL, 不回填、不报错。
--   * 不加外键: child_id 允许 NULL(待认领), 且 RLS 已按 student_id 控权; 保持最轻。
--   * 刀5 通知触发器只认 review_requests 的 INSERT, 与 child_id 无关 → 危机通知照响, 零影响。

-- ============================================================
-- UP
-- ============================================================
alter table public.review_requests
  add column if not exists child_id uuid;

comment on column public.review_requests.child_id is
  '这条申诉/危机对应的孩子 (children.id)。引擎 resolveActiveChild 认出=真 child_id; '
  '认不出(多孩子没带)=NULL=待人工认领。身份修复 Order 2026-07-01。绝不因认不出而不写危机。';

-- 便于复核台捞「待认领」(child_id is null) + 按孩子查
create index if not exists review_requests_child_idx
  on public.review_requests (child_id);

-- ============================================================
-- ROLLBACK (纯增量, 安全可回滚)
-- ============================================================
--   drop index if exists public.review_requests_child_idx;
--   alter table public.review_requests drop column if exists child_id;
