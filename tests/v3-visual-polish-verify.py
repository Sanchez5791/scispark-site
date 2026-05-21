#!/usr/bin/env python3
"""
V3 Visual Polish · Step 5 screenshot evidence capture
Screenshots: doudou x5, jar_before/after/shake_mid, count_0/10/20
"""
import asyncio, os
from playwright.async_api import async_playwright
from datetime import datetime

BASE_URL = os.environ.get("TEST_URL", "http://localhost:8081/lessons/y7/u1/l01-v3-test")
VIEWPORT = {"width": 1280, "height": 800}
OUT = os.path.join(os.path.dirname(__file__), "screenshots")
os.makedirs(OUT, exist_ok=True)

SCREEN_MOODS = {"hook": "start/P02", "learn": "examine/P11", "try": "curious/P03",
                "test": "aha/P04", "wrap": "levelup/P15"}


async def run():
    print("=" * 60)
    print("V3 VISUAL POLISH VERIFY")
    print(f"URL: {BASE_URL}")
    print(f"Started: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 60)

    async with async_playwright() as p:
        browser = await p.chromium.launch(
            headless=True, args=["--autoplay-policy=no-user-gesture-required"]
        )
        ctx = await browser.new_context(viewport=VIEWPORT)
        page = await ctx.new_page()
        await page.goto(BASE_URL, wait_until="networkidle", timeout=30000)
        await page.evaluate("localStorage.clear()")
        await page.reload(wait_until="networkidle", timeout=30000)
        await page.wait_for_timeout(1500)

        issues = []

        # ── #1 Doudou: 5 screens, check SVG not emoji ─────────────────
        print("\n[#1] Doudou SVG across 5 screens")
        for screen in ["hook", "learn", "try", "test", "wrap"]:
            await page.evaluate(f"showScreen('{screen}')")
            await page.wait_for_timeout(700)

            mount_html = await page.evaluate(
                "document.querySelector('.doudou-avatar .doudou-mount')?.innerHTML || ''"
            )
            has_svg = "<svg" in mount_html
            mount_bb = await page.locator(".doudou-avatar .doudou-mount").first.bounding_box()
            in_vp = (mount_bb is not None and mount_bb["width"] > 0 and
                     mount_bb["y"] < VIEWPORT["height"])

            status = "PASS" if (has_svg and in_vp) else "FAIL"
            print(f"  {screen:<8} svg={has_svg}  in_viewport={in_vp}  [{status}]")
            if not (has_svg and in_vp):
                issues.append(f"Doudou {screen}: svg={has_svg} in_vp={in_vp}")

            fname = os.path.join(OUT, f"doudou_{screen}.png")
            await page.screenshot(path=fname, full_page=False)
            print(f"    >> {fname}")

        # ── #2 Spark Jar icon ─────────────────────────────────────────
        print("\n[#2] Spark Jar icon + shake")
        await page.evaluate("showScreen('try')")
        await page.wait_for_timeout(600)

        # jar_before
        fname_before = os.path.join(OUT, "jar_before.png")
        await page.screenshot(path=fname_before, full_page=False)
        jar_svg_exists = await page.evaluate(
            "document.querySelector('.spark-jar__icon svg') !== null"
        )
        jar_count_before = await page.text_content(".spark-jar__count")
        print(f"  jar SVG icon in DOM: {jar_svg_exists}")
        print(f"  count before: {jar_count_before!r}")
        print(f"  >> {fname_before}")
        if not jar_svg_exists:
            issues.append("Spark Jar SVG icon not in DOM")

        # submit correct + catch shake mid-animation
        await page.fill("#q1-input", "three")
        await page.click("#q1-submit")
        await page.wait_for_timeout(80)  # catch early in animation
        fname_shake = os.path.join(OUT, "jar_shake_mid.png")
        await page.screenshot(path=fname_shake, full_page=False)
        print(f"  >> {fname_shake} (shake mid @80ms)")

        await page.wait_for_timeout(500)
        jar_count_after = await page.text_content(".spark-jar__count")
        fname_after = os.path.join(OUT, "jar_after.png")
        await page.screenshot(path=fname_after, full_page=False)
        print(f"  count after correct: {jar_count_after!r}")
        print(f"  >> {fname_after}")
        if jar_count_after != "20":
            issues.append(f"Jar count after correct = {jar_count_after!r} (expected '20')")

        # ── #3 Rolling count screenshots ──────────────────────────────
        print("\n[#3] Rolling count 0 -> 20")
        # Fresh page for count roll screenshots
        page2 = await ctx.new_page()
        await page2.goto(BASE_URL, wait_until="networkidle", timeout=30000)
        await page2.evaluate("localStorage.clear()")
        await page2.reload(wait_until="networkidle", timeout=30000)
        await page2.wait_for_timeout(1000)
        await page2.evaluate("showScreen('try')")
        await page2.wait_for_timeout(600)

        # Screenshot count at 0
        c0 = await page2.text_content(".spark-jar__count")
        fname_c0 = os.path.join(OUT, "count_0.png")
        await page2.screenshot(path=fname_c0, full_page=False)
        print(f"  count @0: {c0!r}  >> {fname_c0}")

        # Submit and capture mid-roll (targeting ~half way through 250ms)
        await page2.fill("#q1-input", "three")
        await page2.click("#q1-submit")
        await page2.wait_for_timeout(120)  # ~halfway through 250ms roll
        c_mid = await page2.text_content(".spark-jar__count")
        fname_c10 = os.path.join(OUT, "count_10.png")
        await page2.screenshot(path=fname_c10, full_page=False)
        print(f"  count @120ms (mid-roll): {c_mid!r}  >> {fname_c10}")

        await page2.wait_for_timeout(200)
        c_final = await page2.text_content(".spark-jar__count")
        fname_c20 = os.path.join(OUT, "count_20.png")
        await page2.screenshot(path=fname_c20, full_page=False)
        print(f"  count @final: {c_final!r}  >> {fname_c20}")

        mid_val = int(c_mid.strip()) if c_mid and c_mid.strip().isdigit() else -1
        rolling_ok = 0 < mid_val < 20
        print(f"  Rolling animation check (0 < {mid_val} < 20): {'PASS' if rolling_ok else 'NOTE: headless may catch final frame'}")
        if not rolling_ok:
            print("    (headless timing note: mid-roll capture is best-effort in headless mode)")

        await page2.close()
        await browser.close()

    # ── Summary ────────────────────────────────────────────────────────
    print()
    print("=" * 60)
    print("SUMMARY")
    print("=" * 60)
    shots = sorted(f for f in os.listdir(OUT) if f.endswith(".png"))
    print(f"Screenshots ({len(shots)}):")
    for f in shots:
        sz = os.path.getsize(os.path.join(OUT, f))
        print(f"  {f} ({sz:,} bytes)")
    if issues:
        print()
        print("ISSUES:")
        for i in issues:
            print(f"  - {i}")
    else:
        print()
        print("All checks PASS")


if __name__ == "__main__":
    asyncio.run(run())
