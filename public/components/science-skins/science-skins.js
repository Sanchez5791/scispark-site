/* ============================================================
   SciSpark · Science Skins behaviour (shared, reusable) · 2026-06-25
   - Biology BioLabelDiagram: point at a diagram part → the same-key
     table row lights up (and vice-versa).
   - Physics PhysSlider: drag the slider → force arrow grows + object
     moves; optional target gives correct feedback.
   ONE file for every lesson. Lessons write only content markup with the
   data-* hooks below; no behaviour is copied per lesson.
   ============================================================ */
(function () {
  // ---------- Biology: point → same-colour row lights ----------
  function initBio(root) {
    (root || document).querySelectorAll('[data-bio-skin]').forEach(function (skin) {
      if (skin._bioWired) return; skin._bioWired = true;
      function light(key) {
        skin.querySelectorAll('[data-bio-part]').forEach(function (p) {
          p.classList.toggle('lit', !!key && p.getAttribute('data-bio-part') === key);
        });
        skin.querySelectorAll('[data-bio-row]').forEach(function (r) {
          r.classList.toggle('lit', !!key && r.getAttribute('data-bio-row') === key);
        });
      }
      skin.querySelectorAll('[data-bio-part],[data-bio-row]').forEach(function (el) {
        var key = el.getAttribute('data-bio-part') || el.getAttribute('data-bio-row');
        el.addEventListener('mouseenter', function () { light(key); });
        el.addEventListener('focus', function () { light(key); });
        el.addEventListener('click', function () { light(key); });
        if (el.hasAttribute('data-bio-row')) { el.tabIndex = 0; }
      });
      skin.addEventListener('mouseleave', function () { light(null); });
    });
  }

  // ---------- Physics: slider → force arrow + object move + target check ----------
  function initPhys(root) {
    (root || document).querySelectorAll('[data-phys-slider]').forEach(function (w) {
      if (w._physWired) return; w._physWired = true;
      var range = w.querySelector('input[type=range]');
      if (!range) return;
      var obj = w.querySelector('[data-phys-object]');
      var arrow = w.querySelector('[data-phys-arrow]');
      var readout = w.querySelector('[data-phys-readout]');
      var fb = w.querySelector('[data-phys-feedback]');
      var target = parseInt(w.getAttribute('data-phys-target') || '0', 10);
      var zh = function () { return document.body.classList.contains('zh-mode'); };
      function upd() {
        var v = parseInt(range.value, 10);
        if (arrow) arrow.style.width = (18 + v * 1.3) + 'px';
        if (obj) obj.style.transform = 'translateX(' + (v * 1.7) + 'px)';
        if (readout) readout.textContent = v;
        if (fb && target) {
          if (Math.abs(v - target) <= 4) {
            fb.className = 'phys-fb ok';
            fb.innerHTML = (zh() ? '✓ 对了!这个力刚好把小车推到绿线。' : '✓ Got it! That force pushes the trolley right to the green line.');
            try { if (window.SparkJar) window.SparkJar.add(20, 'correct'); } catch (e) {}
            try { if (window.playSound) playSound('correct'); } catch (e) {}
          } else {
            fb.className = 'phys-fb';
            fb.innerHTML = '';
          }
        }
      }
      range.addEventListener('input', upd);
      upd();
    });
  }

  function init(root) { initBio(root); initPhys(root); }

  // expose for re-init after engine screen changes
  window.SciSparkSkins = { init: init };

  // run on load, and re-run when the engine switches screens (it patches showScreen)
  function boot() {
    init(document);
    var orig = window.showScreen;
    if (typeof orig === 'function' && !orig._skinPatched) {
      window.showScreen = function (id) { var r = orig.apply(this, arguments); try { init(document); } catch (e) {} return r; };
      window.showScreen._skinPatched = true;
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
