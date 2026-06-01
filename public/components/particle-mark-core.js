/*
  SciSpark · particle-mark-core.js
  Shared marking core for the particle-arrangement question (三态粒子图).
  ONE source, runs in BOTH the browser widget (window.ParticleMarkCore) and the
  Node server marker (require), so widget self-check === server verdict.

  Marking rule (做课工厂 / Chat 66, 2026-06-01):
    A drawing is CORRECT iff  (1) arrangement matches the expected state
                         AND  (2) particle count ≥ min_particles (default 6).

    Arrangement (排列规律):
      solid  = 整齐挨着   → particles touching AND regular spacing (low spread)
      liquid = 挨着但乱   → particles touching AND irregular spacing
      gas    = 稀疏散开   → particles spread far apart

  How it classifies (deterministic, scale-free):
    Work in units of particle DIAMETER (the widget draws a fixed radius, so
    "touching" ⇒ centre-to-centre ≈ 1 diameter).
      ratio = mean(nearest-neighbour distance) / diameter
      cv    = stdev(NN distance) / mean(NN distance)   ← spacing regularity
    • ratio ≥ gas_ratio            → "gas"   (spread out, regardless of order)
    • ratio <  gas_ratio & cv ≤ order_cv → "solid"  (packed + regular)
    • ratio <  gas_ratio & cv >  order_cv → "liquid" (packed + irregular)

  Thresholds are config-overridable so the factory can tune them per question.
*/
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.ParticleMarkCore = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var DEFAULTS = {
    min_particles: 6,   // ≥6 per state, else no full marks
    gas_ratio:     2.2, // mean NN ≥ 2.2 diameters apart ⇒ "spread / gas"
    order_cv:      0.18 // NN-distance CV ≤ 0.18 ⇒ "regular / solid"
  };

  function dist(a, b) {
    var dx = a.x - b.x, dy = a.y - b.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  // nearest-neighbour distance for every particle
  function nnDistances(pts) {
    var out = [];
    for (var i = 0; i < pts.length; i++) {
      var best = Infinity;
      for (var j = 0; j < pts.length; j++) {
        if (i === j) continue;
        var d = dist(pts[i], pts[j]);
        if (d < best) best = d;
      }
      if (best !== Infinity) out.push(best);
    }
    return out;
  }

  function mean(a) {
    if (!a.length) return 0;
    var s = 0; for (var i = 0; i < a.length; i++) s += a[i];
    return s / a.length;
  }
  function stdev(a, m) {
    if (a.length < 2) return 0;
    var s = 0; for (var i = 0; i < a.length; i++) { var d = a[i] - m; s += d * d; }
    return Math.sqrt(s / a.length);
  }

  // classify({particles:[{x,y}], diameter}, opts) → {state, ratio, cv, meanNN, count}
  function classify(input, opts) {
    var o = Object.assign({}, DEFAULTS, opts || {});
    var pts = (input.particles || []).filter(function (p) {
      return p && typeof p.x === 'number' && typeof p.y === 'number';
    });
    var diameter = input.diameter > 0 ? input.diameter : 1;

    var result = { count: pts.length, state: null, ratio: 0, cv: 0, meanNN: 0 };
    if (pts.length < 2) { result.state = 'unknown'; return result; }

    var nn = nnDistances(pts);
    var m = mean(nn);
    var sd = stdev(nn, m);
    result.meanNN = m;
    result.ratio = m / diameter;
    result.cv = m > 0 ? sd / m : 0;

    if (result.ratio >= o.gas_ratio) result.state = 'gas';
    else if (result.cv <= o.order_cv) result.state = 'solid';
    else result.state = 'liquid';
    return result;
  }

  // mark(input, config) → {correct, mark, state_detected, reason, needs_teacher}
  // config: { expected_state:'solid'|'liquid'|'gas', min_particles?, gas_ratio?, order_cv?, marks? }
  function mark(input, config) {
    config = config || {};
    var opts = {
      min_particles: config.min_particles != null ? config.min_particles : DEFAULTS.min_particles,
      gas_ratio:     config.gas_ratio     != null ? config.gas_ratio     : DEFAULTS.gas_ratio,
      order_cv:      config.order_cv       != null ? config.order_cv       : DEFAULTS.order_cv
    };
    var total = (config.marks && config.marks.total) || 1;
    var c = classify(input, opts);

    var arrangementOk = c.state === config.expected_state;
    var countOk = c.count >= opts.min_particles;
    var correct = arrangementOk && countOk;

    var reasons = [];
    if (!countOk) reasons.push('too few particles (' + c.count + ' < ' + opts.min_particles + ')');
    if (!arrangementOk) reasons.push('arrangement looks "' + c.state + '", expected "' + config.expected_state + '"');

    return {
      correct: correct,
      mark: correct ? total : 0,
      max: total,
      state_detected: c.state,
      count: c.count,
      metrics: { ratio: round(c.ratio), cv: round(c.cv) },
      reason: correct ? 'Arrangement and particle count both correct.' : reasons.join('; '),
      needs_teacher: false
    };
  }

  function round(n) { return Math.round(n * 1000) / 1000; }

  return { classify: classify, mark: mark, DEFAULTS: DEFAULTS };
});
