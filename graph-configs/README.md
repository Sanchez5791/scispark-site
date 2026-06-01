# graph-configs — 画图题配置层（第③块）

每道画图题一份 JSON，算账脑（`graph-marker.js`）读它来打分。
**算账脑无条件信任这里的配置**——配置写错，会静悄悄把每个学生都判错，
没有「转老师」兜底。所以**每改一份配置，先跑校验器**。

## 文件

| 文件 | 作用 |
|---|---|
| `{question_id}.json` | 一道题的配置（正确答案、容差、评分项） |
| `validate-config.js` | 守门员：上线前挡下写错的配置 |
| `test-validate.js` | 校验器自己的测试 |
| `README.md` | 本文 |

现有配置：`Y9_Q2b.json`（画线题 line_plot_fit）、`Y8_U3_L12_Q4.json`（读数题 read_from_graph）。

## 出一道新题（PHASE 4 流程）

1. 复制一份同 `graph_type` 的现有配置，改 `question_id` 和 `field_prefix`
   （两者通常相同；`field_prefix` 必须和 widget 吐出的栏位前缀一致）。
2. 填 `marks_breakdown`：列出这道题要打分的项。**键名必须从下表里挑，拼错算账脑会直接忽略 → 漏判。**
3. 按下面「评分项 → 必填字段」把对应的标准答案填进去。**值来自 mark scheme，不许瞎编。**
4. `total_marks` 必须等于各评分项满分之和（见下表）。
5. 跑校验：`node test-validate.js`（顺带验你新配置可加进去），或在代码里 `validateConfig(cfg)`。
6. 人工核对 mark scheme 后，把 `source` 里的 `VERIFY/PENDING` 改成真实出处。

## 评分项 → 满分 → 必填字段

| marks_breakdown 键 | 满分 | 必填字段 |
|---|---|---|
| `axis_labels` | 1 | `expected_axes`（x_axis/y_axis 各带 `variable_keywords`；若 `unit_required` 则 `unit_keywords` 非空） |
| `point_plotting` | 1 | `expected_points`（非空，坐标是数字） |
| `line_best_fit` | 1 | `expected_points`（线对着这些点判） |
| `bar_height` | 1 | `expected_bars`（每根 `category` + `height`） |
| `value_reading` | 1 | `expected_value`（数字）；建议 `expected_unit` |
| `gradient_calc` | **3** | `expected_value`、`expected_unit`；建议 `min_triangle_size` |
| `correlation` | 1 | `expected_correlation`（字符串） |
| `pattern_text` | 1 | `expected_keywords`（非空数组） |
| `anomaly_marked` | 1 | `expected_anomaly` 可选 |

> ⚠️ `gradient_calc` 满分是 **3**（三角形 + 数值 + 单位各 1），别按 1 算 `total_marks`。

## 常用可调字段（带默认值）

- `point_tolerance`（默认 0.5）、`min_points_to_award`（默认 点数−1）
- `line_tolerance_units`（默认 1.0）、`line_min_length_units`（默认 4）
- `value_tolerance_pct`（默认 读数 5 / 斜率 10）
- `bar_tolerance`（默认 0.5）、`anomaly_tolerance`（默认 1.0）
- `allow_one_anomaly`（true 时，学生标的异常点会先从 `expected_points` 剔除）

## 校验器：error vs warning

- **error** = 挡下，不许上线（结构错、必填字段缺、坐标类型错、评分项拼错、分值对不上）。
- **warning** = 放行但提醒（`source` 还是 VERIFY、`graph_canvas` 还是 PENDING、读数题没填单位等）。

```js
const { validateConfig } = require('./validate-config.js');
const res = validateConfig(require('./Y9_Q2b.json'));
// res = { ok, errors:[...], warnings:[...], question_id }
```

## 部署闸门

`source` 字段在人工核对真实 mark scheme 之前，保持 `VERIFY...` 字样——
校验器会一直 warning，提醒「还没核对，别上线」。
`Y8_U3_L12_Q4.json` 的 `value_tolerance_pct` 目前是**临时估值**，上线前务必按 mark scheme 的接受区间确认。

> 注：`graph_canvas` 校准块当前算账脑并不消费（widget 自带标定），保留只为符合 schema。
