// api/mark-lesson.js — SciSpark ray_diagram deterministic marker
// Vercel serverless function — POST /api/mark-lesson
// Called by lesson-shell when rd:submit fires (Phase 2 server marking).
// No LLM. No AI. Exact-match only.
// Spec: api_mark_extension_for_ray_diagram.md §3-§8

'use strict';

const fs   = require('fs');
const path = require('path');
const ParticleMarkCore = require('../public/components/particle-mark-core.js'); // shared widget/server marking core

// =============================================================
// CONFIG CACHE — avoids repeated fs reads on warm instances
// =============================================================
const configCache = new Map();

// =============================================================
// HELPERS
// =============================================================
function buildReasoning(lineCorrect, dirCorrect) {
  if (lineCorrect && dirCorrect)  return 'Both line and direction correct.';
  if (lineCorrect)                return 'Line correct, direction wrong.';
  if (dirCorrect)                 return 'Direction correct, line wrong.';
  return 'Both line and direction wrong.';
}

function loadRayConfig(questionId) {
  if (configCache.has(questionId)) return configCache.get(questionId);

  const filePath = path.join(process.cwd(), 'ray-configs', questionId + '.json');

  let raw;
  try {
    raw = fs.readFileSync(filePath, 'utf8');
  } catch (e) {
    const err = new Error('Config not found for ' + questionId);
    err.statusCode = 500;
    err.alert = true;
    throw err;
  }

  let config;
  try {
    config = JSON.parse(raw);
  } catch (e) {
    const err = new Error('Malformed config for ' + questionId);
    err.statusCode = 500;
    err.alert = true;
    throw err;
  }

  // Structural validation
  if (!config.correct_line || !config.correct_direction || !config.marks || !config.feedback_routing) {
    const err = new Error('Incomplete config for ' + questionId);
    err.statusCode = 500;
    err.alert = true;
    throw err;
  }
  if (config.marks.line + config.marks.direction !== config.marks.total) {
    const err = new Error('Config marks inconsistent for ' + questionId);
    err.statusCode = 500;
    err.alert = true;
    throw err;
  }

  configCache.set(questionId, config);
  return config;
}

function loadParticleConfig(questionId) {
  const cacheKey = 'particle:' + questionId;
  if (configCache.has(cacheKey)) return configCache.get(cacheKey);

  const filePath = path.join(process.cwd(), 'particle-configs', questionId + '.json');

  let raw;
  try {
    raw = fs.readFileSync(filePath, 'utf8');
  } catch (e) {
    const err = new Error('Config not found for ' + questionId);
    err.statusCode = 500; err.alert = true; throw err;
  }

  let config;
  try {
    config = JSON.parse(raw);
  } catch (e) {
    const err = new Error('Malformed config for ' + questionId);
    err.statusCode = 500; err.alert = true; throw err;
  }

  // Structural validation
  const VALID_STATES = { solid: 1, liquid: 1, gas: 1 };
  if (!VALID_STATES[config.expected_state] || !config.marks || !config.marks.total || !config.feedback_routing) {
    const err = new Error('Incomplete config for ' + questionId);
    err.statusCode = 500; err.alert = true; throw err;
  }

  configCache.set(cacheKey, config);
  return config;
}

// =============================================================
// HANDLER
// =============================================================
module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', 'https://scisparklab.com');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const SUPABASE_URL        = process.env.SUPABASE_URL;
  const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

  const serviceHeaders = {
    'apikey':        SUPABASE_SERVICE_KEY,
    'Authorization': 'Bearer ' + SUPABASE_SERVICE_KEY,
    'Content-Type':  'application/json'
  };

  // ------------------------------------------------------------------
  // 1. Auth — verify parent JWT
  // ------------------------------------------------------------------
  const authHeader = req.headers['authorization'] || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  let parentUserId;
  try {
    const authResp = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
      headers: {
        'apikey':        SUPABASE_SERVICE_KEY,
        'Authorization': 'Bearer ' + token
      }
    });
    if (!authResp.ok) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const authData = await authResp.json();
    parentUserId = authData.id;
    if (!parentUserId) return res.status(401).json({ error: 'Unauthorized' });
  } catch (e) {
    console.error('[mark-lesson] auth fetch error:', e.message);
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // ------------------------------------------------------------------
  // 2. Parse body
  // ------------------------------------------------------------------
  const body = req.body || {};
  const { child_id, question_id, student_submission } = body;

  if (!child_id)      return res.status(400).json({ error: 'Missing child_id' });
  if (!question_id)   return res.status(400).json({ error: 'Missing question_id' });

  // question_id format: alphanumeric + underscore only
  if (!/^[A-Z0-9_]+$/i.test(question_id)) {
    return res.status(400).json({ error: 'Invalid question_id format' });
  }

  if (!student_submission || typeof student_submission !== 'object') {
    return res.status(400).json({ error: 'Missing student_submission' });
  }

  // input_type routes to the right marker; default ray_diagram for back-compat
  const input_type = body.input_type || 'ray_diagram';
  if (input_type !== 'ray_diagram' && input_type !== 'particle_diagram') {
    return res.status(400).json({ error: 'Unsupported input_type' });
  }

  // ------------------------------------------------------------------
  // 3. Child ownership verify — body.child_id must belong to this parent
  // ------------------------------------------------------------------
  try {
    const childResp = await fetch(
      `${SUPABASE_URL}/rest/v1/children?id=eq.${child_id}&parent_id=eq.${parentUserId}&select=id`,
      { headers: serviceHeaders }
    );
    const children = await childResp.json();
    if (!Array.isArray(children) || children.length === 0) {
      return res.status(403).json({ error: 'Forbidden' });
    }
  } catch (e) {
    console.error('[mark-lesson] child ownership check error:', e.message);
    return res.status(500).json({ error: 'Server error during auth' });
  }

  // ==================================================================
  //  PARTICLE DIAGRAM PATH (三态粒子图) — deterministic, server-side
  //  Marking rule: arrangement matches expected_state AND count ≥ min.
  //  Same ParticleMarkCore as the widget, so verdicts are identical.
  // ==================================================================
  if (input_type === 'particle_diagram') {
    let pconfig;
    try {
      pconfig = loadParticleConfig(question_id);
    } catch (e) {
      if (e.alert) console.error('[mark-lesson] CONFIG ALERT:', e.message);
      return res.status(e.statusCode || 500).json({ error: e.message });
    }

    const particles = student_submission.particles;
    const diameter  = student_submission.diameter;
    if (!Array.isArray(particles)) {
      return res.status(400).json({ error: 'Missing particles[]' });
    }

    const verdict = ParticleMarkCore.mark({ particles, diameter }, pconfig);
    const pScore  = verdict.mark;
    const pMax    = verdict.max;
    const pVariant = verdict.correct ? pconfig.feedback_routing.correct
                                     : pconfig.feedback_routing.wrong;

    (async () => {
      try {
        const dbResp = await fetch(`${SUPABASE_URL}/rest/v1/lesson_question_attempts`, {
          method:  'POST',
          headers: { ...serviceHeaders, 'Prefer': 'return=minimal' },
          body: JSON.stringify({
            child_id,
            lesson_id:        null,
            question_id,
            input_type:       'particle_diagram',
            submission:       student_submission,
            score:            pScore,
            max_score:        pMax,
            feedback_variant: pVariant.variant,
            marker:           'particle_v1',
            marked_at:        new Date().toISOString()
          })
        });
        if (!dbResp.ok) console.error('[mark-lesson] DB INSERT error:', await dbResp.text());
      } catch (e) {
        console.error('[mark-lesson] DB INSERT exception:', e.message);
      }
    })();

    return res.status(200).json({
      score:            pScore,
      max_score:        pMax,
      feedback_key:     pVariant.key,
      feedback_variant: pVariant.variant,
      state_detected:   verdict.state_detected,
      count:            verdict.count,
      reasoning:        verdict.reason
    });
  }

  // ==================================================================
  //  RAY DIAGRAM PATH (existing) — line + direction exact-match
  // ==================================================================
  const picked_line      = student_submission.picked_line;
  const picked_direction = student_submission.picked_direction;
  if (!picked_line || typeof picked_line !== 'string' || picked_line.trim() === '') {
    return res.status(400).json({ error: 'Missing picked_line' });
  }
  if (!picked_direction || typeof picked_direction !== 'string' || picked_direction.trim() === '') {
    return res.status(400).json({ error: 'Missing picked_direction' });
  }

  // ------------------------------------------------------------------
  // 4. Load backend config
  // ------------------------------------------------------------------
  let config;
  try {
    config = loadRayConfig(question_id);
  } catch (e) {
    if (e.alert) console.error('[mark-lesson] CONFIG ALERT:', e.message);
    return res.status(e.statusCode || 500).json({ error: e.message });
  }

  // ------------------------------------------------------------------
  // 5. Compute score (deterministic exact-match)
  // ------------------------------------------------------------------
  const lineCorrect = (picked_line      === config.correct_line);
  const dirCorrect  = (picked_direction === config.correct_direction);

  const lineMark = lineCorrect ? config.marks.line      : 0;
  const dirMark  = dirCorrect  ? config.marks.direction : 0;
  const score    = lineMark + dirMark;
  const maxScore = config.marks.total;

  // ------------------------------------------------------------------
  // 6. Pick feedback variant
  // line_only   = line correct, direction wrong ("only line is correct")
  // direction_only = direction correct, line wrong ("only direction is correct")
  // ------------------------------------------------------------------
  let variant;
  if (lineCorrect && dirCorrect)   variant = config.feedback_routing.full;
  else if (lineCorrect)            variant = config.feedback_routing.line_only;
  else if (dirCorrect)             variant = config.feedback_routing.direction_only;
  else                             variant = config.feedback_routing.neither;

  // ------------------------------------------------------------------
  // 7. Write to DB — fire-and-forget (DB failure must NOT break student UX)
  // ------------------------------------------------------------------
  (async () => {
    try {
      const dbResp = await fetch(`${SUPABASE_URL}/rest/v1/lesson_question_attempts`, {
        method:  'POST',
        headers: { ...serviceHeaders, 'Prefer': 'return=minimal' },
        body: JSON.stringify({
          child_id,
          lesson_id:        null,
          question_id,
          input_type:       'ray_diagram',
          submission:       student_submission,
          score,
          max_score:        maxScore,
          feedback_variant: variant.variant,
          marker:           'deterministic_v1',
          marked_at:        new Date().toISOString()
        })
      });
      if (!dbResp.ok) {
        const errText = await dbResp.text();
        console.error('[mark-lesson] DB INSERT error:', errText);
      }
    } catch (e) {
      console.error('[mark-lesson] DB INSERT exception:', e.message);
    }
  })();

  // ------------------------------------------------------------------
  // 8. Return response
  // ------------------------------------------------------------------
  return res.status(200).json({
    score,
    max_score:        maxScore,
    feedback_key:     variant.key,
    feedback_variant: variant.variant,
    reasoning:        buildReasoning(lineCorrect, dirCorrect)
  });
};
