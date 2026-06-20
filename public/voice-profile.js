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

  window.SciSparkVoice = {
    pick: pick,
    // 豆豆 pitch. Short companion bubbles use PITCH; long ▶ passages use PITCH_LONG.
    // If long passages sound cartoonish, lower PITCH_LONG to ~1.1–1.15 (boss to confirm on phone).
    PITCH: 1.22,
    PITCH_LONG: 1.22,
    SOFT_EN: SOFT_EN,
    SOFT_ZH: SOFT_ZH
  };
})();
