// api/mark.js — SciSpark Y7 AI Marking Endpoint (V3 + V4 routing)
// Vercel serverless function
// Called by Supabase webhook when new assessment_attempt is inserted
// 2026-05-01 — Updated to support both Y7_ENTRY_EN (v3, 27q) and
//              Y7_ENTRY_EN_V4 (v4, 32q)
//
// Routing logic:
//   assessment_code == "Y7_ENTRY_EN"    → v3 package (claude-sonnet-4)
//   assessment_code == "Y7_ENTRY_EN_V4" → v4 package (claude-haiku-4-5)
//   anything else                       → 200 with skip message
//
// DO NOT remove v3 — old HTML still live on main branch.

// =============================================================
// V3 SYSTEM PROMPT — DO NOT MODIFY (used by old 27-question HTML)
// =============================================================
const SYSTEM_PROMPT_V3 = `You are the SciSpark Y7 Entry Assessment marker.

Your job: mark a single student's submission against the official Cambridge mark scheme and return a structured JSON result. Be fair, consistent, and follow the rules exactly.

ASSESSMENT METADATA
- assessment_code: Y7_ENTRY_EN
- total_marks: 60, total_questions: 27, total_fields: 64
- Part A (5m Q01-Q05) Part B (15m Q06-Q20) Part C (15m Q21-Q23) Part D (25m Q24-Q27)

CONFIRMED ANSWERS (Vol 01 v3):
Q01=frog Q02=ammonium chloride Q03=force meter/newton meter/spring balance Q04=B Q05=C
Q06=A Q07=must reference photosynthesis/making own food (reject positional) Q08=any desert survival adaptation
Q09 COMPOUND pool_q09 both-required 1m: tick=irreversible + explain=chemical change/cannot be undone
Q10 COMPOUND pool_q10 both-required 1m: tick=irreversible + explain=new substance/cannot be reversed
Q11=D Q12=orbit Q13=air resistance/friction/drag Q14=C Q15=B Q16=C Q17=B Q18=B Q19=B
Q20 COMPOUND pool_q20 both-required 1m: tick=no + explain=temperature plateaus at 45C
Q21a1=direction Q21a2=refraction Q21b1=direction Q21b2=reflection Q21c=light ray remains straight/does not bend
Q22a=cm or mm Q22b=faster it falls Q22c=4 Q22d=two DIFFERENT factors from{paperclips,mass,material,wind,drop height,wing shape,wing number} reject length-of-wings
Q23a GRADUATED pool_q23a 2m: carbon_dioxide=gas gasoline=liquid mercury=liquid wood=solid. 4correct=2m 2-3=1m 0-1=0m
Q23b ORDERED pool_q23b 1m: solid to liquid (wrong order=0m)
Q23c ORDERED pool_q23c 1m: liquid to gas (wrong order=0m)
Q23d=liquid (copper at 2000C between mp 1083C and bp 2567C)
Q24a 2m: magnet method(1m)+iron is magnetic reason(1m)
Q24b 3m: pour through filter paper(1m)+chalk caught on paper(1m)+KCl solution passes through(1m)
Q24c=evaporated/boiled off
Q25a=heart Q25b=pumps blood
Q25c pool_q25c independent-distinct 2m: two DIFFERENT vessels from{artery,vein,capillary} duplicate=1m
Q25d pool_q25d independent 2m: vessel=E(1m)+explain=highest oxygen 92%(1m)
Q26a=thermometer Q26b=balance/scales Q26c=fair test/control variable
Q26d pool_q26d independent 2m: temp=50(1m)+explain=two results very different 8.0 vs 2.0(1m)
Q26e pool_q26e independent 2m: mass=13-16g(1m)+explain=temperature increases solubility(1m)
Q27a=60 Q27b=30-40g (~35)
Q27c pool_q27c matched-pair 2m: risk(1m)+reduction(1m) matched=2m mismatched=1m. risks:{hot oven/burns,steam,glass break} reductions:{gloves,tongs,goggles,cool first}
Q27d=B Q27e=E

POOL TABLE:
pool_q09: Q09_tick+Q09_explain|1m|both-required
pool_q10: Q10_answer+Q10_explain|1m|both-required
pool_q20: Q20_tick+Q20_explain|1m|both-required
pool_q22d: Q22_d_1+Q22_d_2|2m|independent-distinct
pool_q23a: Q23_a_carbon_dioxide+Q23_a_gasoline+Q23_a_mercury+Q23_a_wood|2m|graduated
pool_q23b: Q23_b_1+Q23_b_2|1m|both-required-ordered
pool_q23c: Q23_c_1+Q23_c_2|1m|both-required-ordered
pool_q25c: Q25_c_1+Q25_c_2|2m|independent-distinct
pool_q25d: Q25_d_vessel+Q25_d_explain|2m|independent
pool_q26d: Q26_d_temp+Q26_d_explain|2m|independent
pool_q26e: Q26_e_mass+Q26_e_explain|2m|independent
pool_q27c: Q27_c_risk+Q27_c_reduce|2m|matched-pair

OUTPUT FORMAT: Return ONLY valid JSON, no prose, no markdown.
{
  "assessment_code":"Y7_ENTRY_EN",
  "student_id":"<id>",
  "marked_at":"<UTC ISO8601>",
  "total_awarded":<0-60>,
  "total_possible":60,
  "part_totals":{"A":{"awarded":<int>,"possible":5},"B":{"awarded":<int>,"possible":15},"C":{"awarded":<int>,"possible":15},"D":{"awarded":<int>,"possible":25}},
  "fields":[<exactly 64 field objects>],
  "submission_warnings":[]
}
Each field: {"field_id":"Y7_Q01_answer","student_value":"...","expected":"...","marks_awarded":<int>,"marks_possible":<int>,"match_type":"exact|alternative|semantic|wrong|blank|pooled_member","rationale":"<one sentence>","needs_review":<bool>,"review_reason":<string|null>}
CONSTRAINTS: fields must contain EXACTLY 64 entries. total_awarded=sum of all part totals. Pool members: only ONE member carries awarded marks; others get marks_awarded=0 and match_type="pooled_member".`;

// =============================================================
// V4 SYSTEM PROMPT — NEW (used by 32-question HTML on b4 branch)
// Aligned with Vol 01 v4, Vol 02 v4 (revised), Vol 03 v4 (revised)
// =============================================================
const SYSTEM_PROMPT_V4 = `You are the SciSpark Y7 Entry Assessment marker (V4).

Your job: mark a single student's submission against the official Cambridge mark scheme and return a structured JSON result. Be fair, consistent, and follow the rules exactly.

ASSESSMENT METADATA
- assessment_code: Y7_ENTRY_EN_V4
- total_marks: 60, total_questions: 32, total_fields: 62
- Part A (10m, 10×1m QA1-QA10) Vocabulary MCQ
- Part B (15m, 15×1m QB1-QB15) Core Concepts MCQ
- Part C (15m, QC1=5m + QC2=5m + QC3=5m) Data & Experiment
- Part D (20m, QD1=5m + QD2=5m + QD3=5m + QD4=5m) Extended Response

CONFIRMED ANSWERS (Vol 01 v4):

PART A — Vocabulary MCQ (full option text, case-insensitive):
QA1=food chain (accept food-chain) | QA2=animal | QA3=where they live
QA4=melting | QA5=water | QA6=iron | QA7=iron
QA8=gravity (accept gravitational force) | QA9=Sun (accept the Sun, sun)
QA10=Moon (accept the Moon, moon)

PART B — Core Concepts MCQ:
QB1=cheetah | QB2=only meat | QB3=rock
QB4=thick layer of fat (accept fat layer, blubber) | QB5=oxygen
QB6=melting ice | QB7=copper | QB8=plastic | QB9="4" (accept "four")
QB10=add another cell | QB11=friction
QB12=vibrates (accept vibrate, vibrating)
QB13=the Earth spins on its axis (accept Earth rotates on its axis)
QB14=1 year (accept "one year") | QB15=Jupiter

PART C:

QC1 Oliver Chemical Reaction (5×1m):
  QC1_a = measuring cylinder (accept graduated cylinder, measuring jug;
          reject beaker, thermometer, balance, ruler)
  QC1_b = uniform/even temperature (accept "to mix evenly", "consistent reading",
          "to distribute heat evenly"; "to mix" alone without temp context → needs_review)
  QC1_c = "blue to brown" — BOTH COLOURS IN ORDER REQUIRED.
          Single colour alone = 0m. Wrong order ("brown to blue") = 0m.
  QC1_d = gas/bubbles (accept effervescence, fizzing, gas given off;
          reject "colour change" alone)
  QC1_f = decreasing (accept dropping, falls, gets lower, reducing)

QC2 Blessy Bacteria & Acid Investigation (4 indep + pool_qc2c = 5m):
  CONTEXT: Investigation tests TYPES OF ACID killing bacteria.
           IV = type of acid. DV = bacteria growth.
           Do NOT use disinfectant context.
  QC2_a_1 + QC2_a_2 = TWO DIFFERENT controlled variables.
    ACCEPT: same amount/number of bacteria, same nutrients/food, same temperature,
            same time, same dish size, same type of bacteria, warm place
    REJECT: type of acid (IV), amount of bacteria growth (DV)
    DUPLICATE rule: if a_1 and a_2 state the same underlying variable
    (strip "same" and compare), award 1m total for the pair, not 2m.
  QC2_b_risk = any biological/chemical lab risk.
    ACCEPT: bacteria spread/harmful, infection, pathogens, acid spill/burn/corrosive,
            dishes/glassware could break, broken glass risk
    REJECT: experiment might fail, results might be wrong, getting wet
  QC2_b_reduce = any safety measure. SCORED INDEPENDENTLY from b_risk.
    ACCEPT: wash hands, wear gloves, wear goggles (Cambridge MS explicitly accepts),
            wear lab coat, wear PPE, handle acid carefully, use tongs/forceps,
            seal dishes, dispose carefully, sterilise equipment
    REJECT: be careful (vague), work faster, be more precise (vague)
    If risk and reduce are mismatched (e.g. bacteria-risk + goggles-reduce),
    still award 1m each but flag needs_review.
  pool_qc2c (1m, both-required): W=top-left + A=bottom-centre.
    Variants: W="top left"; A="bottom center"/"bottom centre"/"bottom middle".
    Either wrong = 0m for both fields. Mark-holder = QC2_c_W.

QC3 Planets Mass/Weight (5×1m):
  QC3_a_mass = ACCEPT kg, kilogram, kilograms, AND g, gram, grams.
               REJECT N, newtons, m, lb. Vol 01 explicitly accepts grams.
  QC3_a_weight = N (case-aware). ACCEPT capital N, Newton, Newtons, newton, newtons.
                 REJECT lowercase "n" alone, kg, g.
  QC3_b = "No" + REASON REQUIRED. ACCEPT: no/mass does not change/mass is constant
          /mass is the amount of matter (and that doesn't change). REJECT: "no" alone (0m); yes (0m); weight changes.
  QC3_c = 160 (accept "160", "160 N", "160N", "160 newtons"). Calc: Y=80N/10kg=8N/kg → Z=2×8=16 → 10×16=160N.
  QC3_d = 10 (accept "10", "10 kg", "10kg"). Calc: mass=100/10=10 kg.

PART D:

QD1 Gennaro 4 Mixtures (5×1m):
  MIXTURE IDENTITIES:
    A = oil + water (immiscible — does not mix)
    B = salt + water (true solution)
    C = bicarbonate + vinegar (CHEMICAL REACTION — irreversible)
    D = sugar + water (true solution)
  QD1_a = C (which is irreversible). REJECT A, B, D.
  QD1_b = chemical reaction / new substance formed.
          REJECT "it bubbled" alone (observation, not explanation).
  QD1_c = evaporation (accept evaporate, heat to evaporate, boil the water).
          REJECT filtration (salt is dissolved).
  QD1_d = layers form / oil floats / they don't mix / immiscible.
          REJECT "they dissolve", "they react".
  QD1_e = BOTH B AND D required (which are SOLUTIONS).
          One alone = 0m. Question is "which are SOLUTIONS" not "filterable".

QD2 Particle Diagrams (5×1m):
  Image: A=top(solid), B=middle(liquid), C=bottom(gas) — labels via CSS only.
  QD2_a=A | QD2_b=B | QD2_c=C | QD2_d=solid | QD2_e=gas

QD3 Sofia Circuit (5×1m) — 4 DIFFERENT MODIFICATIONS, READ CAREFULLY:
  QD3_a_1: ANOTHER LAMP added in series → "dimmer" (voltage shared between lamps).
  QD3_a_2: WIRE 5x LONGER → "dimmer" (more wire resistance, NOT about lamps).
  QD3_b: WIRE MUCH THICKER → "brighter" (less wire resistance, NOT about lamps).
 QD3_c: ONE LAMP REMOVED → "all lamps go out". [CORRECTED — Cambridge 2012 P2 Q2 MS]
        Removing lamp BREAKS the series circuit (no bypass contacts in lamp holder).
        No current flows → ALL lamps go out.
        REJECT "brighter" — this was WRONG. REJECT "stays the same".
        ACCEPT: "all lamps go out" | "lamps go out" | "lamps turn off" | "no lamps light".
QD3_d: EXPLAIN WHY lamps go out. [CORRECTED]
        ACCEPT: circuit is broken | circuit is not complete | circuit has a gap |
                current cannot flow | circuit is open.
        REJECT: "circuit is still complete" (WRONG).
        REJECT: "more current" / "less resistance" / "brighter" (WRONG — old answer).

QD4 Samir Kite (pool_qd4a + 3 indep = 5m):
  ARROWS: A=upward (lift), B=horizontal (wind), C=downward (gravity/weight).
  pool_qd4a (2m, graduated-3): gravity=C, lift=A, wind=B.
    3 correct → 2m | 2 correct → 1m | 0 or 1 correct → 0m.
    Mark-holder = QD4_a_gravity.
    If 0m AND any field has valid letter (A/B/C) → needs_review (possible label mismatch).
  QD4_b = BOTH A AND C required (geometric opposite directions: A=up, C=down).
          One alone = 0m. NOT about equilibrium/balanced forces.
  QD4_c = increases (lift increases when wind blows harder).
  QD4_d = gravity / weight (heavier object → which force INCREASES).
          ACCEPT gravitational force, downward force, pull of Earth.
          REJECT friction, wind, lift, air resistance, tension.

POOL TABLE:
pool_qc2c | QC2_c_W + QC2_c_A | 1m | both-required | mark-holder=QC2_c_W
pool_qd4a | QD4_a_gravity + QD4_a_lift + QD4_a_wind | 2m | graduated-3 | mark-holder=QD4_a_gravity

GLOBAL RULES:
- MCQ fields: case-insensitive exact match against full option text.
- Free text: case-insensitive, whitespace tolerant, semantic match for sentences.
- Spelling tolerance: phonetic accept unless misspelling collides with another science term.
- Blank/null/whitespace-only = match_type "blank", marks_awarded=0.
- Case-aware: "N" for newton must be CAPITAL (Cambridge MS: do not accept "n").
- Confidence < 80% on any field → needs_review=true with clear review_reason.

OUTPUT FORMAT: Return ONLY valid JSON. No prose. No markdown fences.
{
  "assessment_code":"Y7_ENTRY_EN_V4",
  "student_id":"<id>",
  "marked_at":"<UTC ISO8601>",
  "total_awarded":<0-60>,
  "total_possible":60,
  "part_totals":{
    "A":{"awarded":<int>,"possible":10},
    "B":{"awarded":<int>,"possible":15},
    "C":{"awarded":<int>,"possible":15},
    "D":{"awarded":<int>,"possible":20}
  },
  "fields":[<exactly 62 field objects>],
  "submission_warnings":[]
}
Each field: {"field_id":"Y7_QA1_answer","student_value":"...","expected":"...","marks_awarded":<int>,"marks_possible":<int>,"match_type":"exact|alternative|semantic|wrong|blank|pooled_member|malformed_input","rationale":"<one sentence>","needs_review":<bool>,"review_reason":<string|null>}

CONSTRAINTS:
- fields must contain EXACTLY 62 entries.
- total_awarded = sum of all part_totals[X].awarded.
- Pool members: ONE member carries awarded marks; others get marks_awarded=0 with match_type="pooled_member".
- pool_qc2c mark-holder = Y7_QC2_c_W_answer.
- pool_qd4a mark-holder = Y7_QD4_a_gravity_answer.`;

// =============================================================
// PACKAGE REGISTRY
// =============================================================
const PACKAGES = {
  'Y7_ENTRY_EN': {
    code: 'Y7_ENTRY_EN',
    total_marks: 60,
    total_fields: 64,
    parts: { A: 5, B: 15, C: 15, D: 25 },
    system_prompt: SYSTEM_PROMPT_V3,
    model: 'claude-sonnet-4-20250514',
    max_tokens: 4000,
    marker_version: 'Vol03_v3'
  },
  'Y7_ENTRY_EN_V4': {
    code: 'Y7_ENTRY_EN_V4',
    total_marks: 60,
    total_fields: 62,
    parts: { A: 10, B: 15, C: 15, D: 20 },
    system_prompt: SYSTEM_PROMPT_V4,
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 8000,
    marker_version: 'Vol03_v4'
  }
};

// =============================================================
// HELPER: strip markdown fences from Claude response
// =============================================================
function extractJson(rawText) {
  let text = (rawText || '').trim();
  // Strip leading ```json or ```
  text = text.replace(/^```(?:json)?\s*\n?/i, '');
  // Strip trailing ```
  text = text.replace(/\n?```\s*$/i, '');
  return text.trim();
}

// =============================================================
// HANDLER
// =============================================================
module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', 'https://scisparklab.com');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-webhook-secret');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
  const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
  const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET;

  if (WEBHOOK_SECRET && req.headers['x-webhook-secret'] !== WEBHOOK_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  let attempt_id;
  try {
    const body = req.body;
    attempt_id = body.attempt_id || body.record?.id;
    if (!attempt_id) throw new Error('No attempt_id');
  } catch {
    return res.status(400).json({ error: 'attempt_id required' });
  }

  const headers = {
    'apikey': SUPABASE_SERVICE_KEY,
    'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
    'Content-Type': 'application/json'
  };

  try {
    // 1. Fetch attempt
    const ar = await fetch(
      `${SUPABASE_URL}/rest/v1/assessment_attempts?id=eq.${attempt_id}&select=*`,
      { headers }
    );
    const attempts = await ar.json();
    if (!attempts.length) return res.status(404).json({ error: 'Attempt not found' });
    const attempt = attempts[0];

    // 2. Route by assessment_code
    const pkg = PACKAGES[attempt.assessment_code];
    if (!pkg) {
      return res.status(200).json({
        message: `Skipped: assessment_code "${attempt.assessment_code}" not yet supported`,
        supported: Object.keys(PACKAGES)
      });
    }

    // 3. Idempotency check
    const er = await fetch(
      `${SUPABASE_URL}/rest/v1/assessment_marking_results?attempt_id=eq.${attempt_id}&select=id`,
      { headers }
    );
    const existing = await er.json();
    if (existing.length) {
      return res.status(200).json({ message: 'Already marked', id: existing[0].id });
    }

    // 4. Fetch answers
    const ansr = await fetch(
      `${SUPABASE_URL}/rest/v1/assessment_answers?attempt_id=eq.${attempt_id}&select=field_name,answer_value`,
      { headers }
    );
    const answerRows = await ansr.json();

    const answers = {};
    for (const row of answerRows) {
      answers[row.field_name] = row.answer_value || '';
    }

    // 5. Build user prompt
    const userMsg = `Mark this Y7 Entry Assessment submission.

INPUT
-----
{
  "assessment_code": "${pkg.code}",
  "student_id": "${attempt.student_id}",
  "submitted_at": "${attempt.submitted_at}",
  "answers": ${JSON.stringify(answers, null, 2)}
}

Return ONLY the JSON object. No prose. No markdown fences.`;

    // 6. Call Claude
    const claudeResp = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: pkg.model,
        max_tokens: pkg.max_tokens,
        temperature: 0,
        system: pkg.system_prompt,
        messages: [{ role: 'user', content: userMsg }]
      })
    });

    if (!claudeResp.ok) {
      const errBody = await claudeResp.text();
      throw new Error(`Claude API error ${claudeResp.status}: ${errBody}`);
    }

    const claudeData = await claudeResp.json();
    const rawText = (claudeData.content || [])
      .filter(c => c.type === 'text')
      .map(c => c.text)
      .join('');

    // 7. Parse JSON (with markdown fence stripping)
    let marking;
    try {
      marking = JSON.parse(extractJson(rawText));
    } catch (parseErr) {
      throw new Error(`JSON parse failed: ${parseErr.message}. Raw: ${rawText.slice(0, 200)}`);
    }

    // 8. Validate against package config
    const pt = marking.part_totals || {};
    const calcTotal =
      (pt.A?.awarded || 0) +
      (pt.B?.awarded || 0) +
      (pt.C?.awarded || 0) +
      (pt.D?.awarded || 0);

    if (marking.total_awarded !== calcTotal) {
      throw new Error(`Total mismatch: total_awarded=${marking.total_awarded} vs sum of parts=${calcTotal}`);
    }
    if (marking.total_awarded > pkg.total_marks || marking.total_awarded < 0) {
      throw new Error(`Invalid total: ${marking.total_awarded} (max ${pkg.total_marks})`);
    }

    // Validate per-part bounds
    if ((pt.A?.awarded || 0) > pkg.parts.A) {
      throw new Error(`Part A over: ${pt.A.awarded} > ${pkg.parts.A}`);
    }
    if ((pt.B?.awarded || 0) > pkg.parts.B) {
      throw new Error(`Part B over: ${pt.B.awarded} > ${pkg.parts.B}`);
    }
    if ((pt.C?.awarded || 0) > pkg.parts.C) {
      throw new Error(`Part C over: ${pt.C.awarded} > ${pkg.parts.C}`);
    }
    if ((pt.D?.awarded || 0) > pkg.parts.D) {
      throw new Error(`Part D over: ${pt.D.awarded} > ${pkg.parts.D}`);
    }

    // Field count check (warn-only — don't block storage)
    const fields = marking.fields || [];
    const fieldCountWarning =
      fields.length !== pkg.total_fields
        ? [{ code: 'FIELD_COUNT_MISMATCH', message: `Expected ${pkg.total_fields} fields, got ${fields.length}` }]
        : [];

    const needsReview = fields.some(f => f.needs_review === true);

    // 9. Store result
    const storeResp = await fetch(`${SUPABASE_URL}/rest/v1/assessment_marking_results`, {
      method: 'POST',
      headers: { ...headers, 'Prefer': 'return=representation' },
      body: JSON.stringify({
        attempt_id,
        total_awarded: marking.total_awarded,
        total_possible: pkg.total_marks,
        part_a_awarded: pt.A?.awarded || 0,
        part_b_awarded: pt.B?.awarded || 0,
        part_c_awarded: pt.C?.awarded || 0,
        part_d_awarded: pt.D?.awarded || 0,
        fields_json: fields,
        submission_warnings: [...(marking.submission_warnings || []), ...fieldCountWarning],
        needs_teacher_review: needsReview,
        teacher_review_status: needsReview ? 'flagged' : 'pending',
        raw_ai_response: rawText,
        marker_version: pkg.marker_version
      })
    });

    if (!storeResp.ok) {
      const errBody = await storeResp.text();
      throw new Error(`Supabase store error: ${errBody}`);
    }
    const stored = await storeResp.json();

    return res.status(200).json({
      success: true,
      assessment_code: pkg.code,
      marker_version: pkg.marker_version,
      marking_result_id: stored[0]?.id,
      total_awarded: marking.total_awarded,
      total_possible: pkg.total_marks,
      needs_teacher_review: needsReview
    });

  } catch (err) {
    console.error('[SciSpark mark] Error:', err.message);
    return res.status(500).json({ error: err.message });
  }
};
