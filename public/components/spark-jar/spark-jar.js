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
      <span class="spark-jar__icon"><span class="spark-jar__fill"></span></span>
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
    count += amount;
    render();
    if (chip) {
      chip.classList.remove('is-bumping');
      // restart animation
      void chip.offsetWidth;
      chip.classList.add('is-bumping');
      setTimeout(() => chip && chip.classList.remove('is-bumping'), 260);
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
