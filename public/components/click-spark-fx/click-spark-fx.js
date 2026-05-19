/*
═══════════════════════════════════════════════════════════════
SCISPARK · click-spark-fx · cursor + click particle FX
File: /public/components/click-spark-fx/click-spark-fx.js
Vercel URL: /components/click-spark-fx/click-spark-fx.js

Listens for mousedown anywhere in document, spawns 5-8 orange
spark particles flying outward and fading. Pointer-events:none
on particles, so they never interfere with clicks. No global
state, idempotent (re-import safe).
═══════════════════════════════════════════════════════════════
*/
(function () {
  if (window.__sparkFxInstalled) return;
  window.__sparkFxInstalled = true;

  const layer = document.createElement('div');
  layer.className = 'spark-fx-layer';
  layer.setAttribute('aria-hidden', 'true');
  const mountLayer = () => {
    if (document.body && !layer.isConnected) document.body.appendChild(layer);
  };
  if (document.body) mountLayer();
  else document.addEventListener('DOMContentLoaded', mountLayer, { once: true });

  const reduceMotion = window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function spawn(x, y) {
    if (reduceMotion) return;
    if (!layer.isConnected) mountLayer();
    const n = 5 + Math.floor(Math.random() * 4); // 5–8 particles
    for (let i = 0; i < n; i++) {
      const p = document.createElement('span');
      p.className = 'spark-particle' + (i % 2 === 0 ? '' : ' s2');
      const angle = (Math.PI * 2 * i) / n + (Math.random() - 0.5) * 0.6;
      const dist = 28 + Math.random() * 24;
      const dx = Math.cos(angle) * dist;
      const dy = Math.sin(angle) * dist - 6; // slight upward bias
      p.style.left = (x - 4) + 'px';
      p.style.top  = (y - 4) + 'px';
      p.style.setProperty('--spark-end', `translate(${dx}px, ${dy}px)`);
      layer.appendChild(p);
      p.addEventListener('animationend', () => p.remove(), { once: true });
      setTimeout(() => p.isConnected && p.remove(), 800);
    }
  }

  document.addEventListener('mousedown', (e) => {
    spawn(e.clientX, e.clientY);
  }, { passive: true });

  // Touch — fire on first touch, use first finger
  document.addEventListener('touchstart', (e) => {
    if (e.touches && e.touches.length) {
      spawn(e.touches[0].clientX, e.touches[0].clientY);
    }
  }, { passive: true });

  window.ClickSparkFx = { spawn };
})();
