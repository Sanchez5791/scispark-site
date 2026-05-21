"""
PEDAGOGY_CAP_v1 · 11 Atomic Tests (T01–T11) + URL bar screenshot
Vercel preview · not localhost
2026-05-21
"""
import os
import sys
import time
if sys.stdout.encoding != 'utf-8':
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')

from playwright.sync_api import sync_playwright

PREVIEW_BASE = "https://project-z8i1b-a2bjsxbtr-sci-spark.vercel.app"
LESSON_PATH  = "/lessons/y7/u1/l01-v3-test.html"
BASE_URL     = PREVIEW_BASE + LESSON_PATH
RESET_URL    = BASE_URL + "?reset=1"
SS_DIR       = os.path.join(os.path.dirname(__file__), "screenshots")
os.makedirs(SS_DIR, exist_ok=True)

WRONG_ANSWER = "xxxxwrong"
RIGHT_ANSWER_Q1 = "all three are matter"

results = {}

def reset_and_navigate(page, level='2'):
    """Reset localStorage, navigate to clean URL, go to TRY screen, set level."""
    page.goto(RESET_URL, wait_until="networkidle", timeout=30000)
    page.wait_for_timeout(2500)
    # Navigate to TRY screen
    page.evaluate("if(typeof showScreen==='function') showScreen('try');")
    page.wait_for_timeout(500)
    # Set level
    page.evaluate(f"if(typeof setLevelV2==='function') setLevelV2('{level}');")
    page.wait_for_timeout(300)

def submit_wrong(page, qid='q1'):
    """Type a wrong answer and click submit."""
    ta = page.locator(f"#{qid}-input")
    ta.fill(WRONG_ANSWER)
    btn = page.locator(f"#{qid}-submit")
    btn.click()
    page.wait_for_timeout(600)

def inject_banner(page, test_id, status_lines):
    """Inject proof banner into the page before screenshotting."""
    all_pass = all("PASS" in s for s in status_lines if ":" in s)
    color = "#1F9D55" if all_pass else "#A32D2D"
    lines_html = "<br>".join(status_lines)
    page.evaluate(f"""() => {{
        document.querySelectorAll('._test_banner').forEach(e => e.remove());
        const b = document.createElement('div');
        b.className = '_test_banner';
        b.style.cssText = `
            position:fixed;top:0;left:0;right:0;z-index:99999;
            background:{color};color:white;font-family:monospace;
            font-size:11px;padding:8px 14px;line-height:1.7;
            box-shadow:0 2px 8px rgba(0,0,0,.4);
        `;
        b.innerHTML = `<strong>{test_id} · Vercel preview (not localhost)</strong><br>URL: ${{window.location.href}}<br>{lines_html}`;
        document.body.prepend(b);
    }}""")

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    ctx = browser.new_context(viewport={"width": 1280, "height": 800})
    # Accept all dialogs at context level (covers alert from ?reset=1)
    ctx.on("dialog", lambda d: d.accept())
    page = ctx.new_page()

    # ──────────────────────────────────────────────────────────────────────────
    # T01 · L1 wrong@1 → .ai-feedback.is-open + #q1-hint.show + submit visible
    # ──────────────────────────────────────────────────────────────────────────
    reset_and_navigate(page, '1')
    submit_wrong(page)
    page.wait_for_timeout(500)

    ai_open   = page.locator("#q1-block .ai-feedback.is-open").count() > 0
    hint1_vis = page.locator("#q1-hint.show").count() > 0
    submit_vis= page.locator("#q1-submit").is_visible()
    results["T01_ai_open"]   = "PASS" if ai_open   else "FAIL"
    results["T01_hint1"]     = "PASS" if hint1_vis else "FAIL"
    results["T01_submit_on"] = "PASS" if submit_vis else "FAIL"
    print(f"T01: ai={results['T01_ai_open']} hint1={results['T01_hint1']} submit={results['T01_submit_on']}")

    # ──────────────────────────────────────────────────────────────────────────
    # T02 · L1 wrong@2 → .answer-reveal.show + submit hidden + textarea disabled
    # ──────────────────────────────────────────────────────────────────────────
    submit_wrong(page)  # 2nd wrong on L1
    page.wait_for_timeout(600)

    ans_vis   = page.locator("#q1-ans.show").count() > 0
    sub_gone  = not page.locator("#q1-submit").is_visible()
    ta_dis    = page.locator("#q1-input").is_disabled()
    results["T02_answer_reveal"] = "PASS" if ans_vis  else "FAIL"
    results["T02_submit_gone"]   = "PASS" if sub_gone else "FAIL"
    results["T02_ta_disabled"]   = "PASS" if ta_dis   else "FAIL"
    print(f"T02: ans={results['T02_answer_reveal']} submit_gone={results['T02_submit_gone']} ta_dis={results['T02_ta_disabled']}")

    # Screenshot T02 (L1 cap)
    inject_banner(page, "T02·L1-cap", [
        f"answer-reveal.show: {results['T02_answer_reveal']}",
        f"submit hidden: {results['T02_submit_gone']}",
        f"textarea disabled: {results['T02_ta_disabled']}",
    ])
    page.screenshot(path=os.path.join(SS_DIR, "T02_L1_cap.png"))

    # ──────────────────────────────────────────────────────────────────────────
    # T03 · L2 wrong@1 → .ai-feedback.is-open · hint1 NOT open · submit visible
    # ──────────────────────────────────────────────────────────────────────────
    reset_and_navigate(page, '2')
    submit_wrong(page)
    page.wait_for_timeout(500)

    ai_open   = page.locator("#q1-block .ai-feedback.is-open").count() > 0
    hint1_no  = page.locator("#q1-hint.show").count() == 0
    sub_vis   = page.locator("#q1-submit").is_visible()
    results["T03_ai_open"]    = "PASS" if ai_open  else "FAIL"
    results["T03_hint1_no"]   = "PASS" if hint1_no else "FAIL"
    results["T03_submit_on"]  = "PASS" if sub_vis  else "FAIL"
    print(f"T03: ai={results['T03_ai_open']} hint1_no={results['T03_hint1_no']} submit={results['T03_submit_on']}")

    # ──────────────────────────────────────────────────────────────────────────
    # T04 · L2 wrong@2 → hint1.show · submit still visible
    # ──────────────────────────────────────────────────────────────────────────
    submit_wrong(page)
    page.wait_for_timeout(500)

    hint1_vis = page.locator("#q1-hint.show").count() > 0
    sub_vis   = page.locator("#q1-submit").is_visible()
    results["T04_hint1"] = "PASS" if hint1_vis else "FAIL"
    results["T04_submit_on"] = "PASS" if sub_vis else "FAIL"
    print(f"T04: hint1={results['T04_hint1']} submit={results['T04_submit_on']}")

    # ──────────────────────────────────────────────────────────────────────────
    # T05 · L2 wrong@3 → answer-reveal.show + submit hidden
    # ──────────────────────────────────────────────────────────────────────────
    submit_wrong(page)
    page.wait_for_timeout(600)

    ans_vis  = page.locator("#q1-ans.show").count() > 0
    sub_gone = not page.locator("#q1-submit").is_visible()
    results["T05_answer_reveal"] = "PASS" if ans_vis  else "FAIL"
    results["T05_submit_gone"]   = "PASS" if sub_gone else "FAIL"
    print(f"T05: ans={results['T05_answer_reveal']} submit_gone={results['T05_submit_gone']}")

    inject_banner(page, "T05·L2-cap", [
        f"answer-reveal.show: {results['T05_answer_reveal']}",
        f"submit hidden: {results['T05_submit_gone']}",
    ])
    page.screenshot(path=os.path.join(SS_DIR, "T05_L2_cap.png"))

    # ──────────────────────────────────────────────────────────────────────────
    # T06 · L3 wrong@1 → ai-feedback · hint1 NOT open · submit visible
    # ──────────────────────────────────────────────────────────────────────────
    reset_and_navigate(page, '3')
    submit_wrong(page)
    page.wait_for_timeout(500)

    ai_open   = page.locator("#q1-block .ai-feedback.is-open").count() > 0
    hint1_no  = page.locator("#q1-hint.show").count() == 0
    sub_vis   = page.locator("#q1-submit").is_visible()
    results["T06_ai_open"]   = "PASS" if ai_open  else "FAIL"
    results["T06_hint1_no"]  = "PASS" if hint1_no else "FAIL"
    results["T06_submit_on"] = "PASS" if sub_vis  else "FAIL"
    print(f"T06: ai={results['T06_ai_open']} hint1_no={results['T06_hint1_no']} submit={results['T06_submit_on']}")

    # ──────────────────────────────────────────────────────────────────────────
    # T07 · L3 wrong@2 → hint1.show
    # ──────────────────────────────────────────────────────────────────────────
    submit_wrong(page)
    page.wait_for_timeout(500)

    hint1_vis = page.locator("#q1-hint.show").count() > 0
    results["T07_hint1"] = "PASS" if hint1_vis else "FAIL"
    print(f"T07: hint1={results['T07_hint1']}")

    # ──────────────────────────────────────────────────────────────────────────
    # T08 · L3 wrong@3 → hint2.show · text differs from hint1
    # ──────────────────────────────────────────────────────────────────────────
    submit_wrong(page)
    page.wait_for_timeout(500)

    hint2_vis  = page.locator("#q1-hint2.show").count() > 0
    hint1_text = page.locator("#q1-hint .hint-main").inner_text() if page.locator("#q1-hint .hint-main").count() else ""
    hint2_text = page.locator("#q1-hint2").inner_text() if hint2_vis else ""
    text_diff  = hint1_text.strip() != hint2_text.strip() and len(hint2_text.strip()) > 0
    results["T08_hint2_vis"]   = "PASS" if hint2_vis  else "FAIL"
    results["T08_text_differs"] = "PASS" if text_diff else "FAIL"
    print(f"T08: hint2_vis={results['T08_hint2_vis']} text_differs={results['T08_text_differs']}")

    # ──────────────────────────────────────────────────────────────────────────
    # T09 · L3 wrong@4 → answer-reveal.show + submit hidden
    # ──────────────────────────────────────────────────────────────────────────
    submit_wrong(page)
    page.wait_for_timeout(600)

    ans_vis  = page.locator("#q1-ans.show").count() > 0
    sub_gone = not page.locator("#q1-submit").is_visible()
    results["T09_answer_reveal"] = "PASS" if ans_vis  else "FAIL"
    results["T09_submit_gone"]   = "PASS" if sub_gone else "FAIL"
    print(f"T09: ans={results['T09_answer_reveal']} submit_gone={results['T09_submit_gone']}")

    inject_banner(page, "T09·L3-cap", [
        f"answer-reveal.show: {results['T09_answer_reveal']}",
        f"submit hidden: {results['T09_submit_gone']}",
        f"hint2 visible: {results['T08_hint2_vis']}",
    ])
    page.screenshot(path=os.path.join(SS_DIR, "T09_L3_cap.png"))

    # ──────────────────────────────────────────────────────────────────────────
    # T10 · Reset clears: progress keys=0, feedback hidden, data-attempt-count absent/0
    # ──────────────────────────────────────────────────────────────────────────
    # Seed some data first
    page.goto(BASE_URL, wait_until="networkidle")
    page.evaluate("showScreen('try')")
    page.wait_for_timeout(400)
    page.evaluate("""() => {
        localStorage.setItem('scispark_progress_q1', JSON.stringify({attempts:[{answer:'x',correct:false}]}));
        localStorage.setItem('scispark_progress_q2', JSON.stringify({attempts:[{answer:'x',correct:false}]}));
    }""")
    # Now reset
    page.goto(RESET_URL, wait_until="networkidle")
    page.wait_for_timeout(2500)

    progress_keys = page.evaluate("""() =>
        Object.keys(localStorage).filter(k => k.startsWith('scispark_progress_')).length
    """)
    q1_fb_hidden = page.evaluate("() => { var f=document.getElementById('q1-feedback'); return !f || f.style.display==='none' || f.style.display===''; }")
    attempt_count_val = page.evaluate("() => { var b=document.getElementById('q1-block'); return b ? (b.getAttribute('data-attempt-count')||'0') : '0'; }")

    results["T10_progress_cleared"] = "PASS" if progress_keys == 0 else "FAIL"
    results["T10_feedback_hidden"]  = "PASS" if q1_fb_hidden    else "FAIL"
    results["T10_counter_reset"]    = "PASS" if attempt_count_val in ('0','') else "FAIL"
    print(f"T10: progress_cleared={results['T10_progress_cleared']} fb_hidden={results['T10_feedback_hidden']} counter={results['T10_counter_reset']} (val={repr(attempt_count_val)})")

    # ──────────────────────────────────────────────────────────────────────────
    # T11 · Level switch mid-question · counter carries across · new cap applies
    # Reset → L1 → wrong@1(count=1) → switch L2 → wrong@1(count=2) → verify count=2
    # Then wrong@1 more (count=3) → L2 cap fires (cap=3 not L1 cap=2)
    # ──────────────────────────────────────────────────────────────────────────
    reset_and_navigate(page, '1')

    # L1 wrong@1 → count should be 1
    submit_wrong(page)
    page.wait_for_timeout(400)
    count_after1 = page.evaluate("() => { var b=document.getElementById('q1-block'); return parseInt(b?b.getAttribute('data-attempt-count')||'0':'0',10); }")

    # Switch to L2
    page.evaluate("if(typeof setLevelV2==='function') setLevelV2('2');")
    page.wait_for_timeout(300)

    # L2 wrong (2nd total attempt on this block) → count should be 2
    submit_wrong(page)
    page.wait_for_timeout(400)
    count_after2 = page.evaluate("() => { var b=document.getElementById('q1-block'); return parseInt(b?b.getAttribute('data-attempt-count')||'0':'0',10); }")

    # Counter should be 2 (not reset on level switch)
    results["T11_count_carried"] = "PASS" if count_after2 == 2 else f"FAIL(got {count_after2})"

    # 3rd wrong → count=3 → L2 cap=3 should fire (NOT L1 cap=2)
    submit_wrong(page)
    page.wait_for_timeout(600)
    count_after3 = page.evaluate("() => { var b=document.getElementById('q1-block'); return parseInt(b?b.getAttribute('data-attempt-count')||'0':'0',10); }")
    ans_shown_l2 = page.locator("#q1-ans.show").count() > 0
    sub_gone_l2  = not page.locator("#q1-submit").is_visible()

    results["T11_count_3"]       = "PASS" if count_after3 == 3  else f"FAIL(got {count_after3})"
    results["T11_L2cap_fires"]   = "PASS" if ans_shown_l2       else "FAIL"
    results["T11_submit_gone"]   = "PASS" if sub_gone_l2        else "FAIL"

    print(f"T11: count1={count_after1} count2={count_after2} count3={count_after3}")
    print(f"T11: carried={results['T11_count_carried']} L2cap={results['T11_L2cap_fires']} sub_gone={results['T11_submit_gone']}")

    # ──────────────────────────────────────────────────────────────────────────
    # URL bar screenshot (inject banner + screenshot showing Vercel domain)
    # ──────────────────────────────────────────────────────────────────────────
    all_pass = all(v == "PASS" for v in results.values())
    color = "#1F9D55" if all_pass else "#A32D2D"
    summary_lines = [f"{k}: {v}" for k, v in results.items()]
    page.evaluate(f"""() => {{
        document.querySelectorAll('._test_banner').forEach(e => e.remove());
        const b = document.createElement('div');
        b.style.cssText = `position:fixed;top:0;left:0;right:0;z-index:99999;
            background:{color};color:white;font-family:monospace;
            font-size:10px;padding:8px 14px;line-height:1.6;
            box-shadow:0 2px 8px rgba(0,0,0,.4);`;
        b.innerHTML = `<strong>PEDAGOGY_CAP_v1 · 11 ATOMIC TESTS · Vercel preview · {'ALL PASS' if all_pass else 'SOME FAIL'}</strong><br>URL: ${{window.location.href}}<br>{'<br>'.join(summary_lines)}`;
        document.body.prepend(b);
    }}""")
    page.screenshot(path=os.path.join(SS_DIR, "URL_bar_verify.png"))

    browser.close()

# ─── Print final report ───────────────────────────────────────────────────────
print("\n" + "="*60)
print("PEDAGOGY_CAP_v1 · 11 ATOMIC TESTS · RESULTS")
print("="*60)
for k, v in results.items():
    print(f"  {k}: {v}")
all_pass = all(v == "PASS" for v in results.values())
print(f"\nOVERALL: {'ALL PASS' if all_pass else 'SOME FAILURES'}")
print(f"Vercel: {PREVIEW_BASE}{LESSON_PATH}")
print(f"Commit: 5010a7d")
