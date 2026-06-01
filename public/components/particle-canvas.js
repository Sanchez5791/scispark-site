/*
  SciSpark · particle-canvas.js
  Component: INPUT_TYPE=particle_diagram  (三态粒子图画板 — 组件二)
  Student draws on a bounded box:
    • particle tool (●) → tap empty = add a particle, tap a particle = remove,
                           drag a particle = move
    • arrow tool (↗)    → drag = draw an arrow (e.g. melting arrow); tap an
                           arrow = remove   [marking for arrows TBD by factory]
  Prefix: .pc-*   Exposes: window.ParticleCanvas.{ init, serializeHost, showResult }
  Pointer Events (touch+mouse). No external deps. SVG-based.

  Submission (serializeHost / pc:submit event):
    { particles:[{x,y}], arrows:[{x1,y1,x2,y2}], diameter, box:{w,h}, question_id }
  Coordinates are pixels relative to the box top-left; `diameter` is the particle
  diameter in the same units, so the marker is scale-free.

  Grading is the SERVER's job (api/mark-lesson.js + particle-mark-core.js). With
  `self_check:true` + `expected_state` the widget grades locally via the SAME
  ParticleMarkCore so the demo verdict === server verdict.
*/
(function (root) {
  'use strict';
  var SVG = 'http://www.w3.org/2000/svg';

  function el(tag, attrs, kids) {
    var n = document.createElement(tag);
    if (attrs) for (var k in attrs) {
      if (k === 'class') n.className = attrs[k];
      else if (k === 'text') n.textContent = attrs[k];
      else if (attrs[k] != null) n.setAttribute(k, attrs[k]);
    }
    if (kids) kids.forEach(function (c) { if (c) n.appendChild(c); });
    return n;
  }
  function svgEl(tag, attrs) {
    var n = document.createElementNS(SVG, tag);
    if (attrs) for (var k in attrs) n.setAttribute(k, attrs[k]);
    return n;
  }
  function lang() { return (document.body && document.body.getAttribute('data-lang') === 'zh') ? 'zh' : 'en'; }
  function label(o) {
    if (o == null) return '';
    if (typeof o === 'string') return o;
    var l = lang();
    return o[l] != null ? o[l] : (o.en != null ? o.en : (o.zh != null ? o.zh : ''));
  }

  var STATES = {};
  var SEQ = 0;
  function uid(p) { SEQ++; return p + SEQ; }

  function init(host) {
    if (!host || host.__pcInit) return;
    host.__pcInit = true;

    var cfg = readConfig(host);
    var qid = host.getAttribute('data-question-id') || cfg.question_id || 'UNSET_QID';
    var tools = cfg.tools || ['particles'];
    var radius = cfg.particle_radius || 15;

    var state = {
      host: host, qid: qid, cfg: cfg, tools: tools, radius: radius,
      particles: [], arrows: [],
      tool: tools[0] === 'arrows' ? 'arrow' : 'particle',
      box: { w: cfg.box_width || 480, h: cfg.box_height || 320 },
      locked: false, drag: null
    };
    STATES[qid] = state;

    host.classList.add('pc-host');
    host.innerHTML = '';
    if (cfg.prompt) host.appendChild(el('p', { class: 'pc-prompt', text: label(cfg.prompt) }));

    host.appendChild(buildToolbar(state));
    host.appendChild(buildCanvas(state));
    host.appendChild(buildFooter(state));
    render(state);
    return state;
  }

  function readConfig(host) {
    var inline = host.querySelector('script[type="application/json"]');
    if (inline) { try { return JSON.parse(inline.textContent); } catch (e) { console.error('[particle] bad config', e); } }
    var attr = host.getAttribute('data-config');
    if (attr) { try { return JSON.parse(attr); } catch (e) {} }
    return {};
  }

  // ── toolbar ──
  function buildToolbar(state) {
    var bar = el('div', { class: 'pc-toolbar' });
    var zh = lang() === 'zh';
    if (state.tools.indexOf('particles') >= 0 && state.tools.indexOf('arrows') >= 0) {
      bar.appendChild(toolBtn(state, 'particle', '●', zh ? '粒子' : 'Particle'));
      bar.appendChild(toolBtn(state, 'arrow', '↗', zh ? '箭头' : 'Arrow'));
    }
    var clear = el('button', { class: 'pc-tool pc-tool--clear', type: 'button', text: (zh ? '清空 ' : 'Clear ') + '🗑' });
    clear.addEventListener('click', function () { if (state.locked) return; state.particles = []; state.arrows = []; render(state); clearVerdict(state); });
    bar.appendChild(clear);

    var count = el('span', { class: 'pc-count' });
    state.countEl = count;
    bar.appendChild(count);
    return bar;
  }
  function toolBtn(state, tool, glyph, name) {
    var b = el('button', { class: 'pc-tool', type: 'button', 'data-tool': tool, text: glyph + ' ' + name });
    if (state.tool === tool) b.classList.add('pc-tool--active');
    b.addEventListener('click', function () {
      if (state.locked) return;
      state.tool = tool;
      state.host.querySelectorAll('.pc-tool[data-tool]').forEach(function (x) { x.classList.remove('pc-tool--active'); });
      b.classList.add('pc-tool--active');
    });
    return b;
  }

  // ── canvas ──
  function buildCanvas(state) {
    var svg = svgEl('svg', { class: 'pc-canvas', viewBox: '0 0 ' + state.box.w + ' ' + state.box.h,
      width: state.box.w, height: state.box.h, role: 'application',
      'aria-label': label(state.cfg.prompt) || 'Particle drawing area' });
    // arrowhead marker
    var defs = svgEl('defs');
    var marker = svgEl('marker', { id: 'pc-arrowhead-' + state.qid, markerWidth: 10, markerHeight: 8,
      refX: 8, refY: 4, orient: 'auto', markerUnits: 'strokeWidth' });
    marker.appendChild(svgEl('path', { d: 'M0,0 L9,4 L0,8 Z', fill: 'var(--accent, #EA580C)' }));
    defs.appendChild(marker);
    svg.appendChild(defs);
    state.svg = svg;
    state.layer = svgEl('g', { class: 'pc-layer' });
    svg.appendChild(state.layer);

    svg.addEventListener('pointerdown', function (e) { onDown(state, e); });
    svg.addEventListener('pointermove', function (e) { onMove(state, e); });
    svg.addEventListener('pointerup', function (e) { onUp(state, e); });
    svg.addEventListener('pointercancel', function () { state.drag = null; render(state); });

    var wrap = el('div', { class: 'pc-canvas-wrap' });
    wrap.appendChild(svg);
    return wrap;
  }

  function pt(state, e) {
    var r = state.svg.getBoundingClientRect();
    var sx = state.box.w / r.width, sy = state.box.h / r.height;
    return { x: (e.clientX - r.left) * sx, y: (e.clientY - r.top) * sy };
  }
  function hitParticle(state, p) {
    for (var i = state.particles.length - 1; i >= 0; i--) {
      var q = state.particles[i];
      var dx = q.x - p.x, dy = q.y - p.y;
      if (dx * dx + dy * dy <= state.radius * state.radius) return q;
    }
    return null;
  }
  function hitArrow(state, p) {
    for (var i = state.arrows.length - 1; i >= 0; i--) {
      var a = state.arrows[i];
      if (distToSeg(p, a) <= 8) return a;
    }
    return null;
  }
  function distToSeg(p, a) {
    var vx = a.x2 - a.x1, vy = a.y2 - a.y1;
    var wx = p.x - a.x1, wy = p.y - a.y1;
    var len2 = vx * vx + vy * vy || 1;
    var t = Math.max(0, Math.min(1, (wx * vx + wy * vy) / len2));
    var dx = a.x1 + t * vx - p.x, dy = a.y1 + t * vy - p.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  function onDown(state, e) {
    if (state.locked) return;
    e.preventDefault();
    state.svg.setPointerCapture && state.svg.setPointerCapture(e.pointerId);
    var p = pt(state, e);

    if (state.tool === 'particle') {
      var hp = hitParticle(state, p);
      if (hp) { state.drag = { type: 'particle', target: hp, start: p, moved: false }; }
      else { state.drag = { type: 'add', start: p, moved: false }; }
    } else { // arrow
      var ha = hitArrow(state, p);
      if (ha) { state.drag = { type: 'arrow-hit', target: ha, start: p, moved: false }; }
      else {
        var arrow = { id: uid('a'), x1: p.x, y1: p.y, x2: p.x, y2: p.y };
        state.drag = { type: 'arrow-draw', target: arrow, start: p, moved: false };
        state.arrows.push(arrow);
        render(state);
      }
    }
  }

  function onMove(state, e) {
    if (!state.drag) return;
    var p = pt(state, e);
    var d = state.drag;
    if (Math.abs(p.x - d.start.x) > 3 || Math.abs(p.y - d.start.y) > 3) d.moved = true;
    if (d.type === 'particle') { d.target.x = p.x; d.target.y = p.y; render(state); }
    else if (d.type === 'arrow-draw') { d.target.x2 = p.x; d.target.y2 = p.y; render(state); }
  }

  function onUp(state, e) {
    var d = state.drag; state.drag = null;
    if (!d) return;
    var p = pt(state, e);

    if (d.type === 'add' && !d.moved) {
      state.particles.push({ id: uid('p'), x: clamp(p.x, state.radius, state.box.w - state.radius),
        y: clamp(p.y, state.radius, state.box.h - state.radius) });
    } else if (d.type === 'particle' && !d.moved) {
      state.particles = state.particles.filter(function (q) { return q !== d.target; }); // tap = remove
    } else if (d.type === 'arrow-hit' && !d.moved) {
      state.arrows = state.arrows.filter(function (a) { return a !== d.target; });        // tap = remove
    } else if (d.type === 'arrow-draw') {
      var a = d.target, len = Math.hypot(a.x2 - a.x1, a.y2 - a.y1);
      if (len < state.radius) state.arrows = state.arrows.filter(function (x) { return x !== a; }); // too short
    }
    render(state);
    clearVerdict(state);
  }
  function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

  function render(state) {
    var L = state.layer;
    while (L.firstChild) L.removeChild(L.firstChild);
    state.arrows.forEach(function (a) {
      L.appendChild(svgEl('line', { class: 'pc-arrow', x1: a.x1, y1: a.y1, x2: a.x2, y2: a.y2,
        'marker-end': 'url(#pc-arrowhead-' + state.qid + ')' }));
    });
    state.particles.forEach(function (q) {
      L.appendChild(svgEl('circle', { class: 'pc-particle', cx: q.x, cy: q.y, r: state.radius }));
    });
    if (state.countEl) {
      var zh = lang() === 'zh';
      state.countEl.textContent = (zh ? '粒子数：' : 'Particles: ') + state.particles.length;
    }
  }

  // ── footer ──
  function buildFooter(state) {
    var foot = el('div', { class: 'pc-foot' });
    var btn = el('button', { class: 'pc-submit btn btn-primary btn-sm', type: 'button', text: lang() === 'zh' ? '提交' : 'Submit' });
    state.submitBtn = btn;
    btn.addEventListener('click', function () { onSubmit(state); });
    var v = el('div', { class: 'pc-verdict', 'aria-live': 'polite' });
    state.verdictEl = v;
    foot.appendChild(btn); foot.appendChild(v);
    return foot;
  }
  function clearVerdict(state) { if (state.verdictEl) { state.verdictEl.textContent = ''; state.verdictEl.className = 'pc-verdict'; } }

  function serialize(state) {
    return {
      question_id: state.qid,
      particles: state.particles.map(function (p) { return { x: round(p.x), y: round(p.y) }; }),
      arrows: state.arrows.map(function (a) { return { x1: round(a.x1), y1: round(a.y1), x2: round(a.x2), y2: round(a.y2) }; }),
      diameter: state.radius * 2,
      box: { w: state.box.w, h: state.box.h }
    };
  }
  function round(n) { return Math.round(n * 10) / 10; }

  function onSubmit(state) {
    if (state.locked) return;
    var sub = serialize(state);
    if (state.cfg.self_check && state.cfg.expected_state && root.ParticleMarkCore) {
      var v = root.ParticleMarkCore.mark({ particles: sub.particles, diameter: sub.diameter }, state.cfg);
      showVerdict(state, v.correct, verdictMsg(state, v));
      if (v.correct) lock(state);
      emit(state, sub, v);
      return;
    }
    emit(state, sub, null); // production → shell → server marker
  }
  function verdictMsg(state, v) {
    var zh = lang() === 'zh';
    if (v.correct) return zh ? '排列和粒子数都正确！' : 'Arrangement and count both correct!';
    if (/too few/.test(v.reason)) return zh ? ('粒子太少了（' + v.count + ' 颗，至少 6 颗）。') : ('Too few particles (' + v.count + ', need ≥6).');
    return zh ? ('排列看起来像「' + zhState(v.state_detected) + '」，再调整一下。') : ('Looks like "' + v.state_detected + '" — adjust the arrangement.');
  }
  function zhState(s) { return ({ solid: '固态', liquid: '液态', gas: '气态', unknown: '？' })[s] || s; }

  function showVerdict(state, correct, msg) {
    if (!state.verdictEl) return;
    state.verdictEl.textContent = msg || '';
    state.verdictEl.className = 'pc-verdict ' + (correct ? 'pc-verdict--ok' : 'pc-verdict--no');
  }
  function lock(state) {
    state.locked = true;
    state.host.classList.add('pc-locked');
    if (state.submitBtn) state.submitBtn.disabled = true;
  }
  function emit(state, submission, localResult) {
    var ev;
    try { ev = new CustomEvent('pc:submit', { bubbles: true, detail: {
      question_id: state.qid, input_type: 'particle_diagram', submission: submission, local_result: localResult } }); }
    catch (e) { return; }
    state.host.dispatchEvent(ev);
  }

  function serializeHost(host) {
    var s = STATES[host.getAttribute('data-question-id')];
    return s ? serialize(s) : null;
  }
  function showResult(qid, correct, message) {
    var s = STATES[qid]; if (!s) return;
    showVerdict(s, correct, message); if (correct) lock(s);
  }

  root.ParticleCanvas = { init: init, serializeHost: serializeHost, showResult: showResult, _states: STATES };

  function autoInit() { Array.prototype.forEach.call(document.querySelectorAll('[data-component="particle"]'), init); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', autoInit);
  else autoInit();
})(window);
