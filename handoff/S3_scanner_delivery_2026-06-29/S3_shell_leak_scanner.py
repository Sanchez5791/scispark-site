#!/usr/bin/env python3
# -*- coding: utf-8 -*-
# ================================================================
# S3_shell_leak_scanner.py
# SciSpark 检查房 (S3 Review Room) · 半成品 + 泄漏扫描器  v2
# ----------------------------------------------------------------
# 这支扫描器一次报 7 样 (第零块 6 样 + v18 新增第 7 样):
#   1. 内部代号 MARK_SCHEME 漏给学生看            -> 红牌 FAIL
#   2. [方括号] 没填的空格 / 残留模板             -> 红牌 FAIL
#   3. 豆豆 3 问 + 教授开场白「16 条」写满没        -> 缺/空 = 红牌; 认不出记号 = 人眼复核
#   4. 这 16 条是不是还停在空模板                 -> 同第 3 样一起判
#   5. 内部图片代号 [IMAGE: ...] 漏在正文          -> 格式对放过; 格式错 = 红牌
#   6. 确认这课换线上哪一课                       -> 机器判不了, 只印提醒
#   7. 考试局牌子 Cambridge / UCLES / CAIE ...     -> 红牌 FAIL; 0893 -> 人眼复核
#
# 三个桶 (照批准纸条 2026-06-29 分):
#   🔴 红牌 RED      = 真问题, 整课打回
#   🟡 人眼复核 REVIEW = 机器判不了, 别瞎判过 (0893 / 认不出 16 条记号)
#   ⚪ 放过 PASS     = 正常占位 (格式对的图片格子 / 骨架标签 / 分数 [1][2] / [accept:])
#
# 防误伤铁律 (检查房上次一节好课被误判 53 个, 就是这条):
#   图片格子「按正确格式」才放过, 不是凡 [IMAGE: 开头就放过.
#   正确格式只有两类 (v18 批准纸条):
#       题目图:   [IMAGE: L##_Q##_IMG## here]
#       屏幕图:   [IMAGE: L##_<屏名>_IMG## here]   屏名 = HOOK/LEARN/TRY/TEST/WRAP
#   格式不对的 (例 [IMAGE: ???]、[IMAGE: 插入这里]、[图片]、[____]) -> 红牌.
#
# 用法:
#   python3 S3_shell_leak_scanner.py <文件或文件夹>
#   python3 S3_shell_leak_scanner.py .              # 扫当前文件夹所有 .txt / .html
#   python3 S3_shell_leak_scanner.py lesson.txt     # 扫单个文件
#
# 退出码 (给跑批脚本看):
#   0 = 全干净 (没红牌, 没复核项)
#   1 = 有红牌 (FAIL, 整课打回)
#   2 = 没红牌, 但有人眼复核项 (不可直接放行)
#
# 它只算账, 不猜. 同样的课文扫几次结果都一样.
# 2026-06-29 · 双手房 (Code Room)
# ================================================================

import re, sys, os, glob

# Windows 终端常是 cp1252, 吐不出中文 / emoji -> 强制 UTF-8 输出.
try:
    sys.stdout.reconfigure(encoding='utf-8')
    sys.stderr.reconfigure(encoding='utf-8')
except Exception:
    pass

# ── 第 7 样: 考试局牌子 (不分大小写) ──────────────────────────────
# 顺序: 长的放前面, 这样同一行优先报最精确的牌子.
BRANDS = [
    "Cambridge Assessment",
    "Cambridge International",
    "University of Cambridge",
    "UCLES",
    "CAIE",
    "Cambridge",          # 兜底: 任何 Cambridge 都算
]
# ★ 用「整词」配, 不用「子串」配。否则 base64 图片码 / 编码块里碰巧夹着 CAIE / UCLES
#   会被误判 (真出过: <img src="data:image/png;base64,...CAIE..."> 被误抓)。
def _brand_re(b):
    return re.compile(r'\b' + re.escape(b).replace(r'\ ', r'\s+') + r'\b', re.I)
BRAND_RE = [(b, _brand_re(b)) for b in BRANDS]
SYLLABUS_CODE = re.compile(r'(?<!\d)0893(?!\d)')   # 0893 单独处理 -> 人眼复核

# 「内部字段」判定 (给写课人看, 不是学生屏).
# 用在 txt 中间稿: 这一行若是明确的内部笔记 / 内部字段 -> Cambridge 改人眼复核 (做法B).
# 拿不准 (不匹配这里) -> 当红牌 (从严, 宁可误抓不可放漏).
INTERNAL_HINT = re.compile(
    r'(NOTE TO|setup\s*§|Source\s*:|WRITING DECISIONS|DEPTH|depth dial|difficulty|'
    r'Stage\s*\d|command word|PRODUCED BY|BASED ON|GIVE TO|INTERNAL_REF|'
    r'Progression Test|Checkpoint|S4 |S5 |<=|FILL BOX|IMAGE NAME FMT)', re.I)

# ── 第 1 样: 内部代号 MARK_SCHEME ─────────────────────────────────
MARK_SCHEME = re.compile(r'MARK_SCHEME', re.I)

# ── 方括号分类 (第 2 + 第 5 样) ──────────────────────────────────
# 正确格式的图片格子 -> 放过.
WELL_FORMED_IMAGE = re.compile(
    r'^\[IMAGE:\s*L\d+_(?:HOOK|LEARN|TRY|TEST|WRAP|Q\d+)_IMG\d+\s+here\]$', re.I)
# 分数标记 [1] [2] -> 放过.
SCORE_MARK = re.compile(r'^\[\d+\]$')
# 批注 [accept:...] / [reject:...] / [ignore:...] -> 放过.
ANNOTATION = re.compile(r'^\[(?:accept|reject|ignore)\b', re.I)
# 已知骨架标签 -> 放过 (检查房点名过的那些: BEAT/NAV/ASSET/A1.../Q01 SLOT/...).
SKELETON = re.compile(
    r'^\[(?:BEAT|NAV|ASSET|MISCONCEPTION|KEPT NOTE|COVER|A\d+|Q\d+\s+SLOT|SLOT)\b', re.I)
# 看起来像「没填的空格 / 残留模板」的方括号 -> 红牌.
# 注意: 不抓全空 [] —— 那在 HTML/JS 里就是空数组, 抓了 = 误伤 (live 扫描真撞过).
#       只抓带「占位信号」的方括号 (下划线 / 问号 / 占位词 / 以 here] 结尾).
PLACEHOLDER = re.compile(
    r'_{2,}'                           # 下划线 [____]
    r'|\?{2,}'                         # 问号 [???]
    r'|填|待填|插入|占位|图片'           # 中文占位词
    r'|placeholder|TODO|FIXME|TBD'     # 英文占位词
    r'|\bfill\b'                       # fill here
    r'|\bhere\]$'                      # 以 here] 结尾但又不是正确图片格式
    , re.I)

def classify_bracket(tok):
    """给一个方括号 token 判桶: ('pass', 标签) / ('red', 原因) / None=不管."""
    if WELL_FORMED_IMAGE.match(tok):
        return ('pass', '正常占位:图片格子(格式对)')
    if SCORE_MARK.match(tok):
        return ('pass', '正常占位:分数标记')
    if ANNOTATION.match(tok):
        return ('pass', '正常占位:批注')
    if SKELETON.match(tok):
        return ('pass', '正常占位:骨架标签')
    # 以 [IMAGE 开头但格式不对 -> 残留 / 写坏的图片代号 = 红牌
    if re.match(r'^\[IMAGE\b', tok, re.I):
        return ('red', '图片代号格式不对 / 残留 (第5样)')
    # 看起来是没填的空格 / 残留模板 = 红牌
    if PLACEHOLDER.search(tok):
        return ('red', '没填的空格 / 残留模板 (第2样)')
    # 其它认不出的方括号: 默认放过 (避免重演 53 个误伤).
    return None

# ── 第 3 + 第 4 样: 16 条豆豆 + 教授开场白 ────────────────────────
EXPECTED_16 = [
    'DOUDOU_Q1_EN', 'DOUDOU_Q1_ZH', 'DOUDOU_Q2_EN', 'DOUDOU_Q2_ZH',
    'DOUDOU_Q3_EN', 'DOUDOU_Q3_ZH',
    'SPARK_HOOK_EN', 'SPARK_HOOK_ZH', 'SPARK_LEARN_EN', 'SPARK_LEARN_ZH',
    'SPARK_TRY_EN', 'SPARK_TRY_ZH', 'SPARK_TEST_EN', 'SPARK_TEST_ZH',
    'SPARK_WRAP_EN', 'SPARK_WRAP_ZH',
]
EMPTY_VAL = re.compile(
    r'^\s*$|S4 fills|S5 fills|fills later|待填|TODO|TBD|_{2,}|placeholder|\(fill', re.I)

def check_16_lines(text):
    """回 (status, findings).
       status: 'ok' 全 16 条都写满 / 'red' 有缺或空 / 'review' 整套记号都认不出.
       findings: 红牌项的明细 list."""
    found = {}
    for i, line in enumerate(text.splitlines(), 1):
        m = re.match(r'^\s*([A-Z0-9_]+)\s*:\s*(.*)$', line)
        if m and m.group(1) in EXPECTED_16:
            found[m.group(1)] = (i, m.group(2).strip())
    if not found:
        # 一条记号都没有 -> 这份文件不是用这套记号 (例 HTML 成品) -> 人眼复核
        return ('review', [])
    findings = []
    for label in EXPECTED_16:
        if label not in found:
            findings.append((None, f'{label} 这条缺了 (16 条没写满)'))
        else:
            ln, val = found[label]
            if EMPTY_VAL.match(val):
                findings.append((ln, f'{label} 还停在空模板 / 没填: "{val[:40]}"'))
    return ('red' if findings else 'ok', findings)

# ── 第 7 样扫描 ──────────────────────────────────────────────────
def scan_brands(text, is_html):
    """回 (red_hits, review_hits). 每项 = (行号, 行文, 命中字眼, 内部?).

    txt 中间稿 (做法B):
        · 学生屏 / 拿不准的 Cambridge 牌子 -> 红牌
        · 明确内部字段里的 Cambridge       -> 人眼复核
        · 0893                            -> 人眼复核
    html 成品课 (规矩不同):
        · 成品 HTML 不该有任何内部笔记 -> 任何牌子 / 0893 一律红牌, 不走人眼复核."""
    red_hits, review_hits = [], []
    for i, line in enumerate(text.splitlines(), 1):
        matched = [b for b, rx in BRAND_RE if rx.search(line)]
        # 同一行若命中了较长的 Cambridge XXX, 就不再单独报 "Cambridge"
        if len(matched) > 1 and 'Cambridge' in matched and \
           any(b.startswith('Cambridge ') for b in matched):
            matched = [b for b in matched if b != 'Cambridge']
        if matched:
            internal = bool(INTERNAL_HINT.search(line))
            kw = ' / '.join(matched)
            if is_html:
                red_hits.append((i, line.strip(), kw, False))      # HTML: 一律红牌
            elif internal:
                review_hits.append((i, line.strip(), kw, True))    # txt 内部字段: 人眼复核
            else:
                red_hits.append((i, line.strip(), kw, False))      # txt 学生屏/拿不准: 红牌
        if SYLLABUS_CODE.search(line):
            internal = bool(INTERNAL_HINT.search(line))
            if is_html:
                red_hits.append((i, line.strip(), '0893', False))  # HTML: 0893 也红牌
            else:
                review_hits.append((i, line.strip(), '0893', internal))
    return red_hits, review_hits

# ── 扫一份文件 ───────────────────────────────────────────────────
def scan_file(path):
    with open(path, encoding='utf-8', errors='replace') as f:
        text = f.read()
    is_html = path.lower().endswith(('.html', '.htm'))
    red, review = [], []          # 每项 = 字符串 (已带行号)

    # 第 1 样: MARK_SCHEME
    for i, line in enumerate(text.splitlines(), 1):
        if MARK_SCHEME.search(line):
            red.append(f'第{i}行 · 内部代号 MARK_SCHEME 漏出 (第1样): {line.strip()[:70]}')

    # 第 2 + 第 5 样: 方括号
    for i, line in enumerate(text.splitlines(), 1):
        for tok in re.findall(r'\[[^\[\]]*\]', line):
            verdict = classify_bracket(tok)
            if verdict and verdict[0] == 'red':
                red.append(f'第{i}行 · {verdict[1]}: {tok}')

    # 第 3 + 第 4 样: 16 条
    st16, f16 = check_16_lines(text)
    if st16 == 'red':
        for ln, msg in f16:
            loc = f'第{ln}行 · ' if ln else ''
            red.append(f'{loc}16条开场白(第3/4样): {msg}')
    elif st16 == 'review':
        review.append('16条开场白(第3/4样): 这份文件认不出豆豆/教授记号 (可能是 HTML 成品或别的格式) — 请人眼复核 16 条写满没')

    # 第 7 样: 考试局牌子 + 0893 (txt 走做法B; html 一律红牌)
    brand_red, brand_review = scan_brands(text, is_html)
    for i, ln, kw, internal in brand_red:
        loc = 'HTML成品里' if is_html else '学生屏/拿不准'
        red.append(f'第{i}行 · 考试局牌子「{kw}」(第7样, {loc}): {ln[:70]}')
    for i, ln, kw, internal in brand_review:
        if kw == '0893':
            review.append(f'第{i}行 · 课纲号 0893 (第7样) — 真露给学生=红牌, 只在内部=放过, 请人眼复核: {ln[:70]}')
        else:
            review.append(f'第{i}行 · 考试局牌子「{kw}」(第7样, 疑似内部字段) — 请人眼确认真没露给学生 (做法B): {ln[:70]}')

    return red, is_html, review

# ── 主程序 ───────────────────────────────────────────────────────
def main():
    target = sys.argv[1] if len(sys.argv) > 1 else '.'
    if os.path.isdir(target):
        files = sorted(glob.glob(os.path.join(target, '*.txt')) +
                       glob.glob(os.path.join(target, '*.html')))
    else:
        files = [target]
    if not files:
        print('没找到 .txt / .html 文件。把课文放进来再跑。')
        sys.exit(2)

    print('=' * 60)
    print('SciSpark 检查房 · 半成品 + 泄漏扫描器 v2 (7 样齐报)')
    print(f'文件数: {len(files)}')
    print('=' * 60)

    any_red = False
    any_review = False
    for path in files:
        red, is_html, review = scan_file(path)
        name = os.path.basename(path)
        mode = '[HTML成品·牌子一律红牌]' if is_html else '[txt中间稿·内部牌子走复核]'
        if not red and not review:
            print(f'\n✅ PASS  {name} {mode}  —— 7 样全过, 0 红牌 0 复核')
            continue
        if red:
            any_red = True
            print(f'\n❌ FAIL  {name} {mode}  —— 🔴 {len(red)} 个红牌' +
                  (f', 🟡 {len(review)} 项待复核' if review else ''))
            for r in red:
                print(f'    🔴 {r}')
        else:
            print(f'\n🟡 REVIEW  {name} {mode}  —— 0 红牌, 但 🟡 {len(review)} 项待人眼复核')
        if review:
            any_review = any_review or bool(review)
            for r in review:
                print(f'    🟡 {r}')

    # 第 6 样: 机器判不了, 永远印一句提醒.
    print('\n' + '-' * 60)
    print('ℹ️  第6样提醒: 请人工确认每节课对应线上哪一课 (机器判不了)。')
    print('-' * 60)

    print('\n' + '=' * 60)
    if any_red:
        print('❌ 有红牌 — 整课打回, 不准放行。修干净再扫一遍。')
        sys.exit(1)
    elif any_review:
        print('🟡 没红牌, 但有项目要人眼复核 — 不可直接放行, 先让人看过。')
        sys.exit(2)
    else:
        print('✅ 全干净 — 7 样全过。')
        sys.exit(0)

if __name__ == '__main__':
    main()
