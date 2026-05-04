/**
 * SciSpark Year 8 Entry Assessment
 * script-y8.js v4 — Y8_ENTRY_EN_V4 (32 questions / 60 marks)
 *
 * Field contract: SCISPARK_Y8_ENTRY_ANSWER_FIELD_CONTRACT_AND_DIAGNOSTIC_MAP_v1
 * Assessment code: Y8_ENTRY_EN_V4
 * Architecture: Part A 10m | Part B 15m | Part C 15m | Part D 20m = 60m total
 *
 * CHANGES from v2 (27-question old architecture):
 * - TOTAL_QUESTIONS 27 → 32
 * - Part A: 5 → 10 MCQ fields (Y8_QA1_answer – Y8_QA10_answer)
 * - Part B: 15 MCQ fields — all now use Y8_QB1_answer – Y8_QB15_answer consistently
 * - Part C: 3 × 5-mark structured questions (C1/C2/C3) with locked field IDs
 * - Part D: 4 × 5-mark structured questions (D1/D2/D3/D4) with locked field IDs
 * - Payload rebuilt with exact field contract IDs
 * - assessment_code updated to Y8_ENTRY_EN_V4
 */

'use strict';

/* ━━━━━━━━━━━━━━━━━━━━━━━━━ CONFIG ━━━━━━━━━━━━━━━━━━━━━━━━━ */
const TOTAL_MARKS     = 60;
const TOTAL_QUESTIONS = 32;
const TIMER_SECONDS   = 45 * 60;
const AUTOSAVE_KEY    = 'scispark_y8v4_draft';
const AUTOSAVE_INTERVAL_MS = 15000;

const BACKEND_ENABLED = true;

const SUPABASE_URL      = 'https://fiffuaoibxeggwxcfvfh.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZpZmZ1YW9pYnhlZ2d3eGNmdmZoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY5MzYwOTAsImV4cCI6MjA5MjUxMjA5MH0.AJO3RGNo33rFdQ0DCyHj4gpGryAxnDnHIpUy2Px9wck';

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

/* ━━━━━━━━━━━━━━━━━━━━━ PROGRESS TRACKING ━━━━━━━━━━━━━━━━━━━ */
function getAnsweredQuestions() {
  const answered = new Set();

  const radio = (name) => !!document.querySelector(`input[name="${name}"]:checked`);
  const val   = (id)   => !!(document.getElementById(id)?.value?.trim());

  /* ── Part A: Q1–Q10 (10 MCQ, Y8_QA1_answer – Y8_QA10_answer) ── */
  for (let i = 1; i <= 10; i++) {
    if (radio(`Y8_QA${i}_answer`)) answered.add(`q${i}`);
  }

  /* ── Part B: Q11–Q25 (15 MCQ, Y8_QB1_answer – Y8_QB15_answer) ── */
  for (let i = 1; i <= 15; i++) {
    if (radio(`Y8_QB${i}_answer`)) answered.add(`q${10 + i}`);
  }

  /* ── Part C: Q26 — C1 Parachutes ── */
  if (
    val('Y8_QC1a_anomalous_result') ||
    val('Y8_QC1b_missing_average')  ||
    val('Y8_QC1c_pattern_explanation')
  ) answered.add('q26');

  /* ── Part C: Q27 — C2 Chemical/Physical Changes ── */
  if (
    val('Y8_QC2a_filtration_solid')         ||
    val('Y8_QC2b_reverse_change_method')    ||
    val('Y8_QC2c_irreversible_solid_letter')||
    val('Y8_QC2c_irreversible_evidence')    ||
    val('Y8_QC2d_burning_gasoline')
  ) answered.add('q27');

  /* ── Part C: Q28 — C3 Friction Investigation ── */
  if (
    radio('Y8_QC3a_friction_direction') ||
    val('Y8_QC3b_constant_factor_1')    ||
    val('Y8_QC3b_constant_factor_2')    ||
    val('Y8_QC3c_second_time_problem')  ||
    val('Y8_QC3d_check_method')
  ) answered.add('q28');

  /* ── Part D: Q29 — D1 Particle Properties Table ── */
  if (
    val('Y8_QD1_solid_movement') ||
    val('Y8_QD1_solid_forces')   ||
    val('Y8_QD1_liquid_forces')  ||
    val('Y8_QD1_gas_distance')   ||
    val('Y8_QD1_gas_shape')
  ) answered.add('q29');

  /* ── Part D: Q30 — D2 Gravity Mass Weight ── */
  if (
    val('Y8_QD2a_mass_unit')              ||
    val('Y8_QD2a_weight_unit')            ||
    val('Y8_QD2b_mass_weight_difference') ||
    val('Y8_QD2c_planet_y_mass')          ||
    val('Y8_QD2d_planet_z_weight')
  ) answered.add('q30');

  /* ── Part D: Q31 — D3 Skydiver Forces ── */
  if (
    val('Y8_QD3a_force_A')             ||
    val('Y8_QD3a_force_B')             ||
    val('Y8_QD3b_motion_start')        ||
    val('Y8_QD3c_motion_equal_forces') ||
    val('Y8_QD3d_control_variables')
  ) answered.add('q31');

  /* ── Part D: Q32 — D4 Amazon Food Web ── */
  if (
    val('Y8_QD4_blank1')                    ||
    val('Y8_QD4_blank2')                    ||
    val('Y8_QD4_blank3')                    ||
    val('Y8_QD4_blank4')                    ||
    val('Y8_QD4b_arrows_show')              ||
    val('Y8_QD4c_primary_consumers_count')  ||
    val('Y8_QD4d_decomposer_example')
  ) answered.add('q32');

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
  if (progressFill)   progressFill.style.width  = `${pct}%`;
  if (fpText)         fpText.textContent         = `${count} / ${TOTAL_QUESTIONS} answered`;
  if (fpFill)         fpFill.style.width         = `${pct}%`;
  if (submitAnswered) submitAnswered.textContent  = `${count} of ${TOTAL_QUESTIONS}`;

  document.querySelectorAll('.question-block').forEach(block => {
    const qid = block.id.replace('qblock-', 'q');
    block.classList.toggle('answered', answeredQuestions.has(qid));
  });
}

/* ━━━━━━━━━━━━━━━━━━━━━━ NORMALIZATION ━━━━━━━━━━━━━━━━━━━━━ */
function normalize(raw) {
  if (raw === null || raw === undefined || raw === '') return '';
  return String(raw).trim().replace(/\s+/g, ' ').toLowerCase();
}

function wrapField(raw) {
  const r = (raw === null || raw === undefined) ? '' : String(raw);
  return { raw: r, normalized: normalize(r) };
}

/* ━━━━━━━━━━━━━━━━━━━━ PAYLOAD BUILDER ━━━━━━━━━━━━━━━━━━━━━ */
function buildPayload() {
  const timestamp = new Date().toISOString();

  const getRadio = (name) => {
    const el = document.querySelector(`input[name="${name}"]:checked`);
    return el ? el.value : null;
  };

  const getVal = (id) => {
    const el = document.getElementById(id);
    return (el && el.value.trim()) ? el.value.trim() : null;
  };

  /* Collect all 60 mark-holder fields with raw + normalized */
  const responses = {};

  /* — Part A: 10 MCQ — */
  ['Y8_QA1_answer','Y8_QA2_answer','Y8_QA3_answer','Y8_QA4_answer','Y8_QA5_answer',
   'Y8_QA6_answer','Y8_QA7_answer','Y8_QA8_answer','Y8_QA9_answer','Y8_QA10_answer']
    .forEach(name => { responses[name] = wrapField(getRadio(name)); });

  /* — Part B: 15 MCQ — */
  ['Y8_QB1_answer','Y8_QB2_answer','Y8_QB3_answer','Y8_QB4_answer','Y8_QB5_answer',
   'Y8_QB6_answer','Y8_QB7_answer','Y8_QB8_answer','Y8_QB9_answer','Y8_QB10_answer',
   'Y8_QB11_answer','Y8_QB12_answer','Y8_QB13_answer','Y8_QB14_answer','Y8_QB15_answer']
    .forEach(name => { responses[name] = wrapField(getRadio(name)); });

  /* — Part C — */
  responses['Y8_QC1a_anomalous_result']         = wrapField(getVal('Y8_QC1a_anomalous_result'));
  responses['Y8_QC1b_missing_average']          = wrapField(getVal('Y8_QC1b_missing_average'));
  responses['Y8_QC1c_pattern_explanation']      = wrapField(getVal('Y8_QC1c_pattern_explanation'));

  responses['Y8_QC2a_filtration_solid']         = wrapField(getVal('Y8_QC2a_filtration_solid'));
  responses['Y8_QC2b_reverse_change_method']    = wrapField(getVal('Y8_QC2b_reverse_change_method'));
  responses['Y8_QC2c_irreversible_solid_letter']= wrapField(getVal('Y8_QC2c_irreversible_solid_letter'));
  responses['Y8_QC2c_irreversible_evidence']    = wrapField(getVal('Y8_QC2c_irreversible_evidence'));
  responses['Y8_QC2d_burning_gasoline']         = wrapField(getVal('Y8_QC2d_burning_gasoline'));

  responses['Y8_QC3a_friction_direction']       = wrapField(getRadio('Y8_QC3a_friction_direction'));
  responses['Y8_QC3b_constant_factor_1']        = wrapField(getVal('Y8_QC3b_constant_factor_1'));
  responses['Y8_QC3b_constant_factor_2']        = wrapField(getVal('Y8_QC3b_constant_factor_2'));
  responses['Y8_QC3c_second_time_problem']      = wrapField(getVal('Y8_QC3c_second_time_problem'));
  responses['Y8_QC3d_check_method']             = wrapField(getVal('Y8_QC3d_check_method'));

  /* — Part D — */
  responses['Y8_QD1_solid_movement']            = wrapField(getVal('Y8_QD1_solid_movement'));
  responses['Y8_QD1_solid_forces']              = wrapField(getVal('Y8_QD1_solid_forces'));
  responses['Y8_QD1_liquid_forces']             = wrapField(getVal('Y8_QD1_liquid_forces'));
  responses['Y8_QD1_gas_distance']              = wrapField(getVal('Y8_QD1_gas_distance'));
  responses['Y8_QD1_gas_shape']                 = wrapField(getVal('Y8_QD1_gas_shape'));

  responses['Y8_QD2a_mass_unit']                = wrapField(getVal('Y8_QD2a_mass_unit'));
  responses['Y8_QD2a_weight_unit']              = wrapField(getVal('Y8_QD2a_weight_unit'));
  responses['Y8_QD2b_mass_weight_difference']   = wrapField(getVal('Y8_QD2b_mass_weight_difference'));
  responses['Y8_QD2c_planet_y_mass']            = wrapField(getVal('Y8_QD2c_planet_y_mass'));
  responses['Y8_QD2d_planet_z_weight']          = wrapField(getVal('Y8_QD2d_planet_z_weight'));

  responses['Y8_QD3a_force_A']                  = wrapField(getVal('Y8_QD3a_force_A'));
  responses['Y8_QD3a_force_B']                  = wrapField(getVal('Y8_QD3a_force_B'));
  responses['Y8_QD3b_motion_start']             = wrapField(getVal('Y8_QD3b_motion_start'));
  responses['Y8_QD3c_motion_equal_forces']      = wrapField(getVal('Y8_QD3c_motion_equal_forces'));
  responses['Y8_QD3d_control_variables']        = wrapField(getVal('Y8_QD3d_control_variables'));

  responses['Y8_QD4_blank1']                    = wrapField(getVal('Y8_QD4_blank1'));
  responses['Y8_QD4_blank2']                    = wrapField(getVal('Y8_QD4_blank2'));
  responses['Y8_QD4_blank3']                    = wrapField(getVal('Y8_QD4_blank3'));
  responses['Y8_QD4_blank4']                    = wrapField(getVal('Y8_QD4_blank4'));
  responses['Y8_QD4b_arrows_show']              = wrapField(getVal('Y8_QD4b_arrows_show'));
  responses['Y8_QD4c_primary_consumers_count']  = wrapField(getVal('Y8_QD4c_primary_consumers_count'));
  responses['Y8_QD4d_decomposer_example']       = wrapField(getVal('Y8_QD4d_decomposer_example'));

  /* Client-side field count validation */
  const fieldKeys = Object.keys(responses);
  const missingFields = fieldKeys.filter(k => responses[k].raw === '');

  return {
    assessment_code:    'Y8_ENTRY_EN_V4',
    assessment_version: 'v8_no_ph_lock_review',
    submitted_at:       timestamp,
    student: {
      student_id:  getStudentIdFromUrl() || '',
      school_year: 'Year 8 entry candidate'
    },
    responses,
    client_validation: {
      required_fields_missing:          missingFields,
      field_count_submitted:            fieldKeys.length,
      has_all_required_mark_holder_fields: fieldKeys.length === 60
    },
    source_lock: {
      question_paper:    'SCISPARK_Y8_ENTRY_ASSESSMENT_SOURCE_DRAFT_v8_NO_PH_LOCK_REVIEW_COLOURED',
      field_contract:    'SCISPARK_Y8_ENTRY_ANSWER_FIELD_CONTRACT_AND_DIAGNOSTIC_MAP_v1',
      html_build_brief:  'SCISPARK_Y8_ENTRY_HTML_BUILD_BRIEF_v1'
    },
    meta: {
      year_group:             'Year 8',
      language:               'EN',
      time_remaining_seconds: timerRemaining,
      time_spent_seconds:     TIMER_SECONDS - timerRemaining,
      total_questions:        TOTAL_QUESTIONS,
      total_marks:            TOTAL_MARKS,
      backend_enabled:        BACKEND_ENABLED
    }
  };
}

/* ━━━━━━━━━━━━━━━━━━━━ SUPABASE SUBMISSION ━━━━━━━━━━━━━━━━━ */
function getStudentIdFromUrl() {
  const params = new URLSearchParams(window.location.search);
  return params.get('student_id') || params.get('studentId') || null;
}

function flattenResponses(responses) {
  return Object.entries(responses).map(([fieldId, obj]) => ({
    field_name:   fieldId,
    answer_value: obj.raw
  }));
}

async function submitToSupabase(payload) {
  if (!BACKEND_ENABLED) {
    console.log('[SciSpark Y8v4] BACKEND_ENABLED=false — payload logged, skipping live submit.');
    return 'DRAFT_NO_BACKEND';
  }

  if (!supabaseClient) throw new Error('Supabase library not loaded.');

  const studentId = payload.student.student_id;
  if (!studentId) throw new Error('Missing student_id in URL. Assessment must be opened from signup-complete redirect.');

  const { data: sessionData, error: sessionError } = await supabaseClient.auth.getSession();
  if (sessionError) throw sessionError;
  if (!sessionData?.session) throw new Error('No active login session. Please sign in again.');

  const { data: attempt, error: attemptError } = await supabaseClient
    .from('assessment_attempts')
    .insert({
      student_id:            studentId,
      year_group:            payload.meta.year_group,
      language:              payload.meta.language,
      assessment_code:       payload.assessment_code,
      status:                'submitted',
      total_questions:       payload.meta.total_questions,
      total_marks:           payload.meta.total_marks,
      submitted_at:          payload.submitted_at,
      time_spent_seconds:    payload.meta.time_spent_seconds,
      teacher_review_status: 'pending'
    })
    .select('id')
    .single();

  if (attemptError) throw attemptError;

  const answerRows = flattenResponses(payload.responses).map(row => ({
    attempt_id:   attempt.id,
    field_name:   row.field_name,
    answer_value: row.answer_value
  }));

  const { error: answersError } = await supabaseClient
    .from('assessment_answers')
    .insert(answerRows);

  if (answersError) throw answersError;

  return attempt.id;
}

/* Placeholder for marking engine handoff — does NOT score on front end */
async function sendToMarkingEngine(attemptId) {
  const MARK_URL = `${SUPABASE_URL}/functions/v1/mark-assessment`;
  const { data: sessionData } = await supabaseClient.auth.getSession();
  const token = sessionData?.session?.access_token ?? '';
  const res = await fetch(MARK_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      'apikey': SUPABASE_ANON_KEY
    },
    body: JSON.stringify({ attempt_id: attemptId, assessment_code: 'Y8_ENTRY_EN_V4' })
  });
  if (!res.ok) return null;
  return await res.json();
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
  if (input.type === 'radio' && input.checked) {
    document.querySelectorAll(`input[name="${input.name}"]`).forEach(r => {
      const lbl = r.closest('label');
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
    confirmBtn.disabled    = true;
    confirmBtn.textContent = 'Submitting...';
  }

  try {
    closeModal();
    clearInterval(timerInterval);

    const payload = buildPayload();
    console.log('[SciSpark Y8v4] Submitting payload:', JSON.stringify(payload, null, 2));

    const attemptId = await submitToSupabase(payload);
    console.log('[SciSpark Y8v4] Submitted. Attempt ID:', attemptId);

    sessionStorage.removeItem(AUTOSAVE_KEY);
    document.getElementById('success-screen')?.classList.add('open');

    /* Fire marking engine — does NOT show score to student (teacher reviews first) */
    sendToMarkingEngine(attemptId).catch(() => {});

  } catch (error) {
    console.error('[SciSpark Y8v4] Submission failed:', error);
    alert(
      'Submission failed. Please do not close this page.\n\n' +
      'Reason: ' + (error.message || error)
    );
    startTimer();
    if (confirmBtn) {
      confirmBtn.disabled    = false;
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
    const attemptId = await submitToSupabase(payload);
    console.log('[SciSpark Y8v4] Auto-submitted. Attempt ID:', attemptId);
    sessionStorage.removeItem(AUTOSAVE_KEY);
    document.getElementById('success-screen')?.classList.add('open');
  } catch (error) {
    console.error('[SciSpark Y8v4] Auto-submit failed:', error);
    alert(
      'Auto-submission failed when the timer reached 00:00.\n\nReason: ' +
      (error.message || error) + '\n\nPlease contact your teacher.'
    );
    isSubmitting = false;
  }
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━ INIT ━━━━━━━━━━━━━━━━━━━━━━━━━━ */
function init() {
  startTimer();

  document.querySelectorAll('input, textarea, select').forEach(el => {
    el.addEventListener('change', () => {
      if (el.type === 'radio') syncInputStyles(el);
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

  console.log(
    `[SciSpark Y8 v4] Ready. BACKEND_ENABLED=${BACKEND_ENABLED}. ` +
    `${TOTAL_QUESTIONS} questions, ${TOTAL_MARKS} marks, ${TIMER_SECONDS / 60} min. ` +
    `Assessment code: Y8_ENTRY_EN_V4.`
  );
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
