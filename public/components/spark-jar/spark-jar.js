/*
═══════════════════════════════════════════════════════════════
SCISPARK · spark-jar · 5-stage mastery accumulator
File: /public/components/spark-jar/spark-jar.js
Vercel URL: /components/spark-jar/spark-jar.js

API:
  SparkJar.mount(targetEl)      — render the chip inside targetEl
  SparkJar.add(amount, type)    — accumulate; type ∈ 'correct'|'effort'|'surprise'
  SparkJar.toast(message, type) — flying message
  SparkJar.getCount()           — current numeric total
  SparkJar.getLevel()           — 0..4 visual stage

Storage: in-memory only by default. Lesson HTML can persist by
calling SparkJar.setCount(n) on load if needed.
═══════════════════════════════════════════════════════════════
*/
(function () {
  if (window.SparkJar) return;

  let count = 0;
  let mountEl = null;
  let chip   = null;
  let toastLayer = null;

  const LEVEL_THRESHOLDS = [0, 30, 80, 150, 250]; // 0..4

  function levelFor(n) {
    let lvl = 0;
    for (let i = 0; i < LEVEL_THRESHOLDS.length; i++) {
      if (n >= LEVEL_THRESHOLDS[i]) lvl = i;
    }
    return lvl;
  }

  function render() {
    if (!chip) return;
    const lvl = levelFor(count);
    chip.setAttribute('data-level', String(lvl));
    chip.querySelector('.spark-jar__count').textContent = String(count);
  }

  function ensureToastLayer() {
    if (toastLayer && toastLayer.isConnected) return toastLayer;
    toastLayer = document.createElement('div');
    toastLayer.className = 'spark-toast-layer';
    document.body.appendChild(toastLayer);
    return toastLayer;
  }

  function mount(target) {
    if (!target) return;
    mountEl = target;
    target.innerHTML = '';
    chip = document.createElement('div');
    chip.className = 'spark-jar';
    chip.setAttribute('data-level', '0');
    chip.innerHTML = `
      <span class="spark-jar__icon">
        <svg width="18" height="22" viewBox="0 0 18 22" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <rect x="5" y="0" width="8" height="3" rx="1" stroke="#EA580C" stroke-width="1.5"/>
          <path d="M2 5C1 7 1 16 2 18C3 20 15 20 16 18C17 16 17 7 16 5Z" stroke="#EA580C" stroke-width="1.5"/>
          <line x1="4" y1="9" x2="4" y2="15" stroke="#EA580C" stroke-width="1" opacity="0.3"/>
        </svg>
        <span class="spark-jar__fill"></span>
      </span>
      <span class="spark-jar__count">0</span>
      <span class="spark-jar__label" data-en="mastery" data-zh="掌握度">mastery</span>
    `;
    target.appendChild(chip);
    render();
  }

  function add(amount, type) {
    amount = Number(amount) || 0;
    if (amount <= 0) return;
    const prevLevel = levelFor(count);
    const _prevCount = count;
    count += amount;
    render(); // updates level badge; count text overridden by roll below
    if (chip) {
      const _chip = chip, _from = _prevCount, _to = count;
      const _t0 = performance.now(), _dur = 250;
      (function _roll(ts) {
        const p = Math.min((ts - _t0) / _dur, 1), e = 1 - (1 - p) * (1 - p);
        const el = _chip.querySelector('.spark-jar__count');
        if (el) el.textContent = String(Math.round(_from + (_to - _from) * e));
        if (p < 1) requestAnimationFrame(_roll);
      })(performance.now());
      chip.classList.remove('is-bumping');
      void chip.offsetWidth;
      chip.classList.add('is-bumping');
      setTimeout(() => chip && chip.classList.remove('is-bumping'), 260);
      chip.classList.remove('jar-shake');
      void chip.offsetWidth;
      chip.classList.add('jar-shake');
      setTimeout(() => chip && chip.classList.remove('jar-shake'), 400);
    }
    const labels = {
      correct:  '+' + amount + ' mastery',
      effort:   '+' + amount + ' effort',
      surprise: '+' + amount + ' surprise!'
    };
    toast(labels[type] || ('+' + amount), type, chip);

    // Level-up announce
    const newLevel = levelFor(count);
    if (newLevel > prevLevel) {
      setTimeout(() => toast('Jar level ' + newLevel + '!', 'surprise', chip), 400);
    }
  }

  function toast(message, type, anchor) {
    const layer = ensureToastLayer();
    const el = document.createElement('div');
    el.className = 'spark-toast';
    if (type) el.setAttribute('data-type', type);
    el.textContent = message;

    let x = window.innerWidth - 80;
    let y = 60;
    const ref = anchor || chip || mountEl;
    if (ref && ref.getBoundingClientRect) {
      const r = ref.getBoundingClientRect();
      x = r.left + r.width / 2;
      y = r.top + r.height + 6;
    }
    el.style.left = (x - 50) + 'px';
    el.style.top  = y + 'px';
    layer.appendChild(el);
    setTimeout(() => el.isConnected && el.remove(), 1800);
  }

  function setCount(n) {
    count = Math.max(0, Number(n) || 0);
    render();
  }

  window.SparkJar = {
    mount,
    add,
    toast,
    setCount,
    getCount: () => count,
    getLevel: () => levelFor(count)
  };
})();
