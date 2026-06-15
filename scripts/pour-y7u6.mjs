#!/usr/bin/env node
/*
═══════════════════════════════════════════════════════════════════════════
SciSpark · pour-y7u6.mjs — RE-WRAP B2 Y7 Unit 6 (Ecosystems) into live shell
═══════════════════════════════════════════════════════════════════════════
Unlike pour-y7u1..u5 (which parse raw B1c text), Unit 6 arrived from the B2 room
as FULLY LAID-OUT, validator-passing preview HTML. Per INSTRUCTIONS_FOR_CODE_ROOM
the Code-Room job is exactly two things, layout-only:

  1. Re-wrap each lesson BODY into the LIVE online shell v4 + skin
       Engine: /lesson-shell-v4.js  /lesson-shell-v4.css
       Skin:   /lesson-shell-v4-skin.js  /lesson-shell-v4-skin.css
       Master: lessons/_template/lesson-shell-v4.html
     Keep the card layout AND inline card styles EXACTLY as delivered.
  2. (push handled separately) re-run the validator after push.

HARD RULES (B2): DO NOT touch answers / questions / marks / concept order /
science facts / card inline styles / Visual-Dictionary cards. LAYOUT ONLY.

HOW THIS SCRIPT HONOURS THAT
  • The 5 delivered <section class="screen" id="screen-X"> bodies are copied
    VERBATIM into the v4 master's 5 INSERT slots. No markup is rewritten — the
    delivered class vocabulary (.card .qcard .ptlist .flavour .vd-card .examreal
    .redcard .ans …) and every inline style survives byte-for-byte, so the B2
    machine validator stays green when re-pointed at the output.
  • The delivered preview's CHROME (its own nav/sidebar/footer + JS shim) is
    DROPPED — the live shell provides nav, sidebar, progress, lang toggle, audio,
    XP, Spark Jar, streak, DouDou, AI-tutor panel and the real JS engine.
  • The delivered card CSS (identical <style> across all 7 files) is ported ONCE
    into a shared stylesheet (public/lesson-b2-cards.css), SCOPED under
    .main-content so it cannot fight the shell chrome, with the :root tokens
    re-homed onto .main-content and the language toggle re-keyed from the
    preview's `body[data-lang]` to the shell's `body.zh-mode`.

Usage:
  node scripts/pour-y7u6.mjs [<delivery-dir>]
  (default delivery-dir = .tmp-u6/DELIVERY_Y7U6)
Output:
  lessons/y7/u6/l01.html … l07.html   (re-wrapped lessons)
  lessons/y7/u6/index.html            (B2 cover, verbatim — entities kept)
  public/lesson-b2-cards.css          (ported, scoped card stylesheet)
═══════════════════════════════════════════════════════════════════════════
*/
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const DELIVERY = process.argv[2] || join(ROOT, '.tmp-u6', 'DELIVERY_Y7U6');
const PREVIEW = join(DELIVERY, 'preview');
const OUT_DIR = join(ROOT, 'lessons', 'y7', 'u6');
const MASTER = join(ROOT, 'lessons', '_template', 'lesson-shell-v4.html');
const CARDS_CSS_OUT = join(ROOT, 'public', 'lesson-b2-cards.css');

const UNIT = { label: 'Y7 Unit 6', en: 'Ecosystems', zh: '生态系统' };
const SUBJECT = { en: 'Biology', zh: '生物' };
// Biology Route C sub-labels — identical across U6 (match the delivered sidebar).
const SUBLABELS = {
  hook:  { en: 'Observe',            zh: '观察' },
  learn: { en: 'Define',             zh: '定义' },
  try:   { en: 'Define &amp; diagnose', zh: '练习' },
  wrap:  { en: 'Reflect',            zh: '反思' },
};
// AI-tutor starter prompts — UI scaffolding (not exam content), so generic +
// lesson-agnostic by design; no science facts are invented here.
const AI_PROMPTS = [
  { en: "Explain today's key idea in simple words", zh: '用简单的话解释今天的重点' },
  { en: 'Give me an everyday example',              zh: '给我一个生活中的例子' },
  { en: 'Quiz me with one question',                zh: '出一道题考我' },
];

const SCREENS = ['hook', 'learn', 'try', 'test', 'wrap'];

// ── CSS port: delivered <style> body → scoped shared stylesheet ──────────────
const CHROME_CLASSES = new Set([
  'top-nav', 'logo-bolt', 'nav-brand', 'nav-meta', 'nav-badge', 'nav-spacer',
  'nav-streak', 'lang-toggle', 'lang-btn', 'body-wrap', 'sidebar',
  'sidebar-unit-label', 'sidebar-unit-title', 'sidebar-progress',
  'screen-nav-item', 'screen-num', 'screen-nav-main', 'screen-nav-sub',
  'progress-bar', 'progress-fill', 'progress-label', 'main-content',
  'lesson-footer', 'screen', // bare .screen / .screen.active → shell owns visibility
]);
// split a CSS string into top-level rules / at-rules (brace-aware)
function splitTopLevel(css) {
  const out = []; let depth = 0, buf = '';
  for (const ch of css) {
    buf += ch;
    if (ch === '{') depth++;
    else if (ch === '}') { depth--; if (depth === 0) { out.push(buf.trim()); buf = ''; } }
  }
  if (buf.trim()) out.push(buf.trim());
  return out;
}
const firstClass = sel => (sel.match(/\.([a-zA-Z][\w-]*)/) || [])[1] || null;
function portCss(styleBody) {
  const rules = splitTopLevel(styleBody);
  const kept = [];
  for (const rule of rules) {
    const at = rule.match(/^@([a-z-]+)/i);
    if (at) {
      const kind = at[1].toLowerCase();
      if (kind === 'keyframes' || kind === 'font-face') { kept.push(rule); }
      // @media in the delivered sheet only collapses the shell sidebar/main-content
      // (chrome responsive) — the live shell owns its own responsive layout. Drop it.
      continue;
    }
    const braceAt = rule.indexOf('{');
    if (braceAt < 0) continue;
    const selectorList = rule.slice(0, braceAt).trim();
    const decls = rule.slice(braceAt); // includes { … }
    if (selectorList === ':root') continue; // :root tokens emitted separately, scoped to .main-content
    const newSels = [];
    for (let sel of selectorList.split(',').map(s => s.trim()).filter(Boolean)) {
      if (/\[data-lang/.test(sel)) continue;                 // re-keyed below
      if (sel === '*' || sel === 'body' || sel === 'html') continue; // shell owns globals
      const fc = firstClass(sel);
      if (fc && CHROME_CLASSES.has(fc)) continue;            // chrome → shell owns
      newSels.push('.main-content ' + sel);
    }
    if (newSels.length) kept.push(newSels.join(',\n') + ' ' + decls);
  }
  // Language toggle, re-keyed from the preview's body[data-lang] to the shell's
  // body.zh-mode. The delivered cards show one language at a time via .en/.zh
  // sibling spans. The live shell, however, force-hides ALL .zh glosses with
  //   body:not(.bilingual) .zh { display: none !important }   /* (0,2,1) */
  // and never adds .bilingual (its own bilingual path is data-en/data-zh text
  // swapping, not .en/.zh spans). So to restore the delivered toggle we must
  // beat an !important rule: each rule below is body-state-prefixed (0,3,1) AND
  // !important, so it wins the important cascade over the shell's (0,2,1). The
  // shown language uses `revert` → natural display (li→list-item, span→inline,
  // div→block, matching the delivered preview); the other is hidden.
  const langShim = [
    '/* ── language toggle: re-keyed to shell body.zh-mode, scoped to lesson content; ',
    '   overrides the shell\'s `body:not(.bilingual) .zh{display:none!important}` ── */',
    '.main-content *{box-sizing:border-box;}',
    'body:not(.zh-mode) .main-content .en{display:revert !important;}',
    'body:not(.zh-mode) .main-content .zh{display:none !important;}',
    'body.zh-mode .main-content .en{display:none !important;}',
    'body.zh-mode .main-content .zh{display:revert !important;}',
  ].join('\n');
  return kept.join('\n\n') + '\n\n' + langShim + '\n';
}
// re-home the delivered :root token block onto .main-content (custom props inherit
// to every card descendant but never leak to the shell chrome)
function rootVarsToScope(styleBody) {
  const m = styleBody.match(/:root\s*\{([^}]*)\}/);
  if (!m) return '';
  return `.main-content{\n${m[1].trim()}\n}\n\n`;
}

// ── delivered-file extraction ────────────────────────────────────────────────
const innerOf = (html, name) => {
  const m = html.match(new RegExp(`<section class="screen[^"]*" id="screen-${name}">([\\s\\S]*?)</section>`));
  return m ? m[1].replace(/^\s*\n/, '').replace(/\s*$/, '') : '';
};
const titleEnOf = html => {
  const m = html.match(/<title>([^<]*)<\/title>/);
  if (!m) return '';
  const parts = m[1].split('·').map(s => s.trim());
  return parts[parts.length - 1];
};
const titleZhOf = html => {
  const m = html.match(/<div class="banner-zh[^"]*">([^<]*)<\/div>/);
  return m ? m[1].trim() : '';
};
const countImg = html => (html.match(/class="img-slot"/g) || []).length;
const countQ = html => (html.match(/class="card qcard"/g) || []).length;

// ── master fill ──────────────────────────────────────────────────────────────
function buildLesson(num, srcHtml) {
  let m = readFileSync(MASTER, 'utf8');
  const tEn = titleEnOf(srcHtml);
  const tZh = titleZhOf(srcHtml);
  const lnum = String(parseInt(num, 10));
  const L = `L${num}`;

  // ── metadata REPLACE blocks ──
  m = m.replace('<title>SciSpark · Y[N] U[N] L[NN] · [Lesson Name]</title>',
                `<title>SciSpark · Y7 U6 ${L} · ${tEn}</title>`);
  m = m.replace('<body data-user-level="2" data-lesson="[N]">',
                `<body data-user-level="2" data-lesson="${lnum}">`);
  m = m.replace('<div class="nav-meta">Y[N] · U[N] · L[NN]</div>',
                `<div class="nav-meta">Y7 · U6 · ${L}</div>`);
  m = m.replace('<div class="nav-badge" data-en="[Subject]" data-zh="[学科]">[Subject]</div>',
                `<div class="nav-badge" data-en="${SUBJECT.en}" data-zh="${SUBJECT.zh}">${SUBJECT.en}</div>`);
  m = m.replace('<div class="sidebar-unit-label">Y[N] Unit [N]</div>',
                `<div class="sidebar-unit-label">${UNIT.label}</div>`);
  m = m.replace('<div class="sidebar-unit-title" data-en="[Unit Title EN]" data-zh="[单元标题]">[Unit Title EN]</div>',
                `<div class="sidebar-unit-title" data-en="${UNIT.en}" data-zh="${UNIT.zh}">${UNIT.en}</div>`);

  // ── sidebar sub-labels (hook/learn/try/wrap; test is pre-filled in master) ──
  m = m.replace('[Hook sub-label]', SUBLABELS.hook.en).replace('[钩子副标签]', SUBLABELS.hook.zh);
  m = m.replace('[Learn sub-label]', SUBLABELS.learn.en).replace('[学习副标签]', SUBLABELS.learn.zh);
  m = m.replace('[Try sub-label]', SUBLABELS.try.en).replace('[练习副标签]', SUBLABELS.try.zh);
  m = m.replace('[Wrap sub-label]', SUBLABELS.wrap.en).replace('[总结副标签]', SUBLABELS.wrap.zh);

  // ── ported card stylesheet link (after the skin css) ──
  m = m.replace('<link rel="stylesheet" href="/lesson-shell-v4-skin.css">',
                '<link rel="stylesheet" href="/lesson-shell-v4-skin.css">\n<!-- B2 Y7U6 delivered card components (scoped to .main-content) -->\n<link rel="stylesheet" href="/lesson-b2-cards.css">');

  // ── 5 screen bodies, verbatim ──
  for (const name of SCREENS) {
    const inner = innerOf(srcHtml, name);
    const open = m.match(new RegExp(`<section class="screen[^"]*" id="screen-${name}">`))[0];
    m = m.replace(
      new RegExp(`<section class="screen[^"]*" id="screen-${name}">[\\s\\S]*?</section>`),
      () => `${open}\n\n${inner}\n\n  </section>`
    );
  }

  // ── AI-tutor starter prompts ──
  AI_PROMPTS.forEach((p, i) => {
    m = m.replace(`[Question ${i + 1} for this lesson]`, p.en);
    m = m.replace(['[第一个问题中文]', '[第二个问题中文]', '[第三个问题中文]'][i], p.zh);
  });

  // ── Professor Spark bubble dialogue ──
  const bubble = `window.bubbleScripts = {
  hook:  { en: "Let's take a look — ready?",                 zh: "我们来看看 — 准备好了吗？" },
  learn: { en: "Here's the key idea. Watch closely!",        zh: "这是关键概念，看仔细！" },
  try:   { en: "Try these with me — hints are here if you need them.", zh: "跟我一起做 — 需要时可以看提示。" },
  test:  { en: "Your turn solo. You've got this!",           zh: "换你自己来。你可以的！" },
  wrap:  { en: "Great work today. See you next lesson!",      zh: "今天做得很好。下一课见！" }
};`;
  m = m.replace(/window\.bubbleScripts = \{[\s\S]*?\};/, () => bubble);

  return { html: m, img: countImg(srcHtml), q: countQ(srcHtml), tEn, tZh };
}

// ── main ─────────────────────────────────────────────────────────────────────
if (!existsSync(PREVIEW)) { console.error(`delivery preview not found: ${PREVIEW}`); process.exit(1); }
if (!existsSync(MASTER))  { console.error(`v4 master not found: ${MASTER}`); process.exit(1); }
if (!existsSync(OUT_DIR)) mkdirSync(OUT_DIR, { recursive: true });

// 1) ported shared card stylesheet (once — all 7 share an identical <style>)
const sampleStyle = readFileSync(join(PREVIEW, 'l01.html'), 'utf8').match(/<style>([\s\S]*?)<\/style>/)[1];
const cardsCss =
  '/* ───────────────────────────────────────────────────────────────────────\n' +
  '   SciSpark · lesson-b2-cards.css\n' +
  '   B2 Y7U6 delivered card components, ported VERBATIM and SCOPED under\n' +
  '   .main-content so they layer on the live lesson-shell-v4 + skin chrome\n' +
  '   without colliding. Generated by scripts/pour-y7u6.mjs — do not hand-edit;\n' +
  '   re-run the pour to regenerate. Card look/colours are unchanged from the\n' +
  '   B2 delivery (HARD RULE: do not change card styles).\n' +
  '   ─────────────────────────────────────────────────────────────────────── */\n\n' +
  rootVarsToScope(sampleStyle) + portCss(sampleStyle);
writeFileSync(CARDS_CSS_OUT, cardsCss);
console.log(`\n  ✓ public/lesson-b2-cards.css  (${cardsCss.length} bytes, scoped to .main-content)\n`);

// 2) re-wrap the 7 lessons
let okq = true, oki = true;
// Corrected image inventory (B2 redo 2026-06-15, missing multi-image slots restored;
// the new validate.py D2 gate counts source [IMAGE:]/IMAGE_PROMPT vs rendered slots).
const expImg = { '01': 7, '02': 13, '03': 14, '04': 15, '05': 11, '06': 6, '07': 5 };
for (let i = 1; i <= 7; i++) {
  const num = String(i).padStart(2, '0');
  const src = readFileSync(join(PREVIEW, `l${num}.html`), 'utf8');
  const { html, img, q, tEn } = buildLesson(num, src);
  writeFileSync(join(OUT_DIR, `l${num}.html`), html);
  const qOk = q === 10, iOk = img === expImg[num];
  okq = okq && qOk; oki = oki && iOk;
  console.log(`  L${num}  ${tEn.slice(0, 44).padEnd(46)} Q ${q}${qOk ? '✓' : '✗(exp 10)'}   IMG ${img}${iOk ? '✓' : `✗(exp ${expImg[num]})`}`);
}

// 3) cover page — verbatim (B2 LOCKED template; keep the Chinese HTML entities)
const cover = readFileSync(join(PREVIEW, 'index.html'), 'utf8');
writeFileSync(join(OUT_DIR, 'index.html'), cover);
console.log(`\n  ✓ lessons/y7/u6/index.html  (B2 cover, verbatim)\n`);
console.log(`  counts: questions ${okq ? 'all 10 ✓' : 'MISMATCH ✗'} · images ${oki ? 'match inventory ✓' : 'MISMATCH ✗'}\n`);
