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
    { q: 'q14', name: 'Y8_QB9answer' },
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
  return { meta: { assessment: 'Y8-Entry', assessment_code: 'Y8_ENTRY_ASSESSMENT', year_group: 'Year 8', language: document.documentElement.lang === 'zh' ? 'ZH' : 'EN', submitted_at: timestamp, time_remaining_seconds: timerRemaining, time_spent_seconds: TIMER_SECONDS - timerRemaining, total_questions: TOTAL_QUESTIONS, total_marks: TOTAL_MARKS, backend_enabled: BACKEND_ENABLED }, answers: { q1: getRadio('q1'), q2: getRadio('Y8_QA2_answer'), q3: getRadio('q3'), q4: getRadio('q4'), q5: getRadio('q5'), q6: getRadio('Y8_QB1_answer'), q7: getRadio('Y8_QB2_answer'), q8: getRadio('Y8_QB3_answer'), q9: getRadio('q9'), q10: getRadio('Y8_QB5_answer'), q11: getRadio('q11'), q12: getRadio('q12'), q13: getRadio('q13'), q14: getRadio('Y8_QB9answer'), q15: getRadio('q15'), q16: getRadio('q16'), q17: getRadio('Y8_QB12_answer'), q18: getRadio('q18'), q19: getRadio('Y8_QB14_answer'), q20: getRadio('q20'), q21: { avg_100: getVal('Y8_QC1_a_100'), avg_400: getVal('Y8_QC1_a_400'), avg_900: getVal('Y8_QC1_a_900'), avg_1600: getVal('Y8_QC1_a_1600'), b_yesno: getRadio('Y8_QC1_b_yesno'), b_reason: getVal('Y8_QC1_b_reason'), c_dir: getRadio('Y8_QC1_c_answer') }, q22: { a: getRadio('Y8_QC2_a_answer'), b: getRadio('Y8_QC2_b_answer'), c: getCheckboxValues('Y8_QC2_c_answer') }, q23: { a: getRadio('Y8_QC3_a_answer'), b: getCheckboxValues('Y8_QC3_b_answer'), c: getVal('Y8_QC3_c_answer'), d: getVal('Y8_QC3_d_answer') }, q24: { baking: getRadio('Y8_QD1_a_baking'), condense: getRadio('Y8_QD1_a_condense'), boil: getRadio('Y8_QD1_a_boil'), burn: getRadio('Y8_QD1_a_burn'), digest: getRadio('Y8_QD1_a_digest'), rust: getRadio('Y8_QD1_a_rust'), filter: getRadio('Y8_QD1_a_filter'), dissolve: getRadio('Y8_QD1_a_dissolve'), b: getVal('Y8_QD1_b_answer') }, q25: { a: getRadio('Y8_QD2_a_answer'), pos1: getVal('Y8_QD2_b_pos1'), pos2: getVal('Y8_QD2_b_pos2'), pos3: getVal('Y8_QD2_b_pos3'), pos4: getVal('Y8_QD2_b_pos4'), c: getVal('Y8_QD2_c_answer'), d: getRadio('Y8_QD2_d_answer'), mice: getVal('Y8_QD2_e_mice'), snake: getVal('Y8_QD2_e_snake'), eagle: getVal('Y8_QD2_e_eagle') }, q26: { stir: getVal('Y8_QD3_a_stir'), water: getVal('Y8_QD3_a_water'), temp: getVal('Y8_QD3_a_temp'), chloride: getVal('Y8_QD3_a_chloride'), heading: getVal('Y8_QD3_b_heading'), row1: getVal('Y8_QD3_b_row1'), row2: getVal('Y8_QD3_b_row2'), row3: getVal('Y8_QD3_b_row3'), row4: getVal('Y8_QD3_b_row4'), row5: getVal('Y8_QD3_b_row5') }, q27: { a: getVal('Y8_QD4_a_answer'), b: getVal('Y8_QD4_b_answer'), c: getVal('Y8_QD4_c_answer'), d: getVal('Y8_QD4_d_answer'), e: getVal('Y8_QD4_e_answer') } } };
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

async function submitToSupabase(payload) {
  if (!BACKEND_ENABLED) { console.log('[SciSpark Y8] BACKEND_ENABLED = false'); return 'DRAFT_NO_BACKEND'; }
  if (!supabaseClient) throw new Error('Supabase library not loaded.');
  const studentId = getStudentIdFromUrl();
  if (!studentId) throw new Error('Missing student_id in URL.');
  const { data: sessionData, error: sessionError } = await supabaseClient.auth.getSession();
  if (sessionError) throw sessionError;
  if (!sessionData?.session) throw new Error('No active login session.');
  const { data: attempt, error: attemptError } = await supabaseClient.from('assessment_attempts').insert({ student_id: studentId, year_group: payload.meta.year_group, language: payload.meta.language, assessment_code: payload.meta.assessment_code, status: 'submitted', total_questions: payload.meta.total_questions, total_marks: payload.meta.total_marks, submitted_at: payload.meta.submitted_at, time_spent_seconds: payload.meta.time_spent_seconds, teacher_review_status: 'pending', ai_marking_status: 'pending' }).select('id').single();
  if (attemptError) throw attemptError;
  const answerRows = flattenAnswers(payload.answers).map(row => ({ attempt_id: attempt.id, question_number: row.question_number, field_name: row.field_name, answer_value: row.answer_value }));
  const { error: answersError } = await supabaseClient.from('assessment_answers').insert(answerRows);
  if (answersError) throw answersError;
  return attempt.id;
}

aÞ[˜È[˜Ý[ÛˆØ[X\šÚ[™Ñ[˜Ý[ÛŠ][\Y
HÂˆYˆ
PPÒÑS‘ÑSP“Q][\YOOH	ÑQ•Ó“×ÐPÒÑS‘	ÊH™]\›ˆ[ÂˆÛÛœÝÈ]NˆÙ\ÜÚ[Û‘]HHH]ØZ]Ý\X˜\ÙPÛY[˜]]™Ù]Ù\ÜÚ[ÛŠ
NÂˆÛÛœÝÚÙ[ˆHÙ\ÜÚ[Û‘]OËœÙ\ÜÚ[ÛË˜XØÙ\Ü×ÝÚÙ[ˆÏÈ	ÉÎÂˆÛÛœÝ™\ÈH]ØZ]™]Ú
PT’×Ñ•SÕSÓ—ÕT“ÈY]Ùˆ	ÔÔÕ	ËXY\œÎˆÈ	ÐÛÛ[U\IÎˆ	Ø\XØ][Û‹ÚœÛÛ‰Ë	Ð]]Üš^˜][Û‰Îˆ™X\™\ˆ	ÝÚÙ[ŸX	Ø\ZÙ^IÎˆÕTPTÑWÐS“Ó—ÒÑVHK›ÙNˆ”ÓÓ‹œÝš[™ÚYžJÈ][\ÚYˆ][\YJHJNÂˆYˆ
\™\Ë›ÚÊHÈÛÛœÛÛK™\œ›ÜŠ	ÖÔØÚTÜ\šÈNHX\šÚ[™È\œ›ÜŽ‰Ë™\ËœÝ]\ÊNÈ™]\›ˆ[ÈBˆ™]\›ˆ]ØZ]™\ËšœÛÛŠ
NÂŸB‚™[˜Ý[ÛˆÚÝÔØÛÜ™SÛ”ÝXØÙ\ÜÔØÜ™Y[ŠØÛÜ™\ÊHÂˆYˆ
\ØÛÜ™\ÊHÂˆÛÛœÝ\ÙÑ[HØÝ[Y[™Ù][[Y[žRY
	ÜØÛÜ™KY\Ü^IÊNÂˆYˆ
\ÙÑ[
H\ÙÑ[š[›™\’SH	ÏÝ[OH˜ÛÛÜŽˆÍMMNÙ›Û\Ú^™NŒM\ÛX\™Ú[‹]ÜŒLœ–[Ý\ˆ[œÝÙ\œÈ]™H™Y[ˆØ]™Yˆ[Ý\ˆ™\Ý[ÈÚ[™H]˜Z[X›HÚÜKÜ‰ÎÂˆ™]\›ŽÂˆBˆÛÛœÝÈXÜK\ØË\ÙÝ[Ý]ÛÙˆHHØÛÜ™\ÎÂˆÛÛœÝÝHX]œ›Ý[™

Ý[ÈÝ]ÛÙŠH
ˆL
NÂˆÛÛœÝ]™[HÝ[H

HÈ	Ó]™[ÉÈˆÝ[HÌÈ	Ó]™[‰Èˆ	Ó]™[IÎÂˆÛÛœÝÛÛÜˆHÝ[H

HÈ	ÈÌ™MÙÌ‰ÈˆÝ[HÌÈ	ÈÙMLL	Èˆ	ÈØÍŒŽŽ	ÎÂˆÛÛœÝØÛÜ™R[H]ˆYHœØÛÜ™KY\Ü^HˆÝ[OH›X\™Ú[‹]ÜŒŒÜY[™ÎŒŒØ˜XÚÙÜ›Ý[™ˆÙŽYŽYŽNØ›Ü™\‹\˜Y]\ÎŒLÝ^X[YÛŽ˜Ù[\ˆ]ˆÝ[OH™›Û\Ú^™NœÙ›Û]ÙZYÚÌØÛÛÜŽ‰ØÛÛÜŸH‰ÝÝ[HÈ	ÛÝ]ÛÙŸOÙ]]ˆÝ[OH™›Û\Ú^™NŒNØÛÛÜŽˆÍ

ÛX\™Ú[‹]Ü‰ÜÝIHÝ›Û™Ï‰Û]™[OÜÝ›Û™ÏÙ]]ˆÝ[OH›X\™Ú[‹]ÜŒMÙ›Û\Ú^™NŒLÜØÛÛÜŽˆÍŽÙ\Ü^N™›^ÙØ\ŒNÚ\ÝYžKXÛÛ[˜Ù[\ŽÙ›^]Ü˜\Ü˜\Ü[”\JÐŽˆÝ›Û™Ï‰ÛXÜ_KÌŒÜÝ›Û™ÏÜÜ[Ü[”\ÎˆÝ›Û™Ï‰Ü\ØßKÌLÜÝ›Û™ÏÜÜ[Ü[”\ˆÝ›Û™Ï‰Ü\ÙKÌŽÜÝ›Û™ÏÜÜ[Ù]–[Ý\ˆXXÚ\ˆÚ[™]šY]È[Ý\ˆ[œÝÙ\œËÜÙ]˜ÂˆÛÛœÝÝXØÙ\ÜÔØÜ™Y[ˆHØÝ[Y[™Ù][[Y[žRY
	ÜÝXØÙ\ÜË\ØÜ™Y[‰ÊNÂˆYˆ
ÝXØÙ\ÜÔØÜ™Y[ŠHÈÛÛœÝ^HØÝ[Y[™Ù][[Y[žRY
	ÜØÛÜ™KY\Ü^IÊNÈYˆ
^
H^œ™[[Ý™J
NÈÝXØÙ\ÜÔØÜ™Y[‹š[œÙ\Y˜XÙ[SÉØ™Y›Ü™Y[™	ËØÛÜ™R[
NÈBŸB‚™[˜Ý[Ûˆ]]ÜØ]™J
HÈžHÈÙ\ÜÚ[Û”ÝÜ˜YÙKœÙ]][JUUÔÐU‘WÒÑVK”ÓÓ‹œÝš[™ÚYžJZ[^[ØY

JJNÈHØ]Ú
JHßHB‚™[˜Ý[ÛˆÞ[˜Ò[œ]Ý[\Ê[œ]
HÂˆÛÛœÝX™[H[œ]˜ÛÜÙ\Ý
	ÛX™[	ÊNÂˆYˆ
[X™[
H™]\›ŽÂˆYˆ
[œ]\HOOH	ØÚXÚØ›Þ	ÊHÈX™[˜Û\ÜÓ\ÝÙÙÛJ	ØÚXÚÙY	Ë[œ]˜ÚXÚÙY
NÈBˆ[ÙHYˆ
[œ]\HOOH	Ü˜Y[ÉÈ	‰ˆ[œ]˜ÚXÚÙY
HÈØÝ[Y[œ]Y\žTÙ[XÝÜ[
[œ]Û˜[YOH‰Ú[œ]›˜[Y_H—X
K™›Ü‘XXÚ
˜Y[ÈOˆÈÛÛœÝ›H˜Y[Ë˜ÛÜÙ\Ý
	ÛX™[	ÊNÈYˆ
›
H›˜Û\ÜÓ\Ýœ™[[Ý™J	ØÚXÚÙY	ÊNÈJNÈX™[˜Û\ÜÓ\Ý˜Y
	ØÚXÚÙY	ÊNÈBŸB‚™[˜Ý[ÛˆÜ[“[Ù[

HÂˆ\]T›ÙÜ™\ÜÊ
NÂˆÛÛœÝÛÝ[H[œÝÙ\™Y]Y\Ý[ÛœËœÚ^™NÂˆÛÛœÝ[Ù[[œÝÙ\™YHØÝ[Y[™Ù][[Y[žRY
	Û[Ù[X[œÝÙ\™Y	ÊNÂˆÛÛœÝ[Ù[[˜[œÝÙ\™YHØÝ[Y[™Ù][[Y[žRY
	Û[Ù[][˜[œÝÙ\™Y	ÊNÂˆÛÛœÝ[Ù[[YHHØÝ[Y[™Ù][[Y[žRY
	Û[Ù[][YIÊNÂˆÛÛœÝ[Ù[Ý™\›^HHØÝ[Y[™Ù][[Y[žRY
	Û[Ù[[Ý™\›^IÊNÂˆYˆ
[Ù[[œÝÙ\™Y
H[Ù[[œÝÙ\™Y^ÛÛ[HÛÝ[ÂˆYˆ
[Ù[[˜[œÝÙ\™Y
H[Ù[[˜[œÝÙ\™Y^ÛÛ[HÕSÔUQTÕSÓ”ÈHÛÝ[ÂˆYˆ
[Ù[[YJH[Ù[[YK^ÛÛ[H›Ü›X][YJ[Y\”™[XZ[š[™ÊNÂˆYˆ
[Ù[Ý™\›^JH[Ù[Ý™\›^K˜Û\ÜÓ\Ý˜Y
	ÛÜ[‰ÊNÂŸB‚™[˜Ý[ÛˆÛÜÙS[Ù[

HÈØÝ[Y[™Ù][[Y[žRY
	Û[Ù[[Ý™\›^IÊOË˜Û\ÜÓ\Ýœ™[[Ý™J	ÛÜ[‰ÊNÈB‚˜\Þ[˜È[˜Ý[ÛˆÛÛ™š\›TÝX›Z]

HÂˆYˆ
\ÔÝX›Z][™ÊH™]\›ŽÂˆ\ÔÝX›Z][™ÈHYNÂˆÛÛœÝÛÛ™š\›PˆHØÝ[Y[™Ù][[Y[žRY
	Û[Ù[XÛÛ™š\›IÊNÂˆYˆ
ÛÛ™š\›PŠHÈÛÛ™š\›P‹™\ØX›YHYNÈÛÛ™š\›P‹^ÛÛ[H	ÔÝX›Z][™Ë‹‹‰ÎÈBˆžHÂˆÛÜÙS[Ù[

NÂˆÛX\’[\˜[
[Y\’[\˜[
NÂˆÛÛœÝ^[ØYHZ[^[ØY

NÂˆÛÛœÝ][\YH]ØZ]ÝX›Z]ÔÝ\X˜\ÙJ^[ØY
NÂˆÙ\ÜÚ[Û”ÝÜ˜YÙKœ™[[Ý™R][JUUÔÐU‘WÒÑVJNÂˆØÝ[Y[™Ù][[Y[žRY
	ÜÝXØÙ\ÜË\ØÜ™Y[‰ÊOË˜Û\ÜÓ\Ý˜Y
	ÛÜ[‰ÊNÂˆÚÝÔØÛÜ™SÛ”ÝXØÙ\ÜÔØÜ™Y[Š[
NÂˆØ[X\šÚ[™Ñ[˜Ý[ÛŠ][\Y
K[Š™\Ý[OˆÈYˆ
™\Ý[ËœÝXØÙ\ÜÊHÚÝÔØÛÜ™SÛ”ÝXØÙ\ÜÔØÜ™Y[Š™\Ý[œØÛÜ™\ÊNÈ[ÙHÚÝÔØÛÜ™SÛ”ÝXØÙ\ÜÔØÜ™Y[Š[
NÈJK˜Ø]Ú
\œˆOˆÈÛÛœÛÛK™\œ›ÜŠ	ÖÔØÚTÜ\šÈNHX\šÚ[™È˜Z[Y‰Ë\œŠNÈÚÝÔØÛÜ™SÛ”ÝXØÙ\ÜÔØÜ™Y[Š[
NÈJNÂˆHØ]Ú
\œ›ÜŠHÂˆÛÛœÛÛK™\œ›ÜŠ	ÖÔØÚTÜ\šÈNHÝX›Z\ÜÚ[Ûˆ˜Z[Y‰Ë\œ›ÜŠNÂˆ[\
	ÔÝX›Z\ÜÚ[Ûˆ˜Z[YˆX\ÙHÈ›ÝÛÜÙH\ÈYÙK—”™X\ÛÛŽˆ	È
È
\œ›Ü‹›Y\ÜØYÙH\œ›ÜŠJNÂˆÝ\[Y\Š
NÂˆYˆ
ÛÛ™š\›PŠHÈÛÛ™š\›P‹™\ØX›YH˜[ÙNÈÛÛ™š\›P‹^ÛÛ[H	ÐÛÛ™š\›H	ˆÝX›Z]8¡¤‰ÎÈBˆ\ÔÝX›Z][™ÈH˜[ÙNÂˆBŸB‚˜G7–æ2gVæ7F–öâWFõ7V&Ö—B‚’°¢–b†—57V&Ö—GF–ær’&WGW&ã°¢—57V&Ö—GF–ærÒG'VS°¢G'’°¢6öç7B–ÆöBÒ'V–ÆE–ÆöB‚“°¢6öç7BGFV×D–BÒv—B7V&Ö—EFõ7W&6R‡–ÆöB“°¢6W76–öå7F÷&vRç&VÖ÷fT—FVÒ„UDõ4dUô´U’“°¢Fö7VÖVçBævWDVÆVÖVçD'”–B‚w7V66W72×67&VVâr“òæ6Æ74Æ—7BæFB‚v÷Vâr“°¢6†÷u66÷&Töå7V66W7567&VVâ†çVÆÂ“°¢6ÆÄÖ&¶–ætgVæ7F–öâ†GFV×D–B’çF†Vâ‡&W7VÇBÓâ²–b‡&W7VÇCòç7V66W72’6†÷u66÷&Töå7V66W7567&VVâ‡&W7VÇBç66÷&W2“²Ò’æ6F6‚‚‚’Óâ·Ò“°¢Ò6F6‚†W'&÷"’°¢6öç6öÆRæW'&÷"‚uµ66•7&²“…ÒWFò×7V&Ö—Bf–ÆVC¢rÂW'&÷"“°¢ÆW'B‚tWFò×7V&Ö—76–öâf–ÆVBåÆå&V6öã¢r²†W'&÷"æÖW76vRÇÂW'&÷"’“°¢—57V&Ö—GF–ærÒfÇ6S°¢Ð§Ð ¦gVæ7F–öâ–æ—B‚’°¢7F'EF–ÖW"‚“°¢Fö7VÖVçBçVW'•6VÆV7F÷$ÆÂ‚v–çWBÂFW‡F&VÂ6VÆV7Br’æf÷$V6‚†VÂÓâ°¢VÂæFDWfVçDÆ—7FVæW"‚v6†ævRrÂ‚’Óâ²–b†VÂçG—RÓÓÒw&F–òrÇÂVÂçG—RÓÓÒv6†V6¶&÷‚r’7–æ4–çWE7G–ÆW2†VÂ“²WFFU&öw&W72‚“²WF÷6fR‚“²Ò“°¢VÂæFDWfVçDÆ—7FVæW"‚v–çWBrÂ‚’Óâ²WFFU&öw&W72‚“²WF÷6fR‚“²Ò“°¢Ò“°¢Fö7VÖVçBævWDVÆVÖVçD'”–B‚w7V&Ö—BÖ'Fâr“òæFDWfVçDÆ—7FVæW"‚v6Æ–6²rÂ÷VäÖöFÂ“°¢Fö7VÖVçBævWDVÆVÖVçD'”–B‚w7V&Ö—BÖ'Fâ×6Òr“òæFDWfVçDÆ—7FVæW"‚v6Æ–6²rÂ÷VäÖöFÂ“°¢Fö7VÖVçBævWDVÆVÖVçD'”–B‚vÖöFÂÖ6æ6VÂr“òæFDWfVçDÆ—7FVæW"‚v6Æ–6²rÂ6Æ÷6TÖöFÂ“°¢Fö7VÖVçBævWDVÆVÖVçD'”–B‚vÖöFÂÖ6öæf—&Òr“òæFDWfVçDÆ—7FVæW"‚v6Æ–6²rÂ6öæf—&Õ7V&Ö—B“°¢6WD–çFW'fÂ†WF÷6fRÂUDõ4dUô”åDU%dÅôÕ2“°¢WFFU&öw&W72‚“°¢6öç6öÆRæÆör†µ66•7&²“‚c5Ò&VG’â$4´TäEôTä$ÄTCÒG´$4´TäEôTä$ÄTGÒâGµDõDÅõTU5D”ôå7ÒVW7F–öç2ÂGµDõDÅôÔ$µ7ÒÖ&·2æ“°§Ð ¦–b†Fö7VÖVçBç&VG•7FFRÓÓÒvÆöF–ærr’²Fö7VÖVçBæFDWfVçDÆ—7FVæW"‚tDôÔ6öçFVçDÆöFVBrÂ–æ—B“²ÒVÇ6R²–æ—B‚“²Ð
