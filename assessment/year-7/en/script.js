/**
 * SciSpark Year 7 Entry Assessment
 * script.js - timer, progress, payload builder, Supabase submission
 *
 * Field naming follows Y7_ENTRY_ANSWER_FIELD_CONTRACT_FINAL.txt:
 *   - HTML name attribute       = <data-question-id>_answer
 *   - HTML id attribute         = input_<name>
 *   - data-question-id          = stable contract id (Y7_QXn[_subpart][_row|_choice|_field])
 *
 * Supabase contract:
 *   - assessment_code           = "Y7_ENTRY_EN" (locked exactly)
 *   - submit MUST await supabase.auth.getSession() before any insert
 *   - student_id is read from URL parameter, NOT hardcoded
 *   - one row per non-blank field is inserted into assessment_answers
 */

'use strict';

const TOTAL_MARKS     = 60;
const TOTAL_QUESTIONS = 21;
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
   QUESTION REGISTRY
   Each entry maps a parent contract question (Y7_QXn) to the list
   of contract field ids that contribute to it. A question counts as
   "answered" if any of its fields has a non-blank value.
------------------------------------------------------------------- */
const QUESTION_FIELDS = {
  Y7_QA1: ['Y7_QA1'],
  Y7_QA2: ['Y7_QA2'],
  Y7_QA3: ['Y7_QA3'],
  Y7_QA4: ['Y7_QA4'],
  Y7_QA5: ['Y7_QA5'],
  Y7_QB1: ['Y7_QB1_r1', 'Y7_QB1_r2', 'Y7_QB1_r3', 'Y7_QB1_r4'],
  Y7_QB2: ['Y7_QB2_cA', 'Y7_QB2_cB', 'Y7_QB2_cC', 'Y7_QB2_cD', 'Y7_QB2_cE', 'Y7_QB2_cF'],
  Y7_QB3: ['Y7_QB3_r1', 'Y7_QB3_r2', 'Y7_QB3_r3', 'Y7_QB3_r4', 'Y7_QB3_r5'],
  Y7_QB4: ['Y7_QB4_a', 'Y7_QB4_b_choice', 'Y7_QB4_b_explain', 'Y7_QB4_c_choice', 'Y7_QB4_c_explain', 'Y7_QB4_d'],
  Y7_QB5: ['Y7_QB5_a', 'Y7_QB5_b'],
  Y7_QC1: ['Y7_QC1_a', 'Y7_QC1_b', 'Y7_QC1_c', 'Y7_QC1_d', 'Y7_QC1_e'],
  Y7_QC2: ['Y7_QC2_a', 'Y7_QC2_b', 'Y7_QC2_c', 'Y7_QC2_d'],
  Y7_QC3: ['Y7_QC3_a_value', 'Y7_QC3_a_pattern'],
  Y7_QD1: ['Y7_QD1_a', 'Y7_QD1_b', 'Y7_QD1_c', 'Y7_QD1_d', 'Y7_QD1_e'],
  Y7_QD2: ['Y7_QD2_a_reactant1', 'Y7_QD2_a_reactant2',
           'Y7_QD2_a_product1', 'Y7_QD2_a_product2', 'Y7_QD2_a_product3',
           'Y7_QD2_b', 'Y7_QD2_c_obs1', 'Y7_QD2_c_obs2'],
  Y7_QD3: ['Y7_QD3_a_leaf1', 'Y7_QD3_a_leaf2', 'Y7_QD3_a_leaf3', 'Y7_QD3_a_leaf4',
           'Y7_QD3_b_legs_branch1', 'Y7_QD3_b_legs_branch2',
           'Y7_QD3_b_animal1', 'Y7_QD3_b_animal2'],
  Y7_QD4: ['Y7_QD4_a', 'Y7_QD4_b', 'Y7_QD4_c'],
  Y7_QD5: ['Y7_QD5_a_glass', 'Y7_QD5_a_metals', 'Y7_QD5_a_paper', 'Y7_QD5_a_plastic',
           'Y7_QD5_b', 'Y7_QD5_c'],
  Y7_QD6: ['Y7_QD6_a', 'Y7_QD6_b'],
  Y7_QD7: ['Y7_QD7_a', 'Y7_QD7_b'],
  Y7_QD8: ['Y7_QD8_a', 'Y7_QD8_b', 'Y7_QD8_c']
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
   Each contract field has exactly one HTML input named
   "<field-id>_answer". For radios and single checkboxes we read
   the checked state; for text/number/select we read the value.
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
   Produces the flat answer rows for assessment_answers, in contract
   order. Blank fields are omitted from the insert (per contract
   Section 10 step 4).
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
   AUTOSAVE (session storage only, no PII to disk)
------------------------------------------------------------------- */
function autosave() {
  try {
    sessionStorage.setItem(AUTOSAVE_KEY, JSON.stringify(buildPayload()));
  } catch (e) { /* ignore quota errors */ }
}

/* ------------------------------------------------------------------
   INPUT VISUAL SYNC + B2 tick-exactly-3 enforcement
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

function enforceTickExactlyThree() {
  const groupInputs = document.querySelectorAll('input[type="checkbox"][data-tick-group="Y7_QB2"]');
  groupInputs.forEach(cb => {
    cb.addEventListener('change', () => {
      if (!cb.checked) return;
      const checkedCount = document.querySelectorAll('input[type="checkbox"][data-tick-group="Y7_QB2"]:checked').length;
      if (checkedCount > 3) {
        cb.checked = false;
        cb.closest('label')?.classList.remove('checked');
        const block = document.getElementById('qblock-Y7_QB2');
        if (block) {
          block.classList.add('limit-reached');
          setTimeout(() => block.classList.remove('limit-reached'), 900);
        }
      }
      const hint = document.getElementById('hint-Y7_QB2');
      if (hint) {
        const recount = document.querySelectorAll('input[type="checkbox"][data-tick-group="Y7_QB2"]:checked').length;
        hint.textContent = recount === 3
          ? 'Three selected.'
          : `Select exactly three. (${recount} selected)`;
      }
    });
  });
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

  enforceTickExactlyThree();

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
