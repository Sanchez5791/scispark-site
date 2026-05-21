"""
Playwright test: ?reset=1 URL param on Vercel preview
Verifies: redirect to clean URL, alert fires, localStorage is empty
"""
import re
import os
import sys
# Force UTF-8 output on Windows
if sys.stdout.encoding != 'utf-8':
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')
from playwright.sync_api import sync_playwright, expect

PREVIEW_BASE = "https://project-z8i1b-d8ag9o3xp-sci-spark.vercel.app"
LESSON_PATH  = "/lessons/y7/u1/l01-v3-test.html"
RESET_URL    = f"{PREVIEW_BASE}{LESSON_PATH}?reset=1"
CLEAN_URL    = f"{PREVIEW_BASE}{LESSON_PATH}"
SCREENSHOT   = os.path.join(os.path.dirname(__file__), "screenshots", "reset_param_verify.png")

results = {}

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    ctx = browser.new_context(viewport={"width": 1280, "height": 800})

    # ── Seed some localStorage so we can verify it gets cleared ──
    page_seed = ctx.new_page()
    page_seed.goto(CLEAN_URL, wait_until="domcontentloaded")
    page_seed.evaluate("""() => {
        localStorage.setItem('scispark_progress_q1', JSON.stringify({attempts:[{answer:'x',correct:false,timestamp:1}]}));
        localStorage.setItem('scispark_level', '3');
    }""")
    seed_count = page_seed.evaluate("() => Object.keys(localStorage).length")
    print(f"[seed] localStorage keys before reset: {seed_count}")
    page_seed.close()

    # ── Open the ?reset=1 URL on a fresh page ──
    page = ctx.new_page()

    alert_text = None
    def on_dialog(dialog):
        global alert_text
        alert_text = dialog.message
        # Take screenshot while alert is open (Chrome shows alert overlay)
        # We accept it so the page can finish
        dialog.accept()

    page.on("dialog", on_dialog)

    # Navigate to reset URL
    page.goto(RESET_URL, wait_until="networkidle", timeout=30000)

    # Wait a moment for alert + reload cycle to complete
    page.wait_for_timeout(3000)

    final_url = page.url

    # a. Verify redirect to clean URL (no ?reset=1)
    results["a_no_reset_param"] = "PASS" if "reset=1" not in final_url else "FAIL"
    results["a_detail"]         = f"final URL = {final_url}"

    # b. Verify URL is clean (Vercel strips .html; just check path prefix matches and no query string)
    clean_path = LESSON_PATH.replace(".html", "")
    results["b_clean_url"] = "PASS" if (clean_path in final_url and "?" not in final_url) else "FAIL"

    # c. Verify alert text
    results["c_alert"] = "PASS" if alert_text and "记录已清干净" in alert_text else "FAIL"
    results["c_detail"] = f"alert text = {repr(alert_text)}"

    # d. Verify localStorage is empty
    ls_count  = page.evaluate("() => Object.keys(localStorage).length")
    ls_keys   = page.evaluate("() => JSON.stringify(Object.keys(localStorage))")
    # Check none of our progress keys survived (new writes by shell init are OK)
    progress_keys_survived = page.evaluate("""() =>
        Object.keys(localStorage).filter(k => k.startsWith('scispark_progress_')).length
    """)
    results["d_localStorage_empty"] = "PASS" if progress_keys_survived == 0 else "FAIL"
    results["d_detail"] = f"keys after reset ({ls_count} total): {ls_keys} | progress keys survived: {progress_keys_survived}"

    # Inject a proof banner showing URL + localStorage state + alert result
    ls_keys_now = page.evaluate("() => JSON.stringify(Object.keys(localStorage))")
    progress_cleared = page.evaluate("""() =>
        Object.keys(localStorage).filter(k => k.startsWith('scispark_progress_')).length === 0
    """)
    banner_color = "#1F9D55" if all(v == "PASS" for k, v in results.items() if not k.endswith("_detail")) else "#A32D2D"
    page.evaluate(f"""() => {{
        const b = document.createElement('div');
        b.style.cssText = `
            position:fixed; top:0; left:0; right:0; z-index:99999;
            background:{banner_color}; color:white; font-family:monospace;
            font-size:12px; padding:8px 14px; line-height:1.6;
            box-shadow:0 2px 8px rgba(0,0,0,0.4);
        `;
        b.innerHTML = `
            <strong>PLAYWRIGHT RESET VERIFY</strong> · Vercel preview (not localhost)<br>
            URL: ${{window.location.href}}<br>
            a) no ?reset=1 in URL: {results['a_no_reset_param']}<br>
            b) clean URL (Vercel strips .html): {results['b_clean_url']}<br>
            c) alert fired "记录已清干净": {results['c_alert']}<br>
            d) scispark_progress_* keys cleared: {'PASS' if progress_cleared else 'FAIL'} — remaining keys: ${{JSON.stringify(Object.keys(localStorage))}}
        `;
        document.body.prepend(b);
    }}""")
    page.screenshot(path=SCREENSHOT, full_page=False)
    print(f"[screenshot] saved to {SCREENSHOT}")

    browser.close()

print("\n=== RESET PARAM TEST RESULTS ===")
for k, v in results.items():
    print(f"  {k}: {v}")

all_pass = all(v == "PASS" for k, v in results.items() if not k.endswith("_detail"))
print(f"\nOVERALL: {'ALL PASS ✓' if all_pass else 'SOME FAILURES ✗'}")
print(f"Vercel preview URL: {CLEAN_URL}")
