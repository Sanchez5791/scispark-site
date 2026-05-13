/**
 * SciSpark Year 9 Entry Assessment — script-y9.js
 * v8 2026-05-13 — Y9_ENTRY_EN, 32 questions, 60 fields
 */

'use strict';

/* ─────────────────────────────────────────────────────────────
   CONFIG
───────────────────────────────────────────────────────────── */
const ASSESSMENT_CODE  = 'Y9_ENTRY_EN';
const TOTAL_MARKS      = 60;
const TOTAL_QUESTIONS  = 32;
const TIMER_SECONDS    = 45 * 60;
const AUTOSAVE_KEY     = 'scispark_y9_draft';
const AUTOSAVE_INTERVAL_MS = 15000;

const SUPABASE_URL = 'https://fiffuaoibxeggwxcfvfh.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZpZmZ1YW9pYnhlZ2d3eGNmdmZoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY5MzYwOTAsImV4cCI6MjA5MjUxMjA5MH0.AJO3RGNo33rFdQ0DCyHj4gpGryAxnDnHIpUy2Px9wck';

let supabaseClient = null;
if (window.supabase) {
  supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}

const FIELD_IDS = [
  'Y9_Q1_answer','Y9_Q2_answer','Y9_Q3_answer','Y9_Q4_answer',
  'Y9_Q5_answer','Y9_Q6_answer','Y9_Q7_answer','Y9_Q8_answer',
  'Y9_Q9_answer','Y9_Q10_answer',
  'Y9_Q11_answer','Y9_Q12_answer','Y9_Q13_answer','Y9_Q14_answer',
  'Y9_Q15_answer','Y9_Q16_answer','Y9_Q17_answer','Y9_Q18_answer',
  'Y9_Q19_answer','Y9_Q20_answer','Y9_Q21_answer','Y9_Q22_answer',
  'Y9_Q23_answer','Y9_Q24_answer','Y9_Q25_answer',
  'Y9_Q26a_current_unit','Y9_Q26b_axis_labels',
  'Y9_Q26b_plotted_points','Y9_Q26b_best_fit_line',
  'Y9_Q26c_relationship',
  'Y9_Q27a_temperature_changes','Y9_Q27b_reaction_types',
  'Y9_Q27c_mixture_releases_most_energy','Y9_Q27d_explanation',
  'Y9_Q27e_reliability',
  'Y9_Q28a_plan_place_measure_dent',
  'Y9_Q28a_plan_repeat_different_blocks_masses',
  'Y9_Q28b_measurements','Y9_Q28c_repeat_reason',
  'Y9_Q28d_results_table',
  'Y9_Q29a_prediction_no','Y9_Q29a_table_explanation',
  'Y9_Q29b_copper_lead_same','Y9_Q29c_acid_rain_vs_sea_water',
  'Y9_Q29d_safety_precaution',
  'Y9_Q30a_blank1_neutralise','Y9_Q30a_blank2_alkaline',
  'Y9_Q30a_blank3_salt','Y9_Q30b_i_decide_best_tablet',
  'Y9_Q30b_ii_control_variable',
  'Y9_Q31a_diffusion','Y9_Q31b_alveoli_function',
  'Y9_Q31c_adaptation','Y9_Q31c_explanation','Y9_Q31d_iron',
  'Y9_Q32a_i_weather_definition','Y9_Q32a_ii_graph_values',
  'Y9_Q32b_i_climate_evidence','Y9_Q32b_ii_climate_reason',
  'Y9_Q32c_accuracy_reason'
];

/* ─────────────────────────────────────────────────────────────
   STATE
───────────────────────────────────────────────────────────── */
let timerRemaining    = TIMER_SECONDS;
let timerInterval     = null;
let answeredQuestions = new Set();
let isSubmitting      = false;

/* ─────────────────────────────────────────────────────────────
   TIMER
───────────────────────────────────────────────────────────── */
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

/* ─────────────────────────────────────────────────────────────
   PROGRESS TRACKING
───────────────────────────────────────────────────────────── */
function getAnsweredQuestions() {
  const answered = new Set();
  document.querySelectorAll('.question-block').forEach(block => {
    const fields = block.querySelectorAll('input, textarea, select');
    for (const el of fields) {
      if ((el.type === 'radio' || el.type === 'checkbox') && el.checked) {
        answered.add(block.id);
        return;
      }
      if (el.type !== 'radio' && el.type !== 'checkbox' && el.type !== 'hidden' &&
          (el.value || '').trim() !== '') {
        answered.add(block.id);
        return;
      }
    }
  });
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
  if (fpText)         fpText.textContent          = `${count} / ${TOTAL_QUESTIONS} answered`;
  if (fpFill)         fpFill.style.width          = `${pct}%`;
  if (submitAnswered) submitAnswered.textContent  = `${count} of ${TOTAL_QUESTIONS}`;

  document.querySelectorAll('.question-block').forEach(block => {
    block.classList.toggle('answered', answeredQuestions.has(block.id));
  });
}

/* ─────────────────────────────────────────────────────────────
   PAYLOAD BUILDER
───────────────────────────────────────────────────────────── */
function buildPayload() {
  const timestamp = new Date().toISOString();
  const responses = {};

  FIELD_IDS.forEach(id => {
    const radios = document.querySelectorAll(`input[type="radio"][name="${id}"]`);
    if (radios.length) {
      const checked = Array.from(radios).find(r => r.checked);
      responses[id] = checked ? checked.value : null;
      return;
    }
    const el = document.getElementById(id) || document.querySelector(`[name="${id}"]`);
    responses[id] = el ? (el.value.trim() || null) : null;
  });

  return {
    meta: {
      assessment:             'Y9-Entry',
      assessment_code:        ASSESSMENT_CODE,
      year_group:             'Year 9',
      language:               document.documentElement.lang === 'zh' ? 'ZH' : 'EN',
      submitted_at:           timestamp,
      time_remaining_seconds: timerRemaining,
      time_spent_seconds:     TIMER_SECONDS - timerRemaining,
      answered_count:         answeredQuestions.size,
      total_questions:        TOTAL_QUESTIONS,
      total_marks:            TOTAL_MARKS
    },
    answers: responses
  };
}

/* ─────────────────────────────────────────────────────────────
   SUPABASE SUBMISSION
───────────────────────────────────────────────────────────── */
function getStudentIdFromUrl() {
  const params = new URLSearchParams(window.location.search);
  return params.get('student_id') || params.get('studentId');
}

function flattenAnswers(answers) {
  return Object.entries(answers).map(([field_name, answer_value]) => ({
    field_name,
    answer_value: answer_value == null ? null : String(answer_value)
  }));
}

async function submitToSupabase(payload) {
  if (!supabaseClient) {
    throw new Error('Supabase library not loaded. Add the Supabase CDN script before script-y9.js in the HTML.');
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
      student_id: studentId,
      year_group: payload.meta.year_group,
      language: payload.meta.language,
      assessment_code: payload.meta.assessment_code,
      status: 'submitted',
      total_questions: payload.meta.total_questions,
      total_marks: payload.meta.total_marks,
      submitted_at: payload.meta.submitted_at,
      time_spent_seconds: payload.meta.time_spent_seconds,
      teacher_review_status: 'pending',
      assessment_round: 1,
      trigger_source: 'signup'
    })
    .select('id')
    .single();

  if (attemptError) throw attemptError;

  const answerRows = flattenAnswers(payload.answers).map(row => ({
    attempt_id: attempt.id,
    field_name: row.field_name,
    answer_value: row.answer_value
  }));

  const { error: answersError } = await supabaseClient
    .from('assessment_answers')
    .insert(answerRows);

  if (answersError) throw answersError;

  return attempt.id;
}

/* ─────────────────────────────────────────────────────────────
   AUTOSAVE
───────────────────────────────────────────────────────────── */
function autosave() {
  try {
    sessionStorage.setItem(AUTOSAVE_KEY, JSON.stringify(buildPayload()));
  } catch (e) {}
}

/* ─────────────────────────────────────────────────────────────
   INPUT VISUAL SYNC
───────────────────────────────────────────────────────────── */
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

/* ─────────────────────────────────────────────────────────────
   SUBMISSION MODAL
───────────────────────────────────────────────────────────── */
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
    console.log('[SciSpark Y9] Assessment payload:', JSON.stringify(payload, null, 2));

    const attemptId = await submitToSupabase(payload);
    console.log('[SciSpark Y9] Submitted to Supabase. Attempt ID:', attemptId);

    sessionStorage.removeItem(AUTOSAVE_KEY);
    document.getElementById('success-screen')?.classList.add('open');

  } catch (error) {
    console.error('[SciSpark Y9] Submission failed:', error);
    alert(
      'Submission failed. Please do not close this page.\n\n' +
      'Reason: ' + (error.message || error)
    );
    startTimer();
    if (confirmBtn) {
      confirmBtn.disabled = false;
      confirmBtn.textContent = 'Submit Assessment';
    }
    isSubmitting = false;
  }
}

async function autoSubmit() {
  if (isSubmitting) return;
  isSubmitting = true;

  try {
    const payload = buildPayload();
    console.log('[SciSpark Y9] Auto-submit payload:', JSON.stringify(payload, null, 2));

    const attemptId = await submitToSupabase(payload);
    console.log('[SciSpark Y9] Auto-submitted to Supabase. Attempt ID:', attemptId);

    sessionStorage.removeItem(AUTOSAVE_KEY);
    document.getElementById('success-screen')?.classList.add('open');

  } catch (error) {
    console.error('[SciSpark Y9] Auto-submit failed:', error);
    alert(
      'Time is up, but automatic submission failed. Please call the teacher.\n\n' +
      'Reason: ' + (error.message || error)
    );
  }
}

/* ─────────────────────────────────────────────────────────────
   INIT
───────────────────────────────────────────────────────────── */
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
