# -*- coding: utf-8 -*-
"""Build the Learning Starting Point Check single page from the 3 source papers.
Extracts the 12 selected Part C/D blocks, strips all original form controls,
keeps figures/tables/prompt text, renumbers Q1-Q12, and adds ONE long-answer
box per question. Emits intake_questions.html (body fragment) used by index.html.
"""
import re, json, os, posixpath

HERE = os.path.dirname(__file__)

# site directory each source paper is served from (for resolving relative <img src>)
PAPER_BASE = {
    "assessment-y7-EN.html": "/assessment/year-7/en/",
    "assessment-y8-EN.html": "/assessment/year-8/en/",
    "assessment-y9-EN.html": "/assessment/year-9/en/",
}

def rewrite_img_src(body, paper):
    """Turn relative <img src> (non-base64) into absolute, deploy-safe site paths.
    The referenced files are git-tracked and ship with the site."""
    base = PAPER_BASE[paper]
    def repl(m):
        src = m.group(2)
        if src.startswith('data:') or src.startswith('http') or src.startswith('/'):
            return m.group(0)
        abs_path = posixpath.normpath(posixpath.join(base, src))
        return m.group(1) + abs_path + m.group(3)
    return re.sub(r'(<img\b[^>]*\bsrc=")([^"]*)(")', repl, body)

# (paper, source block id, year, subject, original Q label)
SPEC = [
    ("assessment-y7-EN.html", "qblock-Y7_QC1", "Y7", "Chemistry", "Y7 Q26"),
    ("assessment-y7-EN.html", "qblock-Y7_QC2", "Y7", "Biology",   "Y7 Q27"),
    ("assessment-y7-EN.html", "qblock-Y7_QD1", "Y7", "Chemistry", "Y7 Q29"),
    ("assessment-y7-EN.html", "qblock-Y7_QD3", "Y7", "Physics",   "Y7 Q31"),
    ("assessment-y8-EN.html", "qblock-27",     "Y8", "Chemistry", "Y8 Q27"),
    ("assessment-y8-EN.html", "qblock-26",     "Y8", "Physics",   "Y8 Q26"),
    ("assessment-y8-EN.html", "qblock-29",     "Y8", "Chemistry", "Y8 Q29"),
    ("assessment-y8-EN.html", "qblock-32",     "Y8", "Biology",   "Y8 Q32"),
    ("assessment-y9-EN.html", "qblock-27",     "Y9", "Chemistry", "Y9 Q27"),
    ("assessment-y9-EN.html", "qblock-28",     "Y9", "Physics",   "Y9 Q28"),
    ("assessment-y9-EN.html", "qblock-30",     "Y9", "Chemistry", "Y9 Q30"),
    ("assessment-y9-EN.html", "qblock-31",     "Y9", "Biology",   "Y9 Q31"),
]

def extract_block(html, bid):
    """Return full <div class=question-block ...>...</div> for the given id."""
    i = html.find('id="' + bid + '"')
    if i < 0:
        raise SystemExit("block not found: " + bid)
    start = html.rfind('<div class="question-block"', 0, i)
    depth = 0
    for m in re.finditer(r'<div\b|</div>', html[start:]):
        depth += 1 if m.group() != '</div>' else -1
        if depth == 0:
            return html[start:start + m.end()]
    raise SystemExit("unbalanced block: " + bid)

def inner_body(block):
    """Return inner HTML of the .question-body div."""
    i = block.find('class="question-body"')
    open_end = block.find('>', i) + 1
    depth = 1
    for m in re.finditer(r'<div\b|</div>', block[open_end:]):
        depth += 1 if m.group() != '</div>' else -1
        if depth == 0:
            return block[open_end:open_end + m.start()]
    return block[open_end:]

def remove_balanced_div(html, classname):
    """Remove every <div class="...classname..."> ... </div> (balanced)."""
    while True:
        m = re.search(r'<div\b[^>]*class="[^"]*\b' + re.escape(classname) + r'\b[^"]*"[^>]*>', html)
        if not m:
            return html
        start = m.start()
        depth = 0
        end = None
        for d in re.finditer(r'<div\b|</div>', html[start:]):
            depth += 1 if d.group() != '</div>' else -1
            if depth == 0:
                end = start + d.end()
                break
        if end is None:
            return html
        html = html[:start] + html[end:]

def strip_controls(body):
    """Remove all original answer inputs but keep prompts, tables, images."""
    # replace original answer inputs with a visible blank so cloze sentences
    # ("tablets ____ the acid because they are ____") still read correctly
    body = re.sub(r'<input\b[^>]*>', '<span class="spc-blank">______</span>', body)
    # remove textarea (with content) and select
    body = re.sub(r'<textarea\b[^>]*>.*?</textarea>', '', body, flags=re.S)
    body = re.sub(r'<select\b[^>]*>.*?</select>', '', body, flags=re.S)
    # remove whole MCQ option groups (none expected in C/D, but be safe)
    body = re.sub(r'<div class="mcq-options"[^>]*>.*?</div>\s*', '', body, flags=re.S)
    # remove dead interactive answer-builder widgets (their JS isn't loaded here)
    body = remove_balanced_div(body, 'q28d-wrap')
    # remove any leftover buttons (interactive controls with no handler here)
    body = re.sub(r'<button\b[^>]*>.*?</button>', '', body, flags=re.S)
    # the per-mark hint pill ".sub-marks" is kept (helps student weight effort)
    return body

def clean(body):
    # collapse runs of blank lines created by removals
    body = re.sub(r'\n\s*\n\s*\n+', '\n\n', body)
    return body.strip()

papers = {}
def load(p):
    if p not in papers:
        papers[p] = open(os.path.join(HERE, p), encoding='utf-8').read()
    return papers[p]

questions = []
for idx, (paper, bid, year, subj, orig) in enumerate(SPEC, start=1):
    html = load(paper)
    block = extract_block(html, bid)
    body = clean(strip_controls(inner_body(block)))
    body = rewrite_img_src(body, paper)
    qid = "SPC_Q%02d" % idx
    questions.append(dict(n=idx, qid=qid, year=year, subject=subj,
                          orig=orig, body=body))

# emit a fragment with each question rendered + one long-answer box
SUBJECT_EMOJI = {"Chemistry": "\U0001F9EA", "Biology": "\U0001F9EC", "Physics": "⚗️"}
parts = []
for q in questions:
    emoji = SUBJECT_EMOJI.get(q["subject"], "")
    parts.append('''
  <article class="spc-q" id="qcard-{qid}">
    <div class="spc-q-head">
      <span class="spc-q-num">Question {n} <span class="spc-q-of">of 12</span></span>
      <span class="spc-q-tag">{year} &middot; {subject} &middot; 5 marks</span>
    </div>
    <div class="spc-q-body">
{body}
    </div>
    <label class="spc-answer-label" for="ans_{qid}">Your answer
      <span class="spc-answer-hint">Answer every part (a, b, c &hellip;) you can. It is OK to skip parts you are unsure about.</span>
    </label>
    <textarea id="ans_{qid}" class="spc-answer" data-question-id="{qid}"
      rows="6" placeholder="Type your answer here&hellip;"
      aria-label="Answer for question {n}"></textarea>
  </article>'''.format(emoji=emoji, **q))

open(os.path.join(HERE, "intake_questions.html"), "w", encoding="utf-8").write("\n".join(parts))
# metadata for JS (ordered question ids)
open(os.path.join(HERE, "intake_qids.json"), "w", encoding="utf-8").write(
    json.dumps([q["qid"] for q in questions]))
print("built", len(questions), "questions ->", "intake_questions.html")
for q in questions:
    has_img = "yes" if "<img" in q["body"] else "no"
    has_tbl = "yes" if "<table" in q["body"] else "no"
    print("  Q%-2d %s %-9s %-7s img=%s table=%s  (%d chars)" % (
        q["n"], q["year"], q["subject"], q["orig"], has_img, has_tbl, len(q["body"])))
