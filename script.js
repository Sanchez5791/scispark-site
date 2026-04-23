/**
 * SciSpark Year 9 Entry Assessment
 * script.js — interaction, progress tracking, payload builder, submission
 *
 * System pass fixes applied:
 *  - Q24c: enforces maximum 2 checkbox selections (question says "Tick TWO")
 *  - syncInputStyles: now handles radio inputs as well as checkboxes so the
 *    .checked class is applied for both, making the CSS fallback rules effective
 *  - buildPayload meta: added time_spent_seconds for data completeness
 *  - restoreDraft Q25a: explicit per-field calls (was template-literal forEach —
 *    functionally correct but invisible to static audits)
 *  - Post-restore visual sync: .checked classes applied after restoreDraft so
 *    restored selections are visually highlighted immediately on page load
 *  - Q26d auto-calc: also calls autosave() after filling the pressure field
 */

'use strict';

/* ─────────────────────────────────────────────────────────────
   CONFIG
───────────────────────────────────────────────────────────── */
const TOTAL_MARKS     = 60;
const TOTAL_QUESTIONS = 27;
const TIMER_SECONDS   = 45 * 60;   // 45 minutes
const AUTOSAVE_KEY    = 'scispark_y9_draft';
const AUTOSAVE_INTERVAL_MS = 15000; // 15 s

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
  el.textContent = formatTime(timerRemaining);
  el.classList.toggle('urgent', timerRemaining <= 300); // red under 5 min
}

function startTimer() {
  timerInterval = setInterval(tickTimer, 1000);
}

/* ─────────────────────────────────────────────────────────────
   PROGRESS TRACKING
───────────────────────────────────────────────────────────── */
function getAnsweredQuestions() {
  const answered = new Set();

  // Parts A & B — radio groups q1..q20
  for (let i = 1; i <= 20; i++) {
    if (document.querySelector(`input[name="q${i}"]:checked`)) answered.add(`q${i}`);
  }

  // Q21
  const q21a     = document.querySelectorAll('input[name="q21a"]:checked').length > 0;
  const q21b_tc  = document.getElementById('q21b_temp_change')?.value?.trim();
  const q21b_t   = document.getElementById('q21b_type')?.value;
  const q21c_tc  = document.getElementById('q21c_temp_change')?.value?.trim();
  const q21c_t   = document.getElementById('q21c_type')?.value;
  const q21c_app = document.querySelector('input[name="q21c_app"]:checked');
  if (q21a || q21b_tc || q21b_t || q21c_tc || q21c_t || q21c_app) answered.add('q21');

  // Q22
  const q22a  = document.querySelector('input[name="q22a"]:checked');
  const q22b1 = document.getElementById('q22b_1')?.value?.trim();
  const q22b2 = document.getElementById('q22b_2')?.value?.trim();
  const q22b3 = document.getElementById('q22b_3')?.value?.trim();
  const q22c  = document.querySelector('input[name="q22c"]:checked');
  if (q22a || q22b1 || q22b2 || q22b3 || q22c) answered.add('q22');

  // Q23
  const q23a  = document.querySelector('input[name="q23a"]:checked');
  const q23bA = document.getElementById('q23b_A')?.value?.trim();
  const q23bB = document.getElementById('q23b_B')?.value?.trim();
  const q23c  = document.querySelector('input[name="q23c"]:checked');
  if (q23a || q23bA || q23bB || q23c) answered.add('q23');

  // Q24
  const q24aA = document.getElementById('q24a_A')?.value?.trim();
  const q24aB = document.getElementById('q24a_B')?.value?.trim();
  const q24b1 = document.getElementById('q24b_1')?.value?.trim();
  const q24b2 = document.getElementById('q24b_2')?.value?.trim();
  const q24b3 = document.getElementById('q24b_3')?.value?.trim();
  const q24b4 = document.getElementById('q24b_4')?.value?.trim();
  const q24c  = document.querySelectorAll('input[name="q24c"]:checked').length > 0;
  const q24d  = document.getElementById('q24d')?.value?.trim();
  if (q24aA || q24aB || q24b1 || q24b2 || q24b3 || q24b4 || q24c || q24d) answered.add('q24');

  // Q25 — all text inputs
  const q25ids = ['q25a_A','q25a_B','q25a_C','q25a_D',
                  'q25b_reactant','q25b_product','q25c','q25d_1','q25d_2'];
  if (q25ids.some(id => document.getElementById(id)?.value?.trim())) answered.add('q25');

  // Q26 — text + number inputs
  const q26ids = ['q26a','q26b_working','q26b_answer','q26c',
                  'q26d_force','q26d_area','q26d_pressure','q26e'];
  if (q26ids.some(id => document.getElementById(id)?.value?.trim())) answered.add('q26');

  // Q27 — checkboxes + text/select fields
  const q27ids = ['q27b_1','q27b_2','q27c_type','q27c_expl','q27d_1','q27d_2'];
  const q27r   = document.querySelectorAll('input[name="q27a_renewable"]:checked').length   > 0;
  const q27nr  = document.querySelectorAll('input[name="q27a_nonrenewable"]:checked').length > 0;
  if (q27ids.some(id => document.getElementById(id)?.value?.trim()) || q27r || q27nr) answered.add('q27');

  return answered;
}

function updateProgress() {
  answeredQuestions = getAnsweredQuestions();
  const count = answeredQuestions.size;
  const pct   = (count / TOTAL_QUESTIONS) * 100;

  document.getElementById('answered-count').textContent = count;
  document.getElementById('progress-fill').style.width  = `${pct}%`;
  document.getElementById('fp-text').textContent        = `${count} / ${TOTAL_QUESTIONS} answered`;
  document.getElementById('fp-fill').style.width        = `${pct}%`;

  const submitAnswered = document.getElementById('submit-answered');
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
      submitted_at:           timestamp,
      time_remaining_seconds: timerRemaining,
      time_spent_seconds:     TIMER_SECONDS - timerRemaining,
      answered_count:         answeredQuestions.size,
      total_questions:        TOTAL_QUESTIONS
    },
    answers: {
      // Part A
      q1: getRadio('q1'), q2: getRadio('q2'), q3: getRadio('q3'),
      q4: getRadio('q4'), q5: getRadio('q5'),
      // Part B
      q6:  getRadio('q6'),  q7:  getRadio('q7'),  q8:  getRadio('q8'),
      q9:  getRadio('q9'),  q10: getRadio('q10'), q11: getRadio('q11'),
      q12: getRadio('q12'), q13: getRadio('q13'), q14: getRadio('q14'),
      q15: getRadio('q15'), q16: getRadio('q16'), q17: getRadio('q17'),
      q18: getRadio('q18'), q19: getRadio('q19'), q20: getRadio('q20'),
      // Part C
      q21: {
        a_reactions_releasing_heat: getCheckboxValues('q21a'),
        b_reaction_B_temp_change:   getVal('q21b_temp_change'),
        b_reaction_B_type:          getVal('q21b_type'),
        b_reaction_C_temp_change:   getVal('q21c_temp_change'),
        b_reaction_C_type:          getVal('q21c_type'),
        c_self_heating_can:         getRadio('q21c_app')
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
        b_force_A_name:             getVal('q23b_A'),
        b_force_B_name:             getVal('q23b_B'),
        c_parachute_force_A:        getRadio('q23c')
      },
      // Part D
      q24: {
        a_part_A:            getVal('q24a_A'),
        a_particle_B:        getVal('q24a_B'),
        b_blank_1:           getVal('q24b_1'),
        b_blank_2:           getVal('q24b_2'),
        b_blank_3:           getVal('q24b_3'),
        b_blank_4:           getVal('q24b_4'),
        c_two_differences:   getCheckboxValues('q24c'),
        d_why_models_change: getVal('q24d')
      },
      q25: {
        a_metal_A:         getVal('q25a_A'),
        a_metal_B:         getVal('q25a_B'),
        a_metal_C:         getVal('q25a_C'),
        a_metal_D:         getVal('q25a_D'),
        b_reactant:        getVal('q25b_reactant'),
        b_product:         getVal('q25b_product'),
        c_gold_unreactive: getVal('q25c'),
        d_substance_1:     getVal('q25d_1'),
        d_substance_2:     getVal('q25d_2')
      },
      q26: {
        a_principle_of_moments: getVal('q26a'),
        b_working:              getVal('q26b_working'),
        b_answer_N:             getNum('q26b_answer'),
        c_longer_spanner:       getVal('q26c'),
        d_force:                getNum('q26d_force'),
        d_area:                 getNum('q26d_area'),
        d_pressure:             getNum('q26d_pressure'),
        e_larger_area:          getVal('q26e')
      },
      q27: {
        a_renewable:    getCheckboxValues('q27a_renewable'),
        a_nonrenewable: getCheckboxValues('q27a_nonrenewable'),
        b_reason_1:     getVal('q27b_1'),
        b_reason_2:     getVal('q27b_2'),
        c_type:         getVal('q27c_type'),
        c_explanation:  getVal('q27c_expl'),
        d_product_1:    getVal('q27d_1'),
        d_product_2:    getVal('q27d_2')
      }
    }
  };
}

/* ─────────────────────────────────────────────────────────────
   AUTOSAVE
───────────────────────────────────────────────────────────── */
function autosave() {
  try {
    sessionStorage.setItem(AUTOSAVE_KEY, JSON.stringify(buildPayload()));
  } catch (e) {
    // best-effort; sessionStorage may be unavailable in some contexts
  }
}

function restoreDraft() {
  try {
    const raw = sessionStorage.getItem(AUTOSAVE_KEY);
    if (!raw) return;
    const saved   = JSON.parse(raw);
    const answers = saved?.answers;
    if (!answers) return;

    // Restore Part A & B radios
    for (let i = 1; i <= 20; i++) {
      const val = answers[`q${i}`];
      if (val) {
        const el = document.querySelector(`input[name="q${i}"][value="${val}"]`);
        if (el) el.checked = true;
      }
    }

    // Helpers
    const setVal = (id, val) => {
      if (val == null) return;
      const el = document.getElementById(id);
      if (el) el.value = val;
    };
    const setRadio = (name, val) => {
      if (val == null) return;
      const el = document.querySelector(`input[name="${name}"][value="${val}"]`);
      if (el) el.checked = true;
    };
    const setCheckboxes = (name, vals) => {
      if (!Array.isArray(vals)) return;
      vals.forEach(v => {
        const el = document.querySelector(`input[name="${name}"][value="${v}"]`);
        if (el) el.checked = true;
      });
    };

    // Q21
    if (answers.q21) {
      setCheckboxes('q21a',      answers.q21.a_reactions_releasing_heat);
      setVal('q21b_temp_change', answers.q21.b_reaction_B_temp_change);
      setVal('q21b_type',        answers.q21.b_reaction_B_type);
      setVal('q21c_temp_change', answers.q21.b_reaction_C_temp_change);
      setVal('q21c_type',        answers.q21.b_reaction_C_type);
      setRadio('q21c_app',       answers.q21.c_self_heating_can);
    }

    // Q22
    if (answers.q22) {
      setRadio('q22a', answers.q22.a_pattern);
      setVal('q22b_1', answers.q22.b_blank_1);
      setVal('q22b_2', answers.q22.b_blank_2);
      setVal('q22b_3', answers.q22.b_blank_3);
      setRadio('q22c', answers.q22.c_dry_air);
    }

    // Q23
    if (answers.q23) {
      setRadio('q23a',  answers.q23.a_terminal_velocity_motion);
      setVal('q23b_A',  answers.q23.b_force_A_name);
      setVal('q23b_B',  answers.q23.b_force_B_name);
      setRadio('q23c',  answers.q23.c_parachute_force_A);
    }

    // Q24
    if (answers.q24) {
      setVal('q24a_A',  answers.q24.a_part_A);
      setVal('q24a_B',  answers.q24.a_particle_B);
      setVal('q24b_1',  answers.q24.b_blank_1);
      setVal('q24b_2',  answers.q24.b_blank_2);
      setVal('q24b_3',  answers.q24.b_blank_3);
      setVal('q24b_4',  answers.q24.b_blank_4);
      setCheckboxes('q24c', answers.q24.c_two_differences);
      setVal('q24d',    answers.q24.d_why_models_change);
    }

    // Q25 — explicit per-field restore (all 4 metal identification inputs)
    if (answers.q25) {
      setVal('q25a_A',        answers.q25.a_metal_A);
      setVal('q25a_B',        answers.q25.a_metal_B);
      setVal('q25a_C',        answers.q25.a_metal_C);
      setVal('q25a_D',        answers.q25.a_metal_D);
      setVal('q25b_reactant', answers.q25.b_reactant);
      setVal('q25b_product',  answers.q25.b_product);
      setVal('q25c',          answers.q25.c_gold_unreactive);
      setVal('q25d_1',        answers.q25.d_substance_1);
      setVal('q25d_2',        answers.q25.d_substance_2);
    }

    // Q26
    if (answers.q26) {
      setVal('q26a',          answers.q26.a_principle_of_moments);
      setVal('q26b_working',  answers.q26.b_working);
      setVal('q26b_answer',   answers.q26.b_answer_N);
      setVal('q26c',          answers.q26.c_longer_spanner);
      setVal('q26d_force',    answers.q26.d_force);
      setVal('q26d_area',     answers.q26.d_area);
      setVal('q26d_pressure', answers.q26.d_pressure);
      setVal('q26e',          answers.q26.e_larger_area);
    }

    // Q27
    if (answers.q27) {
      setCheckboxes('q27a_renewable',    answers.q27.a_renewable);
      setCheckboxes('q27a_nonrenewable', answers.q27.a_nonrenewable);
      setVal('q27b_1',    answers.q27.b_reason_1);
      setVal('q27b_2',    answers.q27.b_reason_2);
      setVal('q27c_type', answers.q27.c_type);
      setVal('q27c_expl', answers.q27.c_explanation);
      setVal('q27d_1',    answers.q27.d_product_1);
      setVal('q27d_2',    answers.q27.d_product_2);
    }

  } catch (e) {
    // draft restore is best-effort
  }
}

/* ─────────────────────────────────────────────────────────────
   INPUT VISUAL SYNC
   Adds / removes the .checked CSS class on the wrapping <label>
   so that the fallback CSS rules in style.css take effect in
   browsers that do not support :has().
   Handles both checkbox and radio inputs.
───────────────────────────────────────────────────────────── */
function syncInputStyles(input) {
  const label = input.closest('label');
  if (!label) return;

  if (input.type === 'checkbox') {
    label.classList.toggle('checked', input.checked);

  } else if (input.type === 'radio' && input.checked) {
    // Clear .checked from every option in this radio group first
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
  document.getElementById('modal-answered').textContent   = count;
  document.getElementById('modal-unanswered').textContent = TOTAL_QUESTIONS - count;
  document.getElementById('modal-time').textContent       = formatTime(timerRemaining);
  document.getElementById('modal-overlay').classList.add('open');
}

function closeModal() {
  document.getElementById('modal-overlay').classList.remove('open');
}

async function confirmSubmit() {
  closeModal();
  clearInterval(timerInterval);

  const payload = buildPayload();
  console.log('[SciSpark] Assessment payload:', JSON.stringify(payload, null, 2));

  // ── Plug in your submission endpoint here ───────────────────
  //
  //   const res = await fetch('/api/assessments/submit', {
  //     method: 'POST',
  //     headers: { 'Content-Type': 'application/json' },
  //     body: JSON.stringify(payload)
  //   });
  //
  // payload.meta.time_spent_seconds  — total seconds elapsed
  // payload.meta.answered_count      — questions with at least one field filled
  // payload.answers                  — all fields, stable keys, null if unanswered
  //
  // ─────────────────────────────────────────────────────────────

  sessionStorage.removeItem(AUTOSAVE_KEY);
  document.getElementById('success-screen').classList.add('open');
}

function autoSubmit() {
  // Timer expired — capture whatever has been answered
  const payload = buildPayload();
  console.log('[SciSpark] Auto-submit (time expired):', JSON.stringify(payload, null, 2));
  sessionStorage.removeItem(AUTOSAVE_KEY);
  document.getElementById('success-screen').classList.add('open');
}

/* ─────────────────────────────────────────────────────────────
   INIT
───────────────────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {

  // 1. Restore any saved draft from sessionStorage
  restoreDraft();

  // 2. Re-apply .checked classes to any inputs restored above
  //    (setVal / el.checked = true doesn't fire change events)
  document.querySelectorAll('input[type="radio"]:checked, input[type="checkbox"]:checked')
    .forEach(syncInputStyles);

  // 3. Initial progress update (reads both restored and fresh state)
  updateProgress();

  // 4. Start the 45-minute countdown
  startTimer();

  // 5. Periodic autosave every 15 s
  setInterval(autosave, AUTOSAVE_INTERVAL_MS);

  // ── Field change tracking ─────────────────────────────────────
  document.addEventListener('change', (e) => {
    if (e.target.matches('input, select, textarea')) {
      syncInputStyles(e.target);
      updateProgress();
      autosave();
    }
  });

  // Real-time progress update on text / number typing
  document.addEventListener('input', (e) => {
    if (e.target.matches('input[type="text"], input[type="number"], textarea')) {
      updateProgress();
    }
  });

  // ── Q24c: enforce maximum 2 checkbox selections ───────────────
  // The question says "Tick TWO" — silently prevent selecting a third option.
  document.querySelectorAll('input[name="q24c"]').forEach(cb => {
    cb.addEventListener('change', () => {
      if (!cb.checked) return; // unchecking is always allowed
      const checkedCount = document.querySelectorAll('input[name="q24c"]:checked').length;
      if (checkedCount > 2) {
        cb.checked = false;
        cb.closest('label')?.classList.remove('checked');
        // Brief shake on the question block as visual feedback
        const block = document.getElementById('qblock-24');
        if (block) {
          block.classList.add('limit-reached');
          setTimeout(() => block.classList.remove('limit-reached'), 900);
        }
      }
    });
  });

  // ── Submit controls ───────────────────────────────────────────
  document.getElementById('submit-btn')
    .addEventListener('click', openModal);
  document.getElementById('submit-btn-sm')
    .addEventListener('click', openModal);
  document.getElementById('modal-cancel')
    .addEventListener('click', closeModal);
  document.getElementById('modal-confirm')
    .addEventListener('click', confirmSubmit);
  document.getElementById('modal-overlay')
    .addEventListener('click', (e) => {
      if (e.target === document.getElementById('modal-overlay')) closeModal();
    });

  // Escape closes modal
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeModal();
  });

  // Warn before closing/refreshing with unsaved answers
  window.addEventListener('beforeunload', (e) => {
    if (answeredQuestions.size > 0) {
      e.preventDefault();
      e.returnValue = '';
    }
  });

  // ── Q26d: auto-calculate pressure once force and area are set ──
  const q26dForce    = document.getElementById('q26d_force');
  const q26dArea     = document.getElementById('q26d_area');
  const q26dPressure = document.getElementById('q26d_pressure');

  if (q26dForce && q26dArea && q26dPressure) {
    const calcPressure = () => {
      const f = parseFloat(q26dForce.value);
      const a = parseFloat(q26dArea.value);
      // Only auto-fill if both are valid numbers and pressure box is still empty
      if (!isNaN(f) && !isNaN(a) && a !== 0 && !q26dPressure.value) {
        q26dPressure.value = (f / a).toFixed(2);
        updateProgress();
        autosave();           // capture the auto-filled value immediately
      }
    };
    q26dForce.addEventListener('change', calcPressure);
    q26dArea.addEventListener('change',  calcPressure);
  }
});
