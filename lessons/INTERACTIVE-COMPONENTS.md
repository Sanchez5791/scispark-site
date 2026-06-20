# 互动组件接法速查 · Interactive Components Cheat-Sheet

> 给做课工厂：搭 Y7 单元一 lesson 网页时，照这页复制粘贴就能接入会动的题。
> 不用翻组件代码。每个组件 = **引入 2~3 个文件** + **一个 `<div>` 占位** + **一段题目 JSON**。

两个组件：
| 组件 | 干什么 | 上线状态 |
|---|---|---|
| **拖拽** `drag` | 排顺序 / 连连看 / 拖步骤 / **分类** | ✅ 已在 main（PR #24）；**分类**新增待合 |
| **粒子画板** `particle` | 画三态粒子 + 画箭头 | ⏳ PR #25 合并后上线 |

判分有两种模式，**先看哪种**：
- **即时判分 `self_check`** —— 答案写在页面里，前端当场判，不用后端。最简单，适合练习题。**两个组件现在都能用。**
- **后端判分** —— 答案放后端 config 文件，不下发给学生（防偷看）。**粒子已接好**；拖拽的后端判分还没接（要的话跟代码房说一声，很快）。

下面先给 **`self_check` 的复制即用版**（搭壳阶段最省事），后端版在最后。

---

## 组件一：拖拽 `drag`

**① 引入文件**（`<head>` 放 CSS，`</body>` 前放 JS）：
```html
<link rel="stylesheet" href="/components/drag-interactions.css">
...
<script src="/components/drag-interactions.js"></script>
```

**② 排顺序 / 拖步骤**（`mode: "sequence"`）——把卡片拖成正确顺序：
```html
<div data-component="drag" data-question-id="Y7_U1_L02_Q1">
  <script type="application/json">
  {
    "mode": "sequence",
    "self_check": true,
    "prompt": { "en": "Order these by particle energy:", "zh": "按粒子能量排序：" },
    "items": [
      { "id": "solid",  "label": { "en": "Solid",  "zh": "固态" } },
      { "id": "liquid", "label": { "en": "Liquid", "zh": "液态" } },
      { "id": "gas",    "label": { "en": "Gas",    "zh": "气态" } }
    ],
    "correct_order": ["solid", "liquid", "gas"]
  }
  </script>
</div>
```
> 卡片上屏时会自动打乱。`correct_order` 写 `items` 里的 `id`，按正确先后排。

**③ 连连看**（`mode: "match"`）——左右两列拖线配对：
```html
<div data-component="drag" data-question-id="Y7_U1_L02_Q2">
  <script type="application/json">
  {
    "mode": "match",
    "self_check": true,
    "prompt": { "en": "Match the change to its name:", "zh": "把变化和名称连起来：" },
    "left":  [ { "id": "L1", "label": { "en": "Solid → Liquid", "zh": "固 → 液" } } ],
    "right": [ { "id": "R1", "label": { "en": "Melting", "zh": "熔化" } } ],
    "correct_pairs": [ ["L1", "R1"] ]
  }
  </script>
</div>
```
> 右列自动打乱。`correct_pairs` 写 `[左id, 右id]` 的数组，几对写几条。

**④ 分类**（`mode: "categorize"`）——把多张卡片拖进几个盒子，**一个盒子能装多张**（连线题做不到的「多对一」就用这个）：
```html
<div data-component="drag" data-question-id="Y7_U1_L02_T1">
  <script type="application/json">
  {
    "mode": "categorize",
    "self_check": true,
    "prompt": { "en": "Drag each thing into the right box.", "zh": "把每样东西拖进对的盒子。" },
    "items": [
      { "id": "mountain", "label": { "en": "Mountain", "zh": "山" } },
      { "id": "cell",     "label": { "en": "Cell",     "zh": "细胞" } }
    ],
    "buckets": [
      { "id": "visible", "label": { "en": "Can see with eyes", "zh": "肉眼看得到" } },
      { "id": "hidden",  "label": { "en": "Can't see",         "zh": "看不到" } }
    ],
    "correct": { "mountain": "visible", "cell": "hidden" }
  }
  </script>
</div>
```
> 卡片一开始全在上方「待分类」托盘里、自动打乱。`correct` 写 `{卡片id: 盒子id}`。学生操作：**拖卡片进盒子**，键盘 **←/→** 也能在托盘↔各盒子间移动。

**部分给分**（考段计分题，如 O3）——给 `categorize` 加一段 `marks` 分数带，按「放对几个」给分：
```json
"marks": [
  { "min_correct": 4, "mark": 2 },
  { "min_correct": 2, "mark": 1 },
  { "min_correct": 0, "mark": 0 }
]
```
> 取「放对个数 ≥ min_correct」里最高的一档当分数。全对才锁定，否则留着重试。

⚠️ **防偷看提醒**：`self_check` 会把答案写进页面，计分题（TEST 段）理想是走后端判分。但**拖拽的后端判分还没接**（见文末）。所以现在 O3 先用 `self_check + marks`，分数前端算，够工厂渲染/试题；等接了后端再把答案藏起来。

---

## 组件二：粒子画板 `particle`

**① 引入文件** —— ⚠️ `particle-mark-core.js` 必须排在 `particle-canvas.js` **前面**：
```html
<link rel="stylesheet" href="/components/particle-canvas.css">
...
<script src="/components/particle-mark-core.js"></script>  <!-- 先 -->
<script src="/components/particle-canvas.js"></script>     <!-- 后 -->
```
> （`particle-mark-core.js` 只有 `self_check` 模式才需要在页面里引；走后端判分时可不引。）

**② 画三态粒子**：
```html
<div data-component="particle" data-question-id="Y7_U1_L08_Q1">
  <script type="application/json">
  {
    "tools": ["particles"],
    "self_check": true,
    "expected_state": "solid",
    "prompt": { "en": "Draw the particles in a SOLID (≥6).", "zh": "画出固态粒子排列（≥6 颗）。" }
  }
  </script>
</div>
```
- `expected_state`：`"solid"` 固 / `"liquid"` 液 / `"gas"` 气
- 判分规则（代码房已照工厂定的实现）：**排列对 + 颗数 ≥ 6** 才算对
  - 固 = 整齐挨着 · 液 = 挨着但乱 · 气 = 稀疏散开
- 学生操作：**点空白=加粒子，点粒子=删除，拖动=移动**

**③ 粒子 + 箭头**（箭头先能画，⏳ 箭头判分待工厂给细节）：
```html
<div data-component="particle" data-question-id="Y7_U1_L11_Q2">
  <script type="application/json">
  {
    "tools": ["particles", "arrows"],
    "prompt": { "en": "Draw particles, then a melting arrow.", "zh": "画粒子，再画熔化箭头。" }
  }
  </script>
</div>
```
> 两个工具都开时，画板上方会出现「●粒子 / ↗箭头 / 清空」切换按钮。

---

## 通用约定

- **双语**：所有文字写成 `{ "en": "...", "zh": "..." }`。组件按 `<body data-lang="zh">` / `"en"` 自动切。lesson shell 切语言时会带着切。
- **题号 `data-question-id`**：只用大写字母、数字、下划线（如 `Y7_U1_L02_Q1`）。后端判分时它对应 config 文件名。
- **答错不锁**：答错留着让学生重试，答对才锁定。`self_check` 和后端判分都这样。
- 一个页面放多道题没问题，每道一个 `<div>` + 自己的 `data-question-id` 即可。

---

## 后端判分（防偷看，进阶）

学生看不到答案时用。答案放后端 config，页面里的 JSON **不写** `self_check` / `correct_order` / `correct_pairs` / `expected_state`。

- **粒子题：已接好** ✅ —— 在 `particle-configs/{题号}.json` 放一份，例：[`particle-configs/Y7_U1_L08_Q1.json`](../particle-configs/Y7_U1_L08_Q1.json)。lesson shell 把提交 POST 到 `/api/mark-lesson`，后端用同一套规则判，再回填结果。
- **拖拽题：后端判分还没接** —— 现在请先用 `self_check`。需要后端版（防偷看）时跟代码房说，照粒子同样的方式接上即可。

判分流程对接（shell 那侧）：组件提交时派发 `dg:submit` / `pc:submit` 事件（`event.detail` 含 `question_id`、`input_type`、`submission`）。shell 收到后 POST 给 `/api/mark-lesson`，拿到结果调 `window.DragInteraction.showResult(qid, correct, msg)` / `window.ParticleCanvas.showResult(...)` 回填。

---

## 想先看效果？

- 拖拽：[`demos/drag-interactions-demo.html`](../demos/drag-interactions-demo.html)
- 粒子：[`demos/particle-canvas-demo.html`](../demos/particle-canvas-demo.html)

（本地预览：`python .claude/dev-server.py 3737` → 打开 `http://localhost:3737/demos/...`）
