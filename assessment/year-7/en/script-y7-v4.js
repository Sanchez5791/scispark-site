'use strict';

/* ── Constants ─────────────────────────────────────────────────── */
const SUPABASE_URL      = 'https://fiffuaoibxeggwxcfvfh.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_OOrhuk8oqIbNLg3Wxo6fzQ_7z4sloBJ';
const ASSESSMENT_CODE   = 'Y7_ENTRY_EN';
const TIMER_SECONDS     = 45 * 60;
const TOTAL_QUESTIONS   = 32;
const AUTOSAVE_KEY      = 'scispark_y7_draft';
const AUTOSAVE_INTERVAL = 15000;

/* ── Supabase client ────────────────────────────────────────────── */
let sb = null;
if (window.supabase) {
  sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}

/* ── State ──────────────────────────────────────────────────────── */
let timerRemaining = TIMER_SECONDS;
let timerInterval  = null;
let isSubmitting   = false;

/* ── Timer ──────────────────────────────────────────────────────── */
function formatTime(seconds) {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

function tickTimer() {
  if (timerRemaining <= 0) {
    clearInterval(timerInterval);
    const el = document.getElementById('timer');
    if (el) el.textContent = '00:00';
    autoSubmit();
    return;
  }
  timerRemaining--;
  const el = document.getElementById('timer');
  if (el) {
    el.textContent = formatTime(timerRemaining);
    el.classList.toggle('urgent', timerRemaining <= 300);
  }
}

function startTimer() {
  timerInterval = setInterval(tickTimer, 1000);
}

/* ── Parent question grouping ───────────────────────────────────── */
/* Maps any sub-field code (Y7_QC1_a, Y7_QD4_a_gravity) to its
   parent question code (Y7_QC1, Y7_QD4). Used for progress count. */
function parentCode(code) {
  const m = code.match(/^(Y7_Q[A-D]\d+)/);
  return m ? m[1] : code;
}

/* ── Field value reader ─────────────────────────────────────────── */
/* Reads the current answer value for a given data-question-id code.
   Returns null (not '') when the field is blank or unchecked —
   null rows are still inserted per DECISION 3. */
function readValue(code) {
  // Radio group: all options share data-question-id; find the checked one
  const radios = document.querySelectorAll(
    `input[type="radio"][data-question-id="${code}"]`
  );
  if (radios.length > 0) {
    const checked = Array.from(radios).find(r => r.checked);
    return checked ? checked.value : null;
  }

  // Checkbox
  const cb = document.querySelector(
    `input[type="checkbox"][data-question-id="${code}"]`
  );
  if (cb) return cb.checked ? 'true' : null;

  // Text input / textarea / select (exclude radio/checkbox to avoid double-match)
  const el = document.querySelector(
    `[data-question-id="${code}"]:not([type="radio"]):not([type="checkbox"])`
  );
  if (el) {
    const v = (el.value || '').trim();
    return v.length > 0 ? v : null;
  }

  return null;
}

/* ── Collect all unique question codes from the live DOM ────────── */
function getAllQuestionCodes() {
  const seen = new Set();
  document.querySelectorAll('[data-question-id]').forEach(el => {
    seen.add(el.getAttribute('data-question-id'));
  });
  return [...seen];
}

/* ── Progress counter ───────────────────────────────────────────── */
function updateProgress() {
  const codes = getAllQuestionCodes();

  // Build set of unique parent questions
  const parents = new Set(codes.map(parentCode));

  // A parent question is "answered" if any of its sub-codes has a non-null value
  let answeredCount = 0;
  for (const p of parents) {
    const subCodes = codes.filter(c => parentCode(c) === p);
    if (subCodes.some(c => readValue(c) !== null)) answeredCount++;
  }

  const el = document.getElementById('submit-answered');
  if (el) el.textContent = `${answeredCount} of ${TOTAL_QUESTIONS}`;

  return answeredCount;
}

/* ── Build answer rows for DB insert ────────────────────────────── */
/* One row per unique data-question-id (~62 rows for a full Y7 submission).
   question_number = parent question (e.g. "Y7_QC3")
   field_name      = specific sub-field (e.g. "Y7_QC3_a_mass")
   For Part A/B with no sub-fields these two values are identical.
   answer_value may be null (blank field) per DECISION 3. */
function collectAnswerRows(attemptId) {
  return getAllQuestionCodes().map(code => ({
    attempt_id:      attemptId,
    question_number: parentCode(code),
    field_name:      code,
    answer_value:    readValue(code)
  }));
}

/* ── Error display ──────────────────────────────────────────────── */
function showError(msg) {
  alert('Submission error:\n\n' + msg);
}

/* ── Supabase submit — F&F auth path ────────────────────────────── */
/* Returns attempt UUID on success, null on any failure.
   Caller must NOT show success screen when null is returned. */
async function submitToSupabase() {
  if (!sb) {
    showError('Supabase library failed to load. Please refresh the page and try again.');
    return null;
  }

  /* 1. Verify auth session */
  const { data: { user }, error: authErr } = await sb.auth.getUser();
  if (authErr || !user) {
    location.href = '/signin.html';
    return null;
  }

  /* 2. Look up the child record for this parent account */
  const { data: child, error: cErr } = await sb
    .from('children')
    .select('id, full_name')
    .eq('parent_id', user.id)
    .eq('year_group', 'Y7')
    .maybeSingle();

  if (cErr || !child) {
    console.error('[SciSpark Y7] children lookup failed:', cErr);
    showError(
      'No Year 7 record found for this account.\n' +
      'Please contact SciSpark support and do not close this page.'
    );
    return null;
  }

  /* 3. Insert attempt row */
  const { data: attempt, error: attemptErr } = await sb
    .from('assessment_attempts')
    .insert({
      student_id:            user.id,
      children_id:           child.id,
      assessment_code:       ASSESSMENT_CODE,
      year_group:            'Y7',
      language:              'EN',
      status:                'submitted',
      teacher_review_status: 'pending'
    })
    .select()
    .single();

  if (attemptErr) {
    console.error('[SciSpark Y7] assessment_attempts insert failed:', attemptErr);
    showError(
      'Could not save your assessment attempt.\n' +
      'Please try again. If the problem persists, contact SciSpark support.'
    );
    return null;
  }

  /* 4. Insert all answer rows (one per data-question-id field) */
  const rows = collectAnswerRows(attempt.id);
  const { error: ansErr } = await sb
    .from('assessment_answers')
    .insert(rows);

  if (ansErr) {
    console.error('[SciSpark Y7] assessment_answers insert failed:', ansErr);
    showError(
      'Your attempt was saved (ID: ' + attempt.id + ') but the individual ' +
      'answers could not be stored. Please contact SciSpark immediately and ' +
      'quote this ID. Do not close this page.'
    );
    return null;
  }

  return attempt.id;
}

/* ── Modal ──────────────────────────────────────────────────────── */
function openModal() {
  const count = updateProgress();
  const modalAnswered   = document.getElementById('modal-answered');
  const modalUnanswered = document.getElementById('modal-unanswered');
  const modalTime       = document.getElementById('modal-time');
  const modalOverlay    = document.getElementById('modal-overlay');
  if (modalAnswered)   modalAnswered.textContent   = count;
  if (modalUnanswered) modalUnanswered.textContent = TOTAL_QUESTIONS - count;
  if (modalTime)       modalTime.textContent       = formatTime(timerRemaining);
  if (modalOverlay)    modalOverlay.classList.add('open');
}

function closeModal() {
  document.getElementById('modal-overlay')?.classList.remove('open');
}

/* ── Confirm submit (student-initiated) ─────────────────────────── */
async function confirmSubmit() {
  if (isSubmitting) return;
  isSubmitting = true;

  const confirmBtn = document.getElementById('modal-confirm');
  if (confirmBtn) {
    confirmBtn.disabled    = true;
    confirmBtn.textContent = 'Submitting…';
  }

  closeModal();
  clearInterval(timerInterval);

  let attemptId = null;
  try {
    attemptId = await submitToSupabase();
  } catch (err) {
    console.error('[SciSpark Y7] Unexpected submit error:', err);
    showError(
      'An unexpected error occurred. Please do not close this page and ' +
      'contact SciSpark support immediately.'
    );
  }

  if (attemptId) {
    console.log('[SciSpark Y7] Submitted successfully. Attempt ID:', attemptId);
    sessionStorage.removeItem(AUTOSAVE_KEY);
    document.getElementById('success-screen')?.classList.add('open');
  } else {
    // Error was shown by submitToSupabase or catch above — restore UI
    startTimer();
    if (confirmBtn) {
      confirmBtn.disabled    = false;
      confirmBtn.textContent = 'Confirm & Submit →';
    }
    isSubmitting = false;
  }
}

/* ── Auto submit (timer expiry) ─────────────────────────────────── */
async function autoSubmit() {
  if (isSubmitting) return;
  isSubmitting = true;

  let attemptId = null;
  try {
    attemptId = await submitToSupabase();
  } catch (err) {
    console.error('[SciSpark Y7] Auto-submit unexpected error:', err);
  }

  if (attemptId) {
    console.log('[SciSpark Y7] Auto-submitted. Attempt ID:', attemptId);
    sessionStorage.removeItem(AUTOSAVE_KEY);
    document.getElementById('success-screen')?.classList.add('open');
  } else {
    showError(
      'Time is up, but automatic submission failed.\n' +
      'Please call the teacher or contact SciSpark support immediately.'
    );
    isSubmitting = false;
  }
}

/* ── Input visual sync ──────────────────────────────────────────── */
function syncInputStyles(input) {
  const label = input.closest('label');
  if (!label) return;
  if (input.type === 'checkbox') {
    label.classList.toggle('checked', input.checked);
  } else if (input.type === 'radio' && input.checked) {
    document.querySelectorAll(`input[name="${input.name}"]`).forEach(r => {
      r.closest('label')?.classList.remove('checked');
    });
    label.classList.add('checked');
  }
}

/* ── Autosave (sessionStorage) ──────────────────────────────────── */
function autosave() {
  try {
    const snapshot = {};
    getAllQuestionCodes().forEach(c => { snapshot[c] = readValue(c); });
    sessionStorage.setItem(AUTOSAVE_KEY, JSON.stringify(snapshot));
  } catch (e) { /* ignore quota errors */ }
}

/* ── Init ───────────────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  updateProgress();
  startTimer();
  setInterval(autosave, AUTOSAVE_INTERVAL);

  // Sync any pre-checked inputs on load
  document.querySelectorAll('input[type="radio"]:checked, input[type="checkbox"]:checked')
    .forEach(syncInputStyles);

  // Live progress update on every answer change
  document.addEventListener('change', e => {
    if (e.target.matches('input, select, textarea')) {
      syncInputStyles(e.target);
      updateProgress();
    }
  });
  document.addEventListener('input', e => {
    if (e.target.matches('input[type="text"], input[type="number"], textarea')) {
      updateProgress();
    }
  });

  // Submit flow
  document.getElementById('submit-btn')?.addEventListener('click', openModal);
  document.getElementById('submit-btn-sm')?.addEventListener('click', openModal);
  document.getElementById('modal-confirm')?.addEventListener('click', confirmSubmit);
  document.getElementById('modal-cancel')?.addEventListener('click', closeModal);

  // Close modal on overlay click
  document.getElementById('modal-overlay')?.addEventListener('click', e => {
    if (e.target === e.currentTarget) closeModal();
  });
});
