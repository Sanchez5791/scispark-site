'use strict';
/* SciSpark — Learning Starting Point Check (intake, EN)
   - Routes the student to ONE year-level set (Y7 / Y8 / Y9) of 4 long-answer,
     structured questions. Each sub-part is its own labelled text box.
   - NO auto-grading, NO answer key, NO score shown to the student.
     A teacher marks every answer by hand in the back-end.
   - Stores answer text + time spent into the existing assessment_attempts /
     assessment_answers tables (one answer row per sub-part box).
   - Self-contained: no shared engine/template dependency. Uses ONLY the
     Supabase publishable (anon) key; row access is enforced by RLS, exactly as
     the live Y7/Y8/Y9 assessment pages do. No service key in the frontend. */

/* ── Constants ─────────────────────────────────────────────────── */
const SUPABASE_URL      = 'https://fiffuaoibxeggwxcfvfh.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_OOrhuk8oqIbNLg3Wxo6fzQ_7z4sloBJ';
const ASSESSMENT_CODE   = 'INTAKE_SPC_EN';
const QUESTIONS_PER_SET = 4;     // 4 questions per year (per-student)
const MARKS_PER_SET     = 20;    // 4 × 5 marks, teacher-marked
const AUTOSAVE_INTERVAL = 15000;

/* ── Supabase client ────────────────────────────────────────────── */
let sb = null;
if (window.supabase) sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/* ── State ──────────────────────────────────────────────────────── */
let startedAtMs  = Date.now();
let isSubmitting = false;
let currentYear  = null;          // 'Y7' | 'Y8' | 'Y9'
let questions    = [];            // the routed set (array of question objects)
let fields       = [];            // flat [{ id, bank }] for every answer box
let autosaveKey  = 'scispark_intake_spc_draft';

/* ── Helpers ────────────────────────────────────────────────────── */
function boxEl(id) { return document.querySelector('textarea[data-field="' + id + '"]'); }
function readValue(id) {
  const el = boxEl(id);
  if (!el) return null;
  const v = el.value.trim();
  return v.length ? v : null;
}
function countAnswered() {
  let n = 0;
  fields.forEach(function (f) { if (readValue(f.id) !== null) n++; });
  return n;
}

/* ── Render the routed set ──────────────────────────────────────── */
function figHtml(fig) {
  if (!fig) return '';
  if (fig.type === 'table') return '<div class="spc-tablewrap">' + fig.html + '</div>';
  if (fig.type === 'img')
    return '<img class="spc-fig" src="' + fig.src + '" alt="' + (fig.alt || '') + '" loading="lazy">';
  return '';
}
function figsHtml(figs) {
  return (figs || []).map(figHtml).join('');
}

function renderSet() {
  const main = document.getElementById('spc-main');
  main.innerHTML = '';
  fields = [];

  questions.forEach(function (q, qi) {
    const art = document.createElement('article');
    art.className = 'spc-q';
    art.id = 'qcard-' + q.bank;

    let html =
      '<div class="spc-q-head">' +
        '<span class="spc-q-num">Question ' + (qi + 1) + ' <span class="spc-q-of">of ' + QUESTIONS_PER_SET + '</span></span>' +
      '</div>' +
      (q.stem || '') +
      figsHtml(q.figs);

    q.parts.forEach(function (p) {
      fields.push({ id: p.id, bank: q.bank });
      if (p.lead) html += p.lead;
      if (p.prompt) {
        html += '<div class="spc-sub">';
        if (p.letter) html += '<span class="spc-sub-letter">' + p.letter + '</span>';
        html += '<p class="spc-sub-text">' + p.prompt + '</p></div>';
      }
      html += figsHtml(p.figs);
      if (p.sub) html += '<label class="spc-box-label" for="box_' + p.id + '">' + p.sub + '</label>';
      html += '<textarea class="spc-answer" id="box_' + p.id + '" data-field="' + p.id + '" rows="' +
        (p.rows || 2) + '" placeholder="' + (p.ph || 'Type your answer…') +
        '" aria-label="Answer for question ' + (qi + 1) + (p.letter ? ' part ' + p.letter : '') + '"></textarea>';
    });

    art.innerHTML = html;
    main.appendChild(art);
  });
}

/* ── Autosave (draft only, localStorage) ────────────────────────── */
function saveDraft() {
  try {
    const d = { year: currentYear, ans: {} };
    fields.forEach(function (f) { const v = readValue(f.id); if (v) d.ans[f.id] = v; });
    localStorage.setItem(autosaveKey, JSON.stringify(d));
  } catch (e) {}
}
function restoreDraft() {
  try {
    const raw = localStorage.getItem(autosaveKey);
    if (!raw) return;
    const d = JSON.parse(raw);
    if (d.year !== currentYear) return;
    Object.keys(d.ans || {}).forEach(function (id) {
      const el = boxEl(id);
      if (el) el.value = d.ans[id];
    });
  } catch (e) {}
}
function clearDraft() { try { localStorage.removeItem(autosaveKey); } catch (e) {} }

/* ── Build answer rows (one per sub-part box) ───────────────────── */
function collectAnswerRows(attemptId) {
  return fields.map(function (f) {
    return {
      attempt_id:      attemptId,
      question_number: f.bank,      // bank question id (e.g. Y7_QC1)
      field_name:      f.id,        // sub-part box id (e.g. Y7_QC1_a_answer)
      answer_value:    readValue(f.id)   // text or null
    };
  });
}

/* ── Error display ──────────────────────────────────────────────── */
function showError(msg) { alert('We could not save your answers:\n\n' + msg); }

/* ── Resolve which child / year ─────────────────────────────────── */
async function resolveChild(userId) {
  const params = new URLSearchParams(location.search);
  const wantChild = params.get('child');
  const wantYear  = (params.get('year') || '').toUpperCase();
  const { data: kids } = await sb.from('children')
    .select('id, full_name, year_group')
    .eq('parent_id', userId).order('created_at', { ascending: true });
  if (!kids || kids.length === 0) return null;
  if (wantChild) { const h = kids.find(function (k) { return k.id === wantChild; }); if (h) return h; }
  if (wantYear)  { const h = kids.find(function (k) { return k.year_group === wantYear; }); if (h) return h; }
  return kids[0];
}

/* ── Submit (no score — manual marking only) ────────────────────── */
async function submitToSupabase() {
  if (!sb) { showError('The page did not load fully. Please refresh and try again.'); return null; }

  const { data: { user }, error: authErr } = await sb.auth.getUser();
  if (authErr || !user) {
    location.href = '/signin.html?redirect=' + encodeURIComponent(location.pathname + location.search);
    return null;
  }
  const child = await resolveChild(user.id);
  if (!child) {
    showError('We could not find your child’s record on this account.\n' +
              'Please contact SciSpark support and do not close this page.');
    return null;
  }

  const timeSpent = Math.max(0, Math.round((Date.now() - startedAtMs) / 1000));
  const { data: attempt, error: attemptErr } = await sb.from('assessment_attempts').insert({
    student_id:            user.id,
    children_id:           child.id,
    assessment_code:       ASSESSMENT_CODE,
    year_group:            currentYear,
    language:              'EN',
    status:                'submitted',
    total_questions:       QUESTIONS_PER_SET,
    total_marks:           MARKS_PER_SET,
    started_at:            new Date(startedAtMs).toISOString(),
    submitted_at:          new Date().toISOString(),
    time_spent_seconds:    timeSpent,
    teacher_review_status: 'pending',
    trigger_source:        'intake_after_first_lesson'
  }).select().single();

  if (attemptErr) {
    console.error('[SciSpark Intake] attempt insert failed:', attemptErr);
    showError('Please try again. If it keeps failing, contact SciSpark support.');
    return null;
  }

  const rows = collectAnswerRows(attempt.id);
  const { error: ansErr } = await sb.from('assessment_answers').insert(rows); // no .select() — RLS
  if (ansErr) {
    console.error('[SciSpark Intake] answers insert failed:', ansErr);
    showError('Your check was saved (ID: ' + attempt.id + ') but the answers could not be stored. ' +
              'Please contact SciSpark and quote this ID.');
    return null;
  }
  return attempt.id;
}

/* ── Modal ──────────────────────────────────────────────────────── */
function openModal() {
  const count = countAnswered();
  const a = document.getElementById('modal-answered');
  const u = document.getElementById('modal-unanswered');
  if (a) a.textContent = count;
  if (u) u.textContent = fields.length - count;
  document.getElementById('modal-overlay')?.classList.add('open');
}
function closeModal() { document.getElementById('modal-overlay')?.classList.remove('open'); }

/* ── Success (no level / no score shown) ────────────────────────── */
function showSuccess(attemptId) {
  clearDraft();
  document.getElementById('spc-main').style.display = 'none';
  document.getElementById('spc-submitbar').style.display = 'none';
  const intro = document.querySelector('.spc-intro');
  if (intro) intro.style.display = 'none';
  const screen = document.getElementById('spc-success');
  screen.style.display = 'flex';
  const idEl = document.getElementById('spc-success-id');
  if (idEl) idEl.textContent = attemptId;
  window.scrollTo(0, 0);
}

/* ── Confirm submit ─────────────────────────────────────────────── */
async function confirmSubmit() {
  if (isSubmitting) return;
  isSubmitting = true;
  const btn = document.getElementById('modal-confirm');
  if (btn) { btn.disabled = true; btn.textContent = 'Saving…'; }

  let attemptId = null;
  try { attemptId = await submitToSupabase(); }
  catch (e) { console.error(e); showError('Something went wrong. Please try again.'); }

  if (attemptId) { closeModal(); showSuccess(attemptId); }
  else { isSubmitting = false; if (btn) { btn.disabled = false; btn.textContent = 'Yes, submit my answers'; } }
}

/* ── Year routing ───────────────────────────────────────────────── */
function startSet(year) {
  if (!INTAKE_SETS[year]) return;
  currentYear = year;
  questions   = INTAKE_SETS[year];
  autosaveKey = 'scispark_intake_spc_' + year + '_draft';
  startedAtMs = Date.now();

  document.getElementById('spc-year-pick').style.display = 'none';
  document.getElementById('spc-app').style.display = 'block';
  const badge = document.getElementById('spc-year-badge');
  if (badge) badge.textContent = year.replace('Y', 'Year ');

  renderSet();
  restoreDraft();
  setInterval(saveDraft, AUTOSAVE_INTERVAL);
  window.addEventListener('beforeunload', saveDraft);
  console.log('[SciSpark Intake] ' + year + ' set ready — ' + questions.length +
              ' questions, ' + fields.length + ' boxes.');
}

/* Decide the year: ?year= → logged-in child → else show picker. */
async function routeYear() {
  const params = new URLSearchParams(location.search);
  const p = (params.get('year') || '').toUpperCase();
  if (INTAKE_SETS[p]) { startSet(p); return; }
  if (sb) {
    try {
      const { data: { user } } = await sb.auth.getUser();
      if (user) {
        const child = await resolveChild(user.id);
        if (child && INTAKE_SETS[child.year_group]) { startSet(child.year_group); return; }
      }
    } catch (e) {}
  }
  // fallback: let the student pick (also used for preview)
  document.getElementById('spc-year-pick').style.display = 'flex';
  document.getElementById('spc-app').style.display = 'none';
}

/* ── Init ───────────────────────────────────────────────────────── */
function init() {
  document.getElementById('spc-submit-btn')?.addEventListener('click', openModal);
  document.getElementById('modal-cancel')?.addEventListener('click', closeModal);
  document.getElementById('modal-confirm')?.addEventListener('click', confirmSubmit);
  document.getElementById('modal-overlay')?.addEventListener('click', function (e) {
    if (e.target === e.currentTarget) closeModal();
  });
  document.querySelectorAll('[data-pick-year]').forEach(function (b) {
    b.addEventListener('click', function () { startSet(b.getAttribute('data-pick-year')); });
  });
  routeYear();
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
else init();
