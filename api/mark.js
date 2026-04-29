export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });

  const { attempt_id } = req.body || {};
  if (!attempt_id) return res.status(400).json({ error: 'attempt_id required' });

  const SB_URL = process.env.SUPABASE_URL;
  const SB_KEY = process.env.SUPABASE_SERVICE_KEY;
  const AI_KEY = process.env.ANTHROPIC_API_KEY;
  if (!SB_URL || !SB_KEY || !AI_KEY) return res.status(500).json({ error: 'Missing env vars' });

  const sbH = { 'apikey': SB_KEY, 'Authorization': `Bearer ${SB_KEY}`, 'Content-Type': 'application/json' };

  try {
    const aResp = await fetch(`${SB_URL}/rest/v1/assessment_answers?attempt_id=eq.${attempt_id}&select=field_name,answer_value`, { headers: sbH });
    const rows = await aResp.json();
    if (!Array.isArray(rows) || rows.length === 0) return res.status(404).json({ error: 'No answers found' });
    const answers = {};
    rows.forEach(r => { answers[r.field_name] = r.answer_value ?? ''; });

    const claudeResp = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': AI_KEY, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 8000,
        temperature: 0,
        system: `You are the SciSpark Y7 Entry Assessment marker. Return ONLY a valid JSON object — no prose, no markdown, no comments.

ASSESSMENT: Y7_ENTRY_EN | 60 marks | 64 fields | Parts A(5m Q01-05) B(15m Q06-20) C(15m Q21-23) D(25m Q24-27)

ANSWERS: Q01=frog Q02=ammonium chloride Q03=force meter Q04=B Q05=C Q06=A Q07=photosynthesis Q08=desert adaptation Q09_tick=irreversible Q09_explain=chemical change Q10_answer=irreversible Q10_explain=new substance Q11=D Q12=orbit Q13=air resistance Q14=C Q15=B Q16=C Q17=B Q18=B Q19=B Q20_tick=no Q20_explain=plateau 45C Q21a1=direction Q21a2=refraction Q21b1=direction Q21b2=reflection Q21c=straight Q22a=cm Q22b=faster Q22c=4 Q22d=two factors Q23a=gas/liquid/liquid/solid Q23b=solid-liquid Q23c=liquid-gas Q23d=liquid Q24a=magnet+magnetic Q24b=filtration 3 steps Q24c=evaporated Q25a=heart Q25b=pumps blood Q25c=two vessels Q25d=E+92% Q26a=thermometer Q26b=balance Q26c=fair test Q26d=50+different Q26e=13-16g+temperature Q27a=60 Q27b=30-40 Q27c=risk+reduction Q27d=B Q27e=E

POOL RULES: pool_q09/q10/q20=both-required-1m; pool_q23a=graduated(4=2m,2-3=1m,0-1=0m); pool_q23b/q23c=ordered-1m; pool_q22d/q25c=independent-distinct-2m; pool_q25d/q26d/q26e=independent-2m; pool_q27c=matched-pair-2m

Return JSON with exactly these keys: assessment_code, student_id, marked_at, total_awarded, total_possible, part_totals(A/B/C/D with awarded/possible), fields(array of 64 objects each with field_id/student_value/expected/marks_awarded/marks_possible/match_type/rationale/needs_review/review_reason), submission_warnings`,
        messages: [{ role: 'user', content: `Mark this. Return ONLY valid JSON, no markdown fences.\n\n${JSON.stringify(answers)}` }]
      })
    });

    const cd = await claudeResp.json();
    if (cd.error) throw new Error('Claude: ' + JSON.stringify(cd.error));
    const raw = (cd.content || []).filter(c => c.type === 'text').map(c => c.text).join('');

    let result;
    try {
      const s = raw.indexOf('{'), e = raw.lastIndexOf('}');
      if (s === -1 || e === -1) throw new Error('No JSON found in response');
      result = JSON.parse(raw.slice(s, e + 1));
    } catch (pe) {
      return res.status(500).json({ error: 'Parse failed: ' + pe.message, preview: raw.slice(0, 300) });
    }

    const pt = result.part_totals || {};
    const sum = (pt.A?.awarded||0)+(pt.B?.awarded||0)+(pt.C?.awarded||0)+(pt.D?.awarded||0);
    if (sum !== result.total_awarded) result.total_awarded = sum;
    const needsReview = Array.isArray(result.fields) && result.fields.some(f => f.needs_review);

    await fetch(`${SB_URL}/rest/v1/assessment_marking_results`, {
      method: 'POST',
      headers: { ...sbH, 'Prefer': 'return=minimal' },
      body: JSON.stringify({
        attempt_id,
        total_awarded: result.total_awarded,
        total_possible: 60,
        part_a_awarded: pt.A?.awarded||0,
        part_b_awarded: pt.B?.awarded||0,
        part_c_awarded: pt.C?.awarded||0,
        part_d_awarded: pt.D?.awarded||0,
        fields_json: result.fields||[],
        submission_warnings: result.submission_warnings||[],
        needs_teacher_review: needsReview,
        raw_ai_response: raw,
        marker_version: 'Vol03_v3'
      })
    });

    await fetch(`${SB_URL}/rest/v1/assessment_attempts?id=eq.${attempt_id}`, {
      method: 'PATCH', headers: sbH,
      body: JSON.stringify({ teacher_review_status: needsReview ? 'flagged' : 'pending' })
    });

    return res.status(200).json({ success: true, attempt_id, total_awarded: result.total_awarded, part_totals: result.part_totals, needs_review: needsReview, field_count: result.fields?.length||0 });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
