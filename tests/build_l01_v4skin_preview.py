# Build the Y7 L01 v4+skin pilot preview from the LIVE lesson file.
# Content rule (brief D1 / acceptance #2): all question text + marking
# byte-identical — this script only repoints shell files and adds
# skin chrome (hook band wrapper, exam-mode chip, audio, mute toggle).
import io, sys

SRC = 'lessons/y7/u1/l01.html'
DST = 'lessons/y7/u1/l01-v4skin-preview.html'

html = io.open(SRC, encoding='utf-8').read()
orig = html

def must_replace(old, new, label, count=1):
    global html
    n = html.count(old)
    assert n == count, f'{label}: expected {count} occurrence(s), found {n}'
    html = html.replace(old, new)

# 1 · title
must_replace(
    '<title>SciSpark · Y7 U1 L01 · What is Matter? (v2)</title>',
    '<title>SciSpark · Y7 U1 L01 · What is Matter? (v4+skin PREVIEW)</title>',
    'title')

# 2 · CSS: v4 engine + skin layer
must_replace(
    '<link rel="stylesheet" href="/lesson-shell.css">',
    '<link rel="stylesheet" href="/lesson-shell-v4.css">\n'
    '<link rel="stylesheet" href="/lesson-shell-v4-skin.css">\n'
    '<link rel="stylesheet" href="/components/click-spark-fx/click-spark-fx.css">',
    'css link')

# 3 · JS: v4 engine + doudou poses + skin layer
must_replace(
    '<script src="/lesson-shell.js"></script>',
    '<script src="/lesson-shell-v4.js"></script>\n'
    '<script src="/components/doudou/poses.js"></script>\n'
    '<script src="/components/click-spark-fx/click-spark-fx.js"></script>\n'
    '<script src="/lesson-shell-v4-skin.js"></script>',
    'js script')

# 4 · reward audio (v4 feature; local files — sound only on user action)
must_replace(
    '<div class="print-notice">© SciSpark — Printing not permitted. 请勿打印 · 受版权保护内容。</div>',
    '<div class="print-notice">© SciSpark — Printing not permitted. 请勿打印 · 受版权保护内容。</div>\n\n'
    '<!-- ★★★ v4: 5 OGG reward audio (mute toggle in nav · local files) ★★★ -->\n'
    '<audio id="audio-correct"  src="/audio/correct.ogg"  preload="auto"></audio>\n'
    '<audio id="audio-wrong"    src="/audio/wrong.ogg"    preload="auto"></audio>\n'
    '<audio id="audio-levelup"  src="/audio/levelup.ogg"  preload="auto"></audio>\n'
    '<audio id="audio-popup"    src="/audio/popup.ogg"    preload="auto"></audio>\n'
    '<audio id="audio-complete" src="/audio/complete.ogg" preload="auto"></audio>',
    'audio block')

# 5 · mute toggle in nav (v4 feature)
must_replace(
    '  <a href="/dashboard-student.html" class="nav-back">← Dashboard</a>\n'
    '  <div class="lang-toggle">',
    '  <a href="/dashboard-student.html" class="nav-back">← Dashboard</a>\n'
    '  <button class="mute-toggle" id="mute-toggle" onclick="toggleMute()" title="Mute · 静音" aria-label="Toggle sound">🔊</button>\n'
    '  <div class="lang-toggle">',
    'mute toggle')

# 6 · HOOK cinematic band: wrap the existing screen-header (text unchanged)
hook_header = (
    '''    <div class="screen-header">
      <div class="screen-eyebrow" data-en="Y7 · Unit 1 · Lesson 1 · HOOK" data-zh="Y7 · 第1单元 · 第1课 · 启发">Y7 · Unit 1 · Lesson 1 · HOOK</div>
      <h1 class="screen-title" data-en="What is matter?" data-zh="什么是物质?">What is matter?</h1>
      <div class="screen-title-zh">什么是物质?</div>
      <p class="screen-desc" data-en="Two ordinary objects. One big idea. Find the thing they share." data-zh="两个普通物品。一个大想法。找出它们共有的东西。">Two ordinary objects. One big idea. Find the thing they share.</p>
    </div>''')
hook_band = (
    '''    <!-- ─── v4+skin PILLAR 1: cinematic HOOK band ───
         PHOTO SLOT (D3): real photo allowed HERE ONLY. When the Founder
         supplies a licensed photo, add inside .hook-band-media:
           <img class="hook-band-photo" src="/assets/lessons/y7u1l01-hook.jpg" alt="...">
         and record the licence. Until then .hook-band-scene renders an
         illustrated gradient scene (no licence needed). -->
    <div class="hook-band">
      <div class="hook-band-media" aria-hidden="true">
        <div class="hook-band-scene"></div>
        <div class="hook-band-drift"></div>
      </div>
      <div class="hook-band-content">
''' + hook_header + '''
      </div>
    </div>''')
must_replace(hook_header, hook_band, 'hook band')

# 7 · TEST: mono "exam mode" eyebrow chip (chrome only, no content change)
must_replace(
    '      <div class="screen-eyebrow" data-en="Y7 · Unit 1 · Lesson 1 · TEST" data-zh="Y7 · 第1单元 · 第1课 · 测试">Y7 · Unit 1 · Lesson 1 · TEST</div>',
    '      <div class="exam-mode-chip"><span data-en="EXAM MODE · NO HINTS" data-zh="考试模式 · 无提示">EXAM MODE · NO HINTS</span></div>\n'
    '      <div class="screen-eyebrow" data-en="Y7 · Unit 1 · Lesson 1 · TEST" data-zh="Y7 · 第1单元 · 第1课 · 测试">Y7 · Unit 1 · Lesson 1 · TEST</div>',
    'exam chip')

# 8 · preview marker comment at top
must_replace(
    '<!-- SciSpark Lesson Shell v2 (B-mode) · © 2026 SciSpark -->',
    '<!-- SciSpark Lesson Shell v4+skin PREVIEW (B-mode) · © 2026 SciSpark\n'
    '     PILOT for SCISPARK_LESSON_SHELL_REDESIGN_BRIEF_v1 — NOT LIVE.\n'
    '     Live students stay on l01.html (v2 shell) until Founder sign-off (D4). -->',
    'preview marker')

io.open(DST, 'w', encoding='utf-8', newline='\n').write(html)

# sanity: question/marking content untouched
import re
def strip_known_edits(s):
    return s
for must_keep in ['window.markSchemes', 'function checkAnswer', "submitAnswer('q1')",
                  'All three are matter.', 'Air has mass.']:
    assert must_keep in html, f'content lost: {must_keep}'
print('OK wrote', DST, len(html), 'chars (src', len(orig), ')')
