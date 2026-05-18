/* ================================================================
   SciSpark · landing.js
   Landing-page JS: gate modal flow, Supabase auth, smooth scroll
   v1 · 2026-05-18
================================================================ */

(function () {
  'use strict';

  /* ── Supabase config ─────────────────────────────────────────── */
  const SUPABASE_URL = 'https://fiffuaoibxeggwxcfvfh.supabase.co';
  const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_OOrhuk8oqIbNLg3Wxo6fzQ_7z4sloBJ';
  let supabaseClient = null;

  function initSupabase() {
    try {
      supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
    } catch (e) {
      console.error('Supabase init failed:', e);
    }
  }

  /* ── Gate modal — 5-step flow ────────────────────────────────── */
  // Step 0: Choose path (Parent / School)
  // Step 1: Social login (Parent)
  // Step 2: Email form (Parent)
  // Step 3: School application form
  // Step 4: School success confirmation

  function initGate() {
    const gate = document.getElementById('gate');
    if (!gate) return;

    const closeBtn = document.getElementById('gate-close');

    const steps = {};
    for (let i = 0; i <= 4; i++) {
      steps[i] = document.getElementById('gate-step-' + i);
    }

    function openGate() {
      gate.classList.add('on');
      document.body.style.overflow = 'hidden';
      showStep(0);
    }

    function closeGate() {
      gate.classList.remove('on');
      document.body.style.overflow = '';
    }

    function showStep(n) {
      Object.values(steps).forEach(function (s) {
        if (s) s.style.display = 'none';
      });
      if (steps[n]) steps[n].style.display = '';
    }

    // Open from any [data-gate] trigger
    document.querySelectorAll('[data-gate="1"]').forEach(function (el) {
      el.addEventListener('click', function (e) {
        e.preventDefault();
        openGate();
      });
    });

    // Close
    if (closeBtn) closeBtn.addEventListener('click', closeGate);
    gate.addEventListener('click', function (e) {
      if (e.target === gate) closeGate();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeGate();
    });

    // Step 0 — path choice
    var btnParent = document.getElementById('btn-parent-path');
    var btnSchool = document.getElementById('btn-school-path');
    if (btnParent) btnParent.addEventListener('click', function () { showStep(1); });
    if (btnSchool) btnSchool.addEventListener('click', function () { showStep(3); });

    // Back buttons
    var back1 = document.getElementById('gate-back-1');
    var back2 = document.getElementById('gate-back-2');
    var back3 = document.getElementById('gate-back-3');
    if (back1) back1.addEventListener('click', function () { showStep(0); });
    if (back2) back2.addEventListener('click', function () { showStep(1); });
    if (back3) back3.addEventListener('click', function () { showStep(0); });

    // Step 1 → email step
    var btnEmailStep = document.getElementById('btn-email-step');
    if (btnEmailStep) btnEmailStep.addEventListener('click', function () { showStep(2); });

    // Google OAuth
    var btnGoogle = document.getElementById('btn-google');
    if (btnGoogle) {
      btnGoogle.addEventListener('click', async function (e) {
        e.preventDefault();
        if (!supabaseClient) {
          alert('Sign-in service unavailable. Please refresh and try again.');
          return;
        }
        try {
          await supabaseClient.auth.signInWithOAuth({
            provider: 'google',
            options: { redirectTo: 'https://scisparklab.com/signup-complete.html' }
          });
        } catch (err) {
          alert('Google sign-in could not start. Please try again.');
          console.error(err);
        }
      });
    }

    // Facebook — not yet connected
    var btnFacebook = document.getElementById('btn-facebook');
    if (btnFacebook) {
      btnFacebook.addEventListener('click', function (e) {
        e.preventDefault();
        alert('Facebook sign-in is not connected yet. Please use Google or email.');
      });
    }

    // Email form submit (Step 2)
    var gateForm = document.getElementById('gate-form');
    if (gateForm) {
      gateForm.addEventListener('submit', async function (e) {
        e.preventDefault();
        const submitBtn = gateForm.querySelector('[type="submit"]');
        if (submitBtn) {
          submitBtn.disabled = true;
          submitBtn.textContent = 'Creating accounts…';
        }
        try {
          await submitParentForm(gateForm);
        } finally {
          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = 'Create accounts &amp; begin assessment <span class="arr">→</span>';
          }
        }
      });
    }

    // School form submit (Step 3)
    var schoolForm = document.getElementById('gate-school-form');
    if (schoolForm) {
      schoolForm.addEventListener('submit', function (e) {
        e.preventDefault();
        showStep(4);
      });
    }

    // School success close
    var btnSchoolDone = document.getElementById('btn-school-done');
    if (btnSchoolDone) btnSchoolDone.addEventListener('click', closeGate);
  }

  async function submitParentForm(form) {
    const inputs = form.querySelectorAll('input, select');
    const data = {};
    inputs.forEach(function (el) {
      if (el.name) data[el.name] = el.value;
    });

    const emailInput = form.querySelector('input[type="email"]');
    const emailVal = emailInput ? emailInput.value.trim() : '';

    if (!supabaseClient || !emailVal) {
      window.location.href = 'https://scisparklab.com/signup-complete.html';
      return;
    }

    try {
      const { error } = await supabaseClient.auth.signInWithOtp({
        email: emailVal,
        options: { emailRedirectTo: 'https://scisparklab.com/signup-complete.html' }
      });
      if (error) throw error;
      alert('Check your email — we sent a sign-in link to ' + emailVal);
    } catch (err) {
      console.error('Email OTP error:', err);
      alert('Could not send sign-in link. Please try Google sign-in or contact support.');
    }
  }

  /* ── Smooth scroll for nav links ─────────────────────────────── */
  function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(function (link) {
      link.addEventListener('click', function (e) {
        const id = link.getAttribute('href').slice(1);
        if (!id) return;
        const target = document.getElementById(id);
        if (target) {
          e.preventDefault();
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      });
    });
  }

  /* ── Ribbon dismiss (optional UX) ────────────────────────────── */
  function initRibbon() {
    const ribbon = document.getElementById('ribbon');
    if (!ribbon) return;
    ribbon.style.cursor = 'default';
  }

  /* ── Hero device — option selection ─────────────────────────── */
  function initHeroDevice() {
    document.querySelectorAll('.qopt').forEach(function (opt) {
      opt.addEventListener('click', function () {
        document.querySelectorAll('.qopt').forEach(function (x) { x.classList.remove('sel'); });
        opt.classList.add('sel');
      });
    });
  }

  /* ── Support bot reply stub ──────────────────────────────────── */
  // UI-only for v1. Real backend (email/ticket system) is v3 backlog.
  function initSupportBotReply() {
    if (!window.SciSpark) return;
    window.SciSpark.handleTutorReply = function (text, body) {
      var reply = document.createElement('div');
      reply.className = 'cbubble tutor';
      reply.innerHTML =
        '<span class="who">SciSpark Help</span>' +
        '<p>Thanks for reaching out! A member of our team will get back to you shortly — or email us at <a href="mailto:hello@scisparklab.com">hello@scisparklab.com</a>.</p>';
      body.appendChild(reply);
      body.scrollTop = body.scrollHeight;
    };
  }

  /* ── Boot ────────────────────────────────────────────────────── */
  function boot() {
    initSupabase();
    initGate();
    initSmoothScroll();
    initRibbon();
    initHeroDevice();
    initSupportBotReply();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

}());
