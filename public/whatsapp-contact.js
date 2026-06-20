/* ============================================================================
 * SciSpark · WhatsApp 联系浮动按钮  (② 派工卡 2026-06-20 · 军师房 → 双手房)
 * ----------------------------------------------------------------------------
 * Drop  <script src="/public/whatsapp-contact.js" defer></script>  on public pages.
 * Floating green WhatsApp button → opens a wa.me chat with the boss.
 *
 * ★ FREE — this is an ordinary wa.me deep-link. NO WhatsApp Business API,
 *   no per-message cost. Visitor taps → their WhatsApp opens a chat to the boss;
 *   the boss receives it on his normal / Business WhatsApp.
 *
 * ★ CONFIG (跟老板拿,别瞎填 / ask the boss, never invent):
 *     WA_NUMBER      = boss WhatsApp number, FULL international format,
 *                      digits only — no '+', no spaces. e.g. MY: '60123456789'.
 *     CONTACT_EMAIL  = optional contact email (''/leave empty to hide).
 *   If WA_NUMBER is empty the button does NOT render (so nothing fake ships).
 *
 *   Preview override (does not commit a number): append ?ss_wa=60XXXXXXXXX to the
 *   URL, or set window.SS_WA_NUMBER before this script, to test the live link.
 * ==========================================================================*/
(function () {
  'use strict';

  var WA_NUMBER     = '60177815791';   // ← 老板WhatsApp号码(马来西亚,带国码,纯数字)。空 = 按钮不显示。
  var CONTACT_EMAIL = '';     // ← 可选联系邮箱;空 = 不显示 email。
  var WA_TEXT       = '你好!我想了解 SciSpark 课程。 / Hi! I would like to know more about SciSpark.';

  if (window.__ssWa) return; window.__ssWa = true;

  /* preview-only override so the real link can be demoed without committing a number */
  try {
    var qp = new URLSearchParams(location.search).get('ss_wa');
    if (qp && /^\d{6,15}$/.test(qp)) WA_NUMBER = qp;
    else if (window.SS_WA_NUMBER && /^\d{6,15}$/.test(String(window.SS_WA_NUMBER))) WA_NUMBER = String(window.SS_WA_NUMBER);
  } catch (e) {}

  if (!WA_NUMBER) {
    console.info('[WhatsApp] number not configured — float hidden. Set WA_NUMBER in whatsapp-contact.js.');
    return;
  }

  function build() {
    if (document.getElementById('ss-wa-float')) return;

    var css = document.createElement('style');
    css.textContent = [
      '#ss-wa-float{position:fixed;left:24px;bottom:24px;z-index:9050;',
      'display:flex;align-items:center;gap:10px;padding:11px 17px 11px 13px;',
      'border-radius:999px;background:#25D366;color:#fff;text-decoration:none;',
      "font-family:'Geist','Noto Sans SC',system-ui,sans-serif;font-weight:700;font-size:14px;",
      'box-shadow:0 6px 22px rgba(37,211,102,.42);',
      'transition:transform .18s ease,box-shadow .18s ease;}',
      '#ss-wa-float:hover{transform:translateY(-2px);box-shadow:0 11px 30px rgba(37,211,102,.5);}',
      '#ss-wa-float svg{width:24px;height:24px;flex:none;}',
      '#ss-wa-float .ss-wa-tx{line-height:1.05;}',
      '#ss-wa-float .ss-wa-tx small{display:block;font-size:10.5px;font-weight:500;opacity:.92;}',
      '@media(max-width:480px){#ss-wa-float .ss-wa-tx{display:none;}#ss-wa-float{padding:13px;}}'
    ].join('');
    document.head.appendChild(css);

    var a = document.createElement('a');
    a.id = 'ss-wa-float';
    a.href = 'https://wa.me/' + WA_NUMBER + '?text=' + encodeURIComponent(WA_TEXT);
    a.target = '_blank';
    a.rel = 'noopener';
    a.setAttribute('aria-label', 'WhatsApp 咨询 SciSpark');
    a.innerHTML =
      '<svg viewBox="0 0 32 32" fill="currentColor" aria-hidden="true"><path d="M16.04 4C9.96 4 5 8.95 5 15.02c0 2.13.6 4.13 1.65 5.84L5 28l7.32-1.6a11.1 11.1 0 0 0 3.72.64h.01C22.12 27.04 27 22.1 27 16.03 27 9.95 22.12 4 16.04 4Zm0 20.2h-.01c-1.12 0-2.22-.3-3.18-.87l-.23-.13-3.85.84.82-3.75-.15-.24a8.97 8.97 0 0 1-1.38-4.84c0-4.97 4.06-9.02 9.06-9.02 2.42 0 4.7.94 6.4 2.65a8.95 8.95 0 0 1 2.65 6.38c0 4.97-4.06 9.02-9.05 9.02Zm5.2-6.76c-.28-.14-1.68-.83-1.94-.92-.26-.1-.45-.14-.64.14-.19.28-.74.92-.9 1.11-.17.19-.33.21-.61.07-.28-.14-1.2-.44-2.28-1.41-.84-.75-1.41-1.68-1.58-1.96-.16-.28-.02-.43.12-.57.13-.13.28-.33.42-.5.14-.16.18-.28.28-.47.09-.19.05-.35-.02-.49-.07-.14-.64-1.54-.88-2.11-.23-.55-.46-.48-.64-.48-.16-.01-.35-.01-.54-.01-.19 0-.49.07-.75.35-.26.28-.98.96-.98 2.34s1.01 2.72 1.15 2.9c.14.19 1.98 3.03 4.8 4.25.67.29 1.19.46 1.6.59.67.21 1.28.18 1.77.11.54-.08 1.68-.69 1.92-1.35.24-.66.24-1.23.17-1.35-.07-.12-.26-.19-.54-.33Z"/></svg>' +
      '<span class="ss-wa-tx">WhatsApp 咨询<small>有问题?点这里聊</small></span>';
    document.body.appendChild(a);

    if (CONTACT_EMAIL) {
      var em = document.createElement('a');
      em.href = 'mailto:' + CONTACT_EMAIL;
      em.id = 'ss-wa-email';
      em.textContent = '✉ ' + CONTACT_EMAIL;
      em.style.cssText = 'position:fixed;left:24px;bottom:74px;z-index:9050;font-size:12px;' +
        'color:#0F172A;background:#fff;border:1px solid #E8E2D8;border-radius:999px;' +
        "padding:5px 12px;text-decoration:none;font-family:'Geist','Noto Sans SC',sans-serif;" +
        'box-shadow:0 4px 14px rgba(15,23,42,.12);';
      document.body.appendChild(em);
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', build);
  else build();
})();
