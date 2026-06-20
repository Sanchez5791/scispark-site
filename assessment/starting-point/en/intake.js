'use strict';
/* SciSpark — Learning Starting Point Check (intake, EN V2)
   - Routes the student to ONE year-level set (Y7 / Y8 / Y9) of 15 questions.
   - Q1–Q13 MCQ auto-graded client-side (max 13). Q14–Q15 short answer, manual.
   - Stores selected answers + short text + time spent + auto score into the
     existing assessment_attempts / assessment_answers tables.
   - Self-contained: no shared engine/template dependency. Uses ONLY the
     Supabase publishable (anon) key; row access enforced by RLS, exactly as
     the live Y7/Y8/Y9 assessment pages do. No service key in the frontend. */

/* ── Constants ─────────────────────────────────────────────────── */
const SUPABASE_URL      = 'https://fiffuaoibxeggwxcfvfh.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_OOrhuk8oqIbNLg3Wxo6fzQ_7z4sloBJ';
const ASSESSMENT_CODE   = 'INTAKE_SPC_EN_V2';
const TOTAL_QUESTIONS   = 15;
const MCQ_COUNT         = 13;   // Q1–Q13 auto-graded
const MAX_SCORE         = 13;
const AUTOSAVE_INTERVAL = 15000;

/* ── Supabase client ────────────────────────────────────────────── */
let sb = null;
if (window.supabase) sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/* ── State ──────────────────────────────────────────────────────── */
let startedAtMs   = Date.now();
let isSubmitting  = false;
let currentYear   = null;        // 'Y7' | 'Y8' | 'Y9'
let questions     = [];          // the routed set
let autosaveKey   = 'scispark_intake_spc_v2_draft';

/* ── Helpers ────────────────────────────────────────────────────── */
function qid(i) { return 'SPC_Q' + String(i + 1).padStart(2, '0'); }
function esc(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'];

/* selected MCQ index for a question (or -1), or short-answer text */
function mcqSelected(i) {
  const el = document.querySelector('input[name="' + qid(i) + '"]:checked');
  return el ? parseInt(el.value, 10) : -1;
}
function shortText(i) {
  const el = document.querySelector('textarea[data-qindex="' + i + '"]');
  return el ? el.value.trim() : '';
}
function isAnswered(i) {
  return questions[i].type === 'mcq' ? mcqSelected(i) >= 0 : shortText(i).length > 0;
}
function countAnswered() {
  let n = 0;
  for (let i = 0; i < questions.length; i++) if (isAnswered(i)) n++;
  return n;
}

/* ── Render the routed set ──────────────────────────────────────── */
function renderSet() {
  const main = document.getElementById('spc-main');
  main.innerHTML = '';
  questions.forEach(function (item, i) {
    const art = document.createElement('article');
    art.className = 'spc-q';
    art.id = 'qcard-' + qid(i);

    let body;
    if (item.type === 'mcq') {
      const opts = item.options.map(function (opt, oi) {
        return '<label class="mcq-option">' +
          '<input type="radio" name="' + qid(i) + '" value="' + oi + '">' +
          '<span class="opt-badge">' + LETTERS[oi] + '</span>' +
          '<span class="opt-text">' + esc(opt) + '</span></label>';
      }).join('');
      body = '<div class="mcq-options" role="radiogroup" aria-label="Question ' + (i + 1) + '">' + opts + '</div>';
    } else {
      body = '<textarea class="spc-answer" data-qindex="' + i + '" rows="3" ' +
        'placeholder="Write one sentence…" aria-label="Answer for step ' + (i + 1) + '"></textarea>';
    }

    art.innerHTML =
      '<div class="spc-q-head">' +
        '<span class="spc-q-num">Step ' + (i + 1) + ' <span class="spc-q-of">of 15</span></span>' +
        '<span class="spc-q-tag">' + (item.type === 'mcq' ? 'Pick one' : 'Your words') + '</span>' +
      '</div>' +
      '<p class="spc-q-text">' + esc(item.q) + '</p>' +
      body;
    main.appendChild(art);
  });

  // wire inputs
  main.querySelectorAll('input[type="radio"]').forEach(function (el) {
    el.addEventListener('change', function () {
      el.closest('.mcq-options').querySelectorAll('.mcq-option').forEach(function (l) { l.classList.remove('picked'); });
      el.closest('.mcq-option').classList.add('picked');
      updateProgress();
    });
  });
  main.querySelectorAll('textarea[data-qindex]').forEach(function (el) {
    el.addEventListener('input', updateProgress);
  });
}

/* ── Progress ───────────────────────────────────────────────────── */
function updateProgress() {
  const count = countAnswered();
  const el  = document.getElementById('spc-progress-count');
  const bar = document.getElementById('spc-progress-fill');
  if (el)  el.textContent = count;
  if (bar) bar.style.width = Math.round((count / TOTAL_QUESTIONS) * 100) + '%';
  return count;
}

/* ── Autosave (draft only) ──────────────────────────────────────── */
function saveDraft() {
  try {
    const d = { year: currentYear, mcq: {}, short: {} };
    questions.forEach(function (item, i) {
      if (item.type === 'mcq') { const s = mcqSelected(i); if (s >= 0) d.mcq[i] = s; }
      else { const t = shortText(i); if (t) d.short[i] = t; }
    });
    localStorage.setItem(autosaveKey, JSON.stringify(d));
  } catch (e) {}
}
function restoreDraft() {
  try {
    const raw = localStorage.getItem(autosaveKey);
    if (!raw) return;
    const d = JSON.parse(raw);
    if (d.year !== currentYear) return;
    Object.keys(d.mcq || {}).forEach(function (i) {
      const el = document.querySelector('input[name="' + qid(i) + '"][value="' + d.mcq[i] + '"]');
      if (el) { el.checked = true; el.closest('.mcq-option').classList.add('picked'); }
    });
    Object.keys(d.short || {}).forEach(function (i) {
      const el = document.querySelector('textarea[data-qindex="' + i + '"]');
      if (el) el.value = d.short[i];
    });
  } catch (e) {}
}
function clearDraft() { try { localStorage.removeItem(autosaveKey); } catch (e) {} }

/* ── Grade (Q1–Q13 only) ────────────────────────────────────────── */
function gradeMcq() {
  let score = 0;
  const per = [];
  for (let i = 0; i < MCQ_COUNT; i++) {
    const sel = mcqSelected(i);
    const correct = questions[i].correct;
    const ok = sel === correct;
    if (ok) score++;
    per.push({ q: qid(i), selected: sel, selected_text: sel >= 0 ? questions[i].options[sel] : null, is_correct: ok });
  }
  return { score: score, per: per };
}
function placement(score) {
  if (score <= 5)  return { band: 'lower',  text: 'a lower unit' };
  if (score <= 11) return { band: 'middle', text: 'a middle unit' };
  return { band: 'higher', text: 'a higher unit' };
}

/* ── Build answer rows ──────────────────────────────────────────── */
function collectAnswerRows(attemptId) {
  return questions.map(function (item, i) {
    let val = null;
    if (item.type === 'mcq') {
      const s = mcqSelected(i);
      val = s >= 0 ? item.options[s] : null;        // store readable choice text
    } else {
      val = shortText(i) || null;
    }
    return { attempt_id: attemptId, question_number: qid(i), field_name: qid(i), answer_value: val };
  });
}

/* ── Error display ──────────────────────────────────────────────── */
function showError(msg) { alert('We could not save your answers:\n\n' + msg); }

/* ── Resolve which child / year ─────────────────────────────────── */
async function resolveChild(userId) {
  const params = new URLSearchParams(location.search);
  const wantChild = params.get('child');
  const wantYear  = params.get('year');
  const { data: kids } = await sb.from('children')
    .select('id, full_name, year_group')
    .eq('parent_id', userId).order('created_at', { ascending: true });
  if (!kids || kids.length === 0) return null;
  if (wantChild) { const h = kids.find(function (k) { return k.id === wantChild; }); if (h) return h; }
  if (wantYear)  { const h = kids.find(function (k) { return k.year_group === wantYear; }); if (h) return h; }
  return kids[0];
}

/* ── Submit ─────────────────────────────────────────────────────── */
async function submitToSupabase() {
  if (!sb) { showError('The page did not load fully. Please refresh and try again.'); return null; }

  const { data: { user }, error: authErr } = await sb.auth.getUser();
  if (authErr || !user) {
    location.href = '/signin.html?redirect=' + encodeURIComponent(location.pathname + location.search);
    return null;
  }
  const child = await resolveChild(user.id);
  if (!child) {
    showError('We could not find your child’s record on this account.\nPlease contact SciSpark support and do not close this page.');
    return null;
  }

  const graded    = gradeMcq();
  const place     = placement(graded.score);
  const timeSpent = Math.max(0, Math.round((Date.now() - startedAtMs) / 1000));

  const { data: attempt, error: attemptErr } = await sb.from('assessment_attempts').insert({
    student_id:            user.id,
    children_id:           child.id,
    assessment_code:       ASSESSMENT_CODE,
    year_group:            currentYear,
    language:              'EN',
    status:                'submitted',
    total_questions:       TOTAL_QUESTIONS,
    total_marks:           MAX_SCORE,
    mcq_score:             graded.score,
    total_score:           graded.score,
    ai_marking_status:     'auto_mcq',
    marking_detail:        { mcq_score: graded.score, max: MAX_SCORE, placement: place.band, per_question: graded.per },
    started_at:            new Date(startedAtMs).toISOString(),
    submitted_at:          new Date().toISOString(),
    time_spent_seconds:    timeSpent,
    teacher_review_status: 'pending',
    trigger_source:        'intake_after_first_lesson'
  }).select().single();

  if (attemptErr) {
    console.error('[SciSpark Intake] attempt insert failed:', attemptErr);
    showError('Please try again. If it keeps failing, contact SciSpark support.');
    return null;
  }

  const rows = collectAnswerRows(attempt.id);
  const { error: ansErr } = await sb.from('assessment_answers').insert(rows); // no .select() — RLS
  if (ansErr) {
    console.error('[SciSpark Intake] answers insert failed:', ansErr);
    showError('Your check was saved (ID: ' + attempt.id + ') but the answers could not be stored. ' +
              'Please contact SciSpark and quote this ID.');
    return null;
  }
  return { id: attempt.id, place: place };
}

/* ── Modal ──────────────────────────────────────────────────────── */
function openModal() {
  const count = updateProgress();
  const a = document.getElementById('modal-answered');
  const u = document.getElementById('modal-unanswered');
  if (a) a.textContent = count;
  if (u) u.textContent = TOTAL_QUESTIONS - count;
  document.getElementById('modal-overlay')?.classList.add('open');
}
function closeModal() { document.getElementById('modal-overlay')?.classList.remove('open'); }

/* ── Success ────────────────────────────────────────────────────── */
function showSuccess(result) {
  clearDraft();
  document.getElementById('spc-main').style.display = 'none';
  document.getElementById('spc-submitbar').style.display = 'none';
  document.querySelector('.spc-progress').style.display = 'none';
  const screen = document.getElementById('spc-success');
  screen.style.display = 'flex';
  const dir = document.getElementById('spc-success-dir');
  if (dir && result.place) dir.textContent = 'Suggested starting point: ' + result.place.text + ' — not too easy, not too hard. Your teacher will confirm.';
  const idEl = document.getElementById('spc-success-id');
  if (idEl) idEl.textContent = result.id;
  window.scrollTo(0, 0);
}

/* ── Confirm submit ─────────────────────────────────────────────── */
async function confirmSubmit() {
  if (isSubmitting) return;
  isSubmitting = true;
  const btn = document.getElementById('modal-confirm');
  if (btn) { btn.disabled = true; btn.textContent = 'Saving…'; }

  let result = null;
  try { result = await submitToSupabase(); }
  catch (e) { console.error(e); showError('Something went wrong. Please try again.'); }

  if (result) { closeModal(); showSuccess(result); }
  else { isSubmitting = false; if (btn) { btn.disabled = false; btn.textContent = 'Yes, I’m done'; } }
}

/* ── Year routing ───────────────────────────────────────────────── */
function startSet(year) {
  if (!INTAKE_SETS[year]) return;
  currentYear = year;
  questions   = INTAKE_SETS[year];
  autosaveKey = 'scispark_intake_spc_v2_' + year + '_draft';
  startedAtMs = Date.now();

  document.getElementById('spc-year-pick').style.display = 'none';
  document.getElementById('spc-app').style.display = 'block';
  const badge = document.getElementById('spc-year-badge');
  if (badge) badge.textContent = year.replace('Y', 'Year ');

  renderSet();
  restoreDraft();
  updateProgress();
  setInterval(saveDraft, AUTOSAVE_INTERVAL);
  window.addEventListener('beforeunload', saveDraft);
  console.log('[SciSpark Intake] ' + year + ' set ready — ' + questions.length + ' questions.');
}

/* Decide the year: ?year= → logged-in child → else show picker. */
async function routeYear() {
  const params = new URLSearchParams(location.search);
  const p = (params.get('year') || '').toUpperCase();
  if (INTAKE_SETS[p]) { startSet(p); return; }
  if (sb) {
    try {
      const { data: { user } } = await sb.auth.getUser();
      if (user) {
        const child = await resolveChild(user.id);
        if (child && INTAKE_SETS[child.year_group]) { startSet(child.year_group); return; }
      }
    } catch (e) {}
  }
  // fallback: let the student pick (also used for preview)
  document.getElementById('spc-year-pick').style.display = 'flex';
  document.getElementById('spc-app').style.display = 'none';
}

/* ── Init ───────────────────────────────────────────────────────── */
function init() {
  document.getElementById('spc-submit-btn')?.addEventListener('click', openModal);
  document.getElementById('modal-cancel')?.addEventListener('click', closeModal);
  document.getElementById('modal-confirm')?.addEventListener('click', confirmSubmit);
  document.getElementById('modal-overlay')?.addEventListener('click', function (e) {
    if (e.target === e.currentTarget) closeModal();
  });
  document.querySelectorAll('[data-pick-year]').forEach(function (b) {
    b.addEventListener('click', function () { startSet(b.getAttribute('data-pick-year')); });
  });
  routeYear();
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
else init();
