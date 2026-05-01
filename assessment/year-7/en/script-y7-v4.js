/**
 * SciSpark Year 7 Entry Assessment
 * script-y7-v4.js - timer, progress, payload builder, Supabase submission.
 *
 * Architecture (aligned to LMB v2 / 2026-05-01):
 *   32 questions / 61 fields / 60 marks / 45 minutes
 *   Part A: 10 x 1m  (10 fields)
 *   Part B: 15 x 1m  (15 fields)
 *   Part C: 3 structured questions x 5m  (17 fields)
 *   Part D: 4 structured questions x 5m  (19 fields)
 *
 * Field naming: HTML name attribute = <field_id>_answer
 *               HTML id attribute   = input_<field_id>_answer
 */

'use strict';

const TOTAL_MARKS     = 60;
const TOTAL_QUESTIONS = 32;
const TIMER_SECONDS   = 45 * 60;
const ASSESSMENT_CODE = 'Y7_ENTRY_EN_V4';
const YEAR_GROUP      = 'Year 7';
const LANGUAGE        = 'EN';
const AUTOSAVE_KEY    = 'scispark_y7_v4_draft';
const AUTOSAVE_INTERVAL_MS = 15000;

const SUPABASE_URL      = 'https://fiffuaoibxeggwxcfvfh.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_OOrhuk8oqIbNLg3Wxo6fzQ_7z4sloBJ';

let supabaseClient = null;
if (window.supabase) {
  supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}

/* ------------------------------------------------------------------
   QUESTION REGISTRY (32 parent questions -> 61 contract fields)
------------------------------------------------------------------- */
const QUESTION_FIELDS = {
  // Part A — 10 vocabulary MCQ
  Y7_QA1:  ['Y7_QA1'],
  Y7_QA2:  ['Y7_QA2'],
  Y7_QA3:  ['Y7_QA3'],
  Y7_QA4:  ['Y7_QA4'],
  Y7_QA5:  ['Y7_QA5'],
  Y7_QA6:  ['Y7_QA6'],
  Y7_QA7:  ['Y7_QA7'],
  Y7_QA8:  ['Y7_QA8'],
  Y7_QA9:  ['Y7_QA9'],
  Y7_QA10: ['Y7_QA10'],
  // Part B — 15 core concept MCQ
  Y7_QB1:  ['Y7_QB1'],
  Y7_QB2:  ['Y7_QB2'],
  Y7_QB3:  ['Y7_QB3'],
  Y7_QB4:  ['Y7_QB4'],
  Y7_QB5:  ['Y7_QB5'],
  Y7_QB6:  ['Y7_QB6'],
  Y7_QB7:  ['Y7_QB7'],
  Y7_QB8:  ['Y7_QB8'],
  Y7_QB9:  ['Y7_QB9'],
  Y7_QB10: ['Y7_QB10'],
  Y7_QB11: ['Y7_QB11'],
  Y7_QB12: ['Y7_QB12'],
  Y7_QB13: ['Y7_QB13'],
  Y7_QB14: ['Y7_QB14'],
  Y7_QB15: ['Y7_QB15'],
  // Part C — 3 structured (17 fields)
  Y7_QC1: ['Y7_QC1_a', 'Y7_QC1_b', 'Y7_QC1_c', 'Y7_QC1_d', 'Y7_QC1_f'],
  Y7_QC2: ['Y7_QC2_a_1', 'Y7_QC2_a_2', 'Y7_QC2_b_risk', 'Y7_QC2_b_reduce',
           'Y7_QC2_c_W', 'Y7_QC2_c_A'],
  Y7_QC3: ['Y7_QC3_a_mass', 'Y7_QC3_a_weight', 'Y7_QC3_b', 'Y7_QC3_c', 'Y7_QC3_d'],
  // Part D — 4 structured (19 fields)
  Y7_QD1: ['Y7_QD1_a', 'Y7_QD1_b', 'Y7_QD1_c', 'Y7_QD1_d', 'Y7_QD1_e'],
  Y7_QD2: ['Y7_QD2_a', 'Y7_QD2_b', 'Y7_QD2_c', 'Y7_QD2_d', 'Y7_QD2_e'],
  Y7_QD3: ['Y7_QD3_a_1', 'Y7_QD3_a_2', 'Y7_QD3_b', 'Y7_QD3_c', 'Y7_QD3_d'],
  Y7_QD4: ['Y7_QD4_a_gravity', 'Y7_QD4_a_lift', 'Y7_QD4_a_wind',
           'Y7_QD4_b', 'Y7_QD4_c', 'Y7_QD4_d'],
};

/* ------------------------------------------------------------------
   STATE
------------------------------------------------------------------- */
let timerRemaining    = TIMER_SECONDS;
let timerInterval     = null;
let answeredQuestions = new Set();
let isSubmitting      = false;

/* ------------------------------------------------------------------
   TIMER
------------------------------------------------------------------- */
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

/* ------------------------------------------------------------------
   FIELD VALUE READERS
------------------------------------------------------------------- */
function readFieldValue(fieldId) {
  const inputName = `${fieldId}_answer`;
  const radios = document.querySelectorAll(`input[type="radio"][name="${inputName}"]`);
  if (radios.length > 0) {
    for (const r of radios) {
      if (r.checked) return r.value;
    }
    return null;
  }
  const checkbox = document.querySelector(`input[type="checkbox"][name="${inputName}"]`);
  if (checkbox) {
    return checkbox.checked ? 'true' : null;
  }
  const el = document.getElementById(`input_${inputName}`);
  if (!el) return null;
  const v = (el.value || '').trim();
  return v.length > 0 ? v : null;
}

function getAnsweredQuestions() {
  const answered = new Set();
  for (const [qid, fields] of Object.entries(QUESTION_FIELDS)) {
    for (const f of fields) {
      if (readFieldValue(f) !== null) {
        answered.add(qid);
        break;
      }
    }
  }
  return answered;
}

function updateProgress() {
  answeredQuestions = getAnsweredQuestions();
  const count = answeredQuestions.size;
  const pct   = (count / TOTAL_QUESTIONS) * 100;

  const answeredCount  = document.getElementById('answered-count');
  const progressFill   = document.getElementById('progress-fill');
  const fpText         = document.getElementById('fp-text');
  const fpFill         = document.getElementById('fp-fill');
  const submitAnswered = document.getElementById('submit-answered');

  if (answeredCount)  answeredCount.textContent  = count;
  if (progressFill)   progressFill.style.width   = `${pct}%`;
  if (fpText)         fpText.textContent         = `${count} / ${TOTAL_QUESTIONS} answered`;
  if (fpFill)         fpFill.style.width         = `${pct}%`;
  if (submitAnswered) submitAnswered.textContent = `${count} of ${TOTAL_QUESTIONS}`;

  document.querySelectorAll('.question-block').forEach(block => {
    const qKey = block.getAttribute('data-q-key');
    if (qKey) block.classList.toggle('answered', answeredQuestions.has(qKey));
  });
}

/* ------------------------------------------------------------------
   PAYLOAD BUILDER
------------------------------------------------------------------- */
function buildAnswerRows() {
  const rows = [];
  for (const [, fields] of Object.entries(QUESTION_FIELDS)) {
    for (const f of fields) {
      const v = readFieldValue(f);
      if (v === null) continue;
      rows.push({
        question_number: f,
        field_name:      `${f}_answer`,
        answer_value:    String(v)
      });
    }
  }
  return rows;
}

function buildPayload() {
  const timestamp = new Date().toISOString();
  return {
    meta: {
      assessment_code:        ASSESSMENT_CODE,
      year_group:             YEAR_GROUP,
      language:               LANGUAGE,
      submitted_at:           timestamp,
      time_remaining_seconds: timerRemaining,
      time_spent_seconds:     TIMER_SECONDS - timerRemaining,
      answered_count:         answeredQuestions.size,
      total_questions:        TOTAL_QUESTIONS,
      total_marks:            TOTAL_MARKS
    },
    answers: buildAnswerRows()
  };
}

/* ------------------------------------------------------------------
   SUPABASE SUBMISSION
------------------------------------------------------------------- */
function getStudentIdFromUrl() {
  const params = new URLSearchParams(window.location.search);
  return params.get('student_id') || params.get('studentId');
}

async function submitToSupabase(payload) {
  if (!supabaseClient) {
    throw new Error('Supabase library not loaded.');
  }

  const studentId = getStudentIdFromUrl();
  if (!studentId) {
    throw new Error('Missing student_id in URL. The assessment page must be opened from signup-complete redirect.');
  }

  const { data: sessionData, error: sessionError } = await supabaseClient.auth.getSession();
  if (sessionError) throw sessionError;
  if (!sessionData?.session) {
    throw new Error('No active login session. Please sign in again before submitting.');
  }

  const { data: attempt, error: attemptError } = await supabaseClient
    .from('assessment_attempts')
    .insert({
      student_id:            studentId,
      year_group:            payload.meta.year_group,
      language:              payload.meta.language,
      assessment_code:       payload.meta.assessment_code,
      status:                'submitted',
      total_questions:       payload.meta.total_questions,
      total_marks:           payload.meta.total_marks,
      submitted_at:          payload.meta.submitted_at,
      time_spent_seconds:    payload.meta.time_spent_seconds,
      teacher_review_status: 'pending',
      assessment_round:      1,
      trigger_source:        'signup'
    })
    .select('id')
    .single();
  if (attemptError) throw attemptError;

  const answerRows = payload.answers.map(row => ({
    attempt_id:      attempt.id,
    question_number: row.question_number,
    field_name:      row.field_name,
    answer_value:    row.answer_value
  }));

  if (answerRows.length > 0) {
    const { error: answersError } = await supabaseClient
      .from('assessment_answers')
      .insert(answerRows);
    if (answersError) throw answersError;
  }

  return attempt.id;
}

/* ------------------------------------------------------------------
   AUTOSAVE
------------------------------------------------------------------- */
function autosave() {
  try {
    sessionStorage.setItem(AUTOSAVE_KEY, JSON.stringify(buildPayload()));
  } catch (e) { /* ignore quota errors */ }
}

/* ------------------------------------------------------------------
   INPUT VISUAL SYNC
------------------------------------------------------------------- */
function syncInputStyles(input) {
  const label = input.closest('label');
  if (!label) return;
  if (input.type === 'checkbox') {
    label.classList.toggle('checked', input.checked);
  } else if (input.type === 'radio' && input.checked) {
    document.querySelectorAll(`input[name="${input.name}"]`).forEach(radio => {
      const lbl = radio.closest('label');
      if (lbl) lbl.classList.remove('checked');
    });
    label.classList.add('checked');
  }
}

/* ------------------------------------------------------------------
   SUBMISSION FLOW
------------------------------------------------------------------- */
function openModal() {
  updateProgress();
  const count = answeredQuestions.size;
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

async function confirmSubmit() {
  if (isSubmitting) return;
  isSubmitting = true;

  const confirmBtn = document.getElementById('modal-confirm');
  if (confirmBtn) {
    confirmBtn.disabled = true;
    confirmBtn.textContent = 'Submitting...';
  }

  try {
    closeModal();
    clearInterval(timerInterval);
    const payload = buildPayload();
    const attemptId = await submitToSupabase(payload);
    console.log('[SciSpark Y7 v4] Submitted. Attempt ID:', attemptId);
    sessionStorage.removeItem(AUTOSAVE_KEY);
    document.getElementById('success-screen')?.classList.add('open');
  } catch (error) {
    console.error('[SciSpark Y7 v4] Submission failed:', error);
    alert(
      'Submission failed. Please do not close this page.\n\n' +
      'Reason: ' + (error.message || error)
    );
    startTimer();
    if (confirmBtn) {
      confirmBtn.disabled = false;
      confirmBtn.textContent = 'Confirm & Submit';
    }
    isSubmitting = false;
  }
}

async function autoSubmit() {
  if (isSubmitting) return;
  isSubmitting = true;
  try {
    const payload = buildPayload();
    const attemptId = await submitToSupabase(payload);
    console.log('[SciSpark Y7 v4] Auto-submitted. Attempt ID:', attemptId);
    sessionStorage.removeItem(AUTOSAVE_KEY);
    document.getElementById('success-screen')?.classList.add('open');
  } catch (error) {
    console.error('[SciSpark Y7 v4] Auto-submit failed:', error);
    alert(
      'Time is up, but automatic submission failed. Please call the teacher.\n\n' +
      'Reason: ' + (error.message || error)
    );
  }
}

/* ------------------------------------------------------------------
   INIT
------------------------------------------------------------------- */
document.addEventListener('DOMContentLoaded', () => {
  updateProgress();
  startTimer();
  setInterval(autosave, AUTOSAVE_INTERVAL_MS);

  document.querySelectorAll('input[type="radio"]:checked, input[type="checkbox"]:checked')
    .forEach(syncInputStyles);

  document.addEventListener('change', (e) => {
    if (e.target.matches('input, select, textarea')) {
      syncInputStyles(e.target);
      updateProgress();
      autosave();
    }
  });

  document.addEventListener('input', (e) => {
    if (e.target.matches('input[type="text"], input[type="number"], textarea')) {
      updateProgress();
    }
  });

  document.getElementById('submit-btn')?.addEventListener('click', openModal);
  document.getElementById('submit-btn-sm')?.addEventListener('click', openModal);
  document.getElementById('modal-cancel')?.addEventListener('click', closeModal);
  document.getElementById('modal-confirm')?.addEventListener('click', confirmSubmit);

  document.getElementById('modal-overlay')?.addEventListener('click', (e) => {
    if (e.target === document.getElementById('modal-overlay')) closeModal();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeModal();
  });

  window.addEventListener('beforeunload', (e) => {
    if (answeredQuestions.size > 0 && !isSubmitting) {
      e.preventDefault();
      e.returnValue = '';
    }
  });
});
