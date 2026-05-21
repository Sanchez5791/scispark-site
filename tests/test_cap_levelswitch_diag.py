"""
DIAGNOSTIC T12–T15: cap state vs level-switch behaviour
Vercel preview only · no localhost · no code changes
2026-05-21
"""
import os, sys
if sys.stdout.encoding != 'utf-8':
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')
from playwright.sync_api import sync_playwright

PREVIEW_BASE = "https://project-z8i1b-a2bjsxbtr-sci-spark.vercel.app"
LESSON_PATH  = "/lessons/y7/u1/l01-v3-test.html"
BASE_URL     = PREVIEW_BASE + LESSON_PATH
RESET_URL    = BASE_URL + "?reset=1"
SS_DIR       = os.path.join(os.path.dirname(__file__), "screenshots")
os.makedirs(SS_DIR, exist_ok=True)
WRONG = "xxxxwrong"

results = {}

def nav_reset(page, level='2'):
    page.goto(RESET_URL, wait_until="networkidle", timeout=30000)
    page.wait_for_timeout(2500)
    page.evaluate("if(typeof showScreen==='function') showScreen('try');")
    page.wait_for_timeout(500)
    page.evaluate(f"if(typeof setLevelV2==='function') setLevelV2('{level}');")
    page.wait_for_timeout(400)

def switch_level(page, level):
    page.evaluate(f"if(typeof setLevelV2==='function') setLevelV2('{level}');")
    page.wait_for_timeout(400)

def wrong(page, qid='q1'):
    ta = page.locator(f"#{qid}-input")
    ta.fill(WRONG)
    page.locator(f"#{qid}-submit").click()
    page.wait_for_timeout(600)

def snap(page, name, lines):
    all_pass = all("PASS" in l for l in lines if ":" in l)
    color = "#1F9D55" if all_pass else "#C0392B"
    html = "<br>".join(lines)
    page.evaluate(f"""() => {{
        document.querySelectorAll('._diag_banner').forEach(e=>e.remove());
        const b=document.createElement('div');
        b.className='_diag_banner';
        b.style.cssText=`position:fixed;top:0;left:0;right:0;z-index:99999;
            background:{color};color:white;font-family:monospace;font-size:11px;
            padding:8px 14px;line-height:1.7;box-shadow:0 2px 8px rgba(0,0,0,.4);`;
        b.innerHTML=`<strong>{name} · Vercel preview (not localhost)</strong><br>`+
            `URL: ${{window.location.href}}<br>{html}`;
        document.body.prepend(b);
    }}""")
    page.screenshot(path=os.path.join(SS_DIR, f"{name}.png"))

def check_q1_state(page):
    submit_vis   = page.locator("#q1-submit").is_visible()
    ta_disabled  = page.locator("#q1-input").is_disabled()
    ans_visible  = page.locator("#q1-ans.show").count() > 0
    hint1_visible= page.locator("#q1-hint.show").count() > 0
    attempts_txt = page.locator("#q1-attempts span").inner_text() if page.locator("#q1-attempts span").count() else "?"
    dom_count    = page.evaluate("()=>{var b=document.getElementById('q1-block');return b?(b.getAttribute('data-attempt-count')||'0'):'?';}")
    level_now    = page.evaluate("()=>document.body.getAttribute('data-user-level')||'?'")
    return {
        "submit_vis":    submit_vis,
        "ta_disabled":   ta_disabled,
        "ans_visible":   ans_visible,
        "hint1_visible": hint1_visible,
        "attempts_txt":  attempts_txt,
        "dom_count":     dom_count,
        "level_now":     level_now,
    }

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    ctx = browser.new_context(viewport={"width":1280,"height":800})
    ctx.on("dialog", lambda d: d.accept())
    page = ctx.new_page()

    # ─────────────────────────────────────────────────────────────────────────
    # T12 · L2 cap(3) fires → switch to L1 → check 5 items
    # ─────────────────────────────────────────────────────────────────────────
    nav_reset(page, '2')
    wrong(page); wrong(page); wrong(page)   # 3 wrong on L2

    # Verify cap fired before switch
    pre = check_q1_state(page)
    pre_cap_fired = (not pre["submit_vis"]) and pre["ans_visible"] and pre["ta_disabled"]
    results["T12_pre_cap_confirmed"] = "PASS" if pre_cap_fired else f"FAIL(submit={pre['submit_vis']} ans={pre['ans_visible']} ta_dis={pre['ta_disabled']})"
    print(f"T12 pre-switch (L2 cap): {results['T12_pre_cap_confirmed']} | dom_count={pre['dom_count']}")

    # Now switch to L1 WITHOUT resetting
    switch_level(page, '1')
    post = check_q1_state(page)

    # L1 cap=2, dom_count=3 → 3 > 2, so cap SHOULD stay: submit hidden, ta disabled, ans visible
    results["T12a_submit_hidden"]  = "PASS" if not post["submit_vis"]   else f"FAIL · submit is VISIBLE after switch"
    results["T12b_ta_disabled"]    = "PASS" if post["ta_disabled"]      else f"FAIL · textarea is ENABLED after switch"
    results["T12c_ans_visible"]    = "PASS" if post["ans_visible"]      else f"FAIL · answer HIDDEN after switch"
    results["T12d_hint1_state"]    = f"hint1={'visible' if post['hint1_visible'] else 'hidden'}"
    results["T12e_attempts_disp"]  = f"attempts_display='{post['attempts_txt']}' dom_count={post['dom_count']}"

    lines_t12 = [
        f"Start: L2 · 3 wrong · cap fired → switch to L1",
        f"a. submit hidden:   {results['T12a_submit_hidden']}",
        f"b. textarea disabled: {results['T12b_ta_disabled']}",
        f"c. answer visible:  {results['T12c_ans_visible']}",
        f"d. {results['T12d_hint1_state']}",
        f"e. {results['T12e_attempts_disp']}",
    ]
    snap(page, "T12_L2cap_switchL1", lines_t12)
    for k,v in results.items():
        if k.startswith("T12"):
            print(f"  {k}: {v}")

    # ─────────────────────────────────────────────────────────────────────────
    # T13 · L3 cap(4) fires → switch to L1, then switch to L2
    # ─────────────────────────────────────────────────────────────────────────
    nav_reset(page, '3')
    wrong(page); wrong(page); wrong(page); wrong(page)   # 4 wrong on L3

    pre13 = check_q1_state(page)
    pre13_cap = (not pre13["submit_vis"]) and pre13["ans_visible"]
    results["T13_pre_cap_confirmed"] = "PASS" if pre13_cap else f"FAIL(submit={pre13['submit_vis']} ans={pre13['ans_visible']})"
    print(f"T13 pre-switch (L3 cap): {results['T13_pre_cap_confirmed']} | dom_count={pre13['dom_count']}")

    # Switch to L1
    switch_level(page, '1')
    post13_L1 = check_q1_state(page)
    results["T13a_L1_submit_hidden"] = "PASS" if not post13_L1["submit_vis"] else f"FAIL · submit VISIBLE after L3→L1"
    results["T13b_L1_ta_disabled"]   = "PASS" if post13_L1["ta_disabled"]    else f"FAIL · textarea ENABLED after L3→L1"
    results["T13c_L1_ans_visible"]   = "PASS" if post13_L1["ans_visible"]    else f"FAIL · answer HIDDEN after L3→L1"
    print(f"T13 after L3→L1: submit_hidden={results['T13a_L1_submit_hidden']} ta_dis={results['T13b_L1_ta_disabled']} ans={results['T13c_L1_ans_visible']}")

    # Switch to L2 (still no reset)
    switch_level(page, '2')
    post13_L2 = check_q1_state(page)
    results["T13d_L2_submit_hidden"] = "PASS" if not post13_L2["submit_vis"] else f"FAIL · submit VISIBLE after L3→L2"
    results["T13e_L2_ta_disabled"]   = "PASS" if post13_L2["ta_disabled"]    else f"FAIL · textarea ENABLED after L3→L2"
    results["T13f_L2_ans_visible"]   = "PASS" if post13_L2["ans_visible"]    else f"FAIL · answer HIDDEN after L3→L2"
    print(f"T13 after L3→L2: submit_hidden={results['T13d_L2_submit_hidden']} ta_dis={results['T13e_L2_ta_disabled']} ans={results['T13f_L2_ans_visible']}")

    snap(page, "T13_L3cap_switchL1L2", [
        f"Start: L3 · 4 wrong · cap fired → switch L1 then L2",
        f"After L3→L1: submit_hidden={results['T13a_L1_submit_hidden']} ta_dis={results['T13b_L1_ta_disabled']} ans={results['T13c_L1_ans_visible']}",
        f"After L3→L2: submit_hidden={results['T13d_L2_submit_hidden']} ta_dis={results['T13e_L2_ta_disabled']} ans={results['T13f_L2_ans_visible']}",
        f"dom_count after switches: {post13_L2['dom_count']}",
    ])

    # ─────────────────────────────────────────────────────────────────────────
    # T14 · L1 cap(2) fires → switch to L2 (cap=3, attempts=2 < 3)
    # Design intent question: should submit re-appear? (attempts=2, L2 cap=3 not yet hit)
    # ─────────────────────────────────────────────────────────────────────────
    nav_reset(page, '1')
    wrong(page); wrong(page)   # 2 wrong on L1

    pre14 = check_q1_state(page)
    pre14_cap = (not pre14["submit_vis"]) and pre14["ans_visible"]
    results["T14_pre_cap_confirmed"] = "PASS" if pre14_cap else f"FAIL(submit={pre14['submit_vis']})"
    print(f"T14 pre-switch (L1 cap): {results['T14_pre_cap_confirmed']} | dom_count={pre14['dom_count']}")

    switch_level(page, '2')
    post14 = check_q1_state(page)
    # dom_count=2, L2 cap=3: technically not yet capped. Does submit reappear?
    submit_reappeared = post14["submit_vis"]
    results["T14_submit_after_L1cap_switchL2"] = f"submit={'VISIBLE' if submit_reappeared else 'hidden'} | dom_count={post14['dom_count']} | ta_dis={post14['ta_disabled']} | ans={post14['ans_visible']}"
    print(f"T14 L1cap→switchL2: {results['T14_submit_after_L1cap_switchL2']}")

    # Also try switching to L3 (cap=4, attempts=2 < 4)
    switch_level(page, '3')
    post14_L3 = check_q1_state(page)
    results["T14_submit_after_L1cap_switchL3"] = f"submit={'VISIBLE' if post14_L3['submit_vis'] else 'hidden'} | dom_count={post14_L3['dom_count']} | ta_dis={post14_L3['ta_disabled']}"
    print(f"T14 L1cap→switchL3: {results['T14_submit_after_L1cap_switchL3']}")

    snap(page, "T14_L1cap_switchL2L3", [
        f"Start: L1 · 2 wrong · cap fired → switch L2 then L3",
        f"After L1→L2 (cap=3, attempts=2 < 3): {results['T14_submit_after_L1cap_switchL2']}",
        f"After L1→L3 (cap=4, attempts=2 < 4): {results['T14_submit_after_L1cap_switchL3']}",
    ])

    # ─────────────────────────────────────────────────────────────────────────
    # T15 · Same sequence on Q2 (confirm not Q1-specific)
    # L2 · 3 wrong on Q2 · cap fires · switch L1 · check Q2 state
    # ─────────────────────────────────────────────────────────────────────────
    nav_reset(page, '2')
    # Need to navigate to Q2 — scroll to it or just use the DOM
    page.evaluate("document.getElementById('q2-block')?.scrollIntoView({behavior:'instant'})")
    page.wait_for_timeout(300)

    def wrong_q2(page):
        ta = page.locator("#q2-input")
        ta.fill(WRONG)
        page.locator("#q2-submit").click()
        page.wait_for_timeout(600)

    wrong_q2(page); wrong_q2(page); wrong_q2(page)  # 3 wrong on Q2 (L2 cap)

    pre15 = {
        "submit_vis":  page.locator("#q2-submit").is_visible(),
        "ans_visible": page.locator("#q2-ans.show").count() > 0,
        "ta_disabled": page.locator("#q2-input").is_disabled(),
        "dom_count":   page.evaluate("()=>{var b=document.getElementById('q2-block');return b?(b.getAttribute('data-attempt-count')||'0'):'?';}"),
    }
    pre15_cap = (not pre15["submit_vis"]) and pre15["ans_visible"]
    results["T15_pre_cap_Q2"] = "PASS" if pre15_cap else f"FAIL(submit={pre15['submit_vis']} ans={pre15['ans_visible']})"
    print(f"T15 Q2 L2 cap: {results['T15_pre_cap_Q2']} | dom_count={pre15['dom_count']}")

    switch_level(page, '1')
    post15 = {
        "submit_vis":  page.locator("#q2-submit").is_visible(),
        "ta_disabled": page.locator("#q2-input").is_disabled(),
        "ans_visible": page.locator("#q2-ans.show").count() > 0,
        "dom_count":   page.evaluate("()=>{var b=document.getElementById('q2-block');return b?(b.getAttribute('data-attempt-count')||'0'):'?';}"),
    }
    results["T15a_Q2_submit_hidden"] = "PASS" if not post15["submit_vis"] else f"FAIL · Q2 submit VISIBLE after L2cap→L1"
    results["T15b_Q2_ta_disabled"]   = "PASS" if post15["ta_disabled"]    else f"FAIL · Q2 textarea ENABLED after L2cap→L1"
    results["T15c_Q2_ans_visible"]   = "PASS" if post15["ans_visible"]    else f"FAIL · Q2 answer HIDDEN after L2cap→L1"
    print(f"T15 Q2 after L2→L1: submit={results['T15a_Q2_submit_hidden']} ta={results['T15b_Q2_ta_disabled']} ans={results['T15c_Q2_ans_visible']}")

    snap(page, "T15_Q2_L2cap_switchL1", [
        f"Q2 (not Q1) · L2 · 3 wrong · cap fired → switch L1",
        f"a. Q2 submit hidden: {results['T15a_Q2_submit_hidden']}",
        f"b. Q2 textarea disabled: {results['T15b_Q2_ta_disabled']}",
        f"c. Q2 answer visible: {results['T15c_Q2_ans_visible']}",
        f"dom_count Q2={post15['dom_count']}",
    ])

    browser.close()

# ─── Report ──────────────────────────────────────────────────────────────────
print("\n" + "="*66)
print("DIAGNOSTIC T12–T15: cap state vs level-switch")
print("="*66)
for k, v in results.items():
    print(f"  {k}: {v}")

cap_persist_keys = [k for k in results if any(x in k for x in ["T12a","T12b","T12c","T13a","T13b","T13c","T13d","T13e","T13f","T15a","T15b","T15c"])]
all_persist = all(results[k] == "PASS" for k in cap_persist_keys)
print(f"\nCap-persist checks (T12/T13/T15): {'ALL PASS' if all_persist else 'FAILURES FOUND — level-switch breaks cap state'}")
print(f"\nVercel: {PREVIEW_BASE}{LESSON_PATH}")
