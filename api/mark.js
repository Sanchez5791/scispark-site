// api/mark.js — SciSpark Y7 AI Marking Endpoint
// POST { attempt_id } → fetches answers → calls Claude → stores result

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });

  const { attempt_id } = req.body || {};
  if (!attempt_id) return res.status(400).json({ error: 'attempt_id required' });

  const SB_URL  = process.env.SUPABASE_URL;
  const SB_KEY  = process.env.SUPABASE_SERVICE_KEY;
  const AI_KEY  = process.env.ANTHROPIC_API_KEY;
  if (!SB_URL || !SB_KEY || !AI_KEY) return res.status(500).json({ error: 'Missing env vars' });

  const sbHeaders = {
    'apikey': SB_KEY,
    'Authorization': `Bearer ${SB_KEY}`,
    'Content-Type': 'application/json'
  };

  try {
    // 1. Fetch answers
    const aResp = await fetch(
      `${SB_URL}/rest/v1/assessment_answers?attempt_id=eq.${attempt_id}&select=field_name,answer_value`,
      { headers: sbHeaders }
    );
    const rows = await aResp.json();
    if (!Array.isArray(rows) || rows.length === 0)
      return res.status(404).json({ error: 'No answers found for this attempt' });

    const answers = {};
    rows.forEach(r => { answers[r.field_name] = r.answer_value ?? ''; });

    // 2. Call Claude
    const SYSTEM = `You are the SciSpark Y7 Entry Assessment marker.
Mark a single student submission against the Cambridge mark scheme. Return ONLY valid JSON — no prose, no markdown.

ASSESSMENT: Y7_ENTRY_EN | 60 marks | 64 fields | Parts A(5m) B(15m) C(15m) D(25m)

CONFIRMED ANSWERS:
Q01=frog Q02=ammonium chloride Q03=force meter/newton meter Q04=B Q05=C
Q06=A Q07=photosynthesis/makes own food Q08=any desert adaptation Q11=D Q12=orbit Q13=air resistance/friction/drag Q14=C Q15=B Q16=C Q17=B Q18=B Q19=B
Q20_tick=no Q20_explain=plateau at 45C
Q21a1=direction Q21a2=refraction Q21b1=direction Q21b2=reflection Q21c=light goes straight
Q22a=cm/mm Q22b=faster it falls Q22c=4 Q23d=liquid
Q24a=magnet(1m)+iron is magnetic(1m) Q24b=3 filtration steps(3m) Q24c=evaporated
Q25a=heart Q25b=pumps blood Q27a=60 Q27b=30-40 Q27d=B Q27e=E

POOLS:
pool_q09: Q09_tick(irreversible)+Q09_explain(chemical change) | 1m | both-required
pool_q10: Q10_answer(irreversible)+Q10_explain(new substance) | 1m | both-required
pool_q20: Q20_tick(no)+Q20_explain(plateau) | 1m | both-required
pool_q22d: Q22_d_1+Q22_d_2 | 2m | independent-distinct (different factors, not length of wings)
pool_q23a: Q23_a_carbon_dioxide(gas)+gasoline(liquid)+mercury(liquid)+wood(solid) | 2m | graduated(4=2m,2-3=1m,0-1=0m)
pool_q23b: Q23_b_1(solid)+Q23_b_2(liquid) | 1m | ordered (wrong order=0m)
pool_q23c: Q23_c_1(liquid)+Q23_c_2(gas) | 1m | ordered
pool_q25c: Q25_c_1+Q25_c_2 | 2m | independent-distinct (artery/vein/capillary, different types)
pool_q25d: Q25_d_vessel(E)+Q25_d_explain(highest oxygen 92%) | 2m | independent(1m each)
pool_q26d: Q26_d_temp(50)+Q26_d_explain(results very different) | 2m | independent(1m each)
pool_q26e: Q26_e_mass(13-16g)+Q26_e_explain(temperature increases solubility) | 2m | independent(1m each)
pool_q27c: Q27_c_risk+Q27_c_reduce | 2m | matched-pair(2m if matched,1m if correct but mismatched)

RULES:
1. blank/null → match_type=blank, marks_awarded=0
2. Pool members: one member carries marks, others have marks_awarded=0 and match_type=pooled_member
3. Both-required: BOTH must be correct or pool=0m
4. Ordered: wrong order=0m
5. Graduated Q23a: count correct → 4=2m, 2-3=1m, 0-1=0m
6. Matched-pair Q27c: matched=2m, individually correct but mismatched=1m
7. If confidence<80% set needs_review=true with review_reason
8. Two students with same answers get same marks

OUTPUT (exactly this schema, 64 fields):
{
  "assessment_code":"Y7_ENTRY_EN",
  "student_id":"{{STUDENT_ID}}",
  "marked_at":"<UTC ISO8601>",
  "total_awarded":<0-60>,
  "total_possible":60,
  "part_totals":{"A":{"awarded":<int>,"possible":5},"B":{"awarded":<int>,"possible":15},"C":{"awarded":<int>,"possible":15},"D":{"awarded":<int>,"possible":25}},
  "fields":[{"field_id":"Y7_Q01_answer","student_value":"...","expected":"...","marks_awarded":<int>,"marks_possible":<int>,"match_type":"exact|alternative|semantic|wrong|blank|pooled_member","rationale":"<one sentence>","needs_review":<bool>,"review_reason":<string|null>},...],
  "submission_warnings":[]
}`;

    const userMsg = `Mark this Y7 Entry Assessment submission.

INPUT
-----
{
  "assessment_code": "Y7_ENTRY_EN",
  "student_id": "student",
  "submitted_at": "${new Date().toISOString()}",
  "answers": ${JSON.stringify(answers, null, 2)}
}

Return ONLY the JSON object. No prose. No markdown fences.`;

    const claudeResp = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': AI_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 6000,
        temperature: 0,
        system: SYSTEM,
        messages: [{ role: 'user', content: userMsg }]
      })
    });

    const claudeData = await claudeResp.json();
    if (claudeData.error) throw new Error('Claude error: ' + claudeData.error.message);

    const rawText = claudeData.content
      .filter(c => c.type === 'text')
      .map(c => c.text)
      .join('');

    const clean = rawText.replace(/```json\n?/g,'').replace(/```\n?/g,'').trim();
    const result = JSON.parse(clean);

    // 3. Validate totals
    const sumParts = (result.part_totals?.A?.awarded || 0)
      + (result.part_totals?.B?.awarded || 0)
      + (result.part_totals?.C?.awarded || 0)
      + (result.part_totals?.D?.awarded || 0);
    if (sumParts !== result.total_awarded)
      throw new Error(`Totals mismatch: parts=${sumParts} total=${result.total_awarded}`);

    const needsReview = Array.isArray(result.fields) && result.fields.some(f => f.needs_review);

    // 4. Store result
    const storeResp = await fetch(
      `${SB_URL}/rest/v1/assessment_marking_results`,
      {
        method: 'POST',
        headers: { ...sbHeaders, 'Prefer': 'return=representation' },
        body: JSON.stringify({
          attempt_id,
          total_awarded: result.total_awarded,
          total_possible: 60,
          part_a_awarded: result.part_totals.A.awarded,
          part_b_awarded: result.part_totals.B.awarded,
          part_c_awarded: result.part_totals.C.awarded,
          part_d_awarded: result.part_totals.D.awarded,
          fields_json: result.fields,
          submission_warnings: result.submission_warnings || [],
          needs_teacher_review: needsReview,
          raw_ai_response: rawText,
          marker_version: 'Vol03_v3'
        })
      }
    );

    const stored = await storeResp.json();

    // 5. Update attempt status
    await fetch(
      `${SB_URL}/rest/v1/assessment_attempts?id=eq.${attempt_id}`,
      {
        method: 'PATCH',
        headers: sbHeaders,
        body: JSON.stringify({
          teacher_review_status: needsReview ? 'flagged' : 'pending'
        })
      }
    );

    return res.status(200).json({
      success: true,
      attempt_id,
      total_awarded: result.total_awarded,
      needs_review: needsReview,
      result_id: stored[0]?.id
    });

  } catch (err) {
    console.error('[SciSpark Mark]', err);
    return res.status(500).json({ error: err.message });
  }
}
