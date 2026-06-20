#!/usr/bin/env node
/*
═══════════════════════════════════════════════════════════════════════════
SciSpark · gate-iron-rules.mjs — the MACHINE GATE for the three root-cause rules
═══════════════════════════════════════════════════════════════════════════
Per Code_Room_Machine_Gate_Requirements.txt (2026-06-15). The factory writes the
requirements; this is the code-room machine that truly COUNTS, truly COMPARES, and
truly BLOCKS — not an AI writing "PASS". If the gate does not pass, no delivery
package may be produced (the runner must check the exit code).

Complementary to validate-lessons.mjs (which is the A–F content/structure checklist).
This gate is the Rule-1/2/3 edit-discipline + marking-quality layer.

  node scripts/gate-iron-rules.mjs --lessons lessons/y7/u2
  node scripts/gate-iron-rules.mjs --lessons lessons/y7/u2 --strict
  node scripts/gate-iron-rules.mjs --lessons lessons/y7/u2 --base HEAD~1            # CHECK 3
  node scripts/gate-iron-rules.mjs --lessons lessons/y7/u2 --base main --scope edits.txt  # CHECK 4
  node scripts/gate-iron-rules.mjs --lessons lessons/y7/u2 --base STAGED            # vs git index (pre-commit)

  --scope file: one allowed edit per line — "L03 Q05", "L07 LEARN", or "L03 *" (whole lesson);
                # comments allowed. Anything changed vs --base that is NOT listed ⇒ CHECK 4 report.

CHECKS
  CHECK 1 · Canned marking (Rule 1) ............ BLOCK · same substantive marking
            sentence appears ≥3× word-for-word in one lesson. (--strict also counts
            standard rubric lines: Ignore/Partial/Spelling.)
  CHECK 2 · Question-number style (Rule 2) ..... BLOCK · >1 numbering style in a unit,
            or mixed style inside one lesson.
  CHECK 3 · Half-fix (Rule 3) .................. REPORT · a question's EN changed but its
            ZH did not (or vice-versa) vs --base. Needs --base.
  CHECK 4 · Out-of-scope edits (Rule 3) ........ REPORT · a question/screen changed vs
            --base that is not named in --scope. Needs --base (+ --scope).
  EXTRA   · Empty marking (Reject/Accept with no reason) ..... REPORT
            Missing HINT1 on a practice (TRY) question ........ REPORT
            HINT at the wrong level (a hint inside the no-hint TEST screen) .. REPORT
            Image placeholder leaked into data-image-prompt ... REPORT
            NOT OFFICIAL / NOT FOUND source hard-coded into full marking ... HOLD (BLOCK)

EXIT CODE: 0 only when zero findings of ANY tier. Non-zero ⇒ delivery blocked.
═══════════════════════════════════════════════════════════════════════════
*/
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { join, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';
import { norm, normLower, stripZh, extractQuestions, markingSegments, RUBRIC } from './lib/marking.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const arg = (flag, def) => { const i = process.argv.indexOf(flag); return i >= 0 ? process.argv[i + 1] : def; };
const has = flag => process.argv.includes(flag);
const lessonsArg = arg('--lessons', 'lessons/y7/u1');
const LESSONS_DIR = join(ROOT, lessonsArg);
const STRICT = has('--strict');
const BASE = arg('--base', null);
const SCOPE_PATH = arg('--scope', null);

const C = { g: '\x1b[32m', r: '\x1b[31m', y: '\x1b[33m', dim: '\x1b[90m', b: '\x1b[1m', x: '\x1b[0m' };

// Shared marking parser lives in ./lib/marking.mjs (imported above) so this gate and the
// report-canned-marking.mjs worklist can never disagree about what counts as a marking line.

// ── q-number style classifier (CHECK 2) ──────────────────────────────────────
// A style = a numbering FAMILY (Q#, #., #), Question #, …) plus a PADDING decision
// (are single-digit numbers zero-padded?). Q01 and Q10 are the SAME style (zero-pad,
// 2-wide); Q1 vs Q01 differ. Padding is only knowable from single-digit-VALUE tokens,
// so a lesson with only Q10+ reports pad '?' (compatible with anything).
function tokenInfo(tok) {
  const t = tok.trim(); let m;
  const lead0 = d => /^0\d/.test(d);
  if ((m = t.match(/^Q(\d+)$/i)))        return { family: 'Q#', n: +m[1], lead0: lead0(m[1]) };
  if ((m = t.match(/^Question\s+(\d+)$/i))) return { family: 'Question #', n: +m[1], lead0: lead0(m[1]) };
  if ((m = t.match(/^(\d+)\.$/)))        return { family: '#.', n: +m[1], lead0: lead0(m[1]) };
  if ((m = t.match(/^(\d+)\)$/)))        return { family: '#)', n: +m[1], lead0: lead0(m[1]) };
  if ((m = t.match(/^\((\d+)\)$/)))      return { family: '(#)', n: +m[1], lead0: lead0(m[1]) };
  if ((m = t.match(/^(\d+)$/)))          return { family: '#', n: +m[1], lead0: lead0(m[1]) };
  return { family: `other("${t}")`, n: null, lead0: false };
}
function lessonStyle(tokens) {
  const infos = tokens.map(tokenInfo).filter(i => !i.family.startsWith('other('));
  const families = new Set(infos.map(i => i.family));
  const singles = infos.filter(i => i.n != null && i.n < 10);
  let pad = '?';
  if (singles.length) { const z = singles.filter(i => i.lead0).length; pad = z === singles.length ? 'zero' : z === 0 ? 'no' : 'mixed'; }
  return { families, pad };
}
const styleLabel = (families, pad) => [...families].join('+') + (pad !== '?' && pad !== undefined ? `/${pad}-pad` : '');

// ── scope manifest (CHECK 4) ─────────────────────────────────────────────────
function loadScope() {
  if (!SCOPE_PATH) return null;
  const p = join(ROOT, SCOPE_PATH);
  if (!existsSync(p)) { console.log(`${C.y}  --scope file not found: ${SCOPE_PATH} — CHECK 4 will treat every change as out-of-scope.${C.x}`); return new Set(); }
  const set = new Set();
  for (const raw of readFileSync(p, 'utf8').split(/\r?\n/)) {
    const line = raw.replace(/#.*/, '').trim(); if (!line) continue;
    const m = line.match(/^L0*(\d+)\s+(Q0*\d+|HOOK|LEARN|TRY|TEST|WRAP|\*)/i);
    if (m) set.add(`${padNum(m[1])}:${m[2].toUpperCase().replace(/^Q0*/, 'Q')}`);
  }
  return set;
}
const padNum = n => String(n).replace(/^0+/, '').padStart(2, '0');
const qkey = num => 'Q' + (num.match(/\d+/) ? String(parseInt(num.match(/\d+/)[0], 10)) : num);

// ── git base reader (CHECK 3 & 4) ────────────────────────────────────────────
function gitShow(ref, relPath) {
  // --base STAGED|INDEX ⇒ compare against the git index (handy as a pre-commit gate).
  const spec = /^(STAGED|INDEX)$/i.test(ref) ? `:"${relPath}"` : `${ref}:"${relPath}"`;
  try { return execSync(`git show ${spec}`, { cwd: ROOT, encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] }); }
  catch { return null; }   // file did not exist at base ⇒ wholly new lesson
}

// fingerprint of a question's EN-only and ZH-only content (for half-fix / out-of-scope)
function qBlobs(q) {
  const enReveal = norm(stripZh(q.reveal));
  const enQtext = norm(stripZh(q.qtext));
  const zh = [...(q.reveal + ' ' + q.qtext).matchAll(/<span class="zh">([\s\S]*?)<\/span>/g)].map(m => norm(m[1])).join(' | ');
  return { en: (enQtext + ' || ' + enReveal).trim(), zh: zh.trim() };
}

// ════════════════════════════════════════════════════════════════════════════
// RUN
// ════════════════════════════════════════════════════════════════════════════
if (!existsSync(LESSONS_DIR)) { console.error(`${C.r}No such lessons dir: ${lessonsArg}${C.x}`); process.exit(2); }
const files = readdirSync(LESSONS_DIR).filter(n => /^l\d+\.html$/.test(n)).sort();
if (!files.length) { console.error(`${C.r}No lesson HTML in ${lessonsArg}${C.x}`); process.exit(2); }

const SCOPE = loadScope();
const blocking = [];   // delivery-blocking findings (CHECK 1, CHECK 2, HOLD)
const reports = [];    // report-tier findings (CHECK 3, CHECK 4, extras)
const notices = [];    // visible "could-not-assess" notes (never silent, never block)
const unitStyles = new Map();   // style -> [lessons]
const perLesson = [];

console.log('\n' + C.b + '  SciSpark MACHINE GATE — three root-cause iron rules' + C.x);
console.log(C.dim + '  ' + lessonsArg + (STRICT ? '   [--strict]' : '') + (BASE ? `   base=${BASE}` : '') + C.x);
console.log(C.dim + '  CHECK 1 mode: ' + (STRICT
  ? 'STRICT — every marking sentence repeated ≥3× is counted (rubric included).'
  : `smart — counts per-question marking (expected/accept/reject/if-right/if-wrong); whitelisted standard rubric (NOT counted): ${[...RUBRIC].map(r => r[0].toUpperCase() + r.slice(1)).join(', ')}. Use --strict to count them too.`) + C.x);

for (const file of files) {
  const path = join(LESSONS_DIR, file);
  const html = readFileSync(path, 'utf8');
  const qs = extractQuestions(html);
  const L = file.match(/l(\d+)/)[1];
  const row = { file, check1: true, check2: true, extra: true, hold: true };

  // ── CHECK 1 · canned marking ──────────────────────────────────────────────
  const freq = new Map();   // segText -> Set(qnum)
  for (const q of qs) {
    for (const s of markingSegments(q.reveal)) {
      if (!STRICT && RUBRIC.has(s.key)) continue;        // smart: skip standard rubric lines
      if (s.text.length < 12) continue;                  // too short to be "canned prose"
      const k = s.text.toLowerCase();
      if (!freq.has(k)) freq.set(k, new Set());
      freq.get(k).add(q.num || '?');
    }
  }
  const canned = [...freq.entries()].filter(([, set]) => set.size >= 3).sort((a, b) => b[1].size - a[1].size);
  if (canned.length) {
    row.check1 = false;
    for (const [text, set] of canned)
      blocking.push(`${file} CHECK1: marking sentence repeated ${set.size}× [${[...set].join(',')}] — "${text.slice(0, 70)}…"`);
  }

  // ── CHECK 2 · question-number style (collect; verdict after the unit loop) ──
  const { families, pad } = lessonStyle(qs.map(q => q.num));
  const lessonLabel = styleLabel(families, pad);
  if (families.size) { if (!unitStyles.has(lessonLabel)) unitStyles.set(lessonLabel, []); unitStyles.get(lessonLabel).push({ file, families, pad }); }
  if (families.size > 1 || pad === 'mixed') {
    row.check2 = false;
    blocking.push(`${file} CHECK2: inconsistent numbering WITHIN one lesson — ${families.size > 1 ? [...families].join(' / ') : `mixed zero-padding (${lessonLabel})`}`);
  }

  // ── EXTRA checks ──────────────────────────────────────────────────────────
  for (const q of qs) {
    const tag = `${file} ${q.num || '?'}`;
    const segs = markingSegments(q.reveal);
    const seg = key => segs.find(s => s.key === key);
    // empty marking — a REJECT present but with no reason given (requirement: "REJECT
    // with no reason given"). A short Accept (e.g. a one-word correct answer) is valid.
    {
      const s = seg('reject');
      if (s && normLower(s.text).replace(/[^a-z0-9]/g, '').length < 8) {
        row.extra = false; reports.push(`${tag} EXTRA: reject marking has no reason given — "${s.text}"`);
      }
    }
    // HINT1 missing on a practice (TRY) question — TEST is legitimately hint-free.
    // Only judge questions that use the standard markable structure (have an answer-reveal);
    // a block with no reveal is a non-standard format this gate cannot assess (see notice below).
    if (q.screen === 'try' && q.reveal) {
      const hintTxt = norm(stripZh(q.hint).replace(/💡[^<]*/, '').replace(/Hint/i, ''));
      if (hintTxt.length < 6) { row.extra = false; reports.push(`${tag} EXTRA: HINT1 missing on a TRY question`); }
    }
    // HINT at the wrong level — a hint box inside the no-hint TEST screen
    if (q.screen === 'test' && norm(stripZh(q.hint)).replace(/Hint/i, '').replace(/💡/g, '').trim().length >= 6) {
      row.extra = false; reports.push(`${tag} EXTRA: hint placed at wrong level (TEST screen is hint-free)`);
    }
    // image placeholder leaked into the prompt attribute
    for (const p of q.imgPrompts) {
      if (/\[IMAGE|here\]|image\s*pending|IMAGE_PROMPT/i.test(p) || p.trim() === '') {
        row.extra = false; reports.push(`${tag} EXTRA: placeholder leaked into data-image-prompt — "${p}"`);
      }
    }
    // NOT OFFICIAL / NOT FOUND hard-coded into full marking → HOLD
    if (/not found|not official|no official/i.test(q.source)) {
      const hasFullMarking = !!(seg('accept') || seg('reject'));
      if (hasFullMarking) { row.hold = false; blocking.push(`${tag} HOLD: source "${q.source}" but full marking was hard-coded — flag HOLD, do not auto-fill`); }
    }
  }

  // non-standard markup notice — question blocks present but none carry an answer-reveal,
  // so the marking/hint iron-rules cannot be assessed here. Surfaced loudly (not silent).
  if (qs.length && !qs.some(q => q.reveal))
    notices.push(`${file}: non-standard question markup (no answer-reveal/q-number) — CHECK 1 & marking/hint extras cannot assess; gate this unit with validate-lessons.mjs (A–E).`);

  // ── CHECK 3 & 4 · diff vs --base ──────────────────────────────────────────
  if (BASE) {
    const rel = relative(ROOT, path).replace(/\\/g, '/');
    const baseHtml = gitShow(BASE, rel);
    if (baseHtml != null) {
      const baseQ = new Map(extractQuestions(baseHtml).map(q => [qkey(q.num), qBlobs(q)]));
      for (const q of qs) {
        const k = qkey(q.num); const b = baseQ.get(k); if (!b) continue;   // new question — not a half-fix
        const h = qBlobs(q);
        const enChanged = b.en !== h.en, zhChanged = b.zh !== h.zh;
        // CHECK 3 · half-fix
        if (enChanged !== zhChanged) {
          row.extra = false;
          reports.push(`${file} ${q.num} CHECK3: half-fix — ${enChanged ? 'EN changed, ZH unchanged' : 'ZH changed, EN unchanged'}`);
        }
        // CHECK 4 · out-of-scope
        if ((enChanged || zhChanged) && SCOPE) {
          const allowed = SCOPE.has(`${padNum(L)}:${k}`) || SCOPE.has(`${padNum(L)}:*`);
          if (!allowed) { row.extra = false; reports.push(`${file} ${q.num} CHECK4: changed but not named in --scope`); }
        }
      }
    }
  }

  perLesson.push(row);
}

// ── CHECK 2 unit verdict ───────────────────────────────────────────────────
// Combine across lessons: >1 numbering family, or a real zero-pad conflict (zero vs no,
// ignoring '?' lessons that had no single-digit q-numbers to judge padding from).
const allFamilies = new Set();
const pads = new Set();
for (const [, entries] of unitStyles) for (const e of entries) { for (const f of e.families) allFamilies.add(f); if (e.pad !== '?') pads.add(e.pad); }
const padConflict = pads.has('mixed') || (pads.has('zero') && pads.has('no'));
const distinctStyles = [...unitStyles.keys()];
if (allFamilies.size > 1 || padConflict) {
  for (const r of perLesson) r.check2 = false;
  blocking.push(`UNIT CHECK2: inconsistent numbering across the unit — ${distinctStyles.map(s => `${s} {${unitStyles.get(s).map(e => e.file.replace(/\.html$/, '')).join(',')}}`).join(' · ')}`);
}

// ── table ──────────────────────────────────────────────────────────────────
const cell = ok => ok ? `${C.g}  ✓${C.x}` : `${C.r}  ✗${C.x}`;
console.log('\n  ' + 'lesson '.padEnd(8) + ' CHK1 CHK2 EXTRA HOLD   RESULT');
console.log(C.dim + '  ' + '─'.repeat(44) + C.x);
for (const r of perLesson) {
  const ok = r.check1 && r.check2 && r.extra && r.hold;
  console.log('  ' + r.file.padEnd(8) + cell(r.check1) + '  ' + cell(r.check2) + '  ' + cell(r.extra) + '  ' + cell(r.hold) + '    ' + (ok ? `${C.g}PASS${C.x}` : `${C.r}FAIL${C.x}`));
}
console.log(C.dim + '  ' + '─'.repeat(44) + C.x);

console.log(`\n  ${C.b}Numbering styles in unit:${C.x} ` + (distinctStyles.length ? distinctStyles.join(', ') : '(none)') + (distinctStyles.length === 1 ? `  ${C.g}✓ consistent${C.x}` : ''));

if (blocking.length) { console.log('\n' + C.r + C.b + '  BLOCKING (Rule 1/2 + HOLD) — delivery cannot be produced:' + C.x); for (const d of blocking) console.log(C.r + '    ' + d + C.x); }
if (reports.length) { console.log('\n' + C.y + C.b + '  REPORT (Rule 3 + extras) — review before handover:' + C.x); for (const d of reports) console.log(C.y + '    ' + d + C.x); }
if (notices.length) { console.log('\n' + C.dim + C.b + '  NOTICES (could not assess — not a pass, not a block):' + C.x); for (const d of notices) console.log(C.dim + '    ' + d + C.x); }
if (BASE === null) console.log(C.dim + '\n  CHECK 3 (half-fix) & CHECK 4 (out-of-scope) skipped — pass --base <gitref> to run them.' + C.x);

const clean = !blocking.length && !reports.length;
console.log('\n  ' + (clean
  ? `${C.g}${C.b}GATE PASSED${notices.length ? ` (with ${notices.length} could-not-assess notice${notices.length > 1 ? 's' : ''} — see above)` : ''} — delivery package may be produced.${C.x}`
  : `${C.r}${C.b}GATE BLOCKED — ${blocking.length} blocking, ${reports.length} report. No delivery package.${C.x}`) + '\n');
process.exit(clean ? 0 : 1);
