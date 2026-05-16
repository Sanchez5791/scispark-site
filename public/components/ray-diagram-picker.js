/*
  SciSpark · ray-diagram-picker.js
  Component: INPUT_TYPE=ray_diagram widget
  Exposes: window.RayDiagramPicker.{init, serializeHost}
*/
(function (root) {
  'use strict';

  // ────────────── CONSTANTS ──────────────
  var SVG_NS = 'http://www.w3.org/2000/svg';
  var MIN_LINES = 2, MAX_LINES = 6;
  var MIN_DIRS = 2, MAX_DIRS = 4;

  // ────────────── HELPERS ────────────────
  function $$(sel, ctx) {
    return Array.prototype.slice.call((ctx || document).querySelectorAll(sel));
  }
  function el(tag, attrs, kids) {
    var n = document.createElement(tag);
    if (attrs) for (var k in attrs) {
      if (k === 'class') n.className = attrs[k];
      else if (k === 'text') n.textContent = attrs[k];
      else if (k === 'html') n.innerHTML = attrs[k];
      else n.setAttribute(k, attrs[k]);
    }
    if (kids) kids.forEach(function (c) { if (c) n.appendChild(c); });
    return n;
  }
  function svgEl(tag, attrs) {
    var n = document.createElementNS(SVG_NS, tag);
    if (attrs) for (var k in attrs) n.setAttribute(k, String(attrs[k]));
    return n;
  }
  function parseConfig(raw) {
    if (!raw) return null;
    try { return JSON.parse(raw); }
    catch (e) {
      console.warn('[RayDiagramPicker] bad config JSON:', e);
      return null;
    }
  }

  // Set bilingual text on a node — wraps in <span> + <span class="zh">.
  // Family pattern: lesson-shell.css decides which one shows; in standalone
  // demo both render (ZH styled smaller, ink-3 colour, ZH font).
  function setBilingualText(node, en, zh) {
    if (!node) return;
    node.innerHTML = '';
    if (en) {
      var spanEn = document.createElement('span');
      spanEn.textContent = en;
      node.appendChild(spanEn);
    }
    if (zh) {
      var spanZh = document.createElement('span');
      spanZh.className = 'zh';
      spanZh.textContent = zh;
      node.appendChild(spanZh);
    }
  }

  // Fallback label position: parse last number pair from SVG path d string
  // (endpoint of M / L / Q / C / S / A commands), then nudge up-right
  // by [+8, -8]. Used when config omits line.label_pos.
  function computeLabelPos(pathStr) {
    if (typeof pathStr !== 'string') return [0, 0];
    var nums = pathStr.match(/-?\d+(?:\.\d+)?/g);
    if (!nums || nums.length < 2) return [0, 0];
    return [
      parseFloat(nums[nums.length - 2]) + 8,
      parseFloat(nums[nums.length - 1]) - 8
    ];
  }

  // ────────────── STATE FACTORY ──────────
  function makeState(host) {
    var qid = host.getAttribute('data-question-id') || 'UNSET_QID';
    var rdid = host.getAttribute('data-rd-id') || qid;
    var config = parseConfig(host.getAttribute('data-rd-config'));

    return {
      rdid: rdid,
      qid: qid,
      config: config,             // null if parse failed
      submitted: false,
      picked_line: null,          // line id string or null
      picked_direction: null,     // direction id string or null
      error: null                 // string if invalid config
    };
  }

  // ────────────── VALIDATION OF CONFIG ───
  function validateConfig(state) {
    var c = state.config;
    if (!c) { state.error = 'Config JSON missing or invalid.'; return false; }
    if (!c.viewBox) { state.error = 'Config missing viewBox.'; return false; }
    if (!c.scene || (c.scene.mode !== 'inline' && c.scene.mode !== 'url')) {
      state.error = 'Config missing scene.mode (must be "inline" or "url").';
      return false;
    }
    if (c.scene.mode === 'inline' && typeof c.scene.svg !== 'string') {
      state.error = 'Config scene.mode="inline" requires scene.svg string.';
      return false;
    }
    if (c.scene.mode === 'url' && typeof c.scene.url !== 'string') {
      state.error = 'Config scene.mode="url" requires scene.url string.';
      return false;
    }
    if (!Array.isArray(c.lines) || c.lines.length < MIN_LINES) {
      state.error = 'Config needs at least ' + MIN_LINES + ' lines.';
      return false;
    }
    if (c.lines.length > MAX_LINES) {
      console.warn('[RayDiagramPicker] lines > ' + MAX_LINES + ', truncating');
      c.lines = c.lines.slice(0, MAX_LINES);
    }
    for (var i = 0; i < c.lines.length; i++) {
      var ln = c.lines[i];
      if (!ln.id || typeof ln.path !== 'string') {
        state.error = 'Line at index ' + i + ' missing id or path.';
        return false;
      }
    }
    if (!Array.isArray(c.directions) || c.directions.length < MIN_DIRS) {
      state.error = 'Config needs at least ' + MIN_DIRS + ' directions.';
      return false;
    }
    if (c.directions.length > MAX_DIRS) {
      console.warn('[RayDiagramPicker] directions > ' + MAX_DIRS + ', truncating');
      c.directions = c.directions.slice(0, MAX_DIRS);
    }
    for (var j = 0; j < c.directions.length; j++) {
      if (!c.directions[j].id) {
        state.error = 'Direction at index ' + j + ' missing id.';
        return false;
      }
    }
    // local_marking sanity
    if (c.local_marking) {
      var lm = c.local_marking;
      var lineIds = c.lines.map(function (l) { return l.id; });
      var dirIds = c.directions.map(function (d) { return d.id; });
      if (lineIds.indexOf(lm.correct_line) < 0) {
        console.warn('[RayDiagramPicker] local_marking.correct_line "' + lm.correct_line + '" not in lines list');
      }
      if (dirIds.indexOf(lm.correct_direction) < 0) {
        console.warn('[RayDiagramPicker] local_marking.correct_direction "' + lm.correct_direction + '" not in directions list');
      }
    }
    return true;
  }

  // ────────────── RENDER ─────────────────
  function render(host, state) {
    host.innerHTML = '';

    if (!validateConfig(state)) {
      var err = el('div', {class: 'rd-error', role: 'alert'});
      err.textContent = '[ray_diagram_picker config error] ' + state.error;
      host.appendChild(err);
      return;
    }

    // SVG wrap
    var svgWrap = el('div', {class: 'rd-svg-wrap'});
    var svg = buildSVG(state);
    svgWrap.appendChild(svg);
    host.appendChild(svgWrap);

    // Step 1
    var step1 = buildStep1(state);
    host.appendChild(step1);

    // Step 2
    var step2 = buildStep2(state);
    host.appendChild(step2);

    // Submit row
    var submitRow = buildSubmitRow(state);
    host.appendChild(submitRow);

    // SR live region (visually hidden)
    var live = el('div', {
      class: 'rd-live',
      role: 'status',
      'aria-live': 'polite',
      'aria-atomic': 'true'
    });
    host.appendChild(live);

    // Wire interactions
    wireInteractions(host, state);
    refreshAll(host, state);
  }

  function buildSVG(state) {
    var c = state.config;
    var svg = svgEl('svg', {
      viewBox: c.viewBox,
      preserveAspectRatio: c.preserveAspectRatio || 'xMidYMid meet',
      class: 'rd-svg',
      role: 'group',
      'aria-label': 'Ray diagram with ' + c.lines.length + ' candidate light rays. Use Tab to focus a ray, then Enter or Space to select.'
    });

    // Scene background
    if (c.scene.mode === 'inline') {
      var sceneG = svgEl('g', {class: 'rd-scene-content', 'aria-hidden': 'true'});
      sceneG.innerHTML = c.scene.svg;
      svg.appendChild(sceneG);
    } else if (c.scene.mode === 'url') {
      var img = svgEl('image', {
        href: c.scene.url,
        'xlink:href': c.scene.url,
        x: '0', y: '0',
        width: '100%', height: '100%',
        preserveAspectRatio: c.preserveAspectRatio || 'xMidYMid meet',
        'aria-hidden': 'true'
      });
      // Graceful fallback: if image fails to load it just won't show — lines still work.
      img.addEventListener('error', function () {
        console.warn('[RayDiagramPicker] scene URL failed to load:', c.scene.url);
      });
      svg.appendChild(img);
    }

    // Candidate lines + hit overlays + labels
    c.lines.forEach(function (line) {
      // Invisible hit area (wider, catches taps/clicks)
      var hit = svgEl('path', {
        d: line.path,
        class: 'rd-line-hit',
        'data-rd-line-id': line.id,
        'aria-hidden': 'true'
      });
      svg.appendChild(hit);
    });

    c.lines.forEach(function (line) {
      // Visible line (focusable)
      var labelStr = line.label || line.id;
      var p = svgEl('path', {
        d: line.path,
        class: 'rd-line',
        'data-rd-line-id': line.id,
        tabindex: '0',
        role: 'button',
        'aria-pressed': 'false',
        'aria-label': 'Candidate ray ' + labelStr
      });
      svg.appendChild(p);
    });

    // Labels last so they sit on top
    c.lines.forEach(function (line) {
      var pos = line.label_pos || computeLabelPos(line.path);
      var t = svgEl('text', {
        x: pos[0],
        y: pos[1],
        class: 'rd-line-label',
        'data-rd-label-for': line.id,
        'aria-hidden': 'true'
      });
      t.textContent = line.label || line.id;
      svg.appendChild(t);
    });

    return svg;
  }

  function buildStep1(state) {
    var box = el('div', {class: 'rd-step', 'data-rd-step': '1'});
    var lbl = el('div', {class: 'rd-step-label'});
    setBilingualText(lbl, 'Step 1', '第 1 步');
    var prompt = el('div', {class: 'rd-step-prompt'});
    prompt.innerHTML = 'Click a candidate ray (' +
      state.config.lines.map(function (l) { return l.label || l.id; }).join(' / ') +
      ').<span class="zh">点一条候选光线 (' +
      state.config.lines.map(function (l) { return l.label || l.id; }).join(' / ') +
      ').</span>';
    var readout = el('div', {class: 'rd-picked-readout', 'data-rd-readout': 'line'});
    setBilingualText(readout, 'Picked: —', '已选: —');
    box.appendChild(lbl);
    box.appendChild(prompt);
    box.appendChild(readout);
    return box;
  }

  function buildStep2(state) {
    var box = el('div', {class: 'rd-step', 'data-rd-step': '2'});
    var lbl = el('div', {class: 'rd-step-label'});
    setBilingualText(lbl, 'Step 2', '第 2 步');
    var prompt = el('div', {class: 'rd-step-prompt'});
    prompt.innerHTML = 'Pick the direction of travel.<span class="zh">选光线的传播方向.</span>';
    box.appendChild(lbl);
    box.appendChild(prompt);

    var row = el('div', {class: 'rd-dir-row', role: 'group', 'aria-label': 'Direction options'});
    state.config.directions.forEach(function (dir) {
      var btn = el('button', {
        type: 'button',
        class: 'rd-dir-btn',
        'data-rd-dir-id': dir.id,
        'aria-pressed': 'false'
      });
      if (dir.icon) {
        var ic = el('span', {class: 'rd-dir-icon', 'aria-hidden': 'true'});
        ic.textContent = dir.icon;
        btn.appendChild(ic);
      }
      if (dir.label_en) {
        var en = el('span', {class: 'rd-dir-label-en'});
        en.textContent = dir.label_en;
        btn.appendChild(en);
      }
      if (dir.label_zh) {
        var zh = el('span', {class: 'rd-dir-label-zh zh'});
        zh.textContent = dir.label_zh;
        btn.appendChild(zh);
      }
      // Build aria-label as combined text
      var aria = (dir.label_en || dir.id);
      btn.setAttribute('aria-label', aria);
      row.appendChild(btn);
    });
    box.appendChild(row);

    var readout = el('div', {class: 'rd-picked-readout', 'data-rd-readout': 'dir'});
    setBilingualText(readout, 'Picked: —', '已选: —');
    box.appendChild(readout);
    return box;
  }

  function buildSubmitRow(state) {
    var row = el('div', {class: 'rd-submit-row'});
    var submit = el('button', {
      type: 'button',
      class: 'rd-submit',
      'data-rd-action': 'submit',
      'aria-label': 'Submit answer'
    });
    setBilingualText(submit, 'Submit', '提交');
    var reset = el('button', {
      type: 'button',
      class: 'rd-reset',
      'data-rd-action': 'reset',
      'aria-label': 'Reset selections'
    });
    setBilingualText(reset, 'Reset', '重来');
    var status = el('span', {class: 'rd-status', 'data-rd-status': '1'});
    status.textContent = '';
    row.appendChild(submit);
    row.appendChild(reset);
    row.appendChild(status);
    return row;
  }

  // ────────────── INTERACTIONS ───────────
  function wireInteractions(host, state) {
    // Line click + hit overlay click + keyboard
    var clickLine = function (id) { pickLine(host, state, id); };

    $$('.rd-line, .rd-line-hit', host).forEach(function (node) {
      node.addEventListener('click', function (ev) {
        if (state.submitted) return;
        var id = node.getAttribute('data-rd-line-id');
        if (id) clickLine(id);
      });
    });

    $$('.rd-line', host).forEach(function (node) {
      node.addEventListener('keydown', function (ev) {
        if (state.submitted) return;
        if (ev.key === 'Enter' || ev.key === ' ' || ev.key === 'Spacebar') {
          ev.preventDefault();
          var id = node.getAttribute('data-rd-line-id');
          if (id) clickLine(id);
        }
      });
    });

    // Direction buttons
    $$('.rd-dir-btn', host).forEach(function (btn) {
      btn.addEventListener('click', function () {
        if (state.submitted) return;
        if (state.config.step_lock !== false && state.picked_line === null) {
          // step lock on, line not picked yet — ignore (button will be disabled anyway)
          return;
        }
        var id = btn.getAttribute('data-rd-dir-id');
        if (id) pickDir(host, state, id);
      });
    });

    // Submit + Reset
    host.querySelector('[data-rd-action="submit"]').addEventListener('click', function () {
      submit(host, state);
    });
    host.querySelector('[data-rd-action="reset"]').addEventListener('click', function () {
      resetAll(host, state);
    });
  }

  function pickLine(host, state, id) {
    if (state.submitted) return;
    state.picked_line = id;

    // Update visual
    $$('.rd-line', host).forEach(function (node) {
      var match = node.getAttribute('data-rd-line-id') === id;
      node.classList.toggle('rd-selected', match);
      node.setAttribute('aria-pressed', match ? 'true' : 'false');
    });
    $$('.rd-line-label', host).forEach(function (node) {
      var match = node.getAttribute('data-rd-label-for') === id;
      node.classList.toggle('rd-label-selected', match);
    });

    // Update readout
    var readout = host.querySelector('[data-rd-readout="line"]');
    if (readout) {
      var labelStr = labelForLine(state, id);
      setBilingualText(readout, 'Picked: ' + labelStr, '已选: ' + labelStr);
      readout.classList.add('rd-has-value');
    }

    announce(host, 'Ray ' + labelForLine(state, id) + ' selected.');

    refreshAll(host, state);
  }

  function pickDir(host, state, id) {
    if (state.submitted) return;
    state.picked_direction = id;

    // Update visual
    $$('.rd-dir-btn', host).forEach(function (btn) {
      var match = btn.getAttribute('data-rd-dir-id') === id;
      btn.classList.toggle('rd-active', match);
      btn.setAttribute('aria-pressed', match ? 'true' : 'false');
    });

    // Update readout
    var dirObj = state.config.directions.filter(function (d) { return d.id === id; })[0];
    var labelEn = (dirObj && (dirObj.label_en || dirObj.id)) || id;
    var labelZh = (dirObj && (dirObj.label_zh || dirObj.id)) || id;
    var readout = host.querySelector('[data-rd-readout="dir"]');
    if (readout) {
      setBilingualText(readout, 'Picked: ' + labelEn, '已选: ' + labelZh);
      readout.classList.add('rd-has-value');
    }

    announce(host, 'Direction ' + labelEn + ' selected.');

    refreshAll(host, state);
  }

  function resetAll(host, state) {
    if (state.submitted) return;
    state.picked_line = null;
    state.picked_direction = null;

    $$('.rd-line', host).forEach(function (n) {
      n.classList.remove('rd-selected');
      n.setAttribute('aria-pressed', 'false');
    });
    $$('.rd-line-label', host).forEach(function (n) {
      n.classList.remove('rd-label-selected');
    });
    $$('.rd-dir-btn', host).forEach(function (b) {
      b.classList.remove('rd-active');
      b.setAttribute('aria-pressed', 'false');
    });
    $$('.rd-picked-readout', host).forEach(function (r) {
      setBilingualText(r, 'Picked: —', '已选: —');
      r.classList.remove('rd-has-value');
    });

    announce(host, 'Selections cleared.');
    refreshAll(host, state);
  }

  function labelForLine(state, id) {
    var ln = state.config.lines.filter(function (l) { return l.id === id; })[0];
    return (ln && (ln.label || ln.id)) || id;
  }

  // ────────────── VALIDATION (RUNTIME) ───
  function isReadyToSubmit(state) {
    return state.picked_line !== null && state.picked_direction !== null;
  }

  function refreshAll(host, state) {
    // Lock/unlock Step 2 based on step_lock + picked_line
    var step2 = host.querySelector('[data-rd-step="2"]');
    if (step2) {
      var lock = state.config.step_lock !== false; // default true
      if (lock && state.picked_line === null) {
        step2.classList.add('rd-locked');
        $$('.rd-dir-btn', host).forEach(function (b) { b.setAttribute('disabled', 'disabled'); });
      } else {
        step2.classList.remove('rd-locked');
        $$('.rd-dir-btn', host).forEach(function (b) { b.removeAttribute('disabled'); });
      }
    }

    refreshSubmitBtn(host, state);
  }

  function refreshSubmitBtn(host, state) {
    var btn = host.querySelector('[data-rd-action="submit"]');
    var status = host.querySelector('[data-rd-status="1"]');
    if (!btn || !status) return;

    if (state.submitted) {
      btn.disabled = true;
      setBilingualText(status, 'Submitted', '已提交');
      status.className = 'rd-status rd-ok';
      return;
    }
    var ready = isReadyToSubmit(state);
    btn.disabled = !ready;
    if (ready) {
      setBilingualText(status, 'Ready', '可提交');
      status.className = 'rd-status rd-ok';
    } else {
      var missingEn = [];
      var missingZh = [];
      if (state.picked_line === null) { missingEn.push('line'); missingZh.push('线'); }
      if (state.picked_direction === null) { missingEn.push('direction'); missingZh.push('方向'); }
      setBilingualText(status,
        'Need: ' + missingEn.join(' + '),
        '需要: ' + missingZh.join(' + ')
      );
      status.className = 'rd-status';
    }
  }

  // ────────────── SUBMIT / SERIALIZE ─────
  function serialize(state) {
    var payload = {
      input_type: 'ray_diagram',
      question_id: state.qid,
      student_submission: {
        picked_line: state.picked_line,
        picked_direction: state.picked_direction
      }
    };

    if (state.config.local_marking) {
      var lm = state.config.local_marking;
      var marks = state.config.marks || {line: 1, direction: 1};
      var lineOk = state.picked_line === lm.correct_line;
      var dirOk = state.picked_direction === lm.correct_direction;
      var lineMark = (typeof marks.line === 'number') ? marks.line : 1;
      var dirMark = (typeof marks.direction === 'number') ? marks.direction : 1;
      payload.local_marks = {
        line_correct: lineOk,
        direction_correct: dirOk,
        score: (lineOk ? lineMark : 0) + (dirOk ? dirMark : 0),
        max_score: lineMark + dirMark
      };
    }
    return payload;
  }

  function submit(host, state) {
    if (!isReadyToSubmit(state) || state.submitted) return;
    state.submitted = true;
    var payload = serialize(state);

    host.classList.add('rd-locked-state');

    // Hidden field for traditional form pipelines
    var hidden = el('input', {
      type: 'hidden',
      name: state.qid + '_ray_diagram_submission',
      value: JSON.stringify(payload)
    });
    host.appendChild(hidden);

    // CustomEvent (bubbles up to lesson-shell)
    var evt;
    try {
      evt = new CustomEvent('rd:submit', {detail: payload, bubbles: true});
    } catch (e) {
      evt = document.createEvent('CustomEvent');
      evt.initCustomEvent('rd:submit', true, false, payload);
    }
    host.dispatchEvent(evt);

    // SR announce
    var msg = 'Answer submitted.';
    if (payload.local_marks) {
      msg += ' Score: ' + payload.local_marks.score + ' out of ' + payload.local_marks.max_score + '.';
    }
    announce(host, msg);

    refreshSubmitBtn(host, state);
  }

  // ────────────── SR LIVE REGION ─────────
  function announce(host, text) {
    var live = host.querySelector('.rd-live');
    if (!live) return;
    // Clear-then-set forces SR to re-announce even if identical text
    live.textContent = '';
    setTimeout(function () { live.textContent = text; }, 30);
  }

  // ────────────── PUBLIC API ─────────────
  root.RayDiagramPicker = {
    init: function (hostOrSelector) {
      var hosts;
      if (typeof hostOrSelector === 'string') hosts = $$(hostOrSelector);
      else if (hostOrSelector instanceof Element) hosts = [hostOrSelector];
      else hosts = $$('.ray-diagram-picker');
      hosts.forEach(function (h) {
        if (h.__rdState) return;
        var state = makeState(h);
        h.__rdState = state;
        render(h, state);
      });
    },
    serializeHost: function (host) {
      if (!host || !host.__rdState) return null;
      return serialize(host.__rdState);
    }
  };

  // Auto-init when DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { root.RayDiagramPicker.init(); });
  } else {
    root.RayDiagramPicker.init();
  }

})(window);
