/*
  SciSpark · drag-interactions.js
  Component: INPUT_TYPE=drag_sequence | drag_match
  Three lesson mechanics, one component:
    • sequence  → 排顺序 / 拖步骤  (drag cards into the correct order)
    • match     → 连连看           (drag a connector from a left node to a right node)
  Prefix: .dg-*  (matches family .rd-* / .tb-* / .gw-* convention)
  Exposes: window.DragInteraction.{ init, serializeHost }
  Touch + mouse via Pointer Events. Keyboard-accessible. No external deps.

  Submission shape (read by serializeHost, sent to the server marker):
    sequence : { mode:'sequence', ordered_ids:[ 'c','a','b', ... ] }
    match    : { mode:'match',    pairs:[ ['l1','r2'], ['l2','r1'], ... ] }

  The CORRECT answer is NOT required for the component to run — grading is the
  server marker's job (api/mark-lesson.js, same contract as ray_diagram). For
  standalone demos a `self_check:true` config with `correct_order`/`correct_pairs`
  lets the widget grade itself locally so the mechanic can be eyeballed.
*/
(function (root) {
  'use strict';

  // ────────────── helpers ──────────────
  function $(sel, ctx) { return (ctx || document).querySelector(sel); }
  function $$(sel, ctx) {
    return Array.prototype.slice.call((ctx || document).querySelectorAll(sel));
  }
  function el(tag, attrs, kids) {
    var n = document.createElement(tag);
    if (attrs) for (var k in attrs) {
      if (k === 'class') n.className = attrs[k];
      else if (k === 'text') n.textContent = attrs[k];
      else if (k === 'html') n.innerHTML = attrs[k];
      else if (attrs[k] != null) n.setAttribute(k, attrs[k]);
    }
    if (kids) kids.forEach(function (c) { if (c) n.appendChild(c); });
    return n;
  }
  function lang() {
    // shell sets <html lang> / body data-lang; default EN, mirror zh under .lang-zh
    return (document.body && document.body.getAttribute('data-lang') === 'zh') ? 'zh' : 'en';
  }
  function label(obj) {
    if (obj == null) return '';
    if (typeof obj === 'string') return obj;
    var l = lang();
    return obj[l] != null ? obj[l] : (obj.en != null ? obj.en : (obj.zh != null ? obj.zh : ''));
  }
  // Fisher–Yates; never returns the identity order for n>1 (so the task isn't pre-solved)
  function shuffled(arr) {
    if (arr.length < 2) return arr.slice();
    var a, tries = 0;
    do {
      a = arr.slice();
      for (var i = a.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var t = a[i]; a[i] = a[j]; a[j] = t;
      }
      tries++;
    } while (tries < 12 && a.every(function (x, i) { return x === arr[i]; }));
    return a;
  }
  function arrEq(a, b) {
    if (!a || !b || a.length !== b.length) return false;
    for (var i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
    return true;
  }

  var STATES = {}; // qid -> state

  // ════════════════════════════════════════════════════════
  //  PUBLIC: init
  // ════════════════════════════════════════════════════════
  function init(host) {
    if (!host || host.__dgInit) return;
    host.__dgInit = true;

    var cfg = readConfig(host);
    var qid = host.getAttribute('data-question-id') || cfg.question_id || 'UNSET_QID';
    var mode = cfg.mode || 'sequence';

    var state = {
      host: host, qid: qid, mode: mode, cfg: cfg,
      order: [],            // sequence: current array of item ids
      pairs: {},            // match: { leftId: rightId }
      locked: false
    };
    STATES[qid] = state;

    host.classList.add('dg-host', 'dg-mode-' + mode);
    host.setAttribute('role', 'group');
    host.setAttribute('aria-label', label(cfg.prompt) || 'Interactive question');
    host.innerHTML = '';

    if (cfg.prompt) host.appendChild(el('p', { class: 'dg-prompt', text: label(cfg.prompt) }));

    if (mode === 'match') buildMatch(state);
    else buildSequence(state);

    host.appendChild(buildFooter(state));
    return state;
  }

  function readConfig(host) {
    // config from a <script type="application/json"> child, or data-config attr
    var inline = $('script[type="application/json"]', host);
    if (inline) {
      try { return JSON.parse(inline.textContent); }
      catch (e) { console.error('[drag] bad inline config for', host, e); }
    }
    var attr = host.getAttribute('data-config');
    if (attr) { try { return JSON.parse(attr); } catch (e) {} }
    return {};
  }

  // ════════════════════════════════════════════════════════
  //  MODE: sequence  (排顺序 / 拖步骤)
  // ════════════════════════════════════════════════════════
  function buildSequence(state) {
    var cfg = state.cfg;
    var items = (cfg.items || []).map(function (it) { return it.id; });
    state.order = shuffled(items);

    var list = el('ul', { class: 'dg-seq', role: 'list' });
    state.listEl = list;
    renderSequence(state);
    state.host.appendChild(list);
  }

  function renderSequence(state) {
    var list = state.listEl;
    var byId = {};
    (state.cfg.items || []).forEach(function (it) { byId[it.id] = it; });
    list.innerHTML = '';

    state.order.forEach(function (id, idx) {
      var it = byId[id] || { id: id };
      var li = el('li', {
        class: 'dg-card',
        'data-id': id,
        draggable: state.locked ? 'false' : 'true',
        tabindex: state.locked ? '-1' : '0',
        role: 'listitem',
        'aria-label': (idx + 1) + '. ' + label(it.label != null ? it.label : { en: it.label_en, zh: it.label_zh })
      }, [
        el('span', { class: 'dg-card__handle', 'aria-hidden': 'true', text: '⠿' }),
        el('span', { class: 'dg-card__num', text: String(idx + 1) }),
        el('span', { class: 'dg-card__label', html: label(it.label != null ? it.label : { en: it.label_en, zh: it.label_zh }) })
      ]);
      if (!state.locked) wireSeqCard(state, li);
      list.appendChild(li);
    });
  }

  function wireSeqCard(state, li) {
    // ---- native HTML5 drag (desktop) ----
    li.addEventListener('dragstart', function (e) {
      if (state.locked) return;
      li.classList.add('dg-card--dragging');
      e.dataTransfer.effectAllowed = 'move';
      try { e.dataTransfer.setData('text/plain', li.getAttribute('data-id')); } catch (x) {}
    });
    li.addEventListener('dragend', function () {
      li.classList.remove('dg-card--dragging');
      commitOrderFromDom(state);
    });
    li.addEventListener('dragover', function (e) {
      e.preventDefault();
      var dragging = $('.dg-card--dragging', state.listEl);
      if (!dragging || dragging === li) return;
      var rect = li.getBoundingClientRect();
      var after = (e.clientY - rect.top) > rect.height / 2;
      state.listEl.insertBefore(dragging, after ? li.nextSibling : li);
    });

    // ---- pointer drag (touch / pen / mouse) ----
    li.addEventListener('pointerdown', function (e) {
      if (state.locked || e.button > 0) return;
      // ignore native-drag path for touch where dragstart won't fire
      if (e.pointerType === 'mouse') return; // mouse uses HTML5 dnd above
      startPointerDrag(state, li, e);
    });

    // ---- keyboard reorder (↑/↓ move card) ----
    li.addEventListener('keydown', function (e) {
      if (state.locked) return;
      if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
        e.preventDefault();
        var sib = e.key === 'ArrowUp' ? li.previousElementSibling : li.nextElementSibling;
        if (!sib) return;
        if (e.key === 'ArrowUp') state.listEl.insertBefore(li, sib);
        else state.listEl.insertBefore(sib, li);
        commitOrderFromDom(state);
        li.focus();
      }
    });
  }

  function startPointerDrag(state, li, downEvt) {
    li.setPointerCapture && li.setPointerCapture(downEvt.pointerId);
    li.classList.add('dg-card--dragging');
    var moved = false;

    function onMove(e) {
      moved = true;
      var target = document.elementFromPoint(e.clientX, e.clientY);
      var overCard = target && target.closest ? target.closest('.dg-card') : null;
      if (overCard && overCard !== li && overCard.parentNode === state.listEl) {
        var rect = overCard.getBoundingClientRect();
        var after = (e.clientY - rect.top) > rect.height / 2;
        state.listEl.insertBefore(li, after ? overCard.nextSibling : overCard);
      }
    }
    function onUp(e) {
      li.classList.remove('dg-card--dragging');
      li.removeEventListener('pointermove', onMove);
      li.removeEventListener('pointerup', onUp);
      li.removeEventListener('pointercancel', onUp);
      if (moved) commitOrderFromDom(state);
    }
    li.addEventListener('pointermove', onMove);
    li.addEventListener('pointerup', onUp);
    li.addEventListener('pointercancel', onUp);
  }

  function commitOrderFromDom(state) {
    state.order = $$('.dg-card', state.listEl).map(function (c) { return c.getAttribute('data-id'); });
    // refresh the position numbers without rebuilding (keeps focus/drag smooth)
    $$('.dg-card', state.listEl).forEach(function (c, i) {
      var num = $('.dg-card__num', c); if (num) num.textContent = String(i + 1);
    });
    clearVerdict(state);
  }

  // ════════════════════════════════════════════════════════
  //  MODE: match  (连连看)
  // ════════════════════════════════════════════════════════
  function buildMatch(state) {
    var cfg = state.cfg;
    var wrap = el('div', { class: 'dg-match' });
    var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('class', 'dg-match__wires');
    svg.setAttribute('aria-hidden', 'true');

    var leftCol = el('div', { class: 'dg-col dg-col--left' });
    var rightCol = el('div', { class: 'dg-col dg-col--right' });

    (cfg.left || []).forEach(function (it) { leftCol.appendChild(makeNode(state, it, 'left')); });
    shuffled((cfg.right || []).map(function (r) { return r; })).forEach(function (it) {
      rightCol.appendChild(makeNode(state, it, 'right'));
    });

    wrap.appendChild(leftCol);
    wrap.appendChild(svg);
    wrap.appendChild(rightCol);
    state.matchWrap = wrap;
    state.matchSvg = svg;
    state.host.appendChild(wrap);

    state.drag = null;
    wrap.addEventListener('pointermove', function (e) { if (state.drag) dragWire(state, e); });
    wrap.addEventListener('pointerup', function (e) { if (state.drag) endWire(state, e); });
    wrap.addEventListener('pointercancel', function () { cancelWire(state); });
    window.addEventListener('resize', function () { redrawWires(state); });
  }

  function makeNode(state, it, side) {
    var node = el('button', {
      class: 'dg-node dg-node--' + side,
      type: 'button',
      'data-id': it.id, 'data-side': side,
      html: label(it.label != null ? it.label : { en: it.label_en, zh: it.label_zh })
    });
    var dot = el('span', { class: 'dg-node__dot', 'aria-hidden': 'true' });
    node.appendChild(dot);
    node.addEventListener('pointerdown', function (e) {
      if (state.locked || e.button > 0) return;
      e.preventDefault();
      startWire(state, node, side, e);
    });
    return node;
  }

  function startWire(state, node, side, e) {
    // a fresh drag from a left node clears that node's old wire
    if (side === 'left' && state.pairs[node.getAttribute('data-id')]) {
      delete state.pairs[node.getAttribute('data-id')];
    }
    state.drag = { from: node, side: side };
    state.host.classList.add('dg-dragging-wire');
    var line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('class', 'dg-wire dg-wire--live');
    state.matchSvg.appendChild(line);
    state.drag.line = line;
    dragWire(state, e);
  }

  function nodeAnchor(state, node) {
    var dot = $('.dg-node__dot', node) || node;
    var r = dot.getBoundingClientRect();
    var host = state.matchWrap.getBoundingClientRect();
    return { x: r.left + r.width / 2 - host.left, y: r.top + r.height / 2 - host.top };
  }

  function dragWire(state, e) {
    var a = nodeAnchor(state, state.drag.from);
    var host = state.matchWrap.getBoundingClientRect();
    var line = state.drag.line;
    line.setAttribute('x1', a.x); line.setAttribute('y1', a.y);
    line.setAttribute('x2', e.clientX - host.left); line.setAttribute('y2', e.clientY - host.top);
    var over = document.elementFromPoint(e.clientX, e.clientY);
    var node = over && over.closest ? over.closest('.dg-node') : null;
    $$('.dg-node', state.matchWrap).forEach(function (n) { n.classList.remove('dg-node--hot'); });
    if (node && node.getAttribute('data-side') !== state.drag.side) node.classList.add('dg-node--hot');
  }

  function endWire(state, e) {
    var over = document.elementFromPoint(e.clientX, e.clientY);
    var target = over && over.closest ? over.closest('.dg-node') : null;
    var d = state.drag;
    if (target && target.getAttribute('data-side') !== d.side) {
      var leftId = d.side === 'left' ? d.from.getAttribute('data-id') : target.getAttribute('data-id');
      var rightId = d.side === 'left' ? target.getAttribute('data-id') : d.from.getAttribute('data-id');
      // one wire per left node and per right node
      Object.keys(state.pairs).forEach(function (l) { if (state.pairs[l] === rightId) delete state.pairs[l]; });
      state.pairs[leftId] = rightId;
    }
    cancelWire(state);
    redrawWires(state);
    clearVerdict(state);
  }

  function cancelWire(state) {
    if (state.drag && state.drag.line && state.drag.line.parentNode) {
      state.drag.line.parentNode.removeChild(state.drag.line);
    }
    $$('.dg-node', state.matchWrap || state.host).forEach(function (n) { n.classList.remove('dg-node--hot'); });
    state.host.classList.remove('dg-dragging-wire');
    state.drag = null;
  }

  function redrawWires(state) {
    if (!state.matchSvg) return;
    $$('.dg-wire:not(.dg-wire--live)', state.matchSvg).forEach(function (w) { w.parentNode.removeChild(w); });
    var nodeBy = {};
    $$('.dg-node', state.matchWrap).forEach(function (n) {
      nodeBy[n.getAttribute('data-side') + ':' + n.getAttribute('data-id')] = n;
    });
    Object.keys(state.pairs).forEach(function (leftId) {
      var rightId = state.pairs[leftId];
      var ln = nodeBy['left:' + leftId], rn = nodeBy['right:' + rightId];
      if (!ln || !rn) return;
      var a = nodeAnchor(state, ln), b = nodeAnchor(state, rn);
      var line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('class', 'dg-wire');
      line.setAttribute('x1', a.x); line.setAttribute('y1', a.y);
      line.setAttribute('x2', b.x); line.setAttribute('y2', b.y);
      state.matchSvg.appendChild(line);
    });
  }

  // ════════════════════════════════════════════════════════
  //  FOOTER: submit + verdict
  // ════════════════════════════════════════════════════════
  function buildFooter(state) {
    var foot = el('div', { class: 'dg-foot' });
    var btn = el('button', { class: 'dg-submit btn btn-primary btn-sm', type: 'button',
      html: lang() === 'zh' ? '提交' : 'Submit' });
    state.submitBtn = btn;
    btn.addEventListener('click', function () { onSubmit(state); });
    var verdict = el('div', { class: 'dg-verdict', 'aria-live': 'polite' });
    state.verdictEl = verdict;
    foot.appendChild(btn);
    foot.appendChild(verdict);
    return foot;
  }

  function clearVerdict(state) {
    if (state.verdictEl) { state.verdictEl.textContent = ''; state.verdictEl.className = 'dg-verdict'; }
  }

  function onSubmit(state) {
    if (state.locked) return;
    var submission = serialize(state);

    // Standalone/demo path: grade locally only when the config opts in.
    if (state.cfg.self_check) {
      var res = localGrade(state, submission);
      showVerdict(state, res.correct, res.message);
      if (res.correct) lock(state);   // wrong → leave open so the student can retry
      // still fire the event so a host shell can log the attempt
      emit(state, submission, res);
      return;
    }
    // Production path: hand the submission to the shell → server marker.
    emit(state, submission, null);
    // shell calls window.DragInteraction.showResult(qid, ...) after server reply
  }

  function serialize(state) {
    if (state.mode === 'match') {
      var pairs = Object.keys(state.pairs).map(function (l) { return [l, state.pairs[l]]; });
      return { mode: 'match', question_id: state.qid, pairs: pairs };
    }
    return { mode: 'sequence', question_id: state.qid, ordered_ids: state.order.slice() };
  }

  function localGrade(state, sub) {
    var cfg = state.cfg, zh = lang() === 'zh';
    if (state.mode === 'sequence') {
      var ok = arrEq(sub.ordered_ids, cfg.correct_order || []);
      return { correct: ok, message: ok ? (zh ? '顺序正确！' : 'Correct order!')
                                         : (zh ? '顺序还不对，再试试。' : 'Not the right order yet.') };
    }
    // match
    var want = {};
    (cfg.correct_pairs || []).forEach(function (p) { want[p[0]] = p[1]; });
    var total = Object.keys(want).length, got = 0;
    Object.keys(want).forEach(function (l) { if (state.pairs[l] === want[l]) got++; });
    var allOk = got === total && Object.keys(state.pairs).length === total;
    return { correct: allOk,
      message: allOk ? (zh ? '全部配对正确！' : 'All matched!')
                     : (zh ? ('配对 ' + got + '/' + total + ' 正确，再检查一下。')
                           : ('Matched ' + got + '/' + total + ' — keep going.')) };
  }

  function showVerdict(state, correct, message) {
    if (!state.verdictEl) return;
    state.verdictEl.textContent = message || '';
    state.verdictEl.className = 'dg-verdict ' + (correct ? 'dg-verdict--ok' : 'dg-verdict--no');
  }

  function lock(state) {
    state.locked = true;
    state.host.classList.add('dg-locked');
    if (state.submitBtn) state.submitBtn.disabled = true;
    if (state.mode === 'sequence') renderSequence(state);
  }

  function emit(state, submission, localResult) {
    var ev;
    try { ev = new CustomEvent('dg:submit', { bubbles: true, detail: {
      question_id: state.qid, input_type: 'drag_' + state.mode,
      submission: submission, local_result: localResult } }); }
    catch (e) { return; }
    state.host.dispatchEvent(ev);
  }

  // ════════════════════════════════════════════════════════
  //  PUBLIC: serializeHost (shell reads this on its own submit) + showResult
  // ════════════════════════════════════════════════════════
  function serializeHost(host) {
    var qid = host.getAttribute('data-question-id');
    var state = STATES[qid];
    return state ? serialize(state) : null;
  }
  function showResult(qid, correct, message) {
    var state = STATES[qid];
    if (!state) return;
    showVerdict(state, correct, message);
    if (correct) lock(state);   // wrong → leave open for retry
  }

  root.DragInteraction = { init: init, serializeHost: serializeHost, showResult: showResult, _states: STATES };

  // auto-init any host present at load (shell may also call init explicitly)
  function autoInit() { $$('[data-component="drag"]').forEach(init); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', autoInit);
  else autoInit();

})(window);
