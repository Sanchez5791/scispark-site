/* ================================================================
   SciSpark · lesson-shell.js
   Shared JS: language toggle, lesson navigation, mascot bubble,
   AI tutor panel, streak/XP, surprise/unlock modal
   v1 · 2026-05-18
================================================================ */

(function (global) {
  'use strict';

  const SS = {};

  /* ── Language toggle ─────────────────────────────────────────── */
  SS.setLang = function (lang) {
    const root = document.documentElement;
    root.lang = lang === 'zh' ? 'zh' : 'en';

    document.querySelectorAll('[data-en]').forEach(function (el) {
      const txt = el.getAttribute('data-' + lang);
      if (txt !== null && txt !== undefined) {
        el.innerHTML = txt;
      }
    });

    document.querySelectorAll('.lang button').forEach(function (btn) {
      btn.classList.toggle('on', btn.dataset.lang === lang);
    });

    try { localStorage.setItem('scispark-lang', lang); } catch (e) {}
  };

  function initLang() {
    document.querySelectorAll('.lang button').forEach(function (btn) {
      btn.addEventListener('click', function () {
        SS.setLang(btn.dataset.lang);
      });
    });

    let saved = 'en';
    try { saved = localStorage.getItem('scispark-lang') || 'en'; } catch (e) {}
    if (saved === 'zh') SS.setLang('zh');
  }

  /* ── Lesson screen navigation ────────────────────────────────── */
  SS.showScreen = function (n) {
    n = String(n);

    // Hide/show screen panels
    document.querySelectorAll('[data-screen]').forEach(function (el) {
      el.hidden = el.dataset.screen !== n;
    });

    // Update sidebar active state
    document.querySelectorAll('[data-screen-nav]').forEach(function (el) {
      const li = el.closest('li') || el;
      li.classList.toggle('active', el.dataset.screenNav === n);
    });

    // Persist last screen
    try { sessionStorage.setItem('scispark-screen', n); } catch (e) {}
  };

  function initScreenNav() {
    document.querySelectorAll('[data-screen-nav]').forEach(function (el) {
      el.addEventListener('click', function (e) {
        e.preventDefault();
        SS.showScreen(el.dataset.screenNav);
      });
    });

    // Restore last screen on load (lesson pages)
    let last = '1';
    try { last = sessionStorage.getItem('scispark-screen') || '1'; } catch (e) {}
    if (document.querySelector('[data-screen]')) {
      SS.showScreen(last);
    }
  }

  /* ── Mascot bubble ───────────────────────────────────────────── */
  function initMascot() {
    const bubble = document.getElementById('mascot-bubble');
    if (!bubble) return;

    const avatar = bubble.querySelector('.mascot-avatar');
    if (!avatar) return;

    avatar.setAttribute('tabindex', '0');
    avatar.setAttribute('role', 'button');

    avatar.addEventListener('click', function () {
      SS.openTutorPanel();
    });

    avatar.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        SS.openTutorPanel();
      }
    });
  }

  /* ── AI Tutor panel ──────────────────────────────────────────── */
  SS.openTutorPanel = function () {
    const panel = document.getElementById('tutor-panel');
    if (!panel) return;
    panel.classList.add('open');
    const input = panel.querySelector('.tutor-panel-foot input');
    if (input) setTimeout(function () { input.focus(); }, 50);
  };

  SS.closeTutorPanel = function () {
    const panel = document.getElementById('tutor-panel');
    if (panel) panel.classList.remove('open');
  };

  function initTutorPanel() {
    const panel = document.getElementById('tutor-panel');
    if (!panel) return;

    const closeBtn = panel.querySelector('.tutor-panel-close');
    if (closeBtn) {
      closeBtn.addEventListener('click', SS.closeTutorPanel);
    }

    const form = panel.querySelector('.tutor-panel-foot');
    const input = form && form.querySelector('input');
    const sendBtn = form && form.querySelector('button');

    if (sendBtn && input) {
      sendBtn.addEventListener('click', function () {
        handleTutorMessage(input.value.trim(), panel);
        input.value = '';
      });
      input.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          handleTutorMessage(input.value.trim(), panel);
          input.value = '';
        }
      });
    }

    // Close on Escape
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') SS.closeTutorPanel();
    });
  }

  function handleTutorMessage(text, panel) {
    if (!text) return;
    const body = panel.querySelector('.tutor-panel-body');
    if (!body) return;

    // Student bubble
    const studentBubble = document.createElement('div');
    studentBubble.className = 'cbubble student';
    studentBubble.innerHTML = '<span class="who">You</span><p>' + escHtml(text) + '</p>';
    body.appendChild(studentBubble);
    body.scrollTop = body.scrollHeight;

    // Placeholder tutor response (lesson pages will override SS.handleTutorReply)
    if (SS.handleTutorReply) {
      SS.handleTutorReply(text, body);
    }
  }

  /* ── Streak / XP toast ───────────────────────────────────────── */
  SS.showXpToast = function (xp, message) {
    let toast = document.getElementById('xp-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'xp-toast';
      toast.className = 'xp-toast';
      document.body.appendChild(toast);
    }

    toast.innerHTML =
      '<span class="xp-num">+' + xp + '</span>' +
      '<span>' + (message || 'XP earned') + '</span>';

    toast.classList.add('show');
    clearTimeout(toast._timer);
    toast._timer = setTimeout(function () {
      toast.classList.remove('show');
    }, 3000);
  };

  /* ── Surprise / unlock modal ─────────────────────────────────── */
  SS.showUnlockModal = function (opts) {
    opts = opts || {};
    let backdrop = document.getElementById('unlock-modal-backdrop');
    if (!backdrop) {
      backdrop = document.createElement('div');
      backdrop.id = 'unlock-modal-backdrop';
      backdrop.className = 'unlock-modal-backdrop';
      backdrop.innerHTML =
        '<div class="unlock-modal">' +
        '  <div class="unlock-icon">' + (opts.icon || '🌟') + '</div>' +
        '  <h3>' + escHtml(opts.title || 'Unlocked!') + '</h3>' +
        '  <p>' + escHtml(opts.body || '') + '</p>' +
        '  <button class="btn btn-accent" id="unlock-modal-ok">' + escHtml(opts.cta || 'Continue') + '</button>' +
        '</div>';
      document.body.appendChild(backdrop);
    }

    backdrop.classList.add('open');

    const okBtn = backdrop.querySelector('#unlock-modal-ok');
    if (okBtn) {
      okBtn.onclick = function () {
        backdrop.classList.remove('open');
        if (opts.onContinue) opts.onContinue();
      };
    }

    backdrop.addEventListener('click', function (e) {
      if (e.target === backdrop) backdrop.classList.remove('open');
    });
  };

  /* ── Utility ─────────────────────────────────────────────────── */
  function escHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  /* ── Boot ────────────────────────────────────────────────────── */
  function boot() {
    initLang();
    initScreenNav();
    initMascot();
    initTutorPanel();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

  global.SciSpark = SS;

}(window));
