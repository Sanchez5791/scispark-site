/*
═══════════════════════════════════════════════════════════════
SCISPARK LESSON SHARED JAVASCRIPT
═══════════════════════════════════════════════════════════════
File: /public/lesson-shell.js (Vercel auto-served at /lesson-shell.js)
Type: SHARED script — used by ALL lesson HTML files
Source: extracted from SCISPARK_LESSON_SHELL_v1 → v2 (B-mode shared)
Date: 2026-05-16
Version: v3 (PRODUCTION)
Status: PERMANENT LOCKED — change here propagates to ALL lessons

Changelog:
  v6 (2026-05-16) — fetchLevelFromSupabase 改 layered lookup:
                    [a] assessment_attempts 查最新 attempt (filter
                        student_id = auth UID, 历史命名)
                    [b] assessment_reviews 优先 (teacher_final_level
                        > provisional_level), 这 2 列是 text 类型,
                        加 normLevel() 把 'l1'/'L1'/'1' 全部标准化
                        成 '1'/'2'/'3' (匹配 CSS)
                    [c] 都没有 → 从 assessment_marking_results.
                        total_awarded 算 (≥45=3, ≥30=2, <30=1)
                    支持老师覆盖。其他 function 全部不动。
  v5 (2026-05-16) — fetchLevelFromSupabase 改读 total_awarded
                    (assessment_marking_results 表没有 level 列)。
                    分数→level 换算: ≥45=3, ≥30=2, <30=1。
                    阈值跟 api/mark.js + teacher-review.html 一致。
                    其他 function 全部不动。
  v4 (2026-05-16) — 在 lesson-shell.js 顶部加 Supabase auto-init
                    (IIFE)。自动 load SDK CDN, createClient,
                    赋值 window.sb。lesson HTML 零改动。
                    applyLevelFromURL + 3 个 helper 不动。
  v3 (2026-05-16) — applyLevelFromURL 改读 Supabase
                    assessment_marking_results.level (per student)。
                    URL ?level=N 仍然有效 (老师测试用, 不写 cache)。
                    Supabase 失败 → localStorage → '2' default。
                    新增 fetchLevelFromSupabase + waitForSupabaseClient
                    2 个 helper。其他 function 全部没动。
  v2 (2026-05-11) — B-mode shared 初版

Includes:
  - showScreen() navigation
  - setLang(en/zh) bilingual toggle
  - Professor P bubble per-screen
  - Keyboard arrow nav
  - Question reveal/answer logic
  - localStorage streak counter
═══════════════════════════════════════════════════════════════
*/

// ═════════════════════════════════════════════════════════════
// SUPABASE AUTO-INIT (v4)
// Self-contained: load SDK CDN if needed → createClient → window.sb
// Anon key is publishable by design (RLS = real security boundary).
// ═════════════════════════════════════════════════════════════
(function initSupabase() {
  // 已有 client? 跳过 (lesson HTML 自己 init 过的情况)
  if (window.sb && window.sb.auth && typeof window.sb.from === 'function') {
    console.log('%c[SciSpark Supabase] existing client detected, skipping init',
                'color:#888');
    return;
  }

  const SB_URL = 'https://fiffuaoibxeggwxcfvfh.supabase.co';
  const SB_KEY = 'sb_publishable_OOrhuk8oqIbNLg3Wxo6fzQ_7z4sloBJ';

  function createClient() {
    if (!window.supabase || typeof window.supabase.createClient !== 'function') {
      return false;
    }
    window.sb = window.supabase.createClient(SB_URL, SB_KEY);
    console.log('%c[SciSpark Supabase] client ready',
                'color:#EA580C;font-weight:bold');
    return true;
  }

  // SDK 已 load? 直接 create
  if (createClient()) return;

  // SDK 没 load → 动态 inject CDN <script>
  const s = document.createElement('script');
  s.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js';
  s.onload = () => {
    if (!createClient()) {
      console.warn('[SciSpark Supabase] SDK loaded but createClient failed');
    }
  };
  s.onerror = () => {
    console.warn('[SciSpark Supabase] CDN load failed — applyLevelFromURL will fallback');
  };
  document.head.appendChild(s);
})();

// ═════════════════════════════════════════════════════════════
// TTS STATE — only ONE utterance at a time
// ═════════════════════════════════════════════════════════════
let ttsCurrentUtterance = null;
let ttsCurrentButton = null;
let ttsSupported = (
  'speechSynthesis' in window &&
  'SpeechSynthesisUtterance' in window
);

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
const progress = { hook: 1, learn: 2, try: 3, test: 4, wrap: 5 };

function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.screen-nav-item').forEach(n => n.classList.remove('active'));
  document.getElementById('screen-' + id).classList.add('active');
  const idx = screens.indexOf(id);
  document.querySelectorAll('.screen-nav-item')[idx].classList.add('active');
  // mark previous as done
  for (let i = 0; i < idx; i++) {
    document.querySelectorAll('.screen-nav-item')[i].classList.add('done');
  }
  const pct = Math.round((progress[id] / 5) * 100);
  document.getElementById('prog-fill').style.width = pct + '%';
  document.getElementById('prog-pct').textContent = pct + '%';
  window.scrollTo({ top: 0, behavior: 'smooth' });

  // Update Professor P bubble per screen
  showBubbleForScreen(id);
}

// ═════════════════════════════════════════════════════════════
// LANGUAGE TOGGLE (EN ↔ ZH)
// ═════════════════════════════════════════════════════════════
function setLang(mode) {
  document.body.classList.toggle('zh-mode', mode === 'zh');
  document.getElementById('lang-en').classList.toggle('active', mode === 'en');
  document.getElementById('lang-zh').classList.toggle('active', mode === 'zh');
  // Swap data-en / data-zh attributes
  document.querySelectorAll('[data-en][data-zh]').forEach(el => {
    el.innerHTML = (mode === 'zh') ? el.dataset.zh : el.dataset.en;
  });
  localStorage.setItem('scispark_lang', mode);

  if (ttsCurrentUtterance) {
    ttsStop();
  }
}

// ═════════════════════════════════════════════════════════════
// LEVEL SYSTEM — v3 (Supabase-backed)
// ═════════════════════════════════════════════════════════════
// 顺序:
//   [1] URL ?level=1/2/3  → 老师测试用, 立刻应用, 不写 localStorage,
//                            跳过 Supabase
//   [2] localStorage cache 立刻应用 (避免页面闪烁)
//   [3] async 去 Supabase 抽真值 → 覆盖 [2] + 写 cache
//   [4] Supabase 失败 → 保持 [2] (cache 或 default '2'), 不 break
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
function selectOpt(qId, el, letter) {
  document.querySelectorAll('#' + qId + '-opts .mcq-option').forEach(o => o.classList.remove('selected'));
  el.classList.add('selected');
}
function toggleHint(id) {
  const box = document.getElementById(id);
  box.classList.toggle('show');
}
function toggleAns(id) {
  const box = document.getElementById(id);
  box.classList.toggle('show');
}

// ═════════════════════════════════════════════════════════════
// XP TOAST + AWARD
// ═════════════════════════════════════════════════════════════
let xpEarned = { mcq: 0, aha: 0, lesson: 0 };
const xpAnswered = new Set();

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
      alert(`Great work! Lesson ${lessonNum} complete. ✓\n干得好!第 ${lessonNum} 课完成。`);
    }, 600);
  }
}

function closeSurprise() {
  document.getElementById('surprise-modal').classList.remove('show');
}

// ═════════════════════════════════════════════════════════════
// STREAK COUNTER (localStorage)
// ═════════════════════════════════════════════════════════════
function updateStreak() {
  // PHASE 2 ACTIVATE: sync with Supabase user_streak table
  const today = new Date().toDateString();
  const last = localStorage.getItem('scispark_streak_last');
  let streak = parseInt(localStorage.getItem('scispark_streak_count') || '0', 10);
  if (last !== today) {
    streak += 1;
    localStorage.setItem('scispark_streak_count', streak);
    localStorage.setItem('scispark_streak_last', today);
  }
  document.getElementById('streak-count').textContent = streak;
}

function loadStreak() {
  const streak = parseInt(localStorage.getItem('scispark_streak_count') || '1', 10);
  document.getElementById('streak-count').textContent = streak;
}

// ═════════════════════════════════════════════════════════════
// CONTENT PROTECTION
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
