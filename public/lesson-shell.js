/*
═══════════════════════════════════════════════════════════════
SCISPARK LESSON SHARED JAVASCRIPT
═══════════════════════════════════════════════════════════════
File: /public/lesson-shell.js (Vercel auto-served at /lesson-shell.js)
Type: SHARED script — used by ALL lesson HTML files
Source: extracted from SCISPARK_LESSON_SHELL_v1 → v2 (B-mode shared)
Date: 2026-05-11
Status: PERMANENT LOCKED — change here propagates to ALL lessons

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
}

// ═════════════════════════════════════════════════════════════
// LEVEL SYSTEM (URL ?level=1/2/3)
// ═════════════════════════════════════════════════════════════
function applyLevelFromURL() {
  const params = new URLSearchParams(window.location.search);
  const level = params.get('level') || localStorage.getItem('scispark_level') || '2';
  if (['1','2','3'].includes(level)) {
    document.body.setAttribute('data-user-level', level);
    localStorage.setItem('scispark_level', level);
  }
  // PHASE 2 ACTIVATE: read level from Supabase student profile instead of URL
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

  // Apply level (URL or localStorage)
  applyLevelFromURL();

  // Setup auto-save for all textareas
  setupAutoSave();

  // Setup content protection
  setupContentProtection();

  // Load streak
  loadStreak();

  // Show first Professor P bubble after 1 second
  setTimeout(() => showBubbleForScreen('hook'), 1500);
});
