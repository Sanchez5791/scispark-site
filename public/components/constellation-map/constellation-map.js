/*
═══════════════════════════════════════════════════════════════
SCISPARK · constellation-map · Wrap-screen star map
File: /public/components/constellation-map/constellation-map.js
Vercel URL: /components/constellation-map/constellation-map.js

API:
  ConstellationMap.render(targetEl, answers)
    answers = [{ questionId, correct: bool, attempted_correction: bool }]
    Renders bright ⭐ / twinkle ✨ / dim ⚪ stars connected in a
    simple "lightning bolt" / spark path.
═══════════════════════════════════════════════════════════════
*/
(function () {
  if (window.ConstellationMap) return;

  // Pre-set "spark/lightning" coordinate path so star count drives layout.
  // Coords are in viewBox (0..100, 0..70).
  const TEMPLATE_POINTS = [
    [12, 14], [28, 24], [22, 38], [40, 44],
    [34, 58], [56, 52], [70, 42], [62, 28],
    [82, 22], [92, 12]
  ];

  function pointsFor(n) {
    if (n <= TEMPLATE_POINTS.length) return TEMPLATE_POINTS.slice(0, n);
    // Fallback: round-robin layout
    const pts = TEMPLATE_POINTS.slice();
    for (let i = TEMPLATE_POINTS.length; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      pts.push([50 + Math.cos(a) * 35, 35 + Math.sin(a) * 22]);
    }
    return pts;
  }

  function classify(ans) {
    if (ans.correct) return 'bright';
    if (ans.attempted_correction) return 'twinkle';
    return 'dim';
  }

  function render(target, answers) {
    if (!target) return;
    answers = Array.isArray(answers) ? answers : [];
    const pts = pointsFor(answers.length || 5);

    const ns = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(ns, 'svg');
    svg.setAttribute('viewBox', '0 0 100 70');
    svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
    svg.setAttribute('role', 'img');
    svg.setAttribute('aria-label', 'Constellation map of this lesson’s questions');

    // Path connecting all points
    if (pts.length > 1) {
      const path = document.createElementNS(ns, 'path');
      const d = pts.map((p, i) => (i === 0 ? 'M' : 'L') + p[0] + ' ' + p[1]).join(' ');
      path.setAttribute('d', d);
      path.setAttribute('class', 'cm-link');
      svg.appendChild(path);
    }

    pts.forEach((p, i) => {
      const ans = answers[i] || { correct: false, attempted_correction: false };
      const state = classify(ans);
      const star = document.createElementNS(ns, 'polygon');
      // 5-point star polygon points (centered around p)
      const r1 = 2.6, r2 = 1.1;
      const coords = [];
      for (let k = 0; k < 10; k++) {
        const r = (k % 2 === 0) ? r1 : r2;
        const a = (Math.PI / 5) * k - Math.PI / 2;
        coords.push((p[0] + Math.cos(a) * r).toFixed(2) + ',' + (p[1] + Math.sin(a) * r).toFixed(2));
      }
      star.setAttribute('points', coords.join(' '));
      star.setAttribute('class', 'cm-star cm-star--' + state);
      if (ans.questionId) star.setAttribute('data-question', ans.questionId);
      const titleEl = document.createElementNS(ns, 'title');
      titleEl.textContent = (ans.questionId || ('Q' + (i + 1))) +
        ' · ' + (state === 'bright' ? 'correct' : state === 'twinkle' ? 'corrected' : 'unattempted');
      star.appendChild(titleEl);
      svg.appendChild(star);
    });

    const wrap = document.createElement('div');
    wrap.className = 'constellation-map';
    wrap.appendChild(svg);

    const caption = document.createElement('div');
    caption.className = 'constellation-map__caption';
    caption.setAttribute('data-en', 'Your constellation for this lesson');
    caption.setAttribute('data-zh', '本课的星座');
    caption.textContent = 'Your constellation for this lesson';
    wrap.appendChild(caption);

    const legend = document.createElement('div');
    legend.className = 'constellation-map__legend';
    legend.innerHTML = `
      <span><i class="dot"></i><b data-en="correct" data-zh="答对">correct</b></span>
      <span><i class="dot twinkle"></i><b data-en="corrected" data-zh="订正">corrected</b></span>
      <span><i class="dot dim"></i><b data-en="review" data-zh="复习">review</b></span>
    `;
    wrap.appendChild(legend);

    target.innerHTML = '';
    target.appendChild(wrap);
  }

  window.ConstellationMap = { render };
})();
