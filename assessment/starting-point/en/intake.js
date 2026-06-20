'use strict';
/* SciSpark — Learning Starting Point Check (intake, English V1)
   - 12 long-answer questions, ONE box each.
   - NO auto-grading. All answers stored for human (teacher) marking.
   - Stores answer text + time spent into assessment_attempts / assessment_answers.
   - Uses the Supabase PUBLISHABLE (anon) key only — never a service key.
     Public anon key is safe in the browser; row access is enforced by RLS,
     exactly as the live Y7/Y8/Y9 assessment pages do. */

/* ── Constants ─────────────────────────────────────────────────── */
const SUPABASE_URL      = 'https://fiffuaoibxeggwxcfvfh.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_OOrhuk8oqIbNLg3Wxo6fzQ_7z4sloBJ';
const ASSESSMENT_CODE   = 'INTAKE_SPC_EN_V1';
const TOTAL_QUESTIONS   = 12;
const TOTAL_MARKS       = 60;
const AUTOSAVE_KEY      = 'scispark_intake_spc_draft';
const AUTOSAVE_INTERVAL = 15000;
/* QIDS injected by the page (ordered SPC_Q01 … SPC_Q12) */
const QIDS = (window.SPC_QIDS || []);

/* ── Supabase client ────────────────────────────────────────────── */
let sb = null;
if (window.supabase) {
  sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}

/* ── State ──────────────────────────────────────────────────────── */
let startedAtMs  = Date.now();
let isSubmitting = false;

/* ── Field helpers ──────────────────────────────────────────────── */
function fieldEl(qid) {
  return document.querySelector('textarea[data-question-id="' + qid + '"]');
}
function readValue(qid) {
  const el = fieldEl(qid);
  if (!el) return null;
  const v = el.value.trim();
  return v.length ? v : null;
}
function countAnswered() {
  let n = 0;
  QIDS.forEach(function (qid) { if (readValue(qid) !== null) n++; });
  return n;
}

/* ── Progress chip ──────────────────────────────────────────────── */
function updateProgress() {
  const count = countAnswered();
  const el  = document.getElementById('spc-progress-count');
  const bar = document.getElementById('spc-progress-fill');
  if (el)  el.textContent = count;
  if (bar) bar.style.width = Math.round((count / TOTAL_QUESTIONS) * 100) + '%';
  return count;
}

/* ── Autosave (draft only, localStorage) ────────────────────────── */
function saveDraft() {
  try {
    const draft = {};
    QIDS.forEach(function (qid) {
      const el = fieldEl(qid);
      if (el && el.value) draft[qid] = el.value;
    });
    localStorage.setItem(AUTOSAVE_KEY, JSON.stringify(draft));
  } catch (e) { /* storage may be unavailable; ignore */ }
}
function restoreDraft() {
  try {
    const raw = localStorage.getItem(AUTOSAVE_KEY);
    if (!raw) return;
    const draft = JSON.parse(raw);
    Object.keys(draft).forEach(function (qid) {
      const el = fieldEl(qid);
      if (el) el.value = draft[qid];
    });
  } catch (e) { /* ignore */ }
}
function clearDraft() {
  try { localStorage.removeItem(AUTOSAVE_KEY); } catch (e) {}
}

/* ── Build answer rows for DB insert (one row per question) ─────── */
function collectAnswerRows(attemptId) {
  return QIDS.map(function (qid) {
    return {
      attempt_id:      attemptId,
      question_number: qid,
      field_name:      qid,
      answer_value:    readValue(qid)
    };
  });
}

/* ── Error display ──────────────────────────────────────────────── */
function showError(msg) { alert('We could not save your answers:\n\n' + msg); }

/* ── Which child this check belongs to ──────────────────────────── */
/* A parent account can have more than one child. Allow the caller to
   pass ?child=<uuid> (preferred, set by the lesson-complete redirect).
   Otherwise fall back to ?year=Y7/Y8/Y9, otherwise the first child. */
async function resolveChild(userId) {
  const params = new URLSearchParams(location.search);
  const wantChild = params.get('child');
  const wantYear  = params.get('year');

  const { data: kids, error } = await sb
    .from('children')
    .select('id, full_name, year_group')
    .eq('parent_id', userId)
    .order('created_at', { ascending: true });

  if (error || !kids || kids.length === 0) return null;
  if (wantChild) {
    const hit = kids.find(function (k) { return k.id === wantChild; });
    if (hit) return hit;
  }
  if (wantYear) {
    const hit = kids.find(function (k) { return k.year_group === wantYear; });
    if (hit) return hit;
  }
  return kids[0];
}

/* ── Supabase submit ────────────────────────────────────────────── */
/* Returns attempt UUID on success, null on any failure. */
async function submitToSupabase() {
  if (!sb) {
    showError('The page did not load fully. Please refresh and try again.');
    return null;
  }

  /* 1. Verify auth session */
  const { data: { user }, error: authErr } = await sb.auth.getUser();
  if (authErr || !user) {
    location.href = '/signin.html?redirect=' + encodeURIComponent(location.pathname + location.search);
    return null;
  }

  /* 2. Resolve the child record */
  const child = await resolveChild(user.id);
  if (!child) {
    showError('We could not find your child’s record on this account.\n' +
              'Please contact SciSpark support and do not close this page.');
    return null;
  }

  /* 3. Insert attempt row (no score — human marking only) */
  const timeSpent = Math.max(0, Math.round((Date.now() - startedAtMs) / 1000));
  const nowIso    = new Date().toISOString();
  const { data: attempt, error: attemptErr } = await sb
    .from('assessment_attempts')
    .insert({
      student_id:            user.id,
      children_id:           child.id,
      assessment_code:       ASSESSMENT_CODE,
      year_group:            child.year_group || 'MIXED',
      language:              'EN',
      status:                'submitted',
      total_questions:       TOTAL_QUESTIONS,
      total_marks:           TOTAL_MARKS,
      started_at:            new Date(startedAtMs).toISOString(),
      submitted_at:          nowIso,
      time_spent_seconds:    timeSpent,
      teacher_review_status: 'pending',
      trigger_source:        'intake_after_first_lesson'
    })
    .select()
    .single();

  if (attemptErr) {
    console.error('[SciSpark Intake] attempt insert failed:', attemptErr);
    showError('Please try again. If it keeps failing, contact SciSpark support.');
    return null;
  }

  /* 4. Insert answer rows */
  const rows = collectAnswerRows(attempt.id);
  const { error: ansErr } = await sb.from('assessment_answers').insert(rows);
  if (ansErr) {
    console.error('[SciSpark Intake] answers insert failed:', ansErr);
    showError('Your check was saved (ID: ' + attempt.id + ') but the answers ' +
              'could not be stored. Please contact SciSpark and quote this ID.');
    return null;
  }
  return attempt.id;
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
function closeModal() {
  document.getElementById('modal-overlay')?.classList.remove('open');
}

/* ── Success ────────────────────────────────────────────────────── */
function showSuccess(attemptId) {
  clearDraft();
  const main   = document.getElementById('spc-main');
  const bar    = document.getElementById('spc-submitbar');
  const screen = document.getElementById('spc-success');
  if (main)   main.style.display = 'none';
  if (bar)    bar.style.display = 'none';
  if (screen) {
    screen.style.display = 'flex';
    const idEl = document.getElementById('spc-success-id');
    if (idEl) idEl.textContent = attemptId;
  }
  window.scrollTo(0, 0);
}

/* ── Confirm submit ─────────────────────────────────────────────── */
async function confirmSubmit() {
  if (isSubmitting) return;
  isSubmitting = true;
  const btn = document.getElementById('modal-confirm');
  if (btn) { btn.disabled = true; btn.textContent = 'Saving…'; }

  let attemptId = null;
  try { attemptId = await submitToSupabase(); }
  catch (e) { console.error(e); showError('Something went wrong. Please try again.'); }

  if (attemptId) {
    closeModal();
    showSuccess(attemptId);
  } else {
    isSubmitting = false;
    if (btn) { btn.disabled = false; btn.textContent = 'Yes, submit my answers'; }
  }
}

/* ── Init ───────────────────────────────────────────────────────── */
function init() {
  startedAtMs = Date.now();
  restoreDraft();
  updateProgress();

  QIDS.forEach(function (qid) {
    const el = fieldEl(qid);
    if (el) el.addEventListener('input', function () { updateProgress(); });
  });
  setInterval(saveDraft, AUTOSAVE_INTERVAL);
  window.addEventListener('beforeunload', saveDraft);

  document.getElementById('spc-submit-btn')?.addEventListener('click', openModal);
  document.getElementById('modal-cancel')?.addEventListener('click', closeModal);
  document.getElementById('modal-confirm')?.addEventListener('click', confirmSubmit);
  document.getElementById('modal-overlay')?.addEventListener('click', function (e) {
    if (e.target === e.currentTarget) closeModal();
  });
  console.log('[SciSpark Intake] ready — ' + QIDS.length + ' questions.');
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else { init(); }
