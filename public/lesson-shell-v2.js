/*
═══════════════════════════════════════════════════════════════
SCISPARK LESSON SHELL v2 · public JS
File: /public/lesson-shell-v2.js
Vercel URL: /lesson-shell-v2.js
Status: NEW (L01 still uses /lesson-shell.js — unchanged)
Date: 2026-05-19

Globals exposed:
  window.showScreen(name)                      — switch 5 screens
  window.setLang('en' | 'zh')                  — bilingual toggle
  window.submitAnswer(optionEl, isCorrect, q)  — full answer flow
  window.trackProgress(lessonId, screen, status) — Supabase write
  window.SparkStreak                           — { add, miss, get, render }

Depends on:
  - /components/spark-jar/spark-jar.js   (SparkJar global)
  - /components/constellation-map/constellation-map.js
  - /components/click-spark-fx/click-spark-fx.js (auto-installs)
═══════════════════════════════════════════════════════════════
*/
(function () {

  const SCREENS = ['hook', 'learn', 'try', 'test', 'wrap'];
  const LS_LANG = 'scispark.lang';

  // ─── Supabase client loader (mirrors v1 pattern · zero schema change)
  const SB_URL = 'https://fiffuaoibxeggwxcfvfh.supabase.co';
  const SB_KEY = 'sb_publishable_OOrhuk8oqIbNLg3Wxo6fzQ_7z4sloBJ';

  function ensureSupabase() {
    if (window.sb && typeof window.sb.from === 'function') return Promise.resolve(window.sb);
    if (window.supabase && typeof window.supabase.createClient === 'function') {
      window.sb = window.supabase.createClient(SB_URL, SB_KEY);
      return Promise.resolve(window.sb);
    }
    return new Promise((resolve) => {
      const s = document.createElement('script');
      s.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js';
      s.onload = () => {
        try {
          window.sb = window.supabase.createClient(SB_URL, SB_KEY);
          resolve(window.sb);
        } catch (e) { resolve(null); }
      };
      s.onerror = () => resolve(null);
      document.head.appendChild(s);
    });
  }

  // ─── 5-SCREEN SWITCH ─────────────────────────────────────────
  function showScreen(name) {
    if (!SCREENS.includes(name)) return;
    document.querySelectorAll('.screen').forEach(el => el.classList.remove('active'));
    const target = document.querySelector('.screen[data-screen="' + name + '"]');
    if (target) target.classList.add('active');

    document.querySelectorAll('.sidebar__btn').forEach(btn => {
      btn.classList.toggle('is-active', btn.dataset.screen === name);
    });

    // Mark previous screens as done
    const idx = SCREENS.indexOf(name);
    SCREENS.forEach((s, i) => {
      const btn = document.querySelector('.sidebar__btn[data-screen="' + s + '"]');
      if (btn && i < idx) btn.classList.add('is-done');
    });

    updateLearnProgress();
    window.scrollTo({ top: 0, behavior: 'smooth' });

    const lessonId = document.body.getAttribute('data-lesson-id');
    if (lessonId) trackProgress(lessonId, name, 'view');
  }
  window.showScreen = showScreen;

  function updateLearnProgress() {
    const total = SCREENS.length;
    const active = document.querySelector('.screen.active');
    const idx = active ? SCREENS.indexOf(active.dataset.screen) : 0;
    const pct = Math.round(((idx + 1) / total) * 100);
    const fill = document.querySelector('.progress-track__row[data-track="learn"] .progress-track__fill');
    const num  = document.querySelector('.progress-track__row[data-track="learn"] .progress-track__num');
    if (fill) fill.style.width = pct + '%';
    if (num)  num.textContent = pct + '%';
  }

  function updateTestProgress() {
    const tested = document.querySelectorAll('[data-question][data-answered="true"]').length;
    const total  = document.querySelectorAll('[data-question]').length || 1;
    const pct = Math.round((tested / total) * 100);
    const fill = document.querySelector('.progress-track__row[data-track="test"] .progress-track__fill');
    const num  = document.querySelector('.progress-track__row[data-track="test"] .progress-track__num');
    if (fill) fill.style.width = pct + '%';
    if (num)  num.textContent = pct + '%';
  }

  // ─── LANG TOGGLE (v1 setLang pattern · data-en / data-zh swap) ──
  function setLang(mode) {
    if (mode !== 'en' && mode !== 'zh') mode = 'en';
    document.documentElement.lang = (mode === 'zh') ? 'zh' : 'en';
    document.body.classList.toggle('lang-zh', mode === 'zh');

    document.querySelectorAll('[data-en][data-zh]').forEach(el => {
      const txt = el.getAttribute(mode === 'zh' ? 'data-zh' : 'data-en');
      if (txt != null) el.textContent = txt;
    });

    document.querySelectorAll('.lang-toggle button').forEach(b => {
      b.classList.toggle('is-active', b.dataset.lang === mode);
    });

    try { localStorage.setItem(LS_LANG, mode); } catch (e) {}
  }
  window.setLang = setLang;

  // ─── SPARK STREAK ─────────────────────────────────────────────
  const SparkStreak = (function () {
    let count = 0;
    let paused = false;
    function render() {
      const el = document.querySelector('.nav-top__streak');
      if (!el) return;
      el.setAttribute('data-paused', String(paused));
      const num = el.querySelector('.streak-num');
      if (num) num.textContent = String(count);
    }
    return {
      add() { paused = false; count += 1; render(); },
      miss() { paused = true; render(); },              // pause, don't reset (per brief)
      reset() { count = 0; paused = false; render(); },
      get() { return { count, paused }; },
      render
    };
  })();
  window.SparkStreak = SparkStreak;

  // ─── ANSWER FLOW ──────────────────────────────────────────────
  // submitAnswer(optionEl, isCorrect, opts)
  //   opts = { questionId, screen, explainEn, explainZh, socraticEn, socraticZh, correctEl }
  function submitAnswer(optionEl, isCorrect, opts) {
    opts = opts || {};
    if (!optionEl) return;
    const container = optionEl.closest('.q-block') || optionEl.parentElement;

    // 1 · Mark all options in this block
    const allOpts = container ? container.querySelectorAll('.option') : [optionEl];
    allOpts.forEach(o => { o.setAttribute('disabled', 'true'); });
    optionEl.setAttribute('data-state', isCorrect ? 'correct' : 'wrong');

    // 2 · On wrong, also reveal the correct one (N11 — don't make them guess)
    if (!isCorrect && opts.correctEl) {
      opts.correctEl.setAttribute('data-state', 'reveal-correct');
    }

    // 3 · AI Socratic purple frame
    const fb = container ? container.querySelector('.ai-feedback') : null;
    if (fb) {
      const explain = fb.querySelector('.ai-feedback__explain');
      const socratic = fb.querySelector('.ai-feedback__socratic');
      if (explain) {
        explain.setAttribute('data-en', opts.explainEn || (isCorrect ? 'Nice — that fits the pattern.' : 'Not yet. Let’s look closer.'));
        explain.setAttribute('data-zh', opts.explainZh || (isCorrect ? '不错 — 这正符合规律。' : '还没对。我们一起再看一看。'));
      }
      if (socratic) {
        socratic.setAttribute('data-en', opts.socraticEn || 'What did you notice first when you read the question?');
        socratic.setAttribute('data-zh', opts.socraticZh || '读题时你第一个注意到的是什么?');
      }
      fb.classList.add('is-open');
      // Re-apply lang to inserted text
      const mode = localStorage.getItem(LS_LANG) || 'en';
      setLang(mode);
    }

    // 4 · Spark Jar — correct: +20, effort (wrong): +5, surprise: handled by caller
    if (window.SparkJar) {
      window.SparkJar.add(isCorrect ? 20 : 5, isCorrect ? 'correct' : 'effort');
    }

    // 5 · Streak
    if (isCorrect) SparkStreak.add(); else SparkStreak.miss();

    // 6 · Doudou mood
    const doudou = document.querySelector('.doudou-avatar');
    if (doudou) {
      doudou.setAttribute('data-mood', isCorrect ? 'happy' : 'thinking');
      setTimeout(() => doudou.removeAttribute('data-mood'), 1800);
    }

    // 7 · Mark question answered for test progress
    if (container && container.dataset.question) {
      container.setAttribute('data-answered', 'true');
      container.setAttribute('data-result', isCorrect ? 'correct' : 'wrong');
    }
    updateTestProgress();

    // 8 · Track to DB (best-effort, async)
    const lessonId = document.body.getAttribute('data-lesson-id');
    if (lessonId && opts.questionId) {
      trackProgress(lessonId, opts.screen || 'test', isCorrect ? 'answered_correct' : 'answered_wrong');
    }
  }
  window.submitAnswer = submitAnswer;

  // ─── TRACK PROGRESS (reuse v1 schema · no migration) ─────────
  async function trackProgress(lessonId, screen, status) {
    try {
      const sb = await ensureSupabase();
      if (!sb) return false;
      const auth = await sb.auth.getUser();
      const user = auth && auth.data && auth.data.user;
      if (!user) return false;
      // Mirror v1 behavior: upsert on completion only
      if (status === 'view') return true;
      const { error } = await sb.from('lesson_progress').upsert({
        child_id: user.id,
        lesson_id: lessonId,
        completed_at: new Date().toISOString()
      }, { onConflict: 'child_id,lesson_id' });
      if (error) console.warn('[SciSpark v2] lesson_progress upsert failed:', error.message);
      return !error;
    } catch (e) {
      console.warn('[SciSpark v2] trackProgress error:', e && e.message);
      return false;
    }
  }
  window.trackProgress = trackProgress;

  // ─── Helper: collect answer log for Constellation Map ────────
  function collectAnswers() {
    const out = [];
    document.querySelectorAll('[data-question]').forEach(q => {
      out.push({
        questionId: q.dataset.question,
        correct: q.dataset.result === 'correct',
        attempted_correction: q.dataset.attemptedCorrection === 'true'
      });
    });
    return out;
  }
  window.collectAnswers = collectAnswers;

  // ─── BOOT ────────────────────────────────────────────────────
  function boot() {
    // Sidebar nav clicks
    document.querySelectorAll('.sidebar__btn').forEach(btn => {
      btn.addEventListener('click', () => showScreen(btn.dataset.screen));
    });
    // Lang toggle clicks
    document.querySelectorAll('.lang-toggle button').forEach(b => {
      b.addEventListener('click', () => setLang(b.dataset.lang));
    });
    // [data-go] buttons → switch screen
    document.querySelectorAll('[data-go]').forEach(b => {
      b.addEventListener('click', () => showScreen(b.dataset.go));
    });
    // Mount Spark Jar if a slot exists
    const jarSlot = document.querySelector('[data-mount="spark-jar"]');
    if (jarSlot && window.SparkJar) window.SparkJar.mount(jarSlot);
    // Streak initial render
    SparkStreak.render();

    // Apply saved lang
    let saved = 'en';
    try { saved = localStorage.getItem(LS_LANG) || 'en'; } catch (e) {}
    setLang(saved);

    // Start on Hook
    const params = new URLSearchParams(location.search);
    showScreen(params.get('s') || 'hook');

    // Render constellation when entering Wrap
    document.querySelectorAll('.sidebar__btn[data-screen="wrap"], [data-go="wrap"]').forEach(b => {
      b.addEventListener('click', () => {
        const slot = document.querySelector('[data-mount="constellation"]');
        if (slot && window.ConstellationMap) {
          window.ConstellationMap.render(slot, collectAnswers());
          setLang(localStorage.getItem(LS_LANG) || 'en');
        }
      });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
