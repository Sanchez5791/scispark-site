/*
  Node self-test for particle-mark-core.js
  Run: node demos/test-particle-mark.js
  Builds synthetic solid / liquid / gas arrangements and checks the classifier
  + the full mark() verdict against the factory rule (arrangement + count≥6).
*/
'use strict';
var core = require('../public/components/particle-mark-core.js');

var DIA = 30; // particle diameter in px (widget will report its own)
var pass = 0, fail = 0;
function ok(name, cond, extra) {
  if (cond) { pass++; console.log('  ok  - ' + name); }
  else { fail++; console.log('  FAIL- ' + name + (extra ? '  ' + JSON.stringify(extra) : '')); }
}

// deterministic pseudo-jitter (no Math.random → reproducible test)
var seed = 7;
function rnd() { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; }
function jit(a) { return (rnd() * 2 - 1) * a; }

// ── SOLID: regular 4×3 lattice, touching (spacing ≈ 1 diameter) ──
function solid(n) {
  var pts = [], cols = 4, i = 0;
  for (var r = 0; i < n; r++) for (var c = 0; c < cols && i < n; c++, i++)
    pts.push({ x: 100 + c * DIA, y: 100 + r * DIA });
  return pts;
}
// ── LIQUID: touching but jittered (irregular spacing) ──
function liquid(n) {
  var pts = [], cols = 4, i = 0;
  for (var r = 0; i < n; r++) for (var c = 0; c < cols && i < n; c++, i++)
    pts.push({ x: 100 + c * DIA + jit(DIA * 0.5), y: 100 + r * DIA + jit(DIA * 0.5) });
  return pts;
}
// ── GAS: spread far apart (≈ 3 diameters spacing) + jitter ──
function gas(n) {
  var pts = [], cols = 4, i = 0, gap = DIA * 3;
  for (var r = 0; i < n; r++) for (var c = 0; c < cols && i < n; c++, i++)
    pts.push({ x: 60 + c * gap + jit(DIA), y: 60 + r * gap + jit(DIA) });
  return pts;
}

console.log('classify:');
ok('solid → solid',   core.classify({ particles: solid(9),  diameter: DIA }).state === 'solid',  core.classify({ particles: solid(9),  diameter: DIA }));
ok('liquid → liquid', core.classify({ particles: liquid(9), diameter: DIA }).state === 'liquid', core.classify({ particles: liquid(9), diameter: DIA }));
ok('gas → gas',       core.classify({ particles: gas(9),    diameter: DIA }).state === 'gas',    core.classify({ particles: gas(9),    diameter: DIA }));

console.log('mark() — expected_state gates correctness:');
ok('solid drawing, expect solid → correct, mark 1',
   (function () { var v = core.mark({ particles: solid(9), diameter: DIA }, { expected_state: 'solid' }); return v.correct && v.mark === 1; })());
ok('liquid drawing, expect solid → wrong',
   core.mark({ particles: liquid(9), diameter: DIA }, { expected_state: 'solid' }).correct === false);
ok('gas drawing, expect gas → correct',
   core.mark({ particles: gas(9), diameter: DIA }, { expected_state: 'gas' }).correct === true);

console.log('count rule (≥6):');
ok('solid arrangement but only 4 particles → wrong (count)',
   (function () { var v = core.mark({ particles: solid(4), diameter: DIA }, { expected_state: 'solid' }); return v.correct === false && /too few/.test(v.reason); })());
ok('exactly 6 correct arrangement → correct',
   core.mark({ particles: solid(6), diameter: DIA }, { expected_state: 'solid' }).correct === true);

console.log('config override (min_particles):');
ok('min_particles:8 → 6 particles now wrong',
   core.mark({ particles: solid(6), diameter: DIA }, { expected_state: 'solid', min_particles: 8 }).correct === false);

console.log('\n' + pass + ' passed, ' + fail + ' failed');
process.exit(fail ? 1 : 0);
