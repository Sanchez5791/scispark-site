/**
 * SciSpark Year 7 Entry Assessment
 * script.js - timer, progress, payload builder, Supabase submission.
 *
 * Architecture (locked by Y7_ENTRY_ASSESSMENT_STRUCTURE_LOCK_v1):
 *   27 questions / 68 fields / 60 marks / 45 minutes
 *   Part A: 5 x 1m   (5 fields)
 *   Part B: 15 x 1m  (15 fields, including Y7_QB6 composite)
 *   Part C: 3 structured questions averaging 4m  (11 fields)
 *   Part D: 4 structured questions averaging 7m  (37 fields)
 *
 * Field naming follows Y7_ENTRY_ANSWER_FIELD_CONTRACT_FINAL_v3:
 *   HTML name attribute       = <data-question-id>_answer
 *   HTML id attribute         = input_<name>
 *   data-question-id          = stable contract id matching Section 8
 *
 * Supabase contract:
 *   assessment_code           = "Y7_ENTRY_EN" (locked exactly)
 *   submit MUST await supabase.auth.getSession() before any insert
 *   student_id is read from the URL parameter, NOT hardcoded
 *   one row per non-blank field is inserted into assessment_answers
 *
 * Y7_QB6 special handling:
 *   The visible UI for Y7_QB6 is three <select> elements (solid/liquid/gas
 *   matched to diagram 1/2/3). Per contract Section 8, Part B has 15
 *   fields (one per question), so Y7_QB6 has a single hidden composite
 *   input whose value is rebuilt on every change of the 3 selects:
 *     "solid=<v>;liquid=<v>;gas=<v>"
 *   The downstream AI marker pools the 3 selections from this string.
 */

'use strict';

const TOTAL_MARKS     = 60;
const TOTAL_QUESTIONS = 27;
const TIMER_SECONDS   = 45 * 60;
const ASSESSMENT_CODE = 'Y7_ENTRY_EN';
const YEAR_GROUP      = 'Year 7';
const LANGUAGE        = 'EN';
const AUTOSAVE_KEY    = 'scispark_y7_draft';
const AUTOSAVE_INTERVAL_MS = 15000;

const SUPABASE_URL = 'https://fiffuaoibxeggwxcfvfh.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_OOrhuk8oqIbNLg3Wxo6fzQ_7z4sloBJ';

let supabaseClient = null;
if (window.supabase) {
  supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}

/* ------------------------------------------------------------------
   QUESTION REGISTRY (27 parent questions -> 68 contract fields)
   A question counts as "answered" if any of its fields has a
   non-blank value.
------------------------------------------------------------------- */
const QUESTION_FIELDS = {
  // Part A (5 fields)
  Y7_QA1: ['Y7_QA1'],
  Y7_QA2: ['Y7_QA2'],
  Y7_QA3: ['Y7_QA3'],
  Y7_QA4: ['Y7_QA4'],
  Y7_QA5: ['Y7_QA5'],
  // Part B (15 fields - one per question; QB6 is a composite hidden field)
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
  // Part C (11 fields)
  Y7_QC1: ['Y7_QC1_a', 'Y7_QC1_b', 'Y7_QC1_c', 'Y7_QC1_d', 'Y7_QC1_e'],
  Y7_QC2: ['Y7_QC2_a', 'Y7_QC2_b', 'Y7_QC2_c', 'Y7_QC2_d'],
  Y7_QC3: ['Y7_QC3_a_value', 'Y7_QC3_a_pattern'],
  // Part D (37 fields across 4 structured questions)
  Y7_QD1: ['Y7_QD1_a', 'Y7_QD1_b', 'Y7_QD1_c', 'Y7_QD1_d', 'Y7_QD1_e',
           'Y7_QD1_f_obs1', 'Y7_QD1_f_obs2'],
  Y7_QD2: ['Y7_QD2_a_reactant1', 'Y7_QD2_a_reactant2',
           'Y7_QD2_a_product1', 'Y7_QD2_a_product2', 'Y7_QD2_a_product3',
           'Y7_QD2_b', 'Y7_QD2_c', 'Y7_QD2_d', 'Y7_QD2_e', 'Y7_QD2_f'],
  Y7_QD3: ['Y7_QD3_a_leaf1', 'Y7_QD3_a_leaf2', 'Y7_QD3_a_leaf3', 'Y7_QD3_a_leaf4',
           'Y7_QD3_b_legs_branch1', 'Y7_QD3_b_legs_branch2',
           'Y7_QD3_b_animal1', 'Y7_QD3_b_animal2',
           'Y7_QD3_c_glass', 'Y7_QD3_c_metals', 'Y7_QD3_c_paper', 'Y7_QD3_c_plastic'],
  Y7_QD4: ['Y7_QD4_a', 'Y7_QD4_b', 'Y7_QD4_c1', 'Y7_QD4_c2', 'Y7_QD4_c3',
           'Y7_QD4_d', 'Y7_QD4_e', 'Y7_QD4_f']
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
   QB6 COMPOSITE
   Three visible <select> elements (solid/liquid/gas, each picking
   "diagram 1/2/3") feed one hidden <input name="Y7_QB6_answer">.
   Updated on every change.
------------------------------------------------------------------- */
function refreshQB6Composite() {
  const hidden = document.getElementById('input_Y7_QB6_answer');
  if (!hidden) return;
  const get = (key) => {
    const el = document.querySelector(`select[data-q-key="Y7_QB6"][data-match-key="${key}"]`);
    return el ? el.value : '';
  };
  const solid  = get('solid');
  const liquid = get('liquid');
  const gas    = get('gas');
  hidden.value = (solid || liquid || gas)
    ? `solid=${solid};liquid=${liquid};gas=${gas}`
    : '';
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
  refreshQB6Composite();
  answeredQuestions = getAnsweredQuestions();
  const count = answeredQuestions.size;
  const pct   = (count / TOTAL_QUESTIONS) * 100;

  const answeredCount = document.getElementById('answered-count');
  const progressFill  = document.getElementById('progress-fill');
  const fpText        = document.getElementById('fp-text');
  const fpFill        = document.getElementById('fp-fill');
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
    throw new Error('Supabase library not loaded. Add the Supabase CDN script before script.js in the HTML.');
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
    console.log('[SciSpark Y7] Submitted to Supabase. Attempt ID:', attemptId);
    sessionStorage.removeItem(AUTOSAVE_KEY);
    document.getElementById('success-screen')?.classList.add('open');
  } catch (error) {
    console.error('[SciSpark Y7] Submission failed:', error);
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
    console.log('[SciSpark Y7] Auto-submitted to Supabase. Attempt ID:', attemptId);
    sessionStorage.removeItem(AUTOSAVE_KEY);
    document.getElementById('success-screen')?.classList.add('open');
  } catch (error) {
    console.error('[SciSpark Y7] Auto-submit failed:', error);
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
  refreshQB6Composite();
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
