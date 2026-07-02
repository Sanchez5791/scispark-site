/* public/sos.js — SciSpark 匿名求救 (SOS) 浮窗按钮
 * ==========================================================================
 * ★ 儿童安全生命线。随时都在、无需登录、按完只给一句温柔话。
 *
 * 用法: 任何页面加一行即可 (放 </body> 前):
 *     <script src="/public/sos.js" defer></script>
 *
 * 做什么 (指令 §0 §2 §3):
 *   - 右下角一个安静的浮窗按钮「需要帮助 / Get help」。
 *   - 按下 → 小面板: 一格可留空的话 + 一个大「送出求救」钮。
 *   - 送出 → POST /api/sos, 带 { message, page_url, honeypot(蜜罐), load_to_click_ms(时间差) }。
 *   - 不管结果如何, 永远只显示同一句温柔话, 绝不给小孩看到报错。
 *
 * ★ 不依赖课程引擎, 不依赖登录, 不引入任何外部库。跟着页面语言 (localStorage 'lang') 走。
 * ==========================================================================
 */
(function () {
  'use strict';
  if (window.__sosMounted) return;      // 防重复挂载
  window.__sosMounted = true;

  var LOAD_TS = Date.now();             // 用于时间差 (页面加载 → 送出)
  var ENDPOINT = '/api/sos';

  function lang() {
    try { return localStorage.getItem('lang') === 'zh' ? 'zh' : 'en'; } catch (e) { return 'en'; }
  }
  var ZH = lang() === 'zh';
  var T = {
    fab:      ZH ? '需要帮助' : 'Get help',
    title:    ZH ? '需要帮助吗？' : 'Need help?',
    sub:      ZH ? '告诉我们发生什么事（可以留空）。我们会找一位大人来帮你。'
                 : "Tell us what's happening (you can leave it blank). We'll get a grown-up to help.",
    ph:       ZH ? '你想说的话…' : 'What you want to say…',
    send:     ZH ? '送出求救' : 'Send SOS',
    close:    ZH ? '关闭' : 'Close',
    sent:     ZH ? '你的求救已经送出了。🫧\n我们正在找一位可以帮你的人。'
                 : "Your SOS has been sent. 🫧\nWe are reaching a support person.",
  };

  // ── 样式 (作用域前缀 sos-, 不污染页面) ──
  var css = [
    '.sos-fab{position:fixed;right:18px;bottom:18px;z-index:2147483000;',
      'display:inline-flex;align-items:center;gap:8px;padding:11px 16px;border:none;cursor:pointer;',
      'border-radius:999px;background:#B91C1C;color:#fff;font:600 15px/1 Geist,system-ui,sans-serif;',
      'box-shadow:0 6px 20px rgba(185,28,28,.35);}',
    '.sos-fab:hover{background:#991B1B;}',
    '.sos-fab__dot{width:9px;height:9px;border-radius:50%;background:#fff;flex:0 0 auto;}',
    '.sos-ov{position:fixed;inset:0;z-index:2147483001;display:none;align-items:center;justify-content:center;',
      'background:rgba(15,23,42,.45);padding:16px;}',
    '.sos-ov.is-open{display:flex;}',
    '.sos-card{width:100%;max-width:420px;background:#fff;border-radius:18px;padding:22px 20px;',
      'box-shadow:0 20px 60px rgba(0,0,0,.3);font-family:Geist,system-ui,sans-serif;color:#0F172A;}',
    '.sos-card h3{margin:0 0 6px;font-size:20px;color:#B91C1C;}',
    '.sos-card p{margin:0 0 12px;font-size:14px;line-height:1.6;color:#475569;}',
    '.sos-card textarea{width:100%;box-sizing:border-box;min-height:92px;padding:11px 12px;',
      'border:1px solid #CBD5E1;border-radius:12px;font:15px/1.5 Geist,system-ui,sans-serif;resize:vertical;}',
    '.sos-card textarea:focus{outline:none;border-color:#B91C1C;}',
    '.sos-row{display:flex;gap:10px;margin-top:14px;}',
    '.sos-send{flex:1;padding:13px;border:none;border-radius:12px;cursor:pointer;',
      'background:#B91C1C;color:#fff;font:700 16px/1 Geist,system-ui,sans-serif;}',
    '.sos-send:hover{background:#991B1B;}',
    '.sos-send:disabled{opacity:.6;cursor:default;}',
    '.sos-close{padding:13px 16px;border:1px solid #CBD5E1;border-radius:12px;cursor:pointer;',
      'background:#fff;color:#475569;font:600 15px/1 Geist,system-ui,sans-serif;}',
    // 蜜罐: 人看不见 (不用 display:none, 有些机器人会跳过隐藏项; 移出画面 + 无障碍隐藏)
    '.sos-hp{position:absolute;left:-9999px;width:1px;height:1px;opacity:0;}',
    '.sos-done{margin:0;font-size:16px;line-height:1.7;color:#0F172A;white-space:pre-line;text-align:center;padding:8px 0 4px;}',
    '.sos-done__ok{font-size:34px;text-align:center;margin:2px 0 8px;}',
  ].join('');

  function el(tag, attrs, html) {
    var n = document.createElement(tag);
    if (attrs) for (var k in attrs) n.setAttribute(k, attrs[k]);
    if (html != null) n.innerHTML = html;
    return n;
  }

  function mount() {
    var style = el('style'); style.textContent = css; document.head.appendChild(style);

    // 浮窗按钮
    var fab = el('button', { 'class': 'sos-fab', 'type': 'button', 'aria-label': T.fab });
    fab.innerHTML = '<span class="sos-fab__dot"></span>' + T.fab;
    document.body.appendChild(fab);

    // 遮罩 + 卡片
    var ov = el('div', { 'class': 'sos-ov', 'role': 'dialog', 'aria-modal': 'true' });
    var card = el('div', { 'class': 'sos-card' });
    card.appendChild(el('h3', null, T.title));
    card.appendChild(el('p', null, T.sub));
    var ta = el('textarea', { 'placeholder': T.ph, 'aria-label': T.ph });
    card.appendChild(ta);
    // 蜜罐 (真人永远看不到、永远不填; 机器人会自动填)
    var hp = el('input', { 'class': 'sos-hp', 'type': 'text', 'name': 'website', 'tabindex': '-1', 'autocomplete': 'off', 'aria-hidden': 'true' });
    card.appendChild(hp);
    var row = el('div', { 'class': 'sos-row' });
    var sendBtn = el('button', { 'class': 'sos-send', 'type': 'button' }, T.send);
    var closeBtn = el('button', { 'class': 'sos-close', 'type': 'button' }, T.close);
    row.appendChild(sendBtn); row.appendChild(closeBtn);
    card.appendChild(row);
    ov.appendChild(card);
    document.body.appendChild(ov);

    function open() { ov.classList.add('is-open'); setTimeout(function () { try { ta.focus(); } catch (e) {} }, 50); }
    function close() { ov.classList.remove('is-open'); }

    fab.addEventListener('click', open);
    closeBtn.addEventListener('click', close);
    ov.addEventListener('click', function (e) { if (e.target === ov) close(); });

    var submitting = false;
    async function send() {
      if (submitting) return; submitting = true; sendBtn.disabled = true;
      var body = {
        message: ta.value || '',
        page_url: (location.pathname + location.search) || location.href,
        honeypot: hp.value || '',
        load_to_click_ms: Date.now() - LOAD_TS,
        device_hint: (navigator.userAgent || '').slice(0, 120),
      };
      // 不管成功失败, 都当作已送出 (指令 §3: 小孩永远看到成功)。
      try {
        await fetch(ENDPOINT, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
          keepalive: true,   // 就算马上关页, 请求也尽力送达
        });
      } catch (e) { /* 静默: 网络差也给小孩温柔话; 服务器端已尽力 */ }
      showDone();
    }
    sendBtn.addEventListener('click', send);

    function showDone() {
      card.innerHTML = '';
      card.appendChild(el('div', { 'class': 'sos-done__ok' }, '🫧'));
      card.appendChild(el('p', { 'class': 'sos-done' }, T.sent.replace(/\n/g, '<br>')));
      var r = el('div', { 'class': 'sos-row' });
      var ok = el('button', { 'class': 'sos-send', 'type': 'button' }, ZH ? '好的' : 'OK');
      ok.addEventListener('click', close);
      r.appendChild(ok); card.appendChild(r);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mount);
  } else {
    mount();
  }
})();
