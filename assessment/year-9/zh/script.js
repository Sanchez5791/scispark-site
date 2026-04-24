/**
 * SciSpark Year 9 Entry Assessment
 * script.js — interaction, progress tracking, payload builder, Supabase submission
 */

'use strict';

/* ─────────────────────────────────────────────────────────────
   CONFIG
───────────────────────────────────────────────────────────── */
const TOTAL_MARKS     = 60;
const TOTAL_QUESTIONS = 27;
const TIMER_SECONDS   = 45 * 60;
const AUTOSAVE_KEY    = 'scispark_y9_draft';
const AUTOSAVE_INTERVAL_MS = 15000;

const SUPABASE_URL = 'https://fiffuaoibxeggwxcfvfh.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_OOrhuk8oqIbNLg3Wxo6fzQ_7z4sloBJ';

let supabaseClient = null;

if (window.supabase) {
  supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}

/** Question mark values — reference for future scoring layer */
const QUESTION_MARKS = {
  q1:1,q2:1,q3:1,q4:1,q5:1,
  q6:1,q7:1,q8:1,q9:1,q10:1,q11:1,q12:1,q13:1,q14:1,q15:1,
  q16:1,q17:1,q18:1,q19:1,q20:1,
  q21:4,q22:4,q23:4,
  q24:7,q25:7,q26:7,q27:7
};

/** Field-name → parent question — reference for future routing */
const FIELD_TO_QUESTION = {
  q21a:'q21', q21b_temp_change:'q21', q21b_type:'q21',
  q21c_temp_change:'q21', q21c_type:'q21', q21c_app:'q21',
  q22a:'q22', q22b_1:'q22', q22b_2:'q22', q22b_3:'q22', q22c:'q22',
  q23a:'q23', q23b_A:'q23', q23b_B:'q23', q23c:'q23',
  q24a_A:'q24', q24a_B:'q24',
  q24b_1:'q24', q24b_2:'q24', q24b_3:'q24', q24b_4:'q24',
  q24c:'q24', q24d:'q24',
  q25a_A:'q25', q25a_B:'q25', q25a_C:'q25', q25a_D:'q25',
  q25b_reactant:'q25', q25b_product:'q25', q25c:'q25',
  q25d_1:'q25', q25d_2:'q25',
  q26a:'q26', q26b_working:'q26', q26b_answer:'q26',
  q26c:'q26', q26d_force:'q26', q26d_area:'q26',
  q26d_pressure:'q26', q26e:'q26',
  q27a_renewable:'q27', q27a_nonrenewable:'q27',
  q27b_1:'q27', q27b_2:'q27',
  q27c_type:'q27', q27c_expl:'q27',
  q27d_1:'q27', q27d_2:'q27'
};

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

  for (let i = 1; i <= 20; i++) {
    if (document.querySelector(`input[name="q${i}"]:checked`)) answered.add(`q${i}`);
  }

  const q21a     = document.querySelectorAll('input[name="q21a"]:checked').length > 0;
  const q21b_tc  = document.getElementById('q21b_temp_change')?.value?.trim();
  const q21b_t   = document.getElementById('q21b_type')?.value;
  const q21c_tc  = document.getElementById('q21c_temp_change')?.value?.trim();
  const q21c_t   = document.getElementById('q21c_type')?.value;
  const q21c_app = document.querySelector('input[name="q21c_app"]:checked');
  if (q21a || q21b_tc || q21b_t || q21c_tc || q21c_t || q21c_app) answered.add('q21');

  const q22a  = document.querySelector('input[name="q22a"]:checked');
  const q22b1 = document.getElementById('q22b_1')?.value?.trim();
  const q22b2 = document.getElementById('q22b_2')?.value?.trim();
  const q22b3 = document.getElementById('q22b_3')?.value?.trim();
  const q22c  = document.querySelector('input[name="q22c"]:checked');
  if (q22a || q22b1 || q22b2 || q22b3 || q22c) answered.add('q22');

  const q23a  = document.querySelector('input[name="q23a"]:checked');
  const q23bA = document.getElementById('q23b_A')?.value?.trim();
  const q23bB = document.getElementById('q23b_B')?.value?.trim();
  const q23c  = document.querySelector('input[name="q23c"]:checked');
  if (q23a || q23bA || q23bB || q23c) answered.add('q23');

  const q24aA = document.getElementById('q24a_A')?.value?.trim();
  const q24aB = document.getElementById('q24a_B')?.value?.trim();
  const q24b1 = document.getElementById('q24b_1')?.value?.trim();
  const q24b2 = document.getElementById('q24b_2')?.value?.trim();
  const q24b3 = document.getElementById('q24b_3')?.value?.trim();
  const q24b4 = document.getElementById('q24b_4')?.value?.trim();
  const q24c  = document.querySelectorAll('input[name="q24c"]:checked').length > 0;
  const q24d  = document.getElementById('q24d')?.value?.trim();
  if (q24aA || q24aB || q24b1 || q24b2 || q24b3 || q24b4 || q24c || q24d) answered.add('q24');

  const q25ids = ['q25a_A','q25a_B','q25a_C','q25a_D','q25b_reactant','q25b_product','q25c','q25d_1','q25d_2'];
  if (q25ids.some(id => document.getElementById(id)?.value?.trim())) answered.add('q25');

  const q26ids = ['q26a','q26b_working','q26b_answer','q26c','q26d_force','q26d_area','q26d_pressure','q26e'];
  if (q26ids.some(id => document.getElementById(id)?.value?.trim())) answered.add('q26');

  const q27ids = ['q27b_1','q27b_2','q27c_type','q27c_expl','q27d_1','q27d_2'];
  const q27r   = document.querySelectorAll('input[name="q27a_renewable"]:checked').length > 0;
  const q27nr  = document.querySelectorAll('input[name="q27a_nonrenewable"]:checked').length > 0;
  if (q27ids.some(id => document.getElementById(id)?.value?.trim()) || q27r || q27nr) answered.add('q27');

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

  if (answeredCount) answeredCount.textContent = count;
  if (progressFill) progressFill.style.width = `${pct}%`;
  if (fpText) fpText.textContent = `${count} / ${TOTAL_QUESTIONS} answered`;
  if (fpFill) fpFill.style.width = `${pct}%`;
  if (submitAnswered) submitAnswered.textContent = `${count} of ${TOTAL_QUESTIONS}`;

  document.querySelectorAll('.question-block').forEach(block => {
    const qid = block.id.replace('qblock-', 'q');
    block.classList.toggle('answered', answeredQuestions.has(qid));
  });
}

/* ─────────────────────────────────────────────────────────────
   PAYLOAD BUILDER
───────────────────────────────────────────────────────────── */
function buildPayload() {
  const timestamp = new Date().toISOString();

  const getRadio = (name) => {
    const el = document.querySelector(`input[name="${name}"]:checked`);
    return el ? el.value : null;
  };

  const getCheckboxValues = (name) =>
    [...document.querySelectorAll(`input[name="${name}"]:checked`)].map(el => el.value);

  const getVal = (id) => document.getElementById(id)?.value?.trim() || null;

  const getNum = (id) => {
    const v = document.getElementById(id)?.value;
    return (v !== undefined && v !== '') ? Number(v) : null;
  };

  return {
    meta: {
      assessment:             'Y9-Entry',
      assessment_code:        'Y9_ENTRY_ASSESSMENT',
      year_group:             'Year 9',
      language:               document.documentElement.lang === 'zh' ? 'ZH' : 'EN',
      submitted_at:           timestamp,
      time_remaining_seconds: timerRemaining,
      time_spent_seconds:     TIMER_SECONDS - timerRemaining,
      answered_count:         answeredQuestions.size,
      total_questions:        TOTAL_QUESTIONS,
      total_marks:            TOTAL_MARKS
    },
    answers: {
      q1: getRadio('q1'), q2: getRadio('q2'), q3: getRadio('q3'),
      q4: getRadio('q4'), q5: getRadio('q5'),
      q6: getRadio('q6'), q7: getRadio('q7'), q8: getRadio('q8'),
      q9: getRadio('q9'), q10: getRadio('q10'), q11: getRadio('q11'),
      q12: getRadio('q12'), q13: getRadio('q13'), q14: getRadio('q14'),
      q15: getRadio('q15'), q16: getRadio('q16'), q17: getRadio('q17'),
      q18: getRadio('q18'), q19: getRadio('q19'), q20: getRadio('q20'),
      q21: {
        a_reactions_releasing_heat: getCheckboxValues('q21a'),
        b_reaction_B_temp_change: getVal('q21b_temp_change'),
        b_reaction_B_type: getVal('q21b_type'),
        b_reaction_C_temp_change: getVal('q21c_temp_change'),
        b_reaction_C_type: getVal('q21c_type'),
        c_self_heating_can: getRadio('q21c_app')
      },
      q22: {
        a_pattern: getRadio('q22a'),
        b_blank_1: getVal('q22b_1'),
        b_blank_2: getVal('q22b_2'),
        b_blank_3: getVal('q22b_3'),
        c_dry_air: getRadio('q22c')
      },
      q23: {
        a_terminal_velocity_motion: getRadio('q23a'),
        b_force_A_name: getVal('q23b_A'),
        b_force_B_name: getVal('q23b_B'),
        c_parachute_force_A: getRadio('q23c')
      },
      q24: {
        a_part_A: getVal('q24a_A'),
        a_particle_B: getVal('q24a_B'),
        b_blank_1: getVal('q24b_1'),
        b_blank_2: getVal('q24b_2'),
        b_blank_3: getVal('q24b_3'),
        b_blank_4: getVal('q24b_4'),
        c_two_differences: getCheckboxValues('q24c'),
        d_why_models_change: getVal('q24d')
      },
      q25: {
        a_metal_A: getVal('q25a_A'),
        a_metal_B: getVal('q25a_B'),
        a_metal_C: getVal('q25a_C'),
        a_metal_D: getVal('q25a_D'),
        b_reactant: getVal('q25b_reactant'),
        b_product: getVal('q25b_product'),
        c_gold_unreactive: getVal('q25c'),
        d_substance_1: getVal('q25d_1'),
        d_substance_2: getVal('q25d_2')
      },
      q26: {
        a_principle_of_moments: getVal('q26a'),
        b_working: getVal('q26b_working'),
        b_answer_N: getNum('q26b_answer'),
        c_longer_spanner: getVal('q26c'),
        d_force: getNum('q26d_force'),
        d_area: getNum('q26d_area'),
        d_pressure: getNum('q26d_pressure'),
        e_larger_area: getVal('q26e')
      },
      q27: {
        a_renewable: getCheckboxValues('q27a_renewable'),
        a_nonrenewable: getCheckboxValues('q27a_nonrenewable'),
        b_reason_1: getVal('q27b_1'),
        b_reason_2: getVal('q27b_2'),
        c_type: getVal('q27c_type'),
        c_explanation: getVal('q27c_expl'),
        d_product_1: getVal('q27d_1'),
        d_product_2: getVal('q27d_2')
      }
    }
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
  const rows = [];

  Object.entries(answers).forEach(([questionKey, value]) => {
    if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
      Object.entries(value).forEach(([fieldName, fieldValue]) => {
        rows.push({
          question_number: questionKey,
          field_name: fieldName,
          answer_value: Array.isArray(fieldValue) ? JSON.stringify(fieldValue) : (fieldValue == null ? null : String(fieldValue))
        });
      });
    } else {
      rows.push({
        question_number: questionKey,
        field_name: questionKey,
        answer_value: Array.isArray(value) ? JSON.stringify(value) : (value == null ? null : String(value))
      });
    }
  });

  return rows;
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
      student_id: studentId,
      year_group: payload.meta.year_group,
      language: payload.meta.language,
      assessment_code: payload.meta.assessment_code,
      status: 'submitted',
      total_questions: payload.meta.total_questions,
      total_marks: payload.meta.total_marks,
      submitted_at: payload.meta.submitted_at,
      time_spent_seconds: payload.meta.time_spent_seconds,
      teacher_review_status: 'pending'
    })
    .select('id')
    .single();

  if (attemptError) throw attemptError;

  const answerRows = flattenAnswers(payload.answers).map(row => ({
    attempt_id: attempt.id,
    question_number: row.question_number,
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
   SUBMISSION
───────────────────────────────────────────────────────────── */
function openModal() {
  updateProgress();

  const count = answeredQuestions.size;

  const modalAnswered = document.getElementById('modal-answered');
  const modalUnanswered = document.getElementById('modal-unanswered');
  const modalTime = document.getElementById('modal-time');
  const modalOverlay = document.getElementById('modal-overlay');

  if (modalAnswered) modalAnswered.textContent = count;
  if (modalUnanswered) modalUnanswered.textContent = TOTAL_QUESTIONS - count;
  if (modalTime) modalTime.textContent = formatTime(timerRemaining);
  if (modalOverlay) modalOverlay.classList.add('open');
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
    console.log('[SciSpark] Assessment payload:', JSON.stringify(payload, null, 2));

    const attemptId = await submitToSupabase(payload);
    console.log('[SciSpark] Submitted to Supabase. Attempt ID:', attemptId);

    sessionStorage.removeItem(AUTOSAVE_KEY);
    document.getElementById('success-screen')?.classList.add('open');

  } catch (error) {
    console.error('[SciSpark] Submission failed:', error);
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
    console.log('[SciSpark] Auto-submit payload:', JSON.stringify(payload, null, 2));

    const attemptId = await submitToSupabase(payload);
    console.log('[SciSpark] Auto-submitted to Supabase. Attempt ID:', attemptId);

    sessionStorage.removeItem(AUTOSAVE_KEY);
    document.getElementById('success-screen')?.classList.add('open');

  } catch (error) {
    console.error('[SciSpark] Auto-submit failed:', error);
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

  document.querySelectorAll('input[name="q24c"]').forEach(cb => {
    cb.addEventListener('change', () => {
      if (!cb.checked) return;

      const checkedCount = document.querySelectorAll('input[name="q24c"]:checked').length;

      if (checkedCount > 2) {
        cb.checked = false;
        cb.closest('label')?.classList.remove('checked');

        const block = document.getElementById('qblock-24');
        if (block) {
          block.classList.add('limit-reached');
          setTimeout(() => block.classList.remove('limit-reached'), 900);
        }
      }
    });
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

  const q26dForce    = document.getElementById('q26d_force');
  const q26dArea     = document.getElementById('q26d_area');
  const q26dPressure = document.getElementById('q26d_pressure');

  if (q26dForce && q26dArea && q26dPressure) {
    const calcPressure = () => {
      const f = parseFloat(q26dForce.value);
      const a = parseFloat(q26dArea.value);

      if (!isNaN(f) && !isNaN(a) && a !== 0 && !q26dPressure.value) {
        q26dPressure.value = (f / a).toFixed(2);
        updateProgress();
        autosave();
      }
    };

    q26dForce.addEventListener('change', calcPressure);
    q26dArea.addEventListener('change', calcPressure);
  }
});
