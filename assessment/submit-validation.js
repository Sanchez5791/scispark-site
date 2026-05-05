/* SciSpark Submit Validation v1 — blocks zero-answer submits.
   Hooks submit buttons in capture phase. Safe drop-in for Y7/Y8/Y9.
   Last edited: 2026-05-05 */
(function () {
  'use strict';

  function countAnswered() {
    if (typeof QUESTION_FIELDS !== 'undefined' && typeof readFieldValue === 'function') {
      var n = 0, qids = Object.keys(QUESTION_FIELDS);
      for (var i = 0; i < qids.length; i++) {
        var fields = QUESTION_FIELDS[qids[i]];
        for (var j = 0; j < fields.length; j++) {
          if (readFieldValue(fields[j]) !== null) { n = n + 1; break; }
        }
      }
      return n;
    }
    var groups = new Set();
    document.querySelectorAll('input[type="text"], input[type="number"], textarea').forEach(function (el) {
      if (el.value && el.value.trim()) groups.add(el.name || el.id);
    });
    document.querySelectorAll('input[type="radio"]:checked, input[type="checkbox"]:checked').forEach(function (el) {
      groups.add(el.name);
    });
    return groups.size;
  }

  function validate(e) {
    if (countAnswered() === 0) {
      e.stopImmediatePropagation();
      e.preventDefault();
      alert('You have not answered any questions yet.\n\nPlease answer at least one question before submitting.\n\nYour timer is still running — close this and return to the questions.');
      return false;
    }
  }

  function init() {
    var buttons = [
      document.getElementById('submit-btn'),
      document.getElementById('submit-btn-sm')
    ].filter(Boolean);
    if (buttons.length === 0) {
      console.warn('[submit-validation] No submit button found on this page.');
      return;
    }
    buttons.forEach(function (btn) { btn.addEventListener('click', validate, true); });
    console.log('[submit-validation] Active on ' + buttons.length + ' submit button(s).');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
