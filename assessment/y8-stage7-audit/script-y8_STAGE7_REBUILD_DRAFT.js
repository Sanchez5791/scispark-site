/**
 * SciSpark Year 8 Entry Assessment
 * script-y8.js — interaction, progress tracking, payload builder, autosave.
 *
 * Derived from Year 9 reference script.js per HTML Rebuild Brief v1 §G-9.
 * The Y9 file is not modified.
 *
 * Stage-7 rebuild constraints (HTML Rebuild Brief v1 §H):
 *   - No mark-scheme construction (no answer keys, no scoring).
 *   - No backend wiring: BACKEND_ENABLED is held false; submitToSupabase is
 *     guarded so no network calls fire on submit. Submission still builds the
 *     payload and logs it for QA, then advances to the success screen as if
 *     locally completed. Stage 11 will flip BACKEND_ENABLED to true.
 */

'use strict';

/* ─────────────────────────────────────────────────────────────
   CONFIG — Y8
───────────────────────────────────────────────────────────── */
const TOTAL_MARKS     = 60;
const TOTAL_QUESTIONS = 27;
const TIMER_SECONDS   = 45 * 60;
const AUTOSAVE_KEY    = 'scispark_y8_draft';
const AUTOSAVE_INTERVAL_MS = 15000;

/** Backend wiring flag — held false during Stage 7 rebuild. */
const BACKEND_ENABLED = false;

const SUPABASE_URL      = '';
const SUPABASE_ANON_KEY = '';

let supabaseClient = null;

if (BACKEND_ENABLED && window.supabase && SUPABASE_URL && SUPABASE_ANON_KEY) {
  supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}

/** Question mark values — Y8 distribution: 5 + 15 + 15 + 25 = 60.
 *  Reference for future scoring layer (no scoring wired here). */
const QUESTION_MARKS = {
  q1:1,  q2:1,  q3:1,  q4:1,  q5:1,
  q6:1,  q7:1,  q8:1,  q9:1,  q10:1, q11:1, q12:1, q13:1, q14:1, q15:1,
  q16:1, q17:1, q18:1, q19:1, q20:1,
  q21:5, q22:5, q23:5,
  q24:6, q25:6, q26:6, q27:7
};

/** Field-name → parent question — reference for future routing. */
const FIELD_TO_QUESTION = {
  // Part A
  q1_element:'q1', q1_compound:'q1', q1_mixture:'q1',
  q2_chloroplast:'q2',
  q3_producer:'q3',
  q4_force:'q4',
  q5_iv:'q5',
  // Part B
  q6_compound:'q6',
  q7_state_change:'q7',
  q8_metal:'q8',
  q9_A:'q9',
  q10_metal:'q10',
  q11_stomach:'q11',
  q12_difference:'q12',
  q13_entry:'q13',
  q14_vessel:'q14',
  q15_diaphragm:'q15',
  q16_decomposer:'q16',
  q17_cascade:'q17',
  q18_species:'q18',
  q19_iv:'q19',
  q20_precise:'q20', q20_reason:'q20',
  // Part C
  q21_anom_dist:'q21', q21_anom_time:'q21', q21_trend:'q21', q21_read:'q21',
  q22_starch:'q22', q22_ph:'q22', q22_temp:'q22', q22_amylase:'q22',
  q22_safety:'q22', q22_conclusion:'q22', q22_improve:'q22',
  q23_total:'q23', q23_pct:'q23', q23_difficulty:'q23',
  q23_anom_check:'q23', q23_other_role:'q23',
  // Part D — replacement set per Patch Plan v2
  q24a:'q24',
  q24b_strongest:'q24', q24b_reason:'q24',
  q24c:'q24',
  q24d:'q24',
  q25a_1:'q25', q25a_2:'q25', q25a_3:'q25', q25a_4:'q25', q25a_5:'q25',
  q25b:'q25',
  q26a_method:'q26', q26a_reason:'q26',
  q26b_eq1:'q26', q26b_eq2:'q26', q26b_eq3:'q26',
  q26c:'q26',
  q27a_baking:'q27', q27a_condensing:'q27', q27a_boiling:'q27',
  q27a_burning:'q27', q27a_digesting:'q27', q27a_rusting:'q27',
  q27a_filtering:'q27', q27a_dissolving:'q27',
  q27b:'q27', q27c:'q27', q27d:'q27'
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
   PROGRESS TRACKING — Y8 fields
───────────────────────────────────────────────────────────── */
const _val   = (id) => document.getElementById(id)?.value?.trim();
const _radio = (name) => document.querySelector(`input[name="${name}"]:checked`);
const _cbAny = (name) => document.querySelectorAll(`input[name="${name}"]:checked`).length > 0;
const _cbId  = (id) => document.getElementById(id)?.checked;

function getAnsweredQuestions() {
  const answered = new Set();

  // Q1 — three selects, answered if any has value
  if (_val('q1_element') || _val('q1_compound') || _val('q1_mixture')) answered.add('q1');
  // Q2-Q3 — single radio
  if (_radio('q2_chloroplast')) answered.add('q2');
  if (_radio('q3_producer')) answered.add('q3');
  // Q4-Q5 — text input
  if (_val('q4_force')) answered.add('q4');
  if (_val('q5_iv'))    answered.add('q5');
  // Q6 — radio
  if (_radio('q6_compound')) answered.add('q6');
  // Q7 — inline select
  if (_val('q7_state_change')) answered.add('q7');
  // Q8-Q9 — radio
  if (_radio('q8_metal')) answered.add('q8');
  if (_radio('q9_A')) answered.add('q9');
  // Q10 — radio (NEW: magnetism metal recognition)
  if (_radio('q10_metal')) answered.add('q10');
  // Q11 — radio
  if (_radio('q11_stomach')) answered.add('q11');
  // Q12 — textarea
  if (_val('q12_difference')) answered.add('q12');
  // Q13 — select
  if (_val('q13_entry')) answered.add('q13');
  // Q14-Q15 — radio
  if (_radio('q14_vessel')) answered.add('q14');
  if (_radio('q15_diaphragm')) answered.add('q15');
  // Q16-Q18 — textarea
  if (_val('q16_decomposer')) answered.add('q16');
  if (_val('q17_cascade'))    answered.add('q17');
  if (_val('q18_species'))    answered.add('q18');
  // Q19 — radio
  if (_radio('q19_iv')) answered.add('q19');
  // Q20 — radio + textarea
  if (_radio('q20_precise') || _val('q20_reason')) answered.add('q20');
  // Q21 — anomaly + trend + read
  if (_val('q21_anom_dist') || _val('q21_anom_time') ||
      _val('q21_trend') || _val('q21_read')) answered.add('q21');
  // Q22 — checkboxes + textareas
  if (_cbId('q22_starch') || _cbId('q22_ph') || _cbId('q22_temp') || _cbId('q22_amylase') ||
      _val('q22_safety') || _val('q22_conclusion') || _val('q22_improve')) answered.add('q22');
  // Q23 — number + textareas
  if (_val('q23_total') || _val('q23_pct') ||
      _val('q23_difficulty') || _val('q23_anom_check') || _val('q23_other_role')) {
    answered.add('q23');
  }
  // Q24 — magnetism investigation (NEW)
  if (_cbAny('q24a') || _radio('q24b_strongest') || _val('q24b_reason') ||
      _val('q24c') || _val('q24d')) {
    answered.add('q24');
  }
  // Q25 — dissolving vocabulary (NEW)
  if (_val('q25a_1') || _val('q25a_2') || _val('q25a_3') ||
      _val('q25a_4') || _val('q25a_5') || _radio('q25b')) {
    answered.add('q25');
  }
  // Q26 — separation (NEW)
  if (_val('q26a_method') || _val('q26a_reason') ||
      _val('q26b_eq1') || _val('q26b_eq2') || _val('q26b_eq3') ||
      _radio('q26c')) {
    answered.add('q26');
  }
  // Q27 — reversible/irreversible (NEW)
  const q27aRows = ['baking','condensing','boiling','burning',
                    'digesting','rusting','filtering','dissolving'];
  const q27aAnswered = q27aRows.some(r => _radio(`q27a_${r}`));
  if (q27aAnswered || _val('q27b') || _val('q27c') || _val('q27d')) {
    answered.add('q27');
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
    const qid = block.id.replace('qblock-', 'q');
    block.classList.toggle('answered', answeredQuestions.has(qid));
  });
}

/* ─────────────────────────────────────────────────────────────
   PAYLOAD BUILDER — Y8
───────────────────────────────────────────────────────────── */
function buildPayload() {
  const timestamp = new Date().toISOString();

  const getRadio = (name) => {
    const el = document.querySelector(`input[name="${name}"]:checked`);
    return el ? el.value : null;
  };
  const getCheckboxValues = (name) =>
    [...document.querySelectorAll(`input[name="${name}"]:checked`)].map(el => el.value);
  const getCheckboxBool = (id) => !!document.getElementById(id)?.checked;
  const getVal = (id) => document.getElementById(id)?.value?.trim() || null;
  const getNum = (id) => {
    const v = document.getElementById(id)?.value;
    return (v !== undefined && v !== '') ? Number(v) : null;
  };

  return {
    meta: {
      assessment:             'Y8-Entry',
      assessment_code:        'Y8_ENTRY_READINESS_EN',
      year_group:             'Year 8',
      language:               document.documentElement.lang === 'zh' ? 'ZH' : 'EN',
      submitted_at:           timestamp,
      time_remaining_seconds: timerRemaining,
      time_spent_seconds:     TIMER_SECONDS - timerRemaining,
      answered_count:         answeredQuestions.size,
      total_questions:        TOTAL_QUESTIONS,
      total_marks:            TOTAL_MARKS
    },
    answers: {
      q1: {
        element:  getVal('q1_element'),
        compound: getVal('q1_compound'),
        mixture:  getVal('q1_mixture')
      },
      q2: getRadio('q2_chloroplast'),
      q3: getRadio('q3_producer'),
      q4: getVal('q4_force'),
      q5: getVal('q5_iv'),
      q6:  getRadio('q6_compound'),
      q7:  getVal('q7_state_change'),
      q8:  getRadio('q8_metal'),
      q9:  getRadio('q9_A'),
      q10: getRadio('q10_metal'),
      q11: getRadio('q11_stomach'),
      q12: getVal('q12_difference'),
      q13: getVal('q13_entry'),
      q14: getRadio('q14_vessel'),
      q15: getRadio('q15_diaphragm'),
      q16: getVal('q16_decomposer'),
      q17: getVal('q17_cascade'),
      q18: getVal('q18_species'),
      q19: getRadio('q19_iv'),
      q20: { precise: getRadio('q20_precise'), reason: getVal('q20_reason') },
      q21: {
        a_anomaly_distance: getNum('q21_anom_dist'),
        a_anomaly_time:     getNum('q21_anom_time'),
        b_trend:            getVal('q21_trend'),
        c_graph_read_time:  getNum('q21_read')
      },
      q22: {
        a_kept_same_starch:  getCheckboxBool('q22_starch'),
        a_kept_same_ph:      getCheckboxBool('q22_ph'),
        a_kept_same_temp:    getCheckboxBool('q22_temp'),
        a_kept_same_amylase: getCheckboxBool('q22_amylase'),
        b_safety_action:     getVal('q22_safety'),
        c_conclusion:        getVal('q22_conclusion'),
        d_improvement:       getVal('q22_improve')
      },
      q23: {
        a_total:           getNum('q23_total'),
        b_percent_lg_fish: getNum('q23_pct'),
        c_difficulty:      getVal('q23_difficulty'),
        d_anomaly_check:   getVal('q23_anom_check'),
        e_other_role:      getVal('q23_other_role')
      },
      q24: {
        a_true_statements:  getCheckboxValues('q24a'),
        b_strongest_magnet: getRadio('q24b_strongest'),
        b_reason:           getVal('q24b_reason'),
        c_fair_test:        getVal('q24c'),
        d_make_attract:     getVal('q24d')
      },
      q25: {
        a_blank_1: getVal('q25a_1'),
        a_blank_2: getVal('q25a_2'),
        a_blank_3: getVal('q25a_3'),
        a_blank_4: getVal('q25a_4'),
        a_blank_5: getVal('q25a_5'),
        b_dissolves_material: getRadio('q25b')
      },
      q26: {
        a_method:            getVal('q26a_method'),
        a_reason:            getVal('q26a_reason'),
        b_equipment_1:       getVal('q26b_eq1'),
        b_equipment_2:       getVal('q26b_eq2'),
        b_equipment_3:       getVal('q26b_eq3'),
        c_separation_method: getRadio('q26c')
      },
      q27: {
        a_baking:    getRadio('q27a_baking'),
        a_condensing:getRadio('q27a_condensing'),
        a_boiling:   getRadio('q27a_boiling'),
        a_burning:   getRadio('q27a_burning'),
        a_digesting: getRadio('q27a_digesting'),
        a_rusting:   getRadio('q27a_rusting'),
        a_filtering: getRadio('q27a_filtering'),
        a_dissolving:getRadio('q27a_dissolving'),
        b_boiling_what_happens: getVal('q27b'),
        c_boiling_reversible:   getVal('q27c'),
        d_potato_irreversible:  getVal('q27d')
      }
    }
  };
}

/* ─────────────────────────────────────────────────────────────
   SUBMISSION (BACKEND_ENABLED = false → no network call)
───────────────────────────────────────────────────────────── */
function flattenAnswers(answers) {
  const rows = [];
  Object.entries(answers).forEach(([questionKey, value]) => {
    if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
      Object.entries(value).forEach(([fieldName, fieldValue]) => {
        rows.push({
          question_number: questionKey,
          field_name:      fieldName,
          answer_value:    Array.isArray(fieldValue)
            ? JSON.stringify(fieldValue)
            : (fieldValue == null ? null : String(fieldValue))
        });
      });
    } else {
      rows.push({
        question_number: questionKey,
        field_name:      questionKey,
        answer_value:    Array.isArray(value)
          ? JSON.stringify(value)
          : (value == null ? null : String(value))
      });
    }
  });
  return rows;
}

/**
 * Submit hook — gated by BACKEND_ENABLED.
 * Stage 7: payload is built and logged for QA, but no network call fires.
 * Stage 11 will populate SUPABASE_URL / SUPABASE_ANON_KEY and flip the flag.
 */
async function submitToSupabase(payload) {
  if (!BACKEND_ENABLED) {
    console.log('[SciSpark Y8] BACKEND_ENABLED=false — payload built locally, no network call.');
    console.log('[SciSpark Y8] Flattened answer rows:', flattenAnswers(payload.answers));
    return 'local-no-backend';
  }
  if (!supabaseClient) {
    throw new Error('Supabase library not loaded.');
  }
  return null;
}

/* ─────────────────────────────────────────────────────────────
   AUTOSAVE
───────────────────────────────────────────────────────────── */
function autosave() {
  try {
    sessionStorage.setItem(AUTOSAVE_KEY, JSON.stringify(buildPayload()));
  } catch (e) { /* silent */ }
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
   SUBMISSION FLOW
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
    confirmBtn.disabled    = true;
    confirmBtn.textContent = 'Submitting...';
  }
  try {
    closeModal();
    clearInterval(timerInterval);
    const payload = buildPayload();
    console.log('[SciSpark Y8] Assessment payload:', JSON.stringify(payload, null, 2));
    await submitToSupabase(payload);
    sessionStorage.removeItem(AUTOSAVE_KEY);
    document.getElementById('success-screen')?.classList.add('open');
  } catch (error) {
    console.error('[SciSpark Y8] Submission failed:', error);
    alert('Submission failed. Please do not close this page.\n\nReason: ' + (error.message || error));
    startTimer();
    if (confirmBtn) {
      confirmBtn.disabled    = false;
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
    console.log('[SciSpark Y8] Auto-submit payload:', JSON.stringify(payload, null, 2));
    await submitToSupabase(payload);
    sessionStorage.removeItem(AUTOSAVE_KEY);
    document.getElementById('success-screen')?.classList.add('open');
  } catch (error) {
    console.error('[SciSpark Y8] Auto-submit failed:', error);
    alert('Time is up, but automatic submission failed. Please call the teacher.\n\nReason: ' + (error.message || error));
  }
}

/* ─────────────────────────────────────────────────────────────
   Q24(a) — TICK-TWO LIMIT
   Source MAG-A(a): "Tick the box next to the two correct statements."
   MS rule (p.106): four ticks = 0 marks; three ticks, two correct = 1 mark.
   Frontend gently prevents a 3rd tick to mirror the limit.
───────────────────────────────────────────────────────────── */
function wireTickTwoLimit() {
  document.querySelectorAll('input[name="q24a"]').forEach(cb => {
    cb.addEventListener('change', () => {
      if (!cb.checked) return;
      const checkedCount = document.querySelectorAll('input[name="q24a"]:checked').length;
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

  wireTickTwoLimit();

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
