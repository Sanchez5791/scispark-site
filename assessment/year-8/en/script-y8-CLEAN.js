/**
 * SciSpark Year 8 Entry Assessment
 * script-y8.js v3 â€” AI Auto-Marking enabled
 *
 * Changes from v2:
 * - BACKEND_ENABLED = true
 * - After submission: calls mark-y8-assessment Edge Function
 * - Success screen shows student's score
 */

'use strict';

/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ CONFIG â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
const TOTAL_MARKS     = 60;
const TOTAL_QUESTIONS = 27;
const TIMER_SECONDS   = 45 * 60;
const AUTOSAVE_KEY    = 'scispark_y8_draft';
const AUTOSAVE_INTERVAL_MS = 15000;

/* NOW LIVE */
const BACKEND_ENABLED = true;

const SUPABASE_URL       = 'https://yffuaoibxeggwxcfvfh.supabase.co';
const SUPABASE_ANON_KEY  = 'sb_publishable_OOrhuk8oqIbNLg3Wxo6fzQ_7z4sloKJ';

/* Edge Function URL for marking */
const MARK_FUNCTION_URL  = `${SUPABASE_URL}/functions/v1/mark-y8-assessment`;

let supabaseClient = null;
if (window.supabase) {
  supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}

/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ STATE â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
let timerRemaining    = TIMER_SECONDS;
let timerInterval     = null;
let answeredQuestions = new Set();
let isSubmitting      = false;

/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ TIMER â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
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

/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ PROGRESS TRACKING â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
function getAnsweredQuestions() {
  const answered = new Set();

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

  const partB = [
    { q: 'q6',  name: 'Y8_QB1_answer' },
    { q: 'q7',  name: 'Y8_QB2_answer' },
    { q: 'q8',  name: 'Y8_QB3_answer' },
    { q: 'q9',  name: 'q9' },
    { q: 'q10', name: 'Y8_QB5_answer' },
    { q: 'q11', name: 'q11' },
    { q: 'q12', name: 'q12' },
    { q: 'q13', name: 'q13' },
    { q: 'q14', name: 'Y8_QB9_answer' },
    { q: 'q15', name: 'q15' },
    { q: 'q16', name: 'q16' },
    { q: 'q17', name: 'Y8_QB12_answer' },
    { q: 'q18', name: 'q18' },
    { q: 'q19', name: 'Y8_QB14_answer' },
    { q: 'q20', name: 'q20' },
  ];
  partB.forEach(({ q, name }) => {
    if (document.querySelector(`input[name="${name}"]:checked`)) answered.add(q);
  });

  const q21fields  = ['Y8_QC1_a_100','Y8_QC1_a_400','Y8_QC1_a_900','Y8_QC1_a_1600','Y8_QC1_b_reason'];
  const q21radios  = ['Y8_QC1_b_yesno','Y8_QC1_c_answer'];
  if (
    q21fields.some(id => document.getElementById(id)?.value?.trim()) ||
    q21radios.some(name => document.querySelector(`input[name="${name}"]:checked`))
  ) answered.add('q21');

  const q22radios = ['Y8_QC2_a_answer','Y8_QC2_b_answer'];
  const q22cbAnswered = document.querySelectorAll('input[name="Y8_QC2_c_answer"]:checked').length > 0;
  if (
    q22radios.some(name => document.querySelector(`input[name="${name}"]:checked`)) || q22cbAnswered
  ) answered.add('q22');

  const q23radios = ['Y8_QC3_a_answer'];
  const q23cbAnswered = document.querySelectorAll('input[name="Y8_QC3_b_answer"]:checked').length > 0;
  const q23texts  = ['Y8_QC3_c_answer','Y8_QC3_d_answer'];
  if (
    q23radios.some(name => document.querySelector(`input[name="${name}"]:checked`)) ||
    q23cbAnswered ||
    q23texts.some(id => document.getElementById(id)?.value?.trim())
  ) answered.add('q23');

  const q24radios = [
    'Y8_QD1_a_baking','Y8_QD1_a_condense','Y8_QD1_a_boil','Y8_QD1_a_burn',
    'Y8_QD1_a_digest','Y8_QD1_a_rust','Y8_QD1_a_filter','Y8_QD1_a_dissolve'
  ];
  const q24bVal = document.getElementById('Y8_QD1_b_answer')?.value?.trim();
  if (
    q24radios.some(name => document.querySelector(`input[name="${name}"]:checked`)) || q24bVal
  ) answered.add('q24');

  const q25radio   = document.querySelector('input[name="Y8_QD2_a_answer"]:checked');
  const q25selects = ['Y8_QD2_b_pos1','Y8_QD2_b_pos2','Y8_QD2_b_pos3','Y8_QD2_b_pos4',
                      'Y8_QD2_e_mice','Y8_QD2_e_snake','Y8_QD2_e_eagle'];
  const q25cVal    = document.getElementById('Y8_QD2_c_answer')?.value?.trim();
  const q25dRadio  = document.querySelector('input[name="Y8_QD2_d_answer"]:checked');
  if (
    q25radio || q25cVal || q25dRadio ||
    q25selects.some(id => document.getElementById(id)?.value)
  ) answered.add('q25');

  const q26selects = ['Y8_QD3_a_stir','Y8_QD3_a_water','Y8_QD3_a_temp','Y8_QD3_a_chloride'];
  const q26tableFields = [
    'Y8_QD3_b_heading','Y8_QD3_b_row1','Y8_QD3_b_row2',
    'Y8_QD3_b_row3','Y8_QD3_b_row4','Y8_QD3_b_row5'
  ];
  if (
    q26selects.some(id => document.getElementById(id)?.value) ||
    q26tableFields.some(id => document.getElementById(id)?.value?.trim())
  ) answered.add('q26');

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
  if (answeredCount)  answeredCount.textContent  = count;
  if (progressFill)   progressFill.style.width   = `${pct}%`;
  if (fpText)         fpText.textContent          = `${count} / ${TOTAL_QUESTIONS} answered`;
  if (fpFill)         fpFill.style.width          = `${pct}%`;
  if (submitAnswered) submitAnswered.textContent  = `${count} of ${TOTAL_QUESTIONS}`;
  document.querySelectorAll('.question-block').forEach(block => {
    const qid = block.id.replace('qblock-', 'q');
    block.classList.toggle('answered', answeredQuestions.has(qid));
  });
}

function buildPayload() {
  const timestamp = new Date().toISOString();
  const getRadio = (name) => { const el = document.querySelector(`input[name="${name}"]:checked`); return el ? el.value : null; };
  const getCheckboxValues = (name) => [...document.querySelectorAll(`input[name="${name}"]:checked`)].map(el => el.value);
  const getVal = (id) => document.getElementById(id)?.value?.trim() || null;
  return { meta: { assessment: 'Y8-Entry', assessment_code: 'Y8_ENTRY_ASSESSMENT', year_group: 'Year 8', language: document.documentElement.lang === 'zh' ? 'ZH' : 'EN', submitted_at: timestamp, time_remaining_seconds: timerRemaining, time_spent_seconds: TIMER_SECONDS - timerRemaining, total_questions: TOTAL_QUESTIONS, total_marks: TOTAL_MARKS, backend_enabled: BACKEND_ENABLED }, answers: { q1: getRadio('q1'), q2: getRadio('Y8_QA2_answer'), q3: getRadio('q3'), q4: getRadio('q4'), q5: getRadio('q5'), q6: getRadio('Y8_QB1_answer'), q7: getRadio('Y8_QB2_answer'), q8: getRadio('Y8_QB3_answer'), q9: getRadio('q9'), q10: getRadio('Y8_QB5_answer'), q11: getRadio('q11'), q12: getRadio('q12'), q13: getRadio('q13'), q14: getRadio('Y8_QB9_answer'), q15: getRadio('q15'), q16: getRadio('q16'), q17: getRadio('Y8_QB12_answer'), q18: getRadio('q18'), q19: getRadio('Y8_QB14_answer'), q20: getRadio('q20'), q21: { avg_100: getVal('Y8_QC1_a_100'), avg_400: getVal('Y8_QC1_a_400'), avg_900: getVal('Y8_QC1_a_900'), avg_1600: getVal('Y8_QC1_a_1600'), b_yesno: getRadio('Y8_QC1_b_yesno'), b_reason: getVal('Y8_QC1_b_reason'), c_dir: getRadio('Y8_QC1_c_answer') }, q22: { a: getRadio('Y8_QC2_a_answer'), b: getRadio('Y8_QC2_b_answer'), c: getCheckboxValues('Y8_QC2_c_answer') }, q23: { a: getRadio('Y8_QC3_a_answer'), b: getCheckboxValues('Y8_QC3_b_answer'), c: getVal('Y8_QC3_c_answer'), d: getVal('Y8_QC3_d_answer') }, q24: { baking: getRadio('Y8_QD1_a_baking'), condense: getRadio('Y8_QD1_a_condense'), boil: getRadio('Y8_QD1_a_boil'), burn: getRadio('Y8_QD1_a_burn'), digest: getRadio('Y8_QD1_a_digest'), rust: getRadio('Y8_QD1_a_rust'), filter: getRadio('Y8_QD1_a_filter'), dissolve: getRadio('Y8_QD1_a_dissolve'), b: getVal('Y8_QD1_b_answer') }, q25: { a: getRadio('Y8_QD2_a_answer'), pos1: getVal('Y8_QD2_b_pos1'), pos2: getVal('Y8_QD2_b_pos2'), pos3: getVal('Y8_QD2_b_pos3'), pos4: getVal('Y8_QD2_b_pos4'), c: getVal('Y8_QD2_c_answer'), d: getRadio('Y8_QD2_d_answer'), mice: getVal('Y8_QD2_e_mice'), snake: getVal('Y8_QD2_e_snake'), eagle: getVal('Y8_QD2_e_eagle') }, q26: { stir: getVal('Y8_QD3_a_stir'), water: getVal('Y8_QD3_a_water'), temp: getVal('Y8_QD3_a_temp'), chloride: getVal('Y8_QD3_a_chloride'), heading: getVal('Y8_QD3_b_heading'), row1: getVal('Y8_QD3_b_row1'), row2: getVal('Y8_QD3_b_row2'), row3: getVal('Y8_QD3_b_row3'), row4: getVal('Y8_QD3_b_row4'), row5: getVal('Y8_QD3_b_row5') }, q27: { a: getVal('Y8_QD4_a_answer'), b: getVal('Y8_QD4_b_answer'), c: getVal('Y8_QD4_c_answer'), d: getVal('Y8_QD4_d_answer'), e: getVal('Y8_QD4_e_answer') } } };
}

function getStudentIdFromUrl() { const params = new URLSearchParams(window.location.search); return params.get('student_id') || params.get('studentId'); }

function flattenAnswers(answers) {
  const rows = [];
  Object.entries(answers).forEach(([questionKey, value]) => {
    if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
      Object.entries(value).forEach(([fieldName, fieldValue]) => {
        rows.push({ question_number: questionKey, field_name: fieldName, answer_value: Array.isArray(fieldValue) ? JSON.stringify(fieldValue) : (fieldValue == null ? null : String(fieldValue)) });
      });
    } else {
      rows.push({ question_number: questionKey, field_name: questionKey, answer_value: Array.isArray(value) ? JSON.stringify(value) : (value == null ? null : String(value)) });
    }
  });
  return rows;
}

aŞ[˜È[˜İ[ÛˆİX›Z]Ôİ\X˜\ÙJ^[ØY
HÂˆYˆ
PPÒÑS‘ÑSP“Q
HÈÛÛœÛÛK›ÙÊ	ÖÔØÚTÜ\šÈNHÚÚ\[™ÉÊNÈ™]\›ˆ	ÑQ•Ó“×ĞPÒÑS‘	ÎÈBˆYˆ
\İ\X˜\ÙPÛY[
H›İÈ™]È\œ›ÜŠ	Ôİ\X˜\ÙHXœ˜\H›İØYY‰ÊNÂˆÛÛœİİY[YHÙ]İY[Yœ›ÛU\›

NÂˆYˆ
\İY[Y
H›İÈ™]È\œ›ÜŠ	ÓZ\ÜÚ[™ÈİY[ÚY[ˆT“‰ÊNÂˆÛÛœİÈ]NˆÙ\ÜÚ[Û‘]K\œ›ÜˆÙ\ÜÚ[Û‘\œ›ÜˆHH]ØZ]İ\X˜\ÙPÛY[˜]]™Ù]Ù\ÜÚ[ÛŠ
NÂˆYˆ
Ù\ÜÚ[Û‘\œ›ÜŠH›İÈÙ\ÜÚ[Û‘\œ›ÜÂˆYˆ
\Ù\ÜÚ[Û‘]OËœÙ\ÜÚ[ÛŠH›İÈ™]È\œ›ÜŠ	Ó›ÈXİ]™HÙÚ[ˆÙ\ÜÚ[Û‹‰ÊNÂˆÛÛœİÈ]Nˆ][\\œ›Üˆ][\\œ›ÜˆHH]ØZ]İ\X˜\ÙPÛY[™œ›ÛJ	Ø\ÜÙ\ÜÛY[Ø][\ÉÊKš[œÙ\
ÈİY[ÚYˆİY[YYX\—ÙÜ›İ\ˆ^[ØY›Y]KYX\—ÙÜ›İ\[™İXYÙNˆ^[ØY›Y]K›[™İXYÙK\ÜÙ\ÜÛY[ØÛÙNˆ^[ØY›Y]K˜\ÜÙ\ÜÛY[ØÛÙKİ]\Îˆ	ÜİX›Z]Y	Ëİ[Ü]Y\İ[ÛœÎˆ^[ØY›Y]Kİ[Ü]Y\İ[ÛœËİ[ÛX\šÜÎˆ^[ØY›Y]Kİ[ÛX\šÜËİX›Z]YØ]ˆ^[ØY›Y]KœİX›Z]YØ][YWÜÜ[ÜÙXÛÛ™Îˆ^[ØY›Y]K[YWÜÜ[ÜÙXÛÛ™ËXXÚ\—Ü™]šY]×Üİ]\Îˆ	Ü[™[™ÉËZWÛX\šÚ[™×Üİ]\Îˆ	Ü[™[™ÉÈJKœÙ[Xİ
	ÚY	ÊKœÚ[™ÛJ
NÂˆYˆ
][\\œ›ÜŠH›İÈ][\\œ›ÜÂˆÛÛœİ[œİÙ\”›İÜÈH›][[œİÙ\œÊ^[ØY˜[œİÙ\œÊK›X\
›İÈOˆ
È][\ÚYˆ][\šY]Y\İ[Û—Û[X™\ˆ›İËœ]Y\İ[Û—Û[X™\‹šY[Û˜[YNˆ›İË™šY[Û˜[YK[œİÙ\—İ˜[YNˆ›İË˜[œİÙ\—İ˜[YHJJNÂˆÛÛœİÈ\œ›Üˆ[œİÙ\œÑ\œ›ÜˆHH]ØZ]İ\X˜\ÙPÛY[™œ›ÛJ	Ø\ÜÙ\ÜÛY[Ø[œİÙ\œÉÊKš[œÙ\
[œİÙ\”›İÜÊNÂˆYˆ
[œİÙ\œÑ\œ›ÜŠH›İÈ[œİÙ\œÑ\œ›ÜÂˆ™]\›ˆ][\šYÂŸB‚˜G7–æ2gVæ7F–öâ6ÆÄÖ&¶–ætgVæ7F–öâ†GFV×D–B’°¢–b‚$4´TäEôTä$ÄTBÇÂGFV×D–BÓÓÒtE$eEôäõô$4´TäBr’&WGW&âçVÆÃ°¢6öç7B²FF¢6W76–öäFFÒÒv—B7W&6T6Æ–VçBæWF‚ævWE6W76–öâ‚“°¢6öç7BFö¶VâÒ6W76–öäFFòç6W76–öãòæ66W75÷Fö¶Vâóòrs°¢6öç7B&W2Òv—BfWF6‚„Ô$µôeTä5D”ôåõU$ÂÂ²ÖWF†öC¢uõ5BrÂ†VFW'3¢²t6öçFVçBÕG—Rs¢vÆ–6F–öâö§6öârÂtWF†÷&—¦F–öâs¢&V&W"G·Fö¶VçÖÂv–¶W’s¢5U$4Uôäôåô´U’ÒÂ&öG“¢¥4ôâç7G&–æv–g’‡²GFV×Eö–C¢GFV×D–BÒ’Ò“°¢–b‚&W2æö²’²6öç6öÆRæW'&÷"‚uµ66•7&²“…ÒÖ&¶–ærW'&÷#¢rÂ&W2ç7FGW2“²&WGW&âçVÆÃ²Ğ¢&WGW&âv—B&W2æ§6öâ‚“°§Ğ ¦gVæ7F–öâ6†÷u66÷&Töå7V66W7567&VVâ‡66÷&W2’°¢–b‚66÷&W2’°¢6öç7B×6tVÂÒFö7VÖVçBævWDVÆVÖVçD'”–B‚w66÷&RÖ