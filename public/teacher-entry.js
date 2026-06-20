/* ============================================================================
 * SciSpark · 老师后台入口按钮  (① 派工卡 2026-06-20 · 军师房 → 双手房)
 * ----------------------------------------------------------------------------
 * Drop  <script src="/public/teacher-entry.js" defer></script>  on any page.
 * Renders a floating "老师后台 / 复核清单" button that jumps to /review-console —
 * but ONLY for a logged-in user whose profiles.role is 'teacher' or 'admin'.
 * Students, parents and guests see nothing.
 *
 * Security: this only DECIDES whether to draw a convenience button. The console
 * itself (review-console.html) and the DB (RLS via public.is_staff()) re-check
 * the role server-side, so a non-staff user can never actually read appeals even
 * if they reach the page. Publishable key only — no secret here.
 * ==========================================================================*/
(function () {
  'use strict';

  var SB_URL       = 'https://fiffuaoibxeggwxcfvfh.supabase.co';
  var SB_KEY       = 'sb_publishable_OOrhuk8oqIbNLg3Wxo6fzQ_7z4sloBJ';
  var CONSOLE_PATH = '/review-console';

  if (window.__ssTeacherEntry) return;            // guard double-include
  window.__ssTeacherEntry = true;

  function loadSupabase(cb) {
    if (window.supabase && window.supabase.createClient) return cb();
    var s = document.createElement('script');
    s.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
    s.onload = cb;
    s.onerror = function () { /* blocked / offline → just render nothing */ };
    document.head.appendChild(s);
  }

  function inject() {
    if (document.getElementById('ss-teacher-entry')) return;

    var css = document.createElement('style');
    css.textContent = [
      '#ss-teacher-entry{position:fixed;left:24px;bottom:24px;z-index:9100;',
      'display:flex;align-items:center;gap:9px;padding:10px 16px 10px 13px;',
      'border-radius:999px;background:#0F172A;color:#fff;text-decoration:none;',
      "font-family:'Geist','Noto Sans SC',system-ui,sans-serif;",
      'box-shadow:0 6px 22px rgba(15,23,42,.28);',
      'transition:transform .18s ease,box-shadow .18s ease;}',
      '#ss-teacher-entry:hover{transform:translateY(-2px);box-shadow:0 10px 30px rgba(15,23,42,.36);}',
      '#ss-teacher-entry .ss-te-ic{font-size:18px;line-height:1;}',
      '#ss-teacher-entry .ss-te-tx{display:flex;flex-direction:column;line-height:1.15;text-align:left;}',
      '#ss-teacher-entry .ss-te-tx b{font-size:13.5px;font-weight:800;}',
      '#ss-teacher-entry .ss-te-tx small{font-size:10.5px;opacity:.72;font-weight:500;}',
      /* sit above the WhatsApp float when both are on the page (homepage) */
      'body:has(#ss-wa-float) #ss-teacher-entry{bottom:88px;}'
    ].join('');
    document.head.appendChild(css);

    var a = document.createElement('a');
    a.id = 'ss-teacher-entry';
    a.href = CONSOLE_PATH;
    a.setAttribute('aria-label', '老师后台 — 复核清单 Review Console');
    a.innerHTML =
      '<span class="ss-te-ic" aria-hidden="true">📋</span>' +
      '<span class="ss-te-tx"><b>老师后台</b><small>复核清单 · Review</small></span>';
    document.body.appendChild(a);
  }

  function run() {
    var sb;
    try { sb = window.supabase.createClient(SB_URL, SB_KEY); }
    catch (e) { return; }
    sb.auth.getSession().then(function (r) {
      var session = r && r.data && r.data.session;
      if (!session || !session.user) return;        // not logged in → nothing
      sb.from('profiles').select('role').eq('id', session.user.id).maybeSingle()
        .then(function (p) {
          var role = p && p.data && p.data.role;
          if (role === 'teacher' || role === 'admin') inject();
        })
        .catch(function () {});
    }).catch(function () {});
  }

  function boot() { loadSupabase(run); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
