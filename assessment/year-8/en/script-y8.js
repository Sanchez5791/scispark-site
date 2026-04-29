/**
 * SciSpark Year 8 Entry Assessment
 * script-y8.js v2 — UPDATED for assessment-y8_v2.html field names
 *
 * Changes from v1:
 * - Part A/B: mixed naming fixed (Y8_QA2_answer, Y8_QB1_answer etc now handled)
 * - Part C: Q21 = parachutes, Q22 = evaporation, Q23 = electricity (Y8_QC prefix)
 * - Part D: Q24-Q27 use Y8_QD prefix
 * - BACKEND_ENABLED = false (flip to true after live test passes)
 */

'use strict';

/* ━━━━━━━━━━━━━━━━━━━━━━━━━ CONFIG ━━━━━━━━━━━━━━━━━━━━━━━━━ */
const TOTAL_MARKS     = 60;
const TOTAL_QUESTIONS = 27;
const TIMER_SECONDS   = 45 * 60;
const AUTOSAVE_KEY    = 'scispark_y8_draft';
const AUTOSAVE_INTERVAL_MS = 15000;

/* Flip to true ONLY after Supabase Live Submission Test passes */
const BACKEND_ENABLED = true;

const SUPABASE_URL      = 'https://fiffuaoibxeggwxcfvfh.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_OOrhuk8oqIbNLg3Wxo6fzQ_7z4sloKJ';

let supabaseClient = null;
if (window.supabase) {
  supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━ STATE ━━━━━━━━━━━━━━━━━━━━━━━━━━ */
let timerRemaining    = TIMER_SECONDS;
let timerInterval     = null;
let answeredQuestions = new Set();
let isSubmitting      = false;

/* ━━━━━━━━━━━━━━━━━━━━━━━━ TIMER ━━━━━━━━━━━━━━━━━━━━━━━━━━ */
function formatTime(seconds) {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

function tickTimer() {
  if (timerRemaining <= 0) {
    clearInterval(timerInterval);
    document.getElementById('timer').textContent = '00:00';
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

/* ━━━━━━━━━━━━━━━━━━━━━ PROGRESS TRACKING ━━━━━━━━━━━━━━━━━━━ */
function getAnsweredQuestions() {
  const answered = new Set();

  /* ── Part A: Q1–Q5 ──
     Q1,Q3,Q4,Q5 use name="qX" directly
     Q2 uses name="Y8_QA2_answer" (unchanged question) */
  const partA = [
    { q: 'q1', name: 'q1' },
    { q: 'q2', name: 'Y8_QA2_answer' },
    { q: 'q3', name: 'q3' },
    { q: 'q4', name: 'q4' },
    { q: 'q5', name: 'q5' },
  ];
  partA.forEach(({ q, name }) => {
    if (document.querySelector(`input[name="${name}"]:checked`)) answered.add(q);
  });

  /* ── Part B: Q6–Q20 ──
     Unchanged questions kept Y8_QBx_answer names; replaced questions use qX */
  const partB = [
    { q: 'q6',  name: 'Y8_QB1_answer' },  // Body Systems (unchanged)
    { q: 'q7',  name: 'Y8_QB2_answer' },  // Body Systems (unchanged)
    { q: 'q8',  name: 'Y8_QB3_answer' },  // Habitats (unchanged)
    { q: 'q9',  name: 'q9' },             // Food Chain (replaced)
    { q: 'q10', name: 'Y8_QB5_answer' },  // Dissolving (unchanged)
    { q: 'q11', name: 'q11' },            // Elements/Compounds/Mixtures (replaced)
    { q: 'q12', name: 'q12' },            // Elements (replaced)
    { q: 'q13', name: 'q13' },            // Light (replaced)
    { q: 'q14', name: 'Y8_QB9_answer' },  // Magnetism (unchanged)
    { q: 'q15', name: 'q15' },            // Compounds (replaced)
    { q: 'q16', name: 'q16' },            // Digestive System (replaced)
    { q: 'q17', name: 'Y8_QB12_answer' }, // Forces (unchanged)
    { q: 'q18', name: 'q18' },            // Chemical Reactions (replaced)
    { q: 'q19', name: 'Y8_QB14_answer' }, // Solubility (unchanged)
    { q: 'q20', name: 'q20' },            // Heart Rate (replaced)
  ];
  partB.forEach(({ q, name }) => {
    if (document.querySelector(`input[name="${name}"]:checked`)) answered.add(q);
  });

  /* ── Part C: Q21 — Parachutes ──
     Table text inputs + radio (yes/no) + text reason + radio direction */
  const q21fields = [
    'Y8_QC1_a_100','Y8_QC1_a_400','Y8_QC1_a_900','Y8_QC1_a_1600',
    'Y8_QC1_b_reason'
  ];
  const q21radios = ['Y8_QC1_b_yesno','Y8_QC1_c_answer'];
  if (
    q21fields.some(id => document.getElementById(id)?.value?.trim()) ||
    q21radios.some(name => document.querySelector(`input[name="${name}"]:checked`))
  ) answered.add('q21');

  /* ── Part C: Q22 — Gabriella Evaporation ── */
  const q22radios = ['Y8_QC2_a_answer','Y8_QC2_b_answer'];
  const q22checkboxAnswered = document.querySelectorAll('input[name="Y8_QC2_c_answer"]:checked').length > 0;
  if (
    q22radios.some(name => document.querySelector(`input[name="${name}"]:checked`)) ||
    q22checkboxAnswered
  ) answered.add('q22');

  /* ── Part C: Q23 — Maria Electricity ── */
  const q23radios = ['Y8_QC3_a_answer'];
  const q23checkboxAnswered = document.querySelectorAll('input[name="Y8_QC3_b_answer"]:checked').length > 0;
  const q23texts = ['Y8_QC3_c_answer','Y8_QC3_d_answer'];
  if (
    q23radios.some(name => document.querySelector(`input[name="${name}"]:checked`)) ||
    q23checkboxAnswered ||
    q23texts.some(id => document.getElementById(id)?.value?.trim())
  ) answered.add('q23');

  /* ── Part D: Q24 — Reversible/Irreversible ── */
  const q24radios = [
    'Y8_QD1_a_baking','Y8_QD1_a_condense','Y8_QD1_a_boil','Y8_QD1_a_burn',
    'Y8_QD1_a_digest','Y8_QD1_a_rust','Y8_QD1_a_filter','Y8_QD1_a_dissolve'
  ];
  const q24bVal = document.getElementById('Y8_QD1_b_answer')?.value?.trim();
  if (
    q24radios.some(name => document.querySelector(`input[name="${name}"]:checked`)) ||
    q24bVal
  ) answered.add('q24');

  /* ── Part D: Q25 — Food Chain ── */
  const q25radio = document.querySelector('input[name="Y8_QD2_a_answer"]:checked');
  const q25selects = ['Y8_QD2_b_pos1','Y8_QD2_b_pos2','Y8_QD2_b_pos3','Y8_QD2_b_pos4',
                      'Y8_QD2_e_mice','Y8_QD2_e_snake','Y8_QD2_e_eagle'];
  const q25cVal = document.getElementById('Y8_QD2_c_answer')?.value?.trim();
  const q25dRadio = document.querySelector('input[name="Y8_QD2_d_answer"]:checked');
  if (
    q25radio || q25cVal || q25dRadio ||
    q25selects.some(id => document.getElementById(id)?.value)
  ) answered.add('q25');

  /* ── Part D: Q26 — Ammonium Chloride ── */
  const q26selects = ['Y8_QD3_a_stir','Y8_QD3_a_water','Y8_QD3_a_temp','Y8_QD3_a_chloride'];
  const q26tableFields = [
    'Y8_QD3_b_heading','Y8_QD3_b_row1','Y8_QD3_b_row2',
    'Y8_QD3_b_row3','Y8_QD3_b_row4','Y8_QD3_b_row5'
  ];
  if (
    q26selects.some(id => document.getElementById(id)?.value) ||
    q26tableFields.some(id => document.getElementById(id)?.value?.trim())
  ) answered.add('q26');

  /* ── Part D: Q27 — Separating Mixture ── */
  const q27fields = [
    'Y8_QD4_a_answer','Y8_QD4_b_answer','Y8_QD4_c_answer',
    'Y8_QD4_d_answer','Y8_QD4_e_answer'
  ];
  if (q27fields.some(id => document.getElementById(id)?.value?.trim())) answered.add('q27');

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

  if (answeredCount)  answeredCount.textContent = count;
  if (progressFill)   progressFill.style.width = `${pct}%`;
  if (fpText)         fpText.textContent = `${count} / ${TOTAL_QUESTIONS} answered`;
  if (fpFill)         fpFill.style.width = `${pct}%`;
  if (submitAnswered) submitAnswered.textContent = `${count} of ${TOTAL_QUESTIONS}`;

  document.querySelectorAll('.question-block').forEach(block => {
    const qid = block.id.replace('qblock-', 'q');
    block.classList.toggle('answered', answeredQuestions.has(qid));
  });
}

/* ━━━━━━━━━━━━━━━━━━━━━━ PAYLOAD BUILDER ━━━━━━━━━━━━━━━━━━━ */
function buildPayload() {
  const timestamp = new Date().toISOString();

  const getRadio = (name) => {
    const el = document.querySelector(`input[name="${name}"]:checked`);
    return el ? el.value : null;
  };

  const getCheckboxValues = (name) =>
    [...document.querySelectorAll(`input[name="${name}"]:checked`)].map(el => el.value);

  const getVal = (id) => document.getElementById(id)?.value?.trim() || null;

  return {
    meta: {
      assessment:            'Y8-Entry',
      assessment_code:       'Y8_ENTRY_ASSESSMENT',
      year_group:            'Year 8',
      language:              document.documentElement.lang === 'zh' ? 'ZH' : 'EN',
      submitted_at:          timestamp,
      time_remaining_seconds: timerRemaining,
      time_spent_seconds:    TIMER_SECONDS - timerRemaining,
      total_questions:       TOTAL_QUESTIONS,
      total_marks:           TOTAL_MARKS,
      backend_enabled:       BACKEND_ENABLED
    },
    answers: {
      /* Part A */
      q1:  getRadio('q1'),
      q2:  getRadio('Y8_QA2_answer'),
      q3:  getRadio('q3'),
      q4:  getRadio('q4'),
      q5:  getRadio('q5'),
      /* Part B */
      q6:  getRadio('Y8_QB1_answer'),
      q7:  getRadio('Y8_QB2_answer'),
      q8:  getRadio('Y8_QB3_answer'),
      q9:  getRadio('q9'),
      q10: getRadio('Y8_QB5_answer'),
      q11: getRadio('q11'),
      q12: getRadio('q12'),
      q13: getRadio('q13'),
      q14: getRadio('Y8_QB9_answer'),
      q15: getRadio('q15'),
      q16: getRadio('q16'),
      q17: getRadio('Y8_QB12_answer'),
      q18: getRadio('q18'),
      q19: getRadio('Y8_QB14_answer'),
      q20: getRadio('q20'),
      /* Part C */
      q21: {
        avg_100:  getVal('Y8_QC1_a_100'),
        avg_400:  getVal('Y8_QC1_a_400'),
        avg_900:  getVal('Y8_QC1_a_900'),
        avg_1600: getVal('Y8_QC1_a_1600'),
        b_yesno:  getRadio('Y8_QC1_b_yesno'),
        b_reason: getVal('Y8_QC1_b_reason'),
        c_dir:    getRadio('Y8_QC1_c_answer')
      },
      q22: {
        a: getRadio('Y8_QC2_a_answer'),
        b: getRadio('Y8_QC2_b_answer'),
        c: getCheckboxValues('Y8_QC2_c_answer')
      },
      q23: {
        a: getRadio('Y8_QC3_a_answer'),
        b: getCheckboxValues('Y8_QC3_b_answer'),
        c: getVal('Y8_QC3_c_answer'),
        d: getVal('Y8_QC3_d_answer')
      },
      /* Part D */
      q24: {
        baking:   getRadio('Y8_QD1_a_baking'),
        condense: getRadio('Y8_QD1_a_condense'),
        boil:     getRadio('Y8_QD1_a_boil'),
        burn:     getRadio('Y8_QD1_a_burn'),
        digest:   getRadio('Y8_QD1_a_digest'),
        rust:     getRadio('Y8_QD1_a_rust'),
        filter:   getRadio('Y8_QD1_a_filter'),
        dissolve: getRadio('Y8_QD1_a_dissolve'),
        b:        getVal('Y8_QD1_b_answer')
      },
      q25: {
        a:     getRadio('Y8_QD2_a_answer'),
        pos1:  getVal('Y8_QD2_b_pos1'),
        pos2:  getVal('Y8_QD2_b_pos2'),
        pos3:  getVal('Y8_QD2_b_pos3'),
        pos4:  getVal('Y8_QD2_b_pos4'),
        c:     getVal('Y8_QD2_c_answer'),
        d:     getRadio('Y8_QD2_d_answer'),
        mice:  getVal('Y8_QD2_e_mice'),
        snake: getVal('Y8_QD2_e_snake'),
        eagle: getVal('Y8_QD2_e_eagle')
      },
      q26: {
        stir:     getVal('Y8_QD3_a_stir'),
        water:    getVal('Y8_QD3_a_water'),
        temp:     getVal('Y8_QD3_a_temp'),
        chloride: getVal('Y8_QD3_a_chloride'),
        heading:  getVal('Y8_QD3_b_heading'),
        row1:     getVal('Y8_QD3_b_row1'),
        row2:     getVal('Y8_QD3_b_row2'),
        row3:     getVal('Y8_QD3_b_row3'),
        row4:     getVal('Y8_QD3_b_row4'),
        row5:     getVal('Y8_QD3_b_row5')
      },
      q27: {
        a: getVal('Y8_QD4_a_answer'),
        b: getVal('Y8_QD4_b_answer'),
        c: getVal('Y8_QD4_c_answer'),
        d: getVal('Y8_QD4_d_answer'),
        e: getVal('Y8_QD4_e_answer')
      }
    }
  };
}

/* ━━━━━━━━━━━━━━━━━━━━ SUPABASE SUBMISSION ━━━━━━━━━━━━━━━━━ */
function getStudentIdFromUrl() {
  const params = new URLSearchParams(window.location.search);
  return params.get('student_id') || params.get('studentId');
}

function flattenAnswers(answers) {
  const rows = [];
  Object.entries(answers).forEach(([questionKey, value]) => {
    if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
      Object.entries(value).forEach(([fieldName, fieldValue]) => {
        rows.push({
          question_number: questionKey,
          field_name: fieldName,
          answer_value: Array.isArray(fieldValue)
            ? JSON.stringify(fieldValue)
            : (fieldValue == null ? null : String(fieldValue))
        });
      });
    } else {
      rows.push({
        question_number: questionKey,
        field_name: questionKey,
        answer_value: Array.isArray(value)
          ? JSON.stringify(value)
          : (value == null ? null : String(value))
      });
    }
  });
  return rows;
}

async function submitToSupabase(payload) {
  if (!BACKEND_ENABLED) {
    console.log('[SciSpark Y8] BACKEND_ENABLED = false — skipping live Supabase submit. Payload logged above.');
    return 'DRAFT_NO_BACKEND';
  }

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
      student_id:             studentId,
      year_group:             payload.meta.year_group,
      language:               payload.meta.language,
      assessment_code:        payload.meta.assessment_code,
      status:                 'submitted',
      total_questions:        payload.meta.total_questions,
      total_marks:            payload.meta.total_marks,
      submitted_at:           payload.meta.submitted_at,
      time_spent_seconds:     payload.meta.time_spent_seconds,
      teacher_review_status:  'pending'
    })
    .select('id')
    .single();

  if (attemptError) throw attemptError;

  const answerRows = flattenAnswers(payload.answers).map(row => ({
    attempt_id:      attempt.id,
    question_number: row.question_number,
    field_name:      row.field_name,
    answer_value:    row.answer_value
  }));

  const { error: answersError } = await supabaseClient
    .from('assessment_answers')
    .insert(answerRows);

  if (answersError) throw answersError;

  return attempt.id;
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━ AUTOSAVE ━━━━━━━━━━━━━━━━━━━━━━━━ */
function autosave() {
  try {
    sessionStorage.setItem(AUTOSAVE_KEY, JSON.stringify(buildPayload()));
  } catch (e) {}
}

/* ━━━━━━━━━━━━━━━━━━━━ INPUT VISUAL SYNC ━━━━━━━━━━━━━━━━━━━ */
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

/* ━━━━━━━━━━━━━━━━━━━━━━━ SUBMISSION ━━━━━━━━━━━━━━━━━━━━━━━ */
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
    console.log('[SciSpark Y8] Assessment payload:', JSON.stringify(payload, null, 2));

    const attemptId = await submitToSupabase(payload);
    console.log('[SciSpark Y8] Submitted. Attempt ID:', attemptId);

    sessionStorage.removeItem(AUTOSAVE_KEY);
    document.getElementById('success-screen')?.classList.add('open');

  } catch (error) {
    console.error('[SciSpark Y8] Submission failed:', error);
    alert(
      'Submission failed. Please do not close this page.\n\n' +
      'Reason: ' + (error.message || error)
    );
    startTimer();

    if (confirmBtn) {
      confirmBtn.disabled = false;
      confirmBtn.textContent = 'Confirm & Submit →';
    }
    isSubmitting = false;
  }
}

async function autoSubmit() {
  if (isSubmitting) return;
  isSubmitting = true;

  try {
    const payload = buildPayload();
    console.log('[SciSpark Y8] Auto-submit payload:', JSON.stringify(payload, null, 2));

    const attemptId = await submitToSupabase(payload);
    console.log('[SciSpark Y8] Auto-submitted. Attempt ID:', attemptId);

    sessionStorage.removeItem(AUTOSAVE_KEY);
    document.getElementById('success-screen')?.classList.add('open');

  } catch (error) {
    console.error('[SciSpark Y8] Auto-submit failed:', error);
    alert(
      'Auto-submission failed when the timer reached 00:00.\n\n' +
      'Reason: ' + (error.message || error) + '\n\n' +
      'Please contact your teacher.'
    );
    isSubmitting = false;
  }
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━ INIT ━━━━━━━━━━━━━━━━━━━━━━━━━━ */
function init() {
  startTimer();

  document.querySelectorAll('input, textarea, select').forEach(el => {
    el.addEventListener('change', () => {
      if (el.type === 'radio' || el.type === 'checkbox') syncInputStyles(el);
      updateProgress();
      autosave();
    });
    el.addEventListener('input', () => {
      updateProgress();
      autosave();
    });
  });

  document.getElementById('submit-btn')?.addEventListener('click', openModal);
  document.getElementById('submit-btn-sm')?.addEventListener('click', openModal);
  document.getElementById('modal-cancel')?.addEventListener('click', closeModal);
  document.getElementById('modal-confirm')?.addEventListener('click', confirmSubmit);

  setInterval(autosave, AUTOSAVE_INTERVAL_MS);
  updateProgress();

  console.log(`[SciSpark Y8 v2] Ready. BACKEND_ENABLED=${BACKEND_ENABLED}. ${TOTAL_QUESTIONS} questions, ${TOTAL_MARKS} marks, ${TIMER_SECONDS / 60} min.`);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
