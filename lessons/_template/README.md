# SciSpark Lesson Shell v2 · Template

**Status**: v2 example only. L01 (`/lessons/y7/u1/l01.html`) still uses v1 shell and is unchanged.

This template is the source-of-truth for any new lesson built on shell v2. Copy it, fill in the placeholders, and you have a complete 5-screen bilingual lesson with Spark Jar / Streak / Constellation Map / cursor FX wired in.

---

## How to author a new lesson

1. Copy `lesson-shell-v2-example.html` to its final location, e.g. `lessons/y8/u2/l03.html`.
2. Change `<body data-lesson-id="EXAMPLE-V2-DEMO">` to the real lesson id, e.g. `data-lesson-id="Y8-U2-L03"`. This id is what gets written to the `lesson_progress` table.
3. Update `<title>` and the breadcrumb in `.nav-top__crumb`.
4. Replace the content of each of the five `<section class="screen">` blocks. The five screens are **fixed**: Hook / Learn / Try / Test / Wrap. Don't rename, don't reorder.

That's the whole job. Layout, navigation, language toggle, rewards and styling are inherited from the shell — you only edit text and questions.

---

## File layout

| Path (URL) | What it is |
|---|---|
| `/lesson-shell-v2.css` | All shell styles + 5-screen color tokens + correct/wrong + AI feedback |
| `/lesson-shell-v2.js` | `showScreen`, `setLang`, `submitAnswer`, `trackProgress`, `SparkStreak` |
| `/components/spark-jar/*` | `SparkJar.mount / add / toast / getLevel` — mastery accumulator |
| `/components/constellation-map/*` | `ConstellationMap.render(slot, answers)` — Wrap screen star map |
| `/components/click-spark-fx/*` | Custom cursor + spark particles on every click (auto-installs) |

On disk these live in `public/…`. Vercel rewrites them to the URL paths shown — see `vercel.json`.

---

## Bilingual content

Every text node that should switch languages **must** carry both `data-en` and `data-zh`:

```html
<span data-en="Start learning" data-zh="开始学习">Start learning</span>
```

The shell calls `setLang('en' | 'zh')` on load and on every toggle click. It swaps the text content using the corresponding `data-*` attribute. The user's last choice is stored in `localStorage` under `scispark.lang`.

If you forget `data-zh`, the EN text stays visible after the user picks 中文 — this is the only failure mode and it's easy to grep for: search for `data-en=` without `data-zh=` after authoring.

---

## The five screens · what goes in each

### 1. Hook (orange · `--color-hook`)
A real-world moment that doesn't look like science yet. End with one sentence that names the question the lesson will answer.

```html
<section class="screen screen-hook" data-screen="hook">
  <div class="screen-eyebrow">01 · Hook</div>
  <h1 class="screen-title">…</h1>
  <p class="screen-lede">…</p>
  <article class="lesson-card">…</article>
</section>
```

### 2. Learn (blue · `--color-learn`)
The concept itself, with a `.video-slot` placeholder for Khan-style blackboard video + a bilingual `.video-transcript` block. Follow with one `.lesson-card` summary.

The video itself is produced separately (style A — Khan handwriting on green blackboard with mouse pointer). Until the real video lands, the `.video-slot` just renders the placeholder pattern. **Do not** swap in YouTube embeds or anything else — the visual is part of the brand.

### 3. Try (purple · `--color-try`)
**One** guided question with full AI Socratic feedback. Use the `.two-col` grid: left = a "What we just learned" recap card, right = the question block.

### 4. Test (green · `--color-test`)
**Two** independent questions. Same `.q-block` markup; same `submitAnswer` call.

### 5. Wrap (gold · `--color-wrap`)
Render the Constellation Map by including `<div data-mount="constellation"></div>` and a "What sticks" card.

---

## Writing a question block

```html
<article class="lesson-card q-block" data-question="TEST-Q1">
  <p class="q-prompt" data-en="…" data-zh="…">…</p>
  <div class="option-list">
    <button class="option" type="button" data-id="A"
      onclick="submitAnswer(this, true, {
        questionId:'TEST-Q1', screen:'test',
        explainEn:'…', explainZh:'…',
        socraticEn:'…', socraticZh:'…'
      })">
      <span class="key">A</span><span data-en="…" data-zh="…">…</span>
    </button>
    <button class="option" type="button" data-id="B"
      onclick="submitAnswer(this, false, {
        questionId:'TEST-Q1', screen:'test',
        correctEl: this.parentElement.querySelector('[data-id=&quot;A&quot;]'),
        explainEn:'…', explainZh:'…',
        socraticEn:'…', socraticZh:'…'
      })">
      <span class="key">B</span><span data-en="…" data-zh="…">…</span>
    </button>
  </div>
  <div class="ai-feedback" aria-live="polite">
    <div class="ai-feedback__label">Spark</div>
    <div class="ai-feedback__explain"></div>
    <div class="ai-feedback__socratic"></div>
    <div class="ai-feedback__ask">
      <input type="text" placeholder="Ask Spark…">
      <button type="button">Ask</button>
    </div>
  </div>
</article>
```

Rules:

- `data-question="…"` is required on the `.q-block` — it drives both the Test progress bar and the Constellation Map.
- For the **correct** option, pass `isCorrect: true` and **omit** `correctEl`.
- For each **wrong** option, pass `isCorrect: false` and set `correctEl` to the correct button — that's how the shell highlights the right answer for the student (N11: never let them keep guessing).
- Provide both `explainEn`/`explainZh` and `socraticEn`/`socraticZh`. The Socratic line is the follow-up question Spark asks — keep it short, open-ended, never another MCQ.

---

## Rewards · what each one does

| Reward | When | How it shows |
|---|---|---|
| Spark Jar | Every answer (+20 for correct, +5 for effort) | Chip in top-right of nav, with 5 visual stages (empty → glowing master) |
| Spark Streak | Correct answer adds; wrong **pauses** (does not reset) | Lightning chip next to the jar; goes amber when paused |
| Spark reaction | Mood on the Doudou avatar (`happy` / `thinking`) | 1.8s glow ring on the bottom-right avatar |
| Constellation Map | Rendered when Wrap is opened | Bright ⭐ = first-try correct, twinkle ✨ = corrected, dim ⚪ = unattempted |

You don't have to wire any of these manually — `submitAnswer` calls them. Just remember to set `data-question` on every `.q-block` so the Constellation Map can read the result.

---

## Black-board video slot

Until a real video is produced, every Learn screen should ship with the placeholder:

```html
<div class="video-slot" data-style="khan-blackboard"
     aria-label="Khan-style blackboard video (placeholder)">
  <div class="video-slot__placeholder"
       data-en="Video placeholder · style A · Khan blackboard"
       data-zh="视频占位 · 风格 A · Khan 黑板">…</div>
</div>
<div class="video-transcript">
  <div class="video-transcript__label" data-en="Transcript" data-zh="字幕">Transcript</div>
  <p data-en="…" data-zh="…">…</p>
</div>
```

When the real video lands, swap the inner placeholder for a `<video>` or `<iframe>` — the outer `.video-slot` styling (aspect-ratio, blackboard pattern) stays.

---

## Images · base64 inline (PATH_A · IMAGE_PRODUCTION_SOP_v5.2)

For lesson-internal illustrations, inline as base64 data URLs. Reasons: zero extra HTTP request, no asset 404 risk, no broken-link audit when files are moved.

```html
<img alt="…" src="data:image/png;base64,iVBORw0K…">
```

Don't inline brand assets (logo, cursor, favicons) — those live under `/assets/` and are cached site-wide.

---

## Local test checklist

Before opening a PR, walk through this with the page open in your browser:

- [ ] Sidebar nav switches all 5 screens, animation runs once per switch
- [ ] `EN` / `中` toggle swaps every text node — no English left over on the 中 view
- [ ] One correct + one wrong answer in Try fires the purple AI feedback box
- [ ] Spark Jar number increments and the jar fills visually (try 5+ answers to see a stage-up)
- [ ] Streak increments on correct; on a wrong answer the chip turns **amber** but the number stays (it pauses, does not reset)
- [ ] Wrap screen renders the Constellation Map with the right mix of bright/twinkle/dim stars
- [ ] Click anywhere — 5–8 orange spark particles fly out and fade
- [ ] Wrong answers show in **yellow**, never red. If you see red, the shell CSS isn't loading
- [ ] Refresh the page — your language choice persists

---

## What this shell does NOT do (and how to add it later)

- **It does not gate the Test behind Try.** A motivated student can jump straight to Test from the sidebar. If we want a gate, add a `data-locked-until="try-done"` attribute on the Test sidebar button and a check in `showScreen`. Currently considered out of scope.
- **It does not own the unit-level quiz.** The Wrap screen ends at "Finish lesson" — the unit-level mastery quiz is a separate, future shell.
- **`trackProgress` writes only on completion screens (`view` status is a no-op).** If you need per-question telemetry on top of the existing `lesson_progress` table, that requires a schema change and is out of scope for v2.

---

Spark on. ⚡
