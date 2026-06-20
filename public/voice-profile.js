/* ============================================================
 * /voice-profile.js  (served from /public via vercel rewrite)
 * SciSpark shared VOICE profile — the single source of truth for the
 * 豆豆 read-aloud voice across the whole course.
 *
 * Both the lesson engine (▶ read-aloud buttons) and the doudou companion
 * delegate to window.SciSparkVoice so the entire course speaks in ONE voice.
 * To change the voice or pitch site-wide, edit THIS FILE and nothing else.
 *
 * Free browser voices only (Web Speech API). Voice availability is
 * device-dependent — we pick the softest/highest match per language and
 * fall back gracefully if none exists (never errors).
 * ============================================================ */
(function () {
  'use strict';

  // soft / higher, female-leaning — the "豆豆" voice (names are substrings)
  var SOFT_EN = ['Female','Samantha','Karen','Tessa','Fiona','Moira','Zira',
                 'Aria','Jenny','Susan','Google UK English Female','Google US English'];
  var SOFT_ZH = ['Ting','Mei-Jia','Huihui','Xiaoxiao','Yaoyao','Google','普通话','Chinese'];

  function pick(langCode) {
    langCode = langCode || 'en-US';
    var ss = window.speechSynthesis;
    var voices = (ss && ss.getVoices && ss.getVoices()) || [];
    if (!voices.length) return null;

    var soft = (langCode.indexOf('zh') === 0) ? SOFT_ZH : SOFT_EN;
    function isSoft(x){ for (var i=0;i<soft.length;i++){ if (x.name.indexOf(soft[i]) > -1) return true; } return false; }
    function isNeural(x){ return x.name.indexOf('Google') > -1 || x.name.indexOf('Microsoft') > -1; }
    function find(test){ for (var i=0;i<voices.length;i++){ if (test(voices[i])) return voices[i]; } return null; }
    function lang(x){ return x.lang.indexOf(langCode) === 0; }

    var v;
    v = find(function(x){ return lang(x) && isSoft(x) && isNeural(x); }); if (v) return v; // 1
    v = find(function(x){ return lang(x) && isSoft(x); });               if (v) return v; // 2
    v = find(function(x){ return lang(x) && isNeural(x); });             if (v) return v; // 3
    v = find(function(x){ return lang(x); });                            if (v) return v; // 4
    var main = langCode.split('-')[0];                                                    // 5
    return find(function(x){ return x.lang.indexOf(main) === 0; });
  }

  // speak(utterance, langCode) — apply the soft 豆豆 voice and speak.
  // CRITICAL for mobile: speechSynthesis.getVoices() is empty on the first
  // synchronous call and only fills after 'voiceschanged'. If we speak before
  // it fills, pick() returns null and the device default (often MALE) plays.
  // So if voices aren't ready yet, we wait (voiceschanged + short poll) and
  // speak only once the soft voice can actually be selected. Never throws;
  // worst case (no voices at all) it still speaks in the browser default.
  function speak(u, langCode) {
    var ss = window.speechSynthesis;
    if (!ss || !u) return;
    langCode = langCode || u.lang || 'en-US';
    var spoke = false;
    function go() {
      if (spoke) return true;
      var voices = (ss.getVoices && ss.getVoices()) || [];
      if (!voices.length) return false;      // voices not ready — wait
      spoke = true;
      var v = pick(langCode);
      if (v) u.voice = v;                     // soft 豆豆 voice
      ss.speak(u);
      return true;
    }
    if (go()) return;                         // voices ready → speak now
    try { ss.onvoiceschanged = function () { go(); }; } catch (e) {}
    try { ss.getVoices(); } catch (e) {}      // nudge population
    var tries = 0;
    var iv = setInterval(function () {
      if (go() || ++tries > 20) clearInterval(iv);   // poll up to ~2s
    }, 100);
  }

  // Warm the voice list on load so it is ready by the time the user taps
  // read-aloud (mirrors what the doudou companion did on PR#64).
  try {
    var _ss = window.speechSynthesis;
    if (_ss && _ss.getVoices) {
      _ss.getVoices();
      if ('onvoiceschanged' in _ss && !_ss.onvoiceschanged) {
        _ss.onvoiceschanged = function () { _ss.getVoices(); };
      }
    }
  } catch (e) {}

  // Read-aloud SPEED — 5 selectable steps (slow→fast), centralized here so the
  // full-screen reading bar AND the ▶ buttons share ONE speed scale (插不抄).
  // 2026-06-20: slowed down + 3→5 steps per order. Voice/pitch are UNCHANGED.
  // Slowest 0.30 = ~2× slower than the old slowest (0.6). Default = 0.45 (Slow).
  var RATES = [0.30, 0.45, 0.60, 0.80, 1.00];
  var RATE_DEFAULT_INDEX = 1;                 // 0.45
  var _rate = RATES[RATE_DEFAULT_INDEX];
  function getRate() { return _rate; }
  function setRate(r) { r = parseFloat(r); if (!isNaN(r) && r > 0) _rate = r; return _rate; }

  window.SciSparkVoice = {
    pick: pick,
    speak: speak,
    RATES: RATES,
    RATE_DEFAULT_INDEX: RATE_DEFAULT_INDEX,
    getRate: getRate,
    setRate: setRate,
    // 豆豆 pitch. Short companion bubbles use PITCH; long ▶ passages use PITCH_LONG.
    // If long passages sound cartoonish, lower PITCH_LONG to ~1.1–1.15 (boss to confirm on phone).
    PITCH: 1.22,
    PITCH_LONG: 1.22,
    SOFT_EN: SOFT_EN,
    SOFT_ZH: SOFT_ZH
  };
})();
