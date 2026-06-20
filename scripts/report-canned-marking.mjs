#!/usr/bin/env node
/*
═══════════════════════════════════════════════════════════════════════════
SciSpark · report-canned-marking.mjs — CHECK-1 rewrite worklist for the factory
═══════════════════════════════════════════════════════════════════════════
Lists, per lesson, every question-specific marking sentence that repeats ≥3×
word-for-word — i.e. the canned feedback the machine gate blocks on CHECK 1.
Uses the SAME parser (./lib/marking.mjs) as gate-iron-rules.mjs, so this list is
exactly what the gate counts. Standard rubric (Ignore/Partial/Spelling) is
excluded by default (smart mode); pass --strict to include it.

  node scripts/report-canned-marking.mjs --lessons lessons/y7/u1
  node scripts/report-canned-marking.mjs --lessons lessons/y7/u4 --strict
═══════════════════════════════════════════════════════════════════════════
*/
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { extractQuestions, markingSegments, RUBRIC, KEY_LABEL } from './lib/marking.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const arg = (f, d) => { const i = process.argv.indexOf(f); return i >= 0 ? process.argv[i + 1] : d; };
const STRICT = process.argv.includes('--strict');
const lessonsArg = arg('--lessons', 'lessons/y7/u1');
const DIR = join(ROOT, lessonsArg);
if (!existsSync(DIR)) { console.error('No such dir: ' + lessonsArg); process.exit(2); }

const files = readdirSync(DIR).filter(n => /^l\d+\.html$/.test(n)).sort();
const lines = [];
const out = s => lines.push(s);

out('================================================================');
out('CHECK 1 · CANNED-MARKING REWRITE WORKLIST');
out('unit: ' + lessonsArg + (STRICT ? '   [--strict: rubric included]' : '   [smart: Ignore/Partial/Spelling excluded]'));
out('Each line below repeats word-for-word across the listed questions and');
out('MUST be rewritten so each question gets its own answer-specific feedback.');
out('================================================================');

let unitTotal = 0;
for (const file of files) {
  const html = readFileSync(join(DIR, file), 'utf8');
  const qs = extractQuestions(html).filter(q => q.reveal);   // standard markable questions only
  if (!qs.length) continue;
  // segText -> { key, qs:Set, full }
  const freq = new Map();
  for (const q of qs) {
    const seen = new Set();
    for (const s of markingSegments(q.reveal)) {
      if (!STRICT && RUBRIC.has(s.key)) continue;
      if (s.text.length < 12) continue;
      const k = s.text.toLowerCase();
      if (seen.has(k)) continue; seen.add(k);   // count a sentence once per question
      if (!freq.has(k)) freq.set(k, { key: s.key, full: s.text, qs: new Set() });
      freq.get(k).qs.add(q.num || '?');
    }
  }
  const canned = [...freq.values()].filter(e => e.qs.size >= 3).sort((a, b) => b.qs.size - a.qs.size);
  if (!canned.length) continue;
  out('');
  out(`${file.replace(/\.html$/, '').toUpperCase()}  (${qs.length} questions)`);
  for (const e of canned) {
    unitTotal++;
    const qlist = [...e.qs].sort();
    out(`  • [${KEY_LABEL[e.key] || e.key}] repeated ${e.qs.size}× — ${qlist.join(', ')}`);
    out(`      "${e.full}"`);
  }
  out(`  → ACTION: give each of those questions its own answer-specific text for the field(s) above.`);
}

out('');
out('----------------------------------------------------------------');
out(`TOTAL canned sentences in ${lessonsArg}: ${unitTotal}`);
out(unitTotal ? 'STATUS: BLOCKED until rewritten.' : 'STATUS: clear — no canned marking.');
out('================================================================');

console.log(lines.join('\n'));
