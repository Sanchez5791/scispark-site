#!/usr/bin/env node
/*
═══════════════════════════════════════════════════════════════════════════
SciSpark · build-lessons.mjs — the ONE script that manages all lesson facades
═══════════════════════════════════════════════════════════════════════════

WHAT IT DOES (白话):
  Every lesson HTML = FRAME (门面: head/nav/sidebar/footer/scripts, identical
  in every lesson) + 3 author regions you write by hand:
      • SCISPARK:MANIFEST  — this lesson's identity (title / unit / subject)
      • SCISPARK:CONTENT   — the lesson body (the 5 screens)
      • SCISPARK:BUBBLE    — the DouDou dialogue script
  The FRAME comes from   lessons/_template/lesson-frame.html
  This script stamps that frame onto every lesson, keeping your 3 regions
  untouched. Re-skin 400 lessons by editing the frame once, then running:
      node scripts/build-lessons.mjs sync

COMMANDS:
  node scripts/build-lessons.mjs check          # dry-run: what WOULD change (no writes)
  node scripts/build-lessons.mjs sync           # re-stamp the frame onto every lesson
  node scripts/build-lessons.mjs list           # list managed / unmanaged lesson files
  node scripts/build-lessons.mjs new y8/u7/l02  # scaffold a new blank lesson from the frame

Nothing here decides colours or fonts — those live in the shared stylesheet
(/lesson-shell-v4.css). To re-skin, edit that CSS and/or this frame, then sync.
═══════════════════════════════════════════════════════════════════════════
*/

import { readFileSync, writeFileSync, readdirSync, existsSync, mkdirSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, relative, sep } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const LESSONS_DIR = join(ROOT, 'lessons');
const FRAME_PATH = join(LESSONS_DIR, '_template', 'lesson-frame.html');

// ── region markers ──────────────────────────────────────────────────────
const RE_MANIFEST = /<!-- SCISPARK:MANIFEST\b[\s\S]*?SCISPARK:MANIFEST-END -->/;
const RE_CONTENT  = /(<!-- SCISPARK:CONTENT:START[^\n]*-->)([\s\S]*?)(<!-- SCISPARK:CONTENT:END -->)/;
const RE_BUBBLE   = /(<!-- SCISPARK:BUBBLE:START[^\n]*-->)([\s\S]*?)(<!-- SCISPARK:BUBBLE:END -->)/;

// ── small helpers ─────────────────────────────────────────────────────────
const c = { gray:'\x1b[90m', green:'\x1b[32m', yellow:'\x1b[33m', red:'\x1b[31m', bold:'\x1b[1m', reset:'\x1b[0m' };
const paint = (col, s) => `${col}${s}${c.reset}`;

function isManaged(html) {
  return RE_MANIFEST.test(html) && RE_CONTENT.test(html) && RE_BUBBLE.test(html);
}

function parseManifest(block) {
  const json = block
    .replace(/^<!-- SCISPARK:MANIFEST\s*/, '')
    .replace(/\s*SCISPARK:MANIFEST-END -->$/, '')
    .trim();
  return JSON.parse(json);
}

// Replace the inner text of a CONTENT/BUBBLE region. Uses a function callback
// so the new inner is treated literally ($, $1 etc. are NOT interpreted).
function replaceInner(text, re, newInner) {
  return text.replace(re, (_m, open, _old, close) => open + newInner + close);
}

// Find every lesson HTML file under lessons/ (skips _template, *backup*, *-test*).
function findLessonFiles() {
  const out = [];
  (function walk(dir) {
    for (const name of readdirSync(dir)) {
      const full = join(dir, name);
      const st = statSync(full);
      if (st.isDirectory()) {
        if (name === '_template' || name === 'backups' || name.startsWith('_backup')) continue;
        walk(full);
      } else if (name.endsWith('.html') && !/backup|-test|-v\d-/i.test(name)) {
        out.push(full);
      }
    }
  })(LESSONS_DIR);
  return out.sort();
}

// Build a finished lesson = frame, with this lesson's manifest values poured in,
// then its 3 author regions restored verbatim.
function render(frame, manifestBlock, manifestObj, contentInner, bubbleInner) {
  let out = frame;
  for (const [k, v] of Object.entries(manifestObj)) {
    out = out.split(`{{${k}}}`).join(String(v));
  }
  out = out.replace(RE_MANIFEST, () => manifestBlock);   // keep the file's own manifest verbatim
  out = replaceInner(out, RE_CONTENT, contentInner);
  out = replaceInner(out, RE_BUBBLE, bubbleInner);
  return out;
}

// Stamp the frame onto one already-managed lesson file. Returns rebuilt html.
function restamp(frame, html) {
  const manifestBlock = html.match(RE_MANIFEST)[0];
  const manifestObj   = parseManifest(manifestBlock);
  const contentInner  = html.match(RE_CONTENT)[2];
  const bubbleInner   = html.match(RE_BUBBLE)[2];
  return render(frame, manifestBlock, manifestObj, contentInner, bubbleInner);
}

function rel(p) { return relative(ROOT, p).split(sep).join('/'); }

// ── commands ──────────────────────────────────────────────────────────────
function loadFrame() {
  if (!existsSync(FRAME_PATH)) {
    console.error(paint(c.red, `✗ Frame not found: ${rel(FRAME_PATH)}`));
    process.exit(1);
  }
  return readFileSync(FRAME_PATH, 'utf8');
}

function cmdSyncOrCheck(write) {
  const frame = loadFrame();
  const files = findLessonFiles();
  let managed = 0, changed = 0, skipped = 0, failed = 0;
  const changedList = [], skippedList = [];

  for (const file of files) {
    const html = readFileSync(file, 'utf8');
    if (!isManaged(html)) { skipped++; skippedList.push(rel(file)); continue; }
    managed++;
    let rebuilt;
    try {
      rebuilt = restamp(frame, html);
    } catch (e) {
      failed++;
      console.error(paint(c.red, `✗ ${rel(file)} — ${e.message}`));
      continue;
    }
    if (rebuilt !== html) {
      changed++;
      changedList.push(rel(file));
      if (write) writeFileSync(file, rebuilt);
    }
  }

  console.log('');
  console.log(paint(c.bold, write ? '  SYNC — frame stamped onto all lessons' : '  CHECK — dry run (no files written)'));
  console.log(paint(c.gray, '  ' + '─'.repeat(52)));
  console.log(`  managed lessons : ${managed}`);
  console.log(`  ${write ? 'updated' : 'would update'} : ${paint(changed ? c.yellow : c.green, changed)}`);
  console.log(`  already in sync : ${paint(c.green, managed - changed - failed)}`);
  if (skipped) console.log(`  skipped (not frame-managed) : ${paint(c.gray, skipped)}`);
  if (failed)  console.log(`  ${paint(c.red, 'FAILED : ' + failed)}`);
  for (const f of changedList) console.log(paint(c.yellow, `    ~ ${f}`));
  if (skippedList.length) {
    console.log(paint(c.gray, '  not managed (no markers) — left untouched:'));
    for (const f of skippedList) console.log(paint(c.gray, `    · ${f}`));
  }
  console.log('');
  if (!write && changed) console.log(paint(c.gray, '  Run "node scripts/build-lessons.mjs sync" to apply.\n'));
  process.exit(failed ? 1 : 0);
}

function cmdList() {
  const files = findLessonFiles();
  console.log('');
  for (const file of files) {
    const html = readFileSync(file, 'utf8');
    const tag = isManaged(html) ? paint(c.green, '[managed]  ') : paint(c.gray, '[unmanaged]');
    console.log(`  ${tag} ${rel(file)}`);
  }
  console.log('');
}

function cmdNew(slug) {
  if (!slug) { console.error(paint(c.red, 'Usage: build-lessons.mjs new y8/u7/l02')); process.exit(1); }
  const clean = slug.replace(/\.html$/, '').replace(/^lessons\//, '');
  const dest = join(LESSONS_DIR, clean + '.html');
  if (existsSync(dest)) { console.error(paint(c.red, `✗ Already exists: ${rel(dest)}`)); process.exit(1); }

  const parts = clean.split('/');            // e.g. ['y8','u7','l02']
  const year  = (parts[0] || '').replace(/^y/i, '');
  const unit  = (parts[1] || '').replace(/^u/i, '');
  const lesson= (parts[2] || '').replace(/^l/i, '');
  const lvl   = ({ '7':'1', '8':'2', '9':'3' })[year] || '1';

  const manifest = {
    title:       `SciSpark · Y${year} U${unit} L${lesson} · TODO lesson name`,
    navMeta:     `Y${year} · U${unit} · L${lesson}`,
    subjectEn:   'Science',
    subjectZh:   '科学',
    unitLabel:   `Y${year} Unit ${unit}`,
    unitTitleEn: 'TODO unit title',
    unitTitleZh: 'TODO 单元标题',
    userLevel:   lvl,
    lessonData:  String(Number(lesson) || 1),
  };

  // Frame's own manifest block is already filled by render() via {{placeholders}},
  // so for a NEW lesson we let render keep the frame's manifest (now filled).
  const frame = loadFrame();
  const frameManifestBlock = frame.match(RE_MANIFEST)[0]; // still has {{...}} → fill below
  let filledManifestBlock = frameManifestBlock;
  for (const [k, v] of Object.entries(manifest)) {
    filledManifestBlock = filledManifestBlock.split(`{{${k}}}`).join(String(v));
  }
  const contentInner = frame.match(RE_CONTENT)[2];   // the TODO stub screens
  const bubbleInner  = frame.match(RE_BUBBLE)[2];     // the TODO stub bubbles
  const html = render(frame, filledManifestBlock, manifest, contentInner, bubbleInner);

  mkdirSync(dirname(dest), { recursive: true });
  writeFileSync(dest, html);
  console.log(paint(c.green, `\n  ✓ Created ${rel(dest)}`));
  console.log(paint(c.gray, '    Now edit the 3 author regions: MANIFEST, CONTENT, BUBBLE.\n'));
}

// ── entry ───────────────────────────────────────────────────────────────
const [cmd, arg] = process.argv.slice(2);
switch (cmd) {
  case 'sync':  cmdSyncOrCheck(true);  break;
  case 'check': cmdSyncOrCheck(false); break;
  case 'list':  cmdList();             break;
  case 'new':   cmdNew(arg);           break;
  default:
    console.log(`
SciSpark lesson frame tool

  node scripts/build-lessons.mjs check          dry-run: show what would change
  node scripts/build-lessons.mjs sync           stamp the frame onto every lesson
  node scripts/build-lessons.mjs list           list managed / unmanaged lessons
  node scripts/build-lessons.mjs new y8/u7/l02  scaffold a new blank lesson
`);
    process.exit(cmd ? 1 : 0);
}
