/*
═══════════════════════════════════════════════════════════════════════════
SciSpark · lib/marking.mjs — shared lesson-HTML marking parser
═══════════════════════════════════════════════════════════════════════════
Single source of truth for how a lesson's question blocks and marking segments
are read out of the rendered HTML. Imported by BOTH gate-iron-rules.mjs (the
machine gate) and report-canned-marking.mjs (the rewrite worklist) so a report
can never disagree with what the gate actually blocks.
═══════════════════════════════════════════════════════════════════════════
*/

// ── text utils ──────────────────────────────────────────────────────────────
export const decode = s => String(s)
  .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
  .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, ' ');
export const stripZh = s => s.replace(/<span class="zh">[\s\S]*?<\/span>/g, ' ');
export const stripTags = s => s.replace(/<[^>]*>/g, ' ');
export const norm = s => decode(stripTags(String(s))).replace(/\s+/g, ' ').trim();
export const normLower = s => norm(s).toLowerCase();

// ── per-question extraction (independent of the generator) ───────────────────
export function screenOf(html, idx) {
  let cur = '?';
  const re = /id="screen-(hook|learn|try|test|wrap)"/g; let m, last = -1;
  while ((m = re.exec(html)) !== null) { if (m.index <= idx && m.index > last) { last = m.index; cur = m[1]; } }
  return cur;
}
export function extractQuestions(html) {
  const starts = [...html.matchAll(/<div class="question-block"/g)].map(m => m.index);
  const out = [];
  for (let i = 0; i < starts.length; i++) {
    const slice = html.slice(starts[i], starts[i + 1] ?? html.length);
    const num = (slice.match(/<div class="q-number">([^<]*)<\/div>/) || [])[1] || '';
    const reveal = (slice.match(/<div class="answer-reveal-text">([\s\S]*?)<\/div>/) || [])[1] || '';
    const source = (slice.match(/<div class="source-note">([^<]*)/) || [])[1] || '';
    const qtext = (slice.match(/<p class="question-text">([\s\S]*?)<\/p>/) || [])[1] || '';
    // hint-box holds a nested <div class="hint-label">…</div>, so a non-greedy match to the
    // first </div> would grab only the label. Slice from hint-box to the answer-reveal/btn-row
    // that always follows, then drop the label div, to get the real hint prose.
    let hint = '';
    const hb = slice.indexOf('class="hint-box"');
    if (hb >= 0) {
      const after = slice.slice(hb);
      const end = after.search(/<div class="answer-reveal|<div class="btn-row/);
      hint = (end >= 0 ? after.slice(0, end) : after).replace(/<div class="hint-label">[\s\S]*?<\/div>/, '');
    }
    const imgPrompts = [...slice.matchAll(/data-image-prompt="([^"]*)"/g)].map(m => m[1]);
    out.push({ num: num.trim(), reveal, source: source.trim(), qtext, hint, imgPrompts, screen: screenOf(html, starts[i]) });
  }
  return out;
}

// ── marking segments ────────────────────────────────────────────────────────
export const LABEL_RE = /(✓\s*Accept:|✗\s*Reject:|Ignore:|Partial:|Spelling:|If right:|If wrong:|⚑[^:：]*[:：])/g;
export const labelKey = lab => {
  const l = lab.toLowerCase();
  if (l.includes('accept')) return 'accept';
  if (l.includes('reject')) return 'reject';
  if (l.startsWith('ignore')) return 'ignore';
  if (l.startsWith('partial')) return 'partial';
  if (l.startsWith('spelling')) return 'spelling';
  if (l.startsWith('if right')) return 'ifright';
  if (l.startsWith('if wrong')) return 'ifwrong';
  return 'teacher';
};
// labels whose repetition is legitimate standard-rubric scaffolding (smart-mode allow-list)
export const RUBRIC = new Set(['ignore', 'partial', 'spelling']);
// human label for a segment key (for reports)
export const KEY_LABEL = {
  expected: 'Expected answer', accept: 'Accept', reject: 'Reject',
  ifright: 'If right (对)', ifwrong: 'If wrong (错)', teacher: 'Teacher note',
  ignore: 'Ignore', partial: 'Partial', spelling: 'Spelling',
};
export function markingSegments(revealHtml) {
  const en = norm(stripZh(revealHtml));
  if (!en) return [];
  const parts = en.split(LABEL_RE);
  const segs = [];
  if (parts[0] && parts[0].trim()) segs.push({ key: 'expected', text: parts[0].trim() });
  for (let i = 1; i < parts.length; i += 2) {
    segs.push({ key: labelKey(parts[i]), text: (parts[i + 1] || '').trim() });
  }
  return segs;
}
