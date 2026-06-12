/*
═══════════════════════════════════════════════════════════════
SCISPARK LESSON SHELL v4+skin · BEHAVIOUR LAYER (additive)
═══════════════════════════════════════════════════════════════
File:  /lesson-shell-v4-skin.js
Date:  2026-06-12
Brief: SCISPARK_LESSON_SHELL_REDESIGN_BRIEF_v1 (5 pillars)
Loads AFTER /lesson-shell-v4.js and /components/doudou/poses.js.
Wraps (never replaces) the v4 globals at DOMContentLoaded, so any
lesson-local overrides (e.g. L01's inline submitAnswer) are wrapped
too. Removing this file + the skin css reverts to plain v4.

Pedagogy untouched: marking, attempts, hints, XP amounts, screen
order all stay in the engine / lesson script. This file only adds
presentation: pose swaps, spark burst, XP spring, shake, sweep,
progressive reveal.

Doudou note (ANIMATION_POLICY 锁 #6): character art stays STATIC
SVG (poses.js). Motion = CSS transforms on the container only.
═══════════════════════════════════════════════════════════════
*/
(function () {
  'use strict';

  /* ── motion gate ───────────────────────────────────────────── */
  function motionOff() {
    try {
      if (document.body.classList.contains('reduced-motion')) return true;
      return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    } catch (e) { return false; }
  }

  /* ── PILLAR 5 · Doudou per-screen presence ─────────────────── */
  var SCREEN_MOOD = {
    hook:  'greeting',   /* P02 wave — entrance */
    learn: 'think',      /* P06 — studying alongside */
    try:   'cheer',      /* P05 — encouraging */
    test:  'idle',       /* P01 — sits back, calm, no hints */
    wrap:  'aha'         /* P04 — celebration of what was learned */
  };
  var currentScreen = 'hook';
  var poseTimer = null;

  function setPose(mood) {
    if (!window.renderDoudou) return;
    var holder = document.querySelector('.prof-p-avatar');
    if (!holder) return;
    holder.innerHTML = window.renderDoudou(mood, { size: 62 });
  }

  function setScreenPose(screen) {
    clearTimeout(poseTimer);
    setPose(SCREEN_MOOD[screen] || 'idle');
  }

  /* react to events with a short pose, then settle back (≤2s) */
  function reactPose(mood, holdMs) {
    if (!window.renderDoudou) return;
    clearTimeout(poseTimer);
    setPose(mood);
    poseTimer = setTimeout(function () { setScreenPose(currentScreen); }, holdMs || 2000);
  }

  /* idle-too-long: gentle curious pose only — never while typing,
     never a bubble interruption (banned list) */
  var idleTimer = null;
  function armIdleNudge() {
    clearTimeout(idleTimer);
    if (currentScreen === 'test') return; /* TEST stays calm */
    idleTimer = setTimeout(function () {
      var ae = document.activeElement;
      if (ae && (ae.tagName === 'TEXTAREA' || ae.tagName === 'INPUT')) { armIdleNudge(); return; }
      reactPose('curious', 2000);
      armIdleNudge();
    }, 90000);
  }
  ['pointerdown', 'keydown', 'scroll'].forEach(function (ev) {
    window.addEventListener(ev, armIdleNudge, { passive: true });
  });

  /* ── PILLAR 3 · spark burst at an element (≤600ms total) ─────
     Prefers the existing click-spark-fx asset (brief: "click_spark
     burst"); falls back to the inline .skin-burst rays. */
  function sparkBurst(el) {
    if (!el || motionOff()) return;
    var r = el.getBoundingClientRect();
    if (window.ClickSparkFx && typeof window.ClickSparkFx.spawn === 'function') {
      window.ClickSparkFx.spawn(r.left + r.width / 2, r.top + r.height / 2);
      window.ClickSparkFx.spawn(r.left + r.width / 2, r.top + r.height / 2);
      return;
    }
    var burst = document.createElement('span');
    burst.className = 'skin-burst';
    burst.style.left = (r.left + r.width / 2) + 'px';
    burst.style.top = (r.top + r.height / 2) + 'px';
    burst.style.position = 'fixed';
    for (var i = 0; i < 8; i++) {
      var ray = document.createElement('i');
      ray.style.setProperty('--ray', (i * 45) + 'deg');
      burst.appendChild(ray);
    }
    document.body.appendChild(burst);
    setTimeout(function () { burst.remove(); }, 600);
  }

  /* ── PILLAR 3 · XP chip spring + count roll-up ─────────────── */
  function springToast(amount) {
    var toast = document.getElementById('xp-toast');
    if (!toast) return;
    toast.classList.remove('skin-out');
    if (motionOff()) { toast.textContent = '+' + amount + ' XP'; return; }
    toast.classList.remove('skin-spring');
    void toast.offsetWidth;
    toast.classList.add('skin-spring');
    /* count roll-up: 0 → amount in ~250ms (count_0/10/20 style).
       Reset synchronously so the engine's "+N XP" never flashes first. */
    toast.textContent = '+0 XP';
    var steps = 5, step = 0;
    var iv = setInterval(function () {
      step++;
      var val = Math.round(amount * step / steps);
      toast.textContent = '+' + val + ' XP';
      if (step >= steps) clearInterval(iv);
    }, 50);
    setTimeout(function () {
      toast.classList.add('skin-out');
      setTimeout(function () { toast.classList.remove('show', 'skin-spring', 'skin-out'); }, 260);
    }, 1500);
  }

  /* ── PILLAR 3 · mastery bar tip spark ──────────────────────── */
  function barSpark() {
    if (motionOff()) return;
    var bar = document.querySelector('.sidebar-progress .progress-bar');
    var fill = document.getElementById('prog-fill');
    if (!bar || !fill) return;
    var spark = document.createElement('span');
    spark.className = 'skin-bar-spark';
    /* place at the tip of the fill after the liquid ease settles */
    setTimeout(function () {
      spark.style.left = fill.style.width || '0%';
      bar.appendChild(spark);
      setTimeout(function () { spark.remove(); }, 650);
    }, 580);
  }

  /* ── PILLAR 3 · screen-completion spark sweep (≤600ms) ─────── */
  function screenSweep() {
    if (motionOff()) return;
    var sw = document.createElement('div');
    sw.className = 'skin-sweep';
    document.body.appendChild(sw);
    setTimeout(function () { sw.remove(); }, 600);
  }

  /* ── PILLAR 4 · progressive reveal (scroll-driven, additive) ──
     Content is never hidden behind completion gates: everything is
     in the DOM; reveal is presentation only. No-JS → fully visible. */
  var revealObserver = null;
  var REVEAL_SELECTOR = [
    '.card', '.definition-box', '.summary-box', '.mistake-box',
    '.concept-split', '.lesson-image', '.vocab-card', '.question-block',
    '.wrap-summary', '.xp-stat', '.badge-reveal', '.cliffhanger',
    '#progress-summary-card', '.hook-scenario'
  ].join(',');

  function setupReveal() {
    if (motionOff() || !('IntersectionObserver' in window)) return;
    revealObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          en.target.classList.add('skin-in');
          revealObserver.unobserve(en.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
    observeWithin(document);
  }

  function observeWithin(scope) {
    if (!revealObserver) return;
    scope.querySelectorAll(REVEAL_SELECTOR).forEach(function (el) {
      if (el.classList.contains('skin-in')) return;
      el.classList.add('skin-reveal');
      revealObserver.observe(el);
    });
  }

  /* re-trigger reveal stagger when entering a screen: elements already
     above the fold get a small cascade instead of popping in at once */
  function cascadeScreen(screenEl) {
    if (motionOff() || !screenEl) return;
    var els = screenEl.querySelectorAll('.skin-reveal:not(.skin-in)');
    var delay = 0;
    els.forEach(function (el) {
      var r = el.getBoundingClientRect();
      if (r.top < window.innerHeight * 0.9) {
        (function (d, node) {
          setTimeout(function () { node.classList.add('skin-in'); if (revealObserver) revealObserver.unobserve(node); }, d);
        })(delay, el);
        delay += 70;
      }
    });
  }

  /* ── wire-up: wrap globals AFTER everything else has loaded ── */
  function init() {
    document.body.setAttribute('data-skin', 'v4skin');
    document.body.setAttribute('data-skin-screen', 'hook');

    /* Doudou: swap static placeholder SVG for poses.js art */
    setScreenPose('hook');
    armIdleNudge();
    setupReveal();
    cascadeScreen(document.querySelector('.screen.active'));

    /* wrap showScreen: pose + sweep + bar spark + cascade */
    var origShow = window.showScreen;
    if (typeof origShow === 'function') {
      window.showScreen = function (name) {
        var changed = (name !== currentScreen);
        origShow.apply(this, arguments);
        if (!changed) return;
        currentScreen = name;
        document.body.setAttribute('data-skin-screen', name);
        setScreenPose(name);
        screenSweep();
        barSpark();
        var screenEl = document.getElementById('screen-' + name) ||
                       document.querySelector('.screen[data-screen="' + name + '"]');
        observeWithin(screenEl || document);
        cascadeScreen(screenEl);
      };
    }

    /* wrap awardXP: spring + roll-up replaces plain toast */
    var origAward = window.awardXP;
    if (typeof origAward === 'function') {
      window.awardXP = function (amount, source) {
        origAward.apply(this, arguments);
        springToast(amount);
      };
    }

    /* wrap submitAnswer (text-question lessons): burst on correct,
       gentle 4px shake on the input on wrong. Marking untouched —
       we only read the outcome the lesson script already rendered. */
    var origSubmit = window.submitAnswer;
    if (typeof origSubmit === 'function') {
      window.submitAnswer = function (arg1, arg2, arg3) {
        origSubmit.apply(this, arguments);
        if (typeof arg1 === 'string') {
          var qid = arg1;
          var fb = document.getElementById(qid + '-feedback');
          if (!fb || fb.style.display === 'none') return; /* empty input → no reaction */
          var correct = fb.className.indexOf('feedback-right') !== -1;
          if (correct) {
            sparkBurst(document.getElementById(qid + '-submit'));
            reactPose('correct', 2000);
            if (window.playSound) { try { window.playSound('correct'); } catch (e) {} }
          } else {
            var input = document.getElementById(qid + '-input');
            if (input && !motionOff()) {
              input.classList.remove('skin-shake');
              void input.offsetWidth;
              input.classList.add('skin-shake');
              setTimeout(function () { input.classList.remove('skin-shake'); }, 250);
            }
            reactPose('confused', 2000);
            if (window.playSound) { try { window.playSound('wrong'); } catch (e) {} }
          }
        } else if (arg1 && arg1.nodeType === 1) {
          /* v4 MCQ path: engine already plays sound + doudouReact */
          if (arg2) sparkBurst(arg1);
        }
      };
    }

    /* wrap doudouReact so MCQ lessons get pose swaps too */
    var origReact = window.doudouReact;
    window.doudouReact = function (isCorrect) {
      if (typeof origReact === 'function') { try { origReact.apply(this, arguments); } catch (e) {} }
      reactPose(isCorrect ? 'correct' : 'confused', 2000);
    };

    /* wrap completeLesson: star pose + burst on the complete button */
    var origComplete = window.completeLesson;
    if (typeof origComplete === 'function') {
      window.completeLesson = function () {
        var btn = document.querySelector('#screen-wrap .btn-primary');
        origComplete.apply(this, arguments);
        sparkBurst(btn);
        reactPose('star', 2400);
      };
    }

    /* WRAP xp-stat pop when wrap screen first shown */
    var statsPopped = false;
    var origShow2 = window.showScreen;
    window.showScreen = function (name) {
      origShow2.apply(this, arguments);
      if (name === 'wrap' && !statsPopped && !motionOff()) {
        statsPopped = true;
        document.querySelectorAll('#screen-wrap .xp-stat').forEach(function (el, i) {
          setTimeout(function () { el.classList.add('skin-in'); }, 120 + i * 90);
        });
      }
    };
  }

  /* run after lesson inline scripts (they also wait for DOMContentLoaded;
     we queue behind them with a 0-timeout so our wrap sees their overrides) */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { setTimeout(init, 0); });
  } else {
    setTimeout(init, 0);
  }
})();
/* end /lesson-shell-v4-skin.js */
