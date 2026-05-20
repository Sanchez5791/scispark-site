/*
═══════════════════════════════════════════════════════════════
SCISPARK LESSON SHELL v3 · SHARED JAVASCRIPT (B-mode)
═══════════════════════════════════════════════════════════════
File: /lesson-shell-v3.js (or /public/lesson-shell-v3.js — verify in git HEAD)
Vercel URL: /lesson-shell-v3.js
Type: SHARED — used by ALL lessons referencing v3 shell
Source: merged from lesson-shell.js (v1, 939 lines) + lesson-shell-v2.js (v2)
        + audio reward extracted from y7_u1_l01_v4-PREVIEW-shell-v2 HTML
Date: 2026-05-20
Status: NEW — does NOT replace /lesson-shell.js (v1 kept for F&F students)
         L01-prod still on v1. New lessons (L02+) use v3.

Architecture: B-mode (Sanchez's original vision)
              External CSS/JS — change once, all lessons auto-update.
              No inline CSS/JS in lesson HTML.

Merged features (16 total):
  v1 (12): TTS · Hint · Show Answer · L1/L2/L3 · XP/Surprise/Toast
           · Spark Bubble · AI Tutor · Doudou · Content Protection
           · Auto-save · Bubble Scripts hook
  v2 (4):  Spark Jar · Constellation Map · Click-spark FX · AI Socratic
           · SparkStreak (paused-not-reset)
  new (1): 5 OGG reward audio + 🔊 mute toggle

Globals exposed (lesson HTML can call directly via onclick=):
  showScreen(id), setLang(mode), submitAnswer(el, isCorrect, opts),
  toggleHint(id), toggleAns(id), selectOpt(qId, el, letter),
  awardXP(amt, src), showToast(msg, opts), completeLesson(),
  closeSurprise(), toggleBubble(), openAITutor(), closeAITutor(),
  toggleMute(), trackProgress(lessonId, screen, status),
  SparkStreak, doudouReact(isCorrect)
═══════════════════════════════════════════════════════════════
*/

(function () {
  'use strict';

  // ── Missing variable declarations (omitted during v1→v3 merge) ──
  const ttsSupported = 'speechSynthesis' in window;
  let ttsCurrentButton = null;
  let ttsCurrentUtterance = null;
  const xpEarned = { mcq: 0, aha: 0, lesson: 0 };
  const xpAnswered = new Set();

  // ═════════════════════════════════════════════════════════════
  // SECTION 1: SUPABASE INIT (from v2 — cleaner CDN fallback)
  // ═════════════════════════════════════════════════════════════
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

  // ═════════════════════════════════════════════════════════════
  // SECTION 2: TTS 13-CLASS 男声朗读 (verbatim from v1.js line 103-258)
  // ═════════════════════════════════════════════════════════════

  function ttsToggle(buttonEl, paragraphEl) {
    if (!ttsSupported) return;
  
    if (ttsCurrentButton === buttonEl) {
      ttsStop();
      return;
    }
  
    if (ttsCurrentUtterance) {
      ttsStop();
    }
  
    const isZhMode = document.body.classList.contains('zh-mode');
    const text = isZhMode
      ? (paragraphEl.dataset.zh || '')
      : (paragraphEl.dataset.en || '');
  
    if (!text.trim()) return;
  
    const cleanText = stripHtmlTags(text);
    ttsPlay(cleanText, isZhMode ? 'zh-CN' : 'en-US', buttonEl);
  }
  
  function ttsPlay(text, langCode, buttonEl) {
    const u = new SpeechSynthesisUtterance(text);
    u.lang = langCode;
    u.rate = 0.9;
    u.pitch = 1.0;
    u.volume = 1.0;
  
    const voice = pickBestVoice(langCode);
    if (voice) u.voice = voice;
  
    u.onend = () => ttsStop();
    u.onerror = () => ttsStop();
  
    ttsCurrentUtterance = u;
    ttsCurrentButton = buttonEl;
    buttonEl.classList.add('tts-playing');
    buttonEl.textContent = '⏸';
    buttonEl.setAttribute('aria-label',
      langCode === 'zh-CN' ? '停止朗读' : 'Stop reading');
  
    window.speechSynthesis.speak(u);
  }
  
  function ttsStop() {
    try {
      window.speechSynthesis.cancel();
      setTimeout(() => {
        if (window.speechSynthesis.paused) {
          window.speechSynthesis.resume();
        }
      }, 50);
    } catch(e) {}
    if (ttsCurrentButton) {
      ttsCurrentButton.classList.remove('tts-playing');
      ttsCurrentButton.textContent = '▶';
      ttsCurrentButton.setAttribute('aria-label',
        document.body.classList.contains('zh-mode') ? '朗读这段' : 'Read aloud');
    }
    ttsCurrentUtterance = null;
    ttsCurrentButton = null;
  }
  
  function pickBestVoice(langCode) {
    const voices = window.speechSynthesis.getVoices();
    if (!voices.length) return null;
  
    const maleEN = ['Male','Daniel','Alex','David','Mark','George','Guy','Ryan','Brian','Tony','James'];
    const maleZH = ['Kangkang','Yunyang','Yunxi','Yunjian'];
    const maleNames = langCode.startsWith('zh') ? maleZH : maleEN;
    const isMale = x => maleNames.some(n => x.name.includes(n));
    const isNeural = x => x.name.includes('Google') || x.name.includes('Microsoft');
  
    // 1. Male + Google/Microsoft + exact lang
    let v = voices.find(x => x.lang.startsWith(langCode) && isMale(x) && isNeural(x));
    if (v) return v;
  
    // 2. Male + exact lang (any provider)
    v = voices.find(x => x.lang.startsWith(langCode) && isMale(x));
    if (v) return v;
  
    // 3. Fallback: Google/Microsoft + exact lang (non-male)
    v = voices.find(x => x.lang.startsWith(langCode) && isNeural(x));
    if (v) return v;
  
    // 4. Fallback: any voice matching lang
    v = voices.find(x => x.lang.startsWith(langCode));
    if (v) return v;
  
    // 5. Fallback: main language code only
    const mainLang = langCode.split('-')[0];
    v = voices.find(x => x.lang.startsWith(mainLang));
    return v || null;
  }
  
  function stripHtmlTags(html) {
    const div = document.createElement('div');
    div.innerHTML = html;
    return div.textContent || div.innerText || '';
  }
  
  function ttsInjectButtons() {
    if (!ttsSupported) {
      document.querySelectorAll('.tts-btn').forEach(b => {
        b.classList.add('tts-disabled');
        b.disabled = true;
        b.title = 'Your browser does not support text-to-speech';
      });
      return;
    }
  
    const paragraphs = document.querySelectorAll(
      '.hook-scenario[data-en][data-zh]:not(.tts-text), ' +
      '.hint-text[data-en][data-zh]:not(.tts-text), ' +
      '.vocab-def[data-en][data-zh]:not(.tts-text), ' +
      '.screen-desc[data-en][data-zh]:not(.tts-text), ' +
      '.screen-title[data-en][data-zh]:not(.tts-text), ' +
      '.card-title[data-en][data-zh]:not(.tts-text), ' +
      '.answer-reveal-text[data-en][data-zh]:not(.tts-text), ' +
      '.question-text[data-en][data-zh]:not(.tts-text), ' +
      '.definition-text[data-en][data-zh]:not(.tts-text), ' +
      '.summary-text[data-en][data-zh]:not(.tts-text), ' +
      '.concept-label[data-en][data-zh]:not(.tts-text), ' +
      '.cliff-text[data-en][data-zh]:not(.tts-text), ' +
      '.badge-reveal-desc[data-en][data-zh]:not(.tts-text)'
    );
  
    paragraphs.forEach(p => {
      if (p.closest('.nav-brand')) return;
  
      const txt = (p.dataset.en || '').trim();
      if (txt.length < 5) return;
  
      const wrapper = document.createElement('div');
      wrapper.className = 'tts-row';
  
      const btn = document.createElement('button');
      btn.className = 'tts-btn';
      btn.textContent = '▶';
      btn.type = 'button';
      btn.setAttribute('aria-label', 'Read aloud');
      btn.addEventListener('click', () => ttsToggle(btn, p));
  
      p.parentNode.insertBefore(wrapper, p);
      wrapper.appendChild(btn);
      p.classList.add('tts-text');
      wrapper.appendChild(p);
    });
  }
  
  // ═════════════════════════════════════════════════════════════
  // SCREEN NAVIGATION
  // ═════════════════════════════════════════════════════════════
  const screens = ['hook','learn','try','test','wrap'];

  // ═════════════════════════════════════════════════════════════
  // SECTION 3: 5-SCREEN SWITCH (v2 version + v1 bubble integration)
  // ═════════════════════════════════════════════════════════════
  const SCREENS = ['hook', 'learn', 'try', 'test', 'wrap'];
  const LS_LANG = 'scispark.lang';
  const LS_MUTE = 'scispark.mute';
  const LS_PROGRESS_PREFIX = 'scispark.progress.';

  function showScreen(name) {
    if (!SCREENS.includes(name)) return;
    document.querySelectorAll('.screen').forEach(el => el.classList.remove('active'));

    // v2 pattern: .screen[data-screen="hook"]
    let target = document.querySelector('.screen[data-screen="' + name + '"]');
    // v1 fallback: #screen-hook
    if (!target) target = document.getElementById('screen-' + name);
    if (target) target.classList.add('active');

    // Sidebar nav highlight (v2 + v1 both supported)
    document.querySelectorAll('.sidebar__btn').forEach(btn => {
      btn.classList.toggle('is-active', btn.dataset.screen === name);
    });
    document.querySelectorAll('.screen-nav-item').forEach(n => n.classList.remove('active'));
    const v1NavItem = document.querySelector('.screen-nav-item[onclick*="\'' + name + '\'"]');
    if (v1NavItem) v1NavItem.classList.add('active');

    // Mark previous screens as done (v2 SCREENS array pattern)
    const idx = SCREENS.indexOf(name);
    SCREENS.forEach((s, i) => {
      const btn = document.querySelector('.sidebar__btn[data-screen="' + s + '"]');
      if (btn && i < idx) btn.classList.add('is-done');
    });

    updateLearnProgress();
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // v1 bubble integration — show Professor Spark bubble for this screen
    if (typeof showBubbleForScreen === 'function') {
      try { showBubbleForScreen(name); } catch (e) {}
    }

    // Track to DB
    const lessonId = document.body.getAttribute('data-lesson-id') || document.body.getAttribute('data-lesson');
    if (lessonId) trackProgress(lessonId, name, 'view');

    // Save local progress (v1 pattern)
    if (lessonId) {
      try { localStorage.setItem(LS_PROGRESS_PREFIX + lessonId, name); } catch (e) {}
    }
  }

  function updateLearnProgress() {
    const total = SCREENS.length;
    const active = document.querySelector('.screen.active');
    let idx = 0;
    if (active) {
      const ds = active.dataset.screen || (active.id || '').replace('screen-', '');
      idx = SCREENS.indexOf(ds);
    }
    const pct = Math.round(((Math.max(idx, 0) + 1) / total) * 100);
    const fill = document.querySelector('.progress-track__row[data-track="learn"] .progress-track__fill');
    const num  = document.querySelector('.progress-track__row[data-track="learn"] .progress-track__num');
    if (fill) fill.style.width = pct + '%';
    if (num)  num.textContent = pct + '%';
    // v1 fallback selector
    const v1Fill = document.getElementById('prog-fill');
    const v1Pct  = document.getElementById('prog-pct');
    if (v1Fill) v1Fill.style.width = pct + '%';
    if (v1Pct)  v1Pct.textContent = pct + '%';
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

  // ═════════════════════════════════════════════════════════════
  // SECTION 4: LANG TOGGLE (v2 base + v1 zh-mode class compat)
  // ═════════════════════════════════════════════════════════════
  function setLang(mode) {
    if (mode !== 'en' && mode !== 'zh') mode = 'en';
    document.documentElement.lang = (mode === 'zh') ? 'zh' : 'en';
    document.body.classList.toggle('lang-zh', mode === 'zh');
    document.body.classList.toggle('zh-mode', mode === 'zh'); // v1 compat

    document.querySelectorAll('[data-en][data-zh]').forEach(el => {
      const txt = el.getAttribute(mode === 'zh' ? 'data-zh' : 'data-en');
      if (txt != null) el.textContent = txt;
    });

    // v2 lang-toggle buttons
    document.querySelectorAll('.lang-toggle button').forEach(b => {
      b.classList.toggle('is-active', b.dataset.lang === mode);
      b.classList.toggle('active', b.dataset.lang === mode); // v1 compat
    });
    // v1 explicit lang buttons
    const enBtn = document.getElementById('lang-en');
    const zhBtn = document.getElementById('lang-zh');
    if (enBtn) enBtn.classList.toggle('active', mode === 'en');
    if (zhBtn) zhBtn.classList.toggle('active', mode === 'zh');

    try { localStorage.setItem(LS_LANG, mode); } catch (e) {}
  }

  // ═════════════════════════════════════════════════════════════
  // SECTION 5: L1/L2/L3 LEVEL SYSTEM (verbatim from v1.js line 308-476)
  // Includes: applyLevelFromURL, getSupabaseClient, waitForSupabaseClient,
  //           fetchLevelFromSupabase, normLevel
  // ═════════════════════════════════════════════════════════════

  function applyLevelFromURL() {
    const params = new URLSearchParams(window.location.search);
    const urlLevel = params.get('level');
    const cachedLevel = localStorage.getItem('scispark_level');
  
    // [1] 老师 URL override — 立刻应用, 不写 cache (避免污染学生)
    if (urlLevel && ['1','2','3'].includes(urlLevel)) {
      document.body.setAttribute('data-user-level', urlLevel);
      console.log('%c[SciSpark Level] URL override: ' + urlLevel,
                  'color:#EA580C;font-weight:bold');
      return; // 不查 Supabase
    }
  
    // [2] cache 或 default 先应用 (避免闪烁)
    const startLevel = (cachedLevel && ['1','2','3'].includes(cachedLevel))
      ? cachedLevel
      : '2';
    document.body.setAttribute('data-user-level', startLevel);
    console.log('%c[SciSpark Level] Start (cache/default): ' + startLevel,
                'color:#888');
  
    // [3] async 去 Supabase 抽真正的 level
    fetchLevelFromSupabase()
      .then(dbLevel => {
        if (!['1','2','3'].includes(dbLevel)) {
          console.warn('[SciSpark Level] Invalid DB level "' + dbLevel +
                       '" — keeping ' + startLevel);
          return;
        }
        document.body.setAttribute('data-user-level', dbLevel);
        localStorage.setItem('scispark_level', dbLevel);
        console.log('%c[SciSpark Level] From Supabase: ' + dbLevel,
                    'color:#EA580C;font-weight:bold');
      })
      .catch(err => {
        console.warn('[SciSpark Level] Supabase fetch failed — staying on ' +
                     startLevel + ' (reason: ' + err.message + ')');
      });
  }
  
  // 找 Supabase client 实例 — lesson HTML 自己 init, 我们只读
  // 兼容 3 种常见名字: window.supabaseClient / window.supabase / window.sb
  function getSupabaseClient() {
    const candidates = [
      window.supabaseClient,
      window.supabase,
      window.sb
    ];
    for (const c of candidates) {
      if (c &&
          typeof c.from === 'function' &&
          c.auth &&
          typeof c.auth.getUser === 'function') {
        return c;
      }
    }
    return null;
  }
  
  // 等 Supabase client load (lesson HTML 可能晚 init)
  function waitForSupabaseClient(timeoutMs) {
    return new Promise(resolve => {
      const start = Date.now();
      const tryNow = () => {
        const c = getSupabaseClient();
        if (c) return resolve(c);
        if (Date.now() - start >= timeoutMs) return resolve(null);
        setTimeout(tryNow, 100);
      };
      tryNow();
    });
  }
  
  // 真去 Supabase 抽 level
  async function fetchLevelFromSupabase() {
    const client = await waitForSupabaseClient(3000);
    if (!client) {
      throw new Error('supabase client not initialized on this page');
    }
  
    // Step 1: 抽 auth user
    const { data: userData, error: authErr } = await client.auth.getUser();
    if (authErr) throw new Error('auth: ' + authErr.message);
    const user = userData && userData.user;
    if (!user) throw new Error('user not signed in');
  
    // Step 2: 找最新一笔 attempt
    // 注意: assessment_attempts.student_id 历史命名, 实际存的是 auth.users.id
    const { data: attemptRow, error: attemptErr } = await client
      .from('assessment_attempts')
      .select('id, year_group')
      .eq('student_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
  
    if (attemptErr) throw new Error('attempts query: ' + attemptErr.message);
    if (!attemptRow) throw new Error('no attempts for user ' + user.id);
  
    const attemptShort = String(attemptRow.id).substring(0, 8);
    const yearTag = attemptRow.year_group || '?';
  
    // 标准化 level: 'l1'/'L1'/'1' → '1' (匹配 CSS body[data-user-level="X"])
    function normLevel(raw) {
      if (raw === null || raw === undefined) return null;
      const m = String(raw).trim().toLowerCase().match(/^l?([123])$/);
      return m ? m[1] : null;
    }
  
    // Step 3a: 优先 assessment_reviews (teacher_final > provisional)
    const { data: reviewRow, error: reviewErr } = await client
      .from('assessment_reviews')
      .select('provisional_level, teacher_final_level')
      .eq('attempt_id', attemptRow.id)
      .maybeSingle();
  
    if (reviewErr) {
      console.warn('[SciSpark Level] assessment_reviews query error (falling to score): ' +
                   reviewErr.message);
    } else if (reviewRow) {
      const teacherLvl = normLevel(reviewRow.teacher_final_level);
      const provLvl = normLevel(reviewRow.provisional_level);
      if (teacherLvl) {
        console.log('%c[SciSpark Level] From assessment_reviews.teacher_final: ' + teacherLvl +
                    ' (raw="' + reviewRow.teacher_final_level + '", attempt ' +
                    attemptShort + '..., ' + yearTag + ')',
                    'color:#EA580C;font-weight:bold');
        return teacherLvl;
      }
      if (provLvl) {
        console.log('%c[SciSpark Level] From assessment_reviews.provisional: ' + provLvl +
                    ' (raw="' + reviewRow.provisional_level + '", attempt ' +
                    attemptShort + '..., ' + yearTag + ')',
                    'color:#EA580C;font-weight:bold');
        return provLvl;
      }
    }
  
    // Step 3b: fallback — 从 marking_results.total_awarded 算
    const { data: markRow, error: markErr } = await client
      .from('assessment_marking_results')
      .select('total_awarded, total_possible')
      .eq('attempt_id', attemptRow.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
  
    if (markErr) throw new Error('marking query: ' + markErr.message);
    if (!markRow) throw new Error('no marking for attempt ' + attemptRow.id);
  
    // Step 4: 分数换算 level (阈值同步 api/mark.js + teacher-review.html)
    // ★ 哪天要改阈值, 这 3 个文件全部要改
    const score = Number(markRow.total_awarded);
    if (!Number.isFinite(score)) {
      throw new Error('invalid total_awarded: ' + markRow.total_awarded);
    }
    const level = score >= 45 ? '3' : score >= 30 ? '2' : '1';
  
    console.log('%c[SciSpark Level] Computed from score ' + score + '/' +
                (markRow.total_possible || '?') + ' → Level ' + level +
                ' (attempt ' + attemptShort + '..., ' + yearTag + ', no review)',
                'color:#EA580C;font-weight:bold');
  
    return level;
  }
  
  // ═════════════════════════════════════════════════════════════
  // MCQ + HINT + ANSWER
  // ═════════════════════════════════════════════════════════════

  // ═════════════════════════════════════════════════════════════
  // SECTION 6: QUESTION HANDLERS
  // ═════════════════════════════════════════════════════════════
  // selectOpt: kept from v1 (lesson HTML uses onclick="selectOpt(...)")
  function selectOpt(qId, el, letter) {
    const container = document.getElementById(qId + '-opts') ||
                      (el && el.closest('.q-block'));
    if (container) {
      container.querySelectorAll('.mcq-option, .option').forEach(o => o.classList.remove('selected'));
    }
    if (el) el.classList.add('selected');
  }

  // toggleHint: verbatim from v1.js line 481-484
  function toggleHint(id) {
    const box = document.getElementById(id);
    if (box) box.classList.toggle('show');
  }

  // toggleAns (Show Answer): verbatim from v1.js line 485-488
  // SPEC NOTE: lesson HTML may call this after 2 wrong attempts (D.4 spec gap)
  // For now this just toggles; lesson HTML controls when button appears.
  function toggleAns(id) {
    const box = document.getElementById(id);
    if (box) box.classList.toggle('show');
  }

  // submitAnswer: v2's richer flow + v1 integrations (audio, awardXP, doudouReact)
  //   opts = { questionId, screen, explainEn, explainZh, socraticEn, socraticZh, correctEl, xp }
  function submitAnswer(optionEl, isCorrect, opts) {
    opts = opts || {};
    console.log('[v3] submitAnswer fired', {isCorrect, questionId: opts.questionId});
    if (!optionEl) return;
    const container = optionEl.closest('.q-block') || optionEl.parentElement;

    // 1 · Mark all options in this block disabled
    const allOpts = container ? container.querySelectorAll('.option, .mcq-option') : [optionEl];
    allOpts.forEach(o => { o.setAttribute('disabled', 'true'); });
    optionEl.setAttribute('data-state', isCorrect ? 'correct' : 'wrong');

    // 2 · On wrong, reveal correct (N11)
    if (!isCorrect && opts.correctEl) {
      opts.correctEl.setAttribute('data-state', 'reveal-correct');
    }

    // 3 · Track attempt count (for Show Answer 2-wrong trigger — D.4 spec)
    if (container && container.dataset.question) {
      const attempts = parseInt(container.getAttribute('data-attempts') || '0', 10) + 1;
      container.setAttribute('data-attempts', String(attempts));
      if (!isCorrect && attempts >= 2) {
        // Reveal "Show Answer" button if lesson has one
        const showAnsBtn = container.querySelector('.show-answer-btn, [data-action="show-answer"]');
        if (showAnsBtn) showAnsBtn.classList.add('available');
      }
    }

    // 4 · AI Socratic purple feedback
    const fb = container ? container.querySelector('.ai-feedback') : null;
    if (fb) {
      const explain = fb.querySelector('.ai-feedback__explain');
      const socratic = fb.querySelector('.ai-feedback__socratic');
      if (explain) {
        explain.setAttribute('data-en', opts.explainEn || (isCorrect ? 'Nice — that fits the pattern.' : 'Not yet. Let\u2019s look closer.'));
        explain.setAttribute('data-zh', opts.explainZh || (isCorrect ? '不错 — 这正符合规律。' : '还没对。我们一起再看一看。'));
      }
      if (socratic) {
        socratic.setAttribute('data-en', opts.socraticEn || 'What did you notice first when you read the question?');
        socratic.setAttribute('data-zh', opts.socraticZh || '读题时你第一个注意到的是什么?');
      }
      fb.classList.add('is-open');
      const mode = (function () { try { return localStorage.getItem(LS_LANG) || 'en'; } catch (e) { return 'en'; } })();
      setLang(mode);
    }

    // 5 · Spark Jar — correct: +20, effort (wrong): +5
    if (window.SparkJar) {
      window.SparkJar.add(isCorrect ? 20 : 5, isCorrect ? 'correct' : 'effort');
    }

    // 6 · Spark Streak (paused-not-reset)
    if (isCorrect) SparkStreak.add(); else SparkStreak.miss();

    // 7 · v1 XP system + toast (legacy compat)
    if (typeof awardXP === 'function' && isCorrect) {
      try { awardXP(opts.xp || 10, 'mcq'); } catch (e) {}
    }

    // 8 · Doudou react
    if (typeof doudouReact === 'function') {
      try { doudouReact(isCorrect); } catch (e) {}
    } else {
      const doudou = document.querySelector('.doudou-avatar');
      if (doudou) {
        doudou.setAttribute('data-mood', isCorrect ? 'happy' : 'thinking');
        setTimeout(() => doudou.removeAttribute('data-mood'), 1800);
      }
    }

    // 9 · Reward audio (5 OGG)
    playSound(isCorrect ? 'correct' : 'wrong');

    // 10 · Mark answered for test progress
    if (container && container.dataset.question) {
      container.setAttribute('data-answered', 'true');
      container.setAttribute('data-result', isCorrect ? 'correct' : 'wrong');
    }
    updateTestProgress();

    // 11 · Track to DB (best-effort, async)
    const lessonId = document.body.getAttribute('data-lesson-id') || document.body.getAttribute('data-lesson');
    if (lessonId && opts.questionId) {
      trackProgress(lessonId, opts.screen || 'test', isCorrect ? 'answered_correct' : 'answered_wrong');
    }
  }

  // ═════════════════════════════════════════════════════════════
  // SECTION 7: XP + AUTO-SAVE (verbatim v1.js line 496-574)
  // ═════════════════════════════════════════════════════════════

  function awardXP(amount, source) {
    // PHASE 2 ACTIVATE: insert into Supabase user_xp table
    const toast = document.getElementById('xp-toast');
    toast.textContent = '+' + amount + ' XP';
    toast.classList.remove('show');
    void toast.offsetWidth; // restart animation
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 1600);
  
    if (source === 'aha') xpEarned.aha = amount;
    else xpEarned.mcq += amount;
    updateXPDisplay();
  }
  
  function updateXPDisplay() {
    if (document.getElementById('xp-mcq')) {
      document.getElementById('xp-mcq').textContent = '+' + xpEarned.mcq;
    }
    if (document.getElementById('xp-total')) {
      const total = 100 + xpEarned.mcq + xpEarned.aha;
      document.getElementById('xp-total').textContent = '+' + total;
    }
  }
  
  // ═════════════════════════════════════════════════════════════
  // AUTO-SAVE TEXTAREAS (localStorage)
  // PHASE 2 ACTIVATE: also push to Supabase lab_notebook table
  // ═════════════════════════════════════════════════════════════
  function setupAutoSave() {
    document.querySelectorAll('textarea[id]').forEach(ta => {
      const key = 'scispark_' + ta.id;
      const indicator = document.getElementById(ta.id.replace('-input','-save'));
      // Restore
      const saved = localStorage.getItem(key);
      if (saved) ta.value = saved;
      // Save on input
      let timer;
      ta.addEventListener('input', () => {
        clearTimeout(timer);
        timer = setTimeout(() => {
          localStorage.setItem(key, ta.value);
          if (indicator) {
            indicator.classList.add('show');
            setTimeout(() => indicator.classList.remove('show'), 1500);
          }
          // If aha textarea, award XP once
          if (ta.id === 'aha-input' && ta.value.length > 5 && !xpAnswered.has('aha')) {
            xpAnswered.add('aha');
            awardXP(20, 'aha');
          }
        }, 600);
      });
    });
  }
  
  // ═════════════════════════════════════════════════════════════
  // DOUDOU SPEECH BUBBLES (bottom-right floating)
  // DouDou 豆豆 = co-learner, curious young apprentice voice
  // ▼▼▼ REPLACE: update dialogue for this specific lesson ▼▼▼
  //
  // Voice guide for DouDou:
  //   - Short, curious, enthusiastic (not authoritative like Prof P)
  //   - EN: ElevenLabs Lily/Glinda style (young, bright)
  //   - ZH: young curious Mandarin (pending A/B test — do NOT lock TTS voice yet)
  //   - Never sounds like a teacher — sounds like a fellow student
  // ═════════════════════════════════════════════════════════════
  // Default bubble scripts — lesson HTML can override by setting window.bubbleScripts
  // (e.g. <script>window.bubbleScripts = {...}</script> AFTER lesson-shell.js loads)
  if (typeof window.bubbleScripts === 'undefined') {
    window.bubbleScripts = {
      hook:  { en: "[DouDou hook — curious question to student]",  zh: "[DouDou 钩子 — 好奇地问学生]" },
      learn: { en: "[DouDou learn — 'Oh I get it now!' reaction]", zh: "[DouDou 学习 — '哦我明白了！']" },
      try:   { en: "[DouDou try — 'Let's try together!']",         zh: "[DouDou 练习 — '我们一起试试！']" },
      test:  { en: "[DouDou test — 'You can do it solo!']",        zh: "[DouDou 测试 — '你自己来！加油！']" },
      wrap:  { en: "[DouDou wrap — excited about next lesson]",    zh: "[DouDou 总结 — 对下一课感到兴奋]" }
    };
  }
  // ▲▲▲ REPLACE ▲▲▲
  

  // ═════════════════════════════════════════════════════════════
  // SECTION 8: BUBBLE + AI TUTOR (verbatim v1.js line 575-609)
  // ═════════════════════════════════════════════════════════════

  function showBubbleForScreen(id) {
    const bubble = document.getElementById('prof-p-bubble');
    const text = document.getElementById('prof-p-bubble-text');
    const zh = document.getElementById('prof-p-bubble-zh');
    const scripts = window.bubbleScripts || {};
    if (scripts[id]) {
      text.textContent = scripts[id].en;
      zh.textContent = scripts[id].zh;
      bubble.classList.add('show');
      // Auto-hide after 5 seconds (except WRAP — keep visible)
      if (id !== 'wrap') {
        setTimeout(() => bubble.classList.remove('show'), 5000);
      }
    }
  }
  
  function toggleBubble() {
    const bubble = document.getElementById('prof-p-bubble');
    bubble.classList.toggle('show');
  }
  
  function closeBubble() {
    document.getElementById('prof-p-bubble').classList.remove('show');
  }
  
  // ═════════════════════════════════════════════════════════════
  // AI TUTOR PANEL
  // ═════════════════════════════════════════════════════════════
  function openAITutor() {
    document.getElementById('ai-tutor-panel').classList.add('open');
  }
  function closeAITutor() {
    document.getElementById('ai-tutor-panel').classList.remove('open');
  }
  

  // ═════════════════════════════════════════════════════════════
  // SECTION 9: TOAST + LESSON COMPLETE + SURPRISE (verbatim v1.js line 610-731)
  // ═════════════════════════════════════════════════════════════

  function showToast(message, opts) {
    opts = opts || {};
    let container = document.getElementById('scispark-toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'scispark-toast-container';
      container.style.cssText = 'position:fixed;top:24px;right:24px;z-index:9999;display:flex;flex-direction:column;gap:12px;pointer-events:none;';
      document.body.appendChild(container);
    }
    const toast = document.createElement('div');
    toast.style.cssText = [
      'background:#ffffff',
      'border-left:4px solid #EA580C',
      'box-shadow:0 4px 12px rgba(0,0,0,0.15)',
      'padding:14px 20px',
      'border-radius:12px',
      'font-family:Arial,sans-serif',
      'font-size:14px',
      'color:#1f2937',
      'min-width:240px',
      'max-width:360px',
      'opacity:0',
      'transform:translateX(20px)',
      'transition:opacity 0.3s ease, transform 0.3s ease',
      'pointer-events:auto'
    ].join(';');
    toast.textContent = message;
    container.appendChild(toast);
    requestAnimationFrame(function(){
      toast.style.opacity = '1';
      toast.style.transform = 'translateX(0)';
    });
    setTimeout(function(){
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(20px)';
      setTimeout(function(){
        if (toast.parentNode) toast.parentNode.removeChild(toast);
      }, 300);
    }, 3000);
  }
  
  // ═════════════════════════════════════════════════════════════
  // COMPLETE LESSON (XP + Badge + Surprise Drop + Streak)
  // ═════════════════════════════════════════════════════════════
  function completeLesson() {
    // PHASE 2 ACTIVATE: write to Supabase user_xp, user_badges, user_streak tables
  
    // lesson_progress UPSERT — writes child_id + lesson_id + completed_at
    // lesson_id comes from data-lesson-id on <body> (UUID from lessons table)
    // Unique constraint: (child_id, lesson_id) — safe to upsert repeatedly
    (async function writeLessonProgress() {
      try {
        const lessonId = document.body.dataset.lessonId;
        if (!lessonId) return; // lesson HTML has no data-lesson-id — skip silently
  
        const client = await waitForSupabaseClient(3000);
        if (!client) return;
  
        const { data: { user }, error: authErr } = await client.auth.getUser();
        if (authErr || !user) return;
  
        const { data: child } = await client
          .from('children')
          .select('id')
          .eq('parent_id', user.id)
          .limit(1)
          .maybeSingle();
        if (!child) return;
  
        const now = new Date().toISOString();
        const { error: upsertErr } = await client
          .from('lesson_progress')
          .upsert(
            {
              child_id:     child.id,
              lesson_id:    lessonId,
              status:       'completed',
              started_at:   now,   // used only on first INSERT; ignored on conflict update
              completed_at: now
            },
            { onConflict: 'child_id,lesson_id' }
          );
  
        if (upsertErr) {
          console.warn('[SciSpark] lesson_progress upsert failed:', upsertErr.message);
        } else {
          console.log('%c[SciSpark] lesson_progress saved — lesson ' + lessonId,
                      'color:#EA580C;font-weight:bold');
        }
      } catch (e) {
        console.warn('[SciSpark] lesson_progress write error:', e.message);
      }
    })();
  
    awardXP(100, 'lesson');
    xpEarned.lesson = 100;
    updateXPDisplay();
  
    // Update streak
    updateStreak();
  
    // Surprise Drop 5% probability
    if (Math.random() < 0.05) {
      setTimeout(() => {
        document.getElementById('surprise-modal').classList.add('show');
      }, 800);
    } else {
      setTimeout(() => {
        // Read lesson number from <body data-lesson="N">; fallback to '?' if not set
        const lessonNum = document.body.dataset.lesson || '?';
        showToast(`Great work! Lesson ${lessonNum} complete. ✓ · XP +10`);
      }, 600);
    }
  }
  
  function closeSurprise() {
    document.getElementById('surprise-modal').classList.remove('show');
  }
  
  // ═════════════════════════════════════════════════════════════
  // STREAK COUNTER (localStorage)
  // ═════════════════════════════════════════════════════════════
  function loadStreak() {}
  function updateStreak() {}

  // ═════════════════════════════════════════════════════════════
  // SECTION 10: CONTENT PROTECTION (verbatim v1.js line 753-851)
  // ═════════════════════════════════════════════════════════════

  function setupContentProtection() {
    // Disable right-click
    document.addEventListener('contextmenu', e => {
      if (!['INPUT','TEXTAREA'].includes(e.target.tagName)) e.preventDefault();
    });
    // Disable Ctrl+C, Ctrl+A, Ctrl+P, Ctrl+S, Ctrl+U on lesson content
    document.addEventListener('keydown', e => {
      if (e.ctrlKey && ['c','a','s','p','u'].includes(e.key.toLowerCase())) {
        if (!['INPUT','TEXTAREA'].includes(e.target.tagName)) e.preventDefault();
      }
      if (e.key === 'F12') e.preventDefault();
      if (e.ctrlKey && e.shiftKey && ['I','J','C'].includes(e.key)) e.preventDefault();
    });
    // Disable drag
    document.addEventListener('dragstart', e => {
      if (!['INPUT','TEXTAREA'].includes(e.target.tagName)) e.preventDefault();
    });
    // Override copy
    document.addEventListener('copy', e => {
      if (!['INPUT','TEXTAREA'].includes(e.target.tagName)) {
        e.clipboardData.setData('text/plain',
          '© 2026 SciSpark · IG SPARK CENTRE · scisparklab.com · Content protected.');
        e.preventDefault();
      }
    });
  }
  
  // ═════════════════════════════════════════════════════════════
  // KEYBOARD NAVIGATION (←→ between screens)
  // ═════════════════════════════════════════════════════════════
  document.addEventListener('keydown', e => {
    // Don't intercept if typing in input/textarea
    if (['INPUT','TEXTAREA'].includes(e.target.tagName)) return;
    const cur = document.querySelector('.screen.active');
    if (!cur) return;
    const idx = screens.indexOf(cur.id.replace('screen-', ''));
    if (e.key === 'ArrowRight' && idx < screens.length - 1) showScreen(screens[idx + 1]);
    if (e.key === 'ArrowLeft' && idx > 0) showScreen(screens[idx - 1]);
  });
  
  // ═════════════════════════════════════════════════════════════
  // INIT ON LOAD
  // ═════════════════════════════════════════════════════════════
  document.addEventListener('DOMContentLoaded', () => {
    // Restore language preference
    const savedLang = localStorage.getItem('scispark_lang') || 'en';
    const urlParams = new URLSearchParams(window.location.search);
    const isBilingual = urlParams.get('bilingual') === '1' || localStorage.getItem('scispark_bilingual') === '1';
    if (isBilingual) {
      document.body.classList.add('bilingual');
      localStorage.setItem('scispark_bilingual', '1');
    }
    setLang(savedLang);
  
    // Apply level (URL override or Supabase fetch)
    applyLevelFromURL();
  
    // Setup auto-save for all textareas
    setupAutoSave();
  
    // Setup content protection
    setupContentProtection();
  
    // Load streak
    loadStreak();
  
    // Show first Professor P bubble after 1 second
    setTimeout(() => showBubbleForScreen('hook'), 1500);
  
    // TTS: voice list is async in Chrome — listen for voiceschanged
    if (ttsSupported) {
      window.speechSynthesis.onvoiceschanged = () => {};
      window.speechSynthesis.getVoices();
    }
  
    ttsInjectButtons();
  });
  
  // ═════════════════════════════════════════════════════════════
  // DOUDOU REACTIONS — answer feedback + screen transitions
  // ═════════════════════════════════════════════════════════════
  const DOUDOU_MSGS = {
    correct: {
      en: ['Awesome!', 'Got it!', 'Yes!', 'Keep going!'],
      zh: ['太棒了!', '对了!', '厉害!', '继续!']
    },
    wrong: {
      en: ['Try again', 'Almost!', "Don't give up", 'Take your time'],
      zh: ['再试试', '差一点!', '别放弃', '慢慢想']
    }
  };
  
  const DOUDOU_SCREEN_MSGS = {
    learn: { en: "Now let's learn",  zh: '现在正式开始学新知识' },
    try:   { en: 'Try it out',       zh: '试试看你学得怎样' },
    test:  { en: 'On your own now',  zh: '靠自己做, 不给提示' },
    wrap:  { en: "Let's review",     zh: '看看今天学了什么' }
  };
  

  // ═════════════════════════════════════════════════════════════
  // SECTION 11: DOUDOU SYSTEM (verbatim v1.js line 852-939)
  // ═════════════════════════════════════════════════════════════

  function doudouGetBubble() {
    let b = document.getElementById('doudou-reaction-bubble');
    if (!b) {
      b = document.createElement('div');
      b.id = 'doudou-reaction-bubble';
      const profP = document.querySelector('.prof-p');
      if (profP) profP.appendChild(b);
    }
    return b;
  }
  
  function doudouShowBubble(text, duration) {
    const b = doudouGetBubble();
    b.textContent = text;
    b.classList.add('show');
    clearTimeout(b._t);
    b._t = setTimeout(() => b.classList.remove('show'), duration || 2000);
  }
  
  function doudouAnimate(type) {
    const avatar = document.querySelector('.prof-p-avatar');
    if (!avatar) return;
    avatar.classList.remove('doudou-correct', 'doudou-wrong', 'doudou-transition');
    void avatar.offsetWidth;
    avatar.classList.add('doudou-' + type);
    setTimeout(() => avatar.classList.remove('doudou-' + type), 1000);
  }
  
  function doudouReact(isCorrect) {
    const type = isCorrect ? 'correct' : 'wrong';
    const isZh = document.body.classList.contains('zh-mode');
    const list = DOUDOU_MSGS[type][isZh ? 'zh' : 'en'];
    const msg = list[Math.floor(Math.random() * list.length)];
    doudouAnimate(type);
    doudouShowBubble(msg, 2000);
  }
  
  // Patch selectOpt — MCQ correct/wrong detection via data-correct="true"
  const _origSelectOpt = selectOpt;
  selectOpt = function(qId, el, letter) {
    _origSelectOpt(qId, el, letter);
    doudouReact(el.dataset.correct === 'true');
  };
  
  // Patch toggleAns — inject self-assessment buttons when answer revealed
  const _origToggleAns = toggleAns;
  toggleAns = function(id) {
    const box = document.getElementById(id);
    const wasHidden = !box.classList.contains('show');
    _origToggleAns(id);
    if (wasHidden && !box.querySelector('.doudou-selfassess')) {
      const isZh = document.body.classList.contains('zh-mode');
      const row = document.createElement('div');
      row.className = 'doudou-selfassess';
  
      const btnR = document.createElement('button');
      btnR.className = 'btn btn-sm doudou-got-right';
      btnR.textContent = isZh ? '✓ 我答对了' : '✓ I got it right';
      btnR.setAttribute('data-en', '✓ I got it right');
      btnR.setAttribute('data-zh', '✓ 我答对了');
      btnR.addEventListener('click', () => doudouReact(true));
  
      const btnW = document.createElement('button');
      btnW.className = 'btn btn-sm doudou-got-wrong';
      btnW.textContent = isZh ? '✗ 还没答到' : '✗ Not yet';
      btnW.setAttribute('data-en', '✗ Not yet');
      btnW.setAttribute('data-zh', '✗ 还没答到');
      btnW.addEventListener('click', () => doudouReact(false));
  
      row.appendChild(btnR);
      row.appendChild(btnW);
      box.appendChild(row);
    }
  };
  
  // Patch showScreen — DouDou speaks on screen transitions
  let _prevScreen = 'hook';
  const _origShowScreen = showScreen;
  showScreen = function(id) {
    const prev = _prevScreen;
    _origShowScreen(id);
    _prevScreen = id;
    if (id !== prev && DOUDOU_SCREEN_MSGS[id]) {
      const isZh = document.body.classList.contains('zh-mode');
      doudouAnimate('transition');
      doudouShowBubble(DOUDOU_SCREEN_MSGS[id][isZh ? 'zh' : 'en'], 3000);
    }
  };

  // ═════════════════════════════════════════════════════════════
  // SECTION 12: SPARK STREAK (v2 — paused-not-reset per Sanchez brief)
  // ═════════════════════════════════════════════════════════════
  const SparkStreak = (function () {
    let count = 0;
    let paused = false;
    function render() {
      const el = document.querySelector('.nav-top__streak');
      if (!el) return;
      el.setAttribute('data-paused', String(paused));
      const num = el.querySelector('.streak-num');
      if (num) num.textContent = String(count);
      // v1 fallback
      const v1Num = document.getElementById('streak-count');
      if (v1Num) v1Num.textContent = String(count);
    }
    return {
      add() { paused = false; count += 1; render(); },
      miss() { paused = true; render(); },
      reset() { count = 0; paused = false; render(); },
      get() { return { count, paused }; },
      render
    };
  })();

  // ═════════════════════════════════════════════════════════════
  // SECTION 13: AUDIO REWARD 5 OGG + MUTE TOGGLE
  // Source: extracted from v03 chat HTML inline (gamesounds.xyz CC0)
  // ═════════════════════════════════════════════════════════════
  const AUDIO_BASE = 'https://gamesounds.xyz/Kenney\'s%20Sound%20Pack/Interface%20Sounds/';
  const AUDIO_FILES = {
    correct:  'confirmation_001.ogg',
    wrong:    'error_002.ogg',
    levelup:  'maximize_009.ogg',
    popup:    'pluck_001.ogg',
    complete: 'bong_001.ogg'
  };
  const audioCache = {};
  let muted = false;
  try { muted = localStorage.getItem(LS_MUTE) === '1'; } catch (e) {}

  function playSound(type) {
    if (muted) return;
    if (!AUDIO_FILES[type]) return;
    let a = audioCache[type];
    if (!a) {
      // Try to use lesson HTML inline <audio> first
      a = document.getElementById('audio-' + type);
      if (!a) {
        a = new Audio(AUDIO_BASE + AUDIO_FILES[type]);
        a.preload = 'auto';
      }
      audioCache[type] = a;
    }
    try {
      a.currentTime = 0;
      const p = a.play();
      if (p && p.catch) p.catch(() => {});
    } catch (e) {}
  }

  function toggleMute() {
    muted = !muted;
    try { localStorage.setItem(LS_MUTE, muted ? '1' : '0'); } catch (e) {}
    renderMuteToggle();
  }

  function renderMuteToggle() {
    const btn = document.getElementById('mute-toggle') || document.querySelector('.mute-toggle');
    if (!btn) return;
    btn.textContent = muted ? '🔇' : '🔊';
    btn.classList.toggle('muted', muted);
    btn.setAttribute('aria-label', muted ? 'Unmute · 取消静音' : 'Mute · 静音');
  }

  // ═════════════════════════════════════════════════════════════
  // SECTION 14: TRACK PROGRESS + COLLECT ANSWERS (v2)
  // ═════════════════════════════════════════════════════════════
  async function trackProgress(lessonId, screen, status) {
    try {
      const sb = await ensureSupabase();
      if (!sb) return false;
      const auth = await sb.auth.getUser();
      const user = auth && auth.data && auth.data.user;
      if (!user) return false;
      if (status === 'view') return true;
      const { error } = await sb.from('lesson_progress').upsert({
        child_id: user.id,
        lesson_id: lessonId,
        completed_at: new Date().toISOString()
      }, { onConflict: 'child_id,lesson_id' });
      if (error) console.warn('[SciSpark v3] lesson_progress upsert failed:', error.message);
      return !error;
    } catch (e) {
      console.warn('[SciSpark v3] trackProgress error:', e && e.message);
      return false;
    }
  }

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

  // ═════════════════════════════════════════════════════════════
  // SECTION 15: BOOT
  // ═════════════════════════════════════════════════════════════
  function boot() {
    // Apply Supabase-driven level (v1)
    if (typeof applyLevelFromURL === 'function') {
      try { applyLevelFromURL(); } catch (e) {}
    }

    // Sidebar nav clicks (v2 pattern)
    document.querySelectorAll('.sidebar__btn').forEach(btn => {
      btn.addEventListener('click', () => showScreen(btn.dataset.screen));
    });

    // Lang toggle clicks (v2 pattern)
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

    // Render mute toggle initial state
    renderMuteToggle();

    // Wire mute toggle button (if exists in HTML)
    const muteBtn = document.getElementById('mute-toggle') || document.querySelector('.mute-toggle');
    if (muteBtn && !muteBtn._wired) {
      muteBtn.addEventListener('click', toggleMute);
      muteBtn._wired = true;
    }

    // Setup content protection
    if (typeof setupContentProtection === 'function') {
      try { setupContentProtection(); } catch (e) {}
    }

    // Setup auto-save
    if (typeof setupAutoSave === 'function') {
      try { setupAutoSave(); } catch (e) {}
    }

    // Inject TTS buttons (v1)
    if (typeof ttsInjectButtons === 'function') {
      try { ttsInjectButtons(); } catch (e) {}
    }

    // Start on Hook (or screen from URL param ?s=, or saved progress)
    const params = new URLSearchParams(location.search);
    let startScreen = params.get('s') || 'hook';
    const lessonId = document.body.getAttribute('data-lesson-id') || document.body.getAttribute('data-lesson');
    if (lessonId && !params.get('s')) {
      try {
        const saved = localStorage.getItem(LS_PROGRESS_PREFIX + lessonId);
        if (saved && SCREENS.includes(saved)) startScreen = saved;
      } catch (e) {}
    }
    showScreen(startScreen);

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

  // ═════════════════════════════════════════════════════════════
  // EXPOSE GLOBALS (lesson HTML calls these via onclick=)
  // ═════════════════════════════════════════════════════════════
  window.showScreen = showScreen;
  window.setLang = setLang;
  window.submitAnswer = submitAnswer;
  window.selectOpt = selectOpt;
  window.toggleHint = toggleHint;
  window.toggleAns = toggleAns;
  window.toggleMute = toggleMute;
  window.playSound = playSound;
  window.trackProgress = trackProgress;
  window.collectAnswers = collectAnswers;
  window.SparkStreak = SparkStreak;

  // v1 globals (exposed if defined in copied sections)
  if (typeof awardXP === 'function')               window.awardXP = awardXP;
  if (typeof updateXPDisplay === 'function')       window.updateXPDisplay = updateXPDisplay;
  if (typeof showToast === 'function')             window.showToast = showToast;
  if (typeof completeLesson === 'function')        window.completeLesson = completeLesson;
  if (typeof closeSurprise === 'function')         window.closeSurprise = closeSurprise;
  if (typeof toggleBubble === 'function')          window.toggleBubble = toggleBubble;
  if (typeof closeBubble === 'function')           window.closeBubble = closeBubble;
  if (typeof openAITutor === 'function')           window.openAITutor = openAITutor;
  if (typeof closeAITutor === 'function')          window.closeAITutor = closeAITutor;
  if (typeof showBubbleForScreen === 'function')   window.showBubbleForScreen = showBubbleForScreen;
  if (typeof doudouReact === 'function')           window.doudouReact = doudouReact;
  if (typeof doudouAnimate === 'function')         window.doudouAnimate = doudouAnimate;
  if (typeof doudouShowBubble === 'function')      window.doudouShowBubble = doudouShowBubble;
  if (typeof ttsToggle === 'function')             window.ttsToggle = ttsToggle;
  if (typeof ttsPlay === 'function')               window.ttsPlay = ttsPlay;
  if (typeof ttsStop === 'function')               window.ttsStop = ttsStop;
  if (typeof setupContentProtection === 'function') window.setupContentProtection = setupContentProtection;
  if (typeof setupAutoSave === 'function')         window.setupAutoSave = setupAutoSave;
  if (typeof applyLevelFromURL === 'function')     window.applyLevelFromURL = applyLevelFromURL;

  // Boot when ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})(); // end IIFE

/* ═══════════════════════════════════════════════════════════════
   SECTION: Click-Spark Cursor FX — ported from v2 component
   Spawns 5-8 orange spark particles on every mousedown/touchstart.
   ═══════════════════════════════════════════════════════════════ */
(function () {
  if (window.__sparkFxInstalled) return;
  window.__sparkFxInstalled = true;

  const layer = document.createElement('div');
  layer.className = 'spark-fx-layer';
  layer.setAttribute('aria-hidden', 'true');
  const mountLayer = () => {
    if (document.body && !layer.isConnected) document.body.appendChild(layer);
  };
  if (document.body) mountLayer();
  else document.addEventListener('DOMContentLoaded', mountLayer, { once: true });

  const reduceMotion = window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function spawn(x, y) {
    if (reduceMotion) return;
    if (!layer.isConnected) mountLayer();
    const n = 5 + Math.floor(Math.random() * 4);
    for (let i = 0; i < n; i++) {
      const p = document.createElement('span');
      p.className = 'spark-particle' + (i % 2 === 0 ? '' : ' s2');
      const angle = (Math.PI * 2 * i) / n + (Math.random() - 0.5) * 0.6;
      const dist = 28 + Math.random() * 24;
      const dx = Math.cos(angle) * dist;
      const dy = Math.sin(angle) * dist - 6;
      p.style.left = (x - 4) + 'px';
      p.style.top  = (y - 4) + 'px';
      p.style.setProperty('--spark-end', `translate(${dx}px, ${dy}px)`);
      layer.appendChild(p);
      p.addEventListener('animationend', () => p.remove(), { once: true });
      setTimeout(() => p.isConnected && p.remove(), 800);
    }
  }

  document.addEventListener('mousedown', (e) => { spawn(e.clientX, e.clientY); }, { passive: true });
  document.addEventListener('touchstart', (e) => {
    if (e.touches && e.touches.length) spawn(e.touches[0].clientX, e.touches[0].clientY);
  }, { passive: true });

  window.ClickSparkFx = { spawn };
})();
