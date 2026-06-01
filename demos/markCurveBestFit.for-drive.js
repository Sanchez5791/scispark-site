// =============================================================
// markCurveBestFit — block ⑤ marker for graph_type "curve_best_fit"
// HANDOFF: paste this function into graph-marker.js (Google Drive).
// Mirrors markQ26Graph / markQ28Graph verdict shape: { mark, reason, needs_teacher }.
//
// studentCurveRaw : the student's "{prefix}_curve_best_fit" value — a JSON string
//                   of [{x,y},...] sampled points (what the JSXGraph curve widget emits).
// cfg             : the question config (expected_curve, curve_tolerance,
//                   min_fraction_in_band, require_decreasing).
//
// Logic is identical to the verified widget grader in jsxgraph-curve-widget.html.
// =============================================================
function markCurveBestFit(studentCurveRaw, cfg) {
  var result = { mark: 0, reason: '', needs_teacher: false };

  // —— no data → teacher (same policy as markQ26Graph) ——
  if (!studentCurveRaw || studentCurveRaw === '[]' || studentCurveRaw === '') {
    result.needs_teacher = true;
    result.reason = 'No curve data captured — teacher review required';
    return result;
  }

  var curve;
  try { curve = JSON.parse(studentCurveRaw); }
  catch (e) {
    result.needs_teacher = true;
    result.reason = 'Malformed curve JSON — teacher review required';
    return result;
  }
  if (!Array.isArray(curve) || curve.length < 2) {
    result.needs_teacher = true;
    result.reason = 'Too few curve points — teacher review required';
    return result;
  }

  var tol        = cfg.curve_tolerance;
  var minFrac    = (cfg.min_fraction_in_band != null) ? cfg.min_fraction_in_band : 0.8;
  var requireDec = (cfg.require_decreasing === true);

  // interpolate the student's y at a given x from the sampled curve
  function yAt(xq) {
    if (xq < curve[0].x || xq > curve[curve.length - 1].x) return null;
    for (var i = 0; i < curve.length - 1; i++) {
      var A = curve[i], B = curve[i + 1];
      if (xq >= A.x && xq <= B.x) {
        var t = (xq - A.x) / ((B.x - A.x) || 1e-9);
        return A.y + t * (B.y - A.y);
      }
    }
    return curve[curve.length - 1].y;
  }

  var exp = cfg.expected_curve;
  var inBand = 0, drawnYs = [];
  for (var i = 0; i < exp.length; i++) {
    var y = yAt(exp[i].x);
    if (y === null) continue;            // student didn't draw over this x
    drawnYs.push(y);
    if (Math.abs(y - exp[i].y) <= tol) inBand++;
  }
  var frac = inBand / exp.length;

  // shape check: consistently decreasing. Wobble allowance = tol, because a real
  // hand-drawn flat tail wobbles by ~a tolerance band; only a jump > tol counts as "going up".
  var decreasing = true;
  for (var j = 1; j < drawnYs.length; j++) {
    if (drawnYs[j] > drawnYs[j - 1] + tol) { decreasing = false; break; }
  }

  var shapeOk = frac >= minFrac && (!requireDec || decreasing);
  if (shapeOk) {
    result.mark = 1;
    result.reason = inBand + '/' + exp.length + ' sample points within ±' + tol +
                    ' (' + Math.round(frac * 100) + '%)';
  } else if (requireDec && !decreasing) {
    result.reason = 'Curve not consistently decreasing — wrong shape';
  } else {
    result.reason = 'Only ' + inBand + '/' + exp.length + ' points within tolerance (' +
                    Math.round(frac * 100) + '%, need ' + Math.round(minFrac * 100) + '%)';
  }
  return result;
}

// node export for the test below (DELETE this line when pasting into graph-marker.js if it already has its own exports)
if (typeof module !== 'undefined' && module.exports) module.exports = { markCurveBestFit: markCurveBestFit };

// =============================================================
// SELF-TEST — run: node markCurveBestFit.for-drive.js
// =============================================================
if (typeof require !== 'undefined' && require.main === module) {
  var cfg = require('../graph-configs/Y9_Q33_curve.json');
  var pass = 0, fail = 0;
  function check(name, got, want) {
    var ok = got === want;
    console.log((ok ? '  ✓ ' : '  ✗ ') + name + '  got=' + got + ' want=' + want);
    ok ? pass++ : fail++;
  }

  // helper: build a sampled curve string the way the widget would
  function sample(fn) {
    var arr = [];
    for (var x = 0; x <= 8.0001; x += 0.5) arr.push({ x: Math.round(x*100)/100, y: Math.round(fn(x)*100)/100 });
    return JSON.stringify(arr);
  }

  console.log('markCurveBestFit tests');

  // 1) correct cooling curve (matches expected within tol)
  var good = sample(function (t) { return 24 + 66 * Math.exp(-0.45 * t); });
  var r1 = markCurveBestFit(good, cfg);
  check('correct cooling curve → mark 1', r1.mark, 1);
  check('correct curve → not teacher', r1.needs_teacher, false);

  // 2) flat wrong line at 55°C
  var flat = sample(function () { return 55; });
  check('flat line → mark 0', markCurveBestFit(flat, cfg).mark, 0);

  // 3) increasing curve (wrong shape, even if it crossed the band)
  var up = sample(function (t) { return 25 + 8 * t; });
  var r3 = markCurveBestFit(up, cfg);
  check('increasing curve → mark 0', r3.mark, 0);
  check('increasing curve → shape reason', /decreasing/.test(r3.reason), true);

  // 4) empty / missing → teacher review
  check('empty data → needs_teacher', markCurveBestFit('', cfg).needs_teacher, true);
  check('"[]" → needs_teacher', markCurveBestFit('[]', cfg).needs_teacher, true);

  // 5) malformed JSON → teacher review (never crash)
  check('garbage JSON → needs_teacher', markCurveBestFit('{not json', cfg).needs_teacher, true);

  // 6) slightly-off-but-in-tolerance curve still passes
  var nearly = sample(function (t) { return 24 + 66 * Math.exp(-0.45 * t) + (t % 2 ? 3 : -3); });
  check('within-tolerance noisy curve → mark 1', markCurveBestFit(nearly, cfg).mark, 1);

  console.log('\nresult: ' + pass + ' passed, ' + fail + ' failed');
  if (fail) process.exit(1);
}
