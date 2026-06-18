-- ============================================================================
-- SciSpark · 学生分等级 Level 系统 (方案 B) — DB foundation
-- Order: SciSpark_Order_To_HandsRoom_StudentLevel_PlanB_2026-06-18
-- ----------------------------------------------------------------------------
-- DEATH RULES encoded here:
--   • 真实等级 (backend_level): 可升可降, 机器用它决定题目难度 + 提示量.
--   • 显示等级 (display_level): 只升不降 (= 历史最高), 给学生/家长看.
--   • 真数据才显示: 没做过定级/没答过题 → 无 student_levels 行 → 前端显示「暂无」.
--   • 方案 C 预留: rewards jsonb 占位, 现在不写, 以后加奖励层不用改表.
--   • 只升不降在 DB 层强制 (set_student_level), 不靠前端守.
-- 所有写入只走 SECURITY DEFINER 函数 (service_role 调用); 客户端只读.
-- ============================================================================

-- ── 1. 当前状态表 (每个孩子一行) ──────────────────────────────────────────
create table if not exists public.student_levels (
  child_id               uuid primary key references public.children(id) on delete cascade,
  backend_level          smallint not null default 2 check (backend_level between 1 and 3),  -- 真实等级 (可升可降)
  display_level          smallint not null default 2 check (display_level between 1 and 3),  -- 显示等级 (只升不降)
  placement_level        smallint check (placement_level between 1 and 3),                   -- 入学定级起点
  placement_completed_at timestamptz,
  rolling_correct        integer not null default 0,    -- 滚动累计: 答对题数
  rolling_total          integer not null default 0,    -- 滚动累计: 总答题数
  rolling_score          numeric,                       -- 缓存正确率 / 平均分 (null = 还没答过)
  last_recomputed_at     timestamptz,
  rewards                jsonb not null default '{}'::jsonb,  -- 方案 C 预留 (徽章/星星/SparkJar), 现在为空
  meta                   jsonb not null default '{}'::jsonb,  -- 其它扩展预留
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now()
);
comment on table public.student_levels is '学生分等级 (方案B): 真实等级可升可降, 显示等级只升不降; rewards 为方案C预留';

-- ── 2. 等级变化历史 (喂家长台只升不降趋势 + 审计) ────────────────────────
create table if not exists public.level_events (
  id             uuid primary key default gen_random_uuid(),
  child_id       uuid not null references public.children(id) on delete cascade,
  event_type     text not null check (event_type in ('placement','unit_recompute','rolling','manual','seed')),
  backend_level  smallint not null check (backend_level between 1 and 3),
  display_level  smallint not null check (display_level between 1 and 3),
  direction      text not null default 'same' check (direction in ('up','down','same')),  -- 后台方向; 显示从不画 down
  unit_key       text,           -- 例 '7-1' (单元末重算时)
  score_snapshot numeric,
  note           text,
  created_at     timestamptz not null default now()
);
create index if not exists level_events_child_created_idx on public.level_events(child_id, created_at);
comment on table public.level_events is '等级变化历史: display_level 单调不减, 家长趋势图只用 display_level (只升不降)';

-- ── 3. RLS: 家长只看自己孩子 (镜像 lesson_progress); 写入只走函数 ─────────
alter table public.student_levels enable row level security;
alter table public.level_events   enable row level security;

drop policy if exists student_levels_select_own on public.student_levels;
create policy student_levels_select_own on public.student_levels
  for select to authenticated
  using (
    child_id in (select id from public.children where parent_id = auth.uid())
    or (auth.jwt() ->> 'email') = 'info@scisparklab.com'
  );

drop policy if exists level_events_select_own on public.level_events;
create policy level_events_select_own on public.level_events
  for select to authenticated
  using (
    child_id in (select id from public.children where parent_id = auth.uid())
    or (auth.jwt() ->> 'email') = 'info@scisparklab.com'
  );
-- 故意不建 INSERT/UPDATE/DELETE policy → 客户端无法直接写; 只有下面的 definer 函数能写.

-- ── 4. 唯一写入口: 强制「只升不降」显示规则 ───────────────────────────────
create or replace function public.set_student_level(
  p_child       uuid,
  p_backend     smallint,
  p_event_type  text,
  p_unit_key    text    default null,
  p_score       numeric default null,
  p_note        text    default null
) returns public.student_levels
language plpgsql security definer set search_path = public as $$
declare
  v_prev_backend smallint;
  v_prev_display smallint;
  v_dir          text;
  v_row          public.student_levels;
begin
  if p_backend is null or p_backend not between 1 and 3 then
    raise exception 'backend level must be 1..3 (got %)', p_backend;
  end if;

  select backend_level, display_level into v_prev_backend, v_prev_display
    from public.student_levels where child_id = p_child;

  v_dir := case
    when v_prev_backend is null then 'same'
    when p_backend > v_prev_backend then 'up'
    when p_backend < v_prev_backend then 'down'
    else 'same' end;

  insert into public.student_levels as sl
      (child_id, backend_level, display_level,
       placement_level, placement_completed_at, last_recomputed_at, updated_at)
    values (p_child, p_backend, p_backend,   -- first row: display starts = backend
       case when p_event_type = 'placement' then p_backend else null end,
       case when p_event_type = 'placement' then now() else null end,
       now(), now())
  on conflict (child_id) do update set
    backend_level          = excluded.backend_level,
    display_level          = greatest(sl.display_level, excluded.backend_level),  -- ONLY UP
    placement_level        = coalesce(sl.placement_level,
                               case when p_event_type = 'placement' then excluded.backend_level end),
    placement_completed_at = coalesce(sl.placement_completed_at,
                               case when p_event_type = 'placement' then now() end),
    last_recomputed_at     = now(),
    updated_at             = now()
  returning * into v_row;

  insert into public.level_events
      (child_id, event_type, backend_level, display_level, direction, unit_key, score_snapshot, note)
    values (p_child, p_event_type, p_backend, v_row.display_level, v_dir, p_unit_key, p_score, p_note);

  return v_row;
end $$;
comment on function public.set_student_level is '等级唯一写入口; display_level = greatest(旧, 新backend) 强制只升不降';

-- ── 5. 入学定级: 把 3×15min 小测的总正确率 (0..100) 映射成起点等级 ─────────
create or replace function public.apply_placement_result(p_child uuid, p_pct numeric)
returns public.student_levels
language plpgsql security definer set search_path = public as $$
declare v_backend smallint;
begin
  -- v1 阈值 (可调): <50 → L1, 50..79 → L2, ≥80 → L3
  v_backend := case when p_pct >= 80 then 3 when p_pct >= 50 then 2 else 1 end;
  return public.set_student_level(p_child, v_backend, 'placement', null, round(p_pct,1), 'placement test (3×15min)');
end $$;

-- ── 6. 单元末重算 (C 混合): 由 lesson_progress.score 滚动平均决定, 每次最多 ±1 级 ──
create or replace function public.recompute_student_level(p_child uuid, p_unit_key text default null)
returns public.student_levels
language plpgsql security definer set search_path = public as $$
declare
  v_n int; v_avg numeric; v_backend smallint; v_cur smallint;
begin
  select count(*), avg(score) into v_n, v_avg
    from public.lesson_progress
    where child_id = p_child and score is not null;

  if v_n = 0 then
    return (select * from public.student_levels where child_id = p_child);  -- 没真数据 → 不动
  end if;

  -- v1 阈值 (可调, 假设 score 为 0..100): ≥80 → L3, 50..79 → L2, <50 → L1
  v_backend := case when v_avg >= 80 then 3 when v_avg >= 50 then 2 else 1 end;

  -- 温和调整: 相对当前后台等级一次最多动 ±1 级
  select backend_level into v_cur from public.student_levels where child_id = p_child;
  if v_cur is not null then
    v_backend := least(greatest(v_backend, (v_cur - 1)::smallint), (v_cur + 1)::smallint);
  end if;

  return public.set_student_level(p_child, v_backend::smallint, 'unit_recompute', p_unit_key, round(v_avg,1), 'unit-end auto recompute');
end $$;

-- ── 7. 权限: 写函数只给 service_role (服务端/老师/cron 调用); 客户端只能 SELECT 表 ──
revoke all on function public.set_student_level(uuid, smallint, text, text, numeric, text) from public, anon, authenticated;
revoke all on function public.apply_placement_result(uuid, numeric) from public, anon, authenticated;
revoke all on function public.recompute_student_level(uuid, text) from public, anon, authenticated;
grant execute on function public.set_student_level(uuid, smallint, text, text, numeric, text) to service_role;
grant execute on function public.apply_placement_result(uuid, numeric) to service_role;
grant execute on function public.recompute_student_level(uuid, text) to service_role;
