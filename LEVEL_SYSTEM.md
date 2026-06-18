# 学生分等级 Level 系统 (方案 B) — 实现说明

> Order: `SciSpark_Order_To_HandsRoom_StudentLevel_PlanB_2026-06-18`
> 方案 B = **按等级给「题目难度 + 提示量」**。游戏化(方案 C)以后才做,这次只在结构上预留。

---

## 1. 死规则(都已编码,不靠口头守)

| 规则 | 在哪强制 |
|---|---|
| 真实等级 `backend_level` 可升可降,决定给什么难度的题 + 提示量 | `student_levels.backend_level` |
| 显示等级 `display_level` **只升不降** = 历史最高 | `set_student_level()` 里 `greatest(旧, 新)`,DB 层强制 |
| 降级**绝不**显示给学生/家长 | 前端只读 `display_level`;趋势图只画 `display_level` |
| 真数据才显示,没有 → 「暂无」 | 无 `student_levels` 行 → 家长台显示 No level yet · 暂无等级 |
| 方案 C 以后能加奖励层、不用改表 | `student_levels.rewards jsonb`(现在空)+ `level-system.js` `CONFIG.rewards`(现在 `enabled:false`) |

---

## 2. 数据库(`sql/student_level_system.sql`,已上线到 Supabase)

- **`student_levels`**(每个孩子一行,当前状态):`backend_level` / `display_level` / `placement_level` / 滚动累计 `rolling_*` / `rewards`(方案C预留)/ `meta`。
- **`level_events`**(历史,喂家长台趋势 + 审计):每次变化一行,含 `direction`(`up`/`down`/`same`,后台方向)与 `display_level`(只升不降)。
- **RLS**:家长只看自己孩子(镜像 `lesson_progress`)。**客户端只能 SELECT**;没有 INSERT/UPDATE/DELETE policy。
- **写入只走三个 `SECURITY DEFINER` 函数(只授权 `service_role`)**:
  - `apply_placement_result(child, pct)` — 入学定级:总正确率 0..100 → 起点等级。
  - `recompute_student_level(child, unit_key)` — 单元末重算:读 `lesson_progress.score` 滚动平均,**每次最多 ±1 级**。
  - `set_student_level(child, level, event_type, …)` — 唯一写入口,强制 `display = greatest(旧, 新)`。

> 已用「升 L3 → 后台降 L1」做过 rollback 测试:`display_level` 稳稳停在 3,后台正确记到 1。

---

## 3. 等级阈值(v1,可调)

`level-system.js` 与 SQL **两边一致**,改一处记得改两处。

| 总分 / 正确率 | 等级 |
|---|---|
| ≥ 80% | Level 3(挑战) |
| 50–79% | Level 2(进阶) |
| < 50% | Level 1(起步) |

单元末重算:由该单元 `lesson_progress.score` 平均分套上表算「理想等级」,再相对当前后台等级**一次最多动一级**(防止抖动)。

---

## 4. 给内容房 / 工厂房:课堂题目怎么标(才能按等级切换)

机制在 `public/level-system.js` 的 `applyLevelToQuestion()`。作者只要在题块里加标注,**不标的旧题原样显示,不受影响**。

```html
<div class="question-block" data-question="Q01">

  <!-- (可选) 同一知识点的三个难度版本;不写就用唯一一题 -->
  <div data-variant="easy">  …简单版题干… </div>
  <div data-variant="medium">…中等版题干… </div>
  <div data-variant="hard">  …挑战版题干… </div>

  <!-- 作答区(三档共用)、批改逻辑不变 -->

  <!-- 三档提示;按等级只显示其中一档 -->
  <div class="lvl-hint" data-hint="full">   提示多(手把手,L1) </div>
  <div class="lvl-hint" data-hint="medium"> 提示中(L2)       </div>
  <div class="lvl-hint" data-hint="light">  提示少(一个关键词,L3) </div>

</div>
```

- `data-variant`:`easy` / `medium` / `hard` —— L1→easy, L2→medium, L3→hard。
- `data-hint`:`full` / `medium` / `light` —— L1→full, L2→medium, L3→light。
- 课堂页只要 `SciSparkLevel.applyLevelToAll(document, 后台等级)` 一行,即按学生**后台真实等级**切好难度与提示。

> 真课接入(改 `lessons/_template/lesson-shell-v4-FUNCTIONAL-template.html`)留到内容房供齐三档内容后再做 —— 见「待办」。`level-demo.html` 已用样题演示这套机制。

---

## 5. 前端文件

| 文件 | 作用 |
|---|---|
| `public/level-system.js` | 共用引擎:阈值、定级/重算、徽章、难度标签、提示切换、只升不降趋势、demo 数据 |
| `public/level-system.css` | 等级徽章 / 难度标签 / 提示框 / 切换器 / 趋势图样式(继承 design-tokens) |
| `level-demo.html` | **给老板看的一条龙预览**:定级 → 课中难度+提示 → 跟进(真实vs显示)→ 家长台趋势 |
| `parent-console.html` | 新增「学习等级」区:读 `student_levels`/`level_events`;无数据→暂无;`?demo=level` 显示样例 |

---

## 6. 待办(本次预览**未**做,等点头后排)

1. **入学定级正式页**:3×15min、真题(内容房供)、做完调 `apply_placement_result`(走 service_role / Edge Function)。
2. **真课接入**:把 `applyLevelToAll()` 接进 functional 模板,内容房供齐每题三档难度+三档提示后再批量。
3. **单元末重算触发**:课程完成时(或 cron)调 `recompute_student_level`。
4. **方案 C**:奖励层(徽章/星星/SparkJar)。表与 config 已预留,届时加一层,不改结构。

---

## 7. 红线自查

- ✅ 真数据才显示;demo 全部清楚标注「样例 / Demo」。
- ✅ 降级绝不显示(DB + 前端双保险)。
- ✅ 没碰 7 个 PhET 保护分支。
- ✅ 没做游戏化(方案 C),只预留。
- ⏳ Vercel 预览 → 老板手机点头 → 才上线。
