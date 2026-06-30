/* SciSpark · Google Analytics (GA4) bootstrap
 * Measurement ID: G-BR8ZX96245  (资源名 scisparklab · 帐号 IG Spark Centre)
 * 装法：每个网页 <head> 加一行  <script src="/ga.js"></script>
 * 改 ID 只改这一份。ID 非机密，可见于网页源码。
 * 来源：军师房指令卡 2026-06-30。
 */
(function () {
  var GA_ID = 'G-BR8ZX96245';

  // 1. 载入官方 gtag 程式库
  var s = document.createElement('script');
  s.async = true;
  s.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA_ID;
  document.head.appendChild(s);

  // 2. 初始化 dataLayer + gtag
  window.dataLayer = window.dataLayer || [];
  function gtag() { window.dataLayer.push(arguments); }
  window.gtag = gtag;
  gtag('js', new Date());
  gtag('config', GA_ID);
})();
