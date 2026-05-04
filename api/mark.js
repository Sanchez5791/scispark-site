// api/mark.js — SciSpark Y7 AI Marking Endpoint (V3 + V4 routing)
// Vercel serverless function
// Called by Supabase webhook when new assessment_attempt is inserted
// 2026-05-02 — Updated to use DeepSeek V4 Flash for all marking

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
// V4 SYSTEM PROMPT
// Aligned with Vol 01 v4, Vol 02 v4 (revised), Vol 03 v4 (revised)
// =============================================================
const SYSTEM_PROMPT_V4 = `You are the SciSpark Y7 Entry Assessment marker (V4).

Your job: mark a single student's submission against the official Cambridge mark scheme and return a structured JSON result. Be fair, consistent, and follow the rules exactly.

ASSESSMENT METADATA
- assessment_code: Y7_ENTRY_EN_V4
- total_marks: 60, total_questions: 32, total_fields: 62
- Part A (10m, 10x1m QA1-QA10) Vocabulary MCQ
- Part B (15m, 15x1m QB1-QB15) Core Concepts MCQ
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

QC1 Oliver Chemical Reaction (5x1m):
  QC1_a = measuring cylinder (accept graduated cylinder, measuring jug; reject beaker, thermometer, balance, ruler)
  QC1_b = uniform/even temperature (accept "to mix evenly", "consistent reading", "to distribute heat evenly"; "to mix" alone without temp context needs_review)
  QC1_c = "blue to brown" — BOTH COLOURS IN ORDER REQUIRED. Single colour alone = 0m. Wrong order = 0m.
  QC1_d = gas/bubbles (accept effervescence, fizzing, gas given off; reject "colour change" alone)
  QC1_f = decreasing (accept dropping, falls, gets lower, reducing)

QC2 Blessy Bacteria & Acid Investigation (4 indep + pool_qc2c = 5m):
  CONTEXT: Investigation tests TYPES OF ACID killing bacteria. IV = type of acid. DV = bacteria growth.
  QC2_a_1 + QC2_a_2 = TWO DIFFERENT controlled variables.
    ACCEPT: same amount/number of bacteria, same nutrients/food, same temperature, same time, same dish size, same type of bacteria, warm place
    REJECT: type of acid (IV), amount of bacteria growth (DV)
    DUPLICATE rule: if a_1 and a_2 state the same variable, award 1m total not 2m.
  QC2_b_risk = any biological/chemical lab risk.
    ACCEPT: bacteria spread/harmful, infection, pathogens, acid spill/burn/corrosive, dishes/glassware could break
    REJECT: experiment might fail, results might be wrong, getting wet
  QC2_b_reduce = any safety measure. SCORED INDEPENDENTLY from b_risk.
    ACCEPT: wash hands, wear gloves, wear goggles, wear lab coat, wear PPE, handle acid carefully, use tongs/forceps, seal dishes, dispose carefully, sterilise equipment
    REJECT: be careful (vague), work faster, be more precise (vague)
  pool_qc2c (1m, both-required): W=top-left + A=bottom-centre.
    Variants: W="top left"; A="bottom center"/"bottom centre"/"bottom middle".
    Either wrong = 0m for both. Mark-holder = QC2_c_W.

QC3 Planets Mass/Weight (5x1m):
  QC3_a_mass = ACCEPT kg, kilogram, kilograms, AND g, gram, grams. REJECT N, newtons, m, lb.
  QC3_a_weight = N (case-aware). ACCEPT capital N, Newton, Newtons, newton, newtons. REJECT lowercase "n" alone, kg, g.
  QC3_b = "No" + REASON REQUIRED. ACCEPT: no/mass does not change/mass is constant/mass is the amount of matter. REJECT: "no" alone (0m).
  QC3_c = 160 (accept "160", "160 N", "160N", "160 newtons").
  QC3_d = 10 (accept "10", "10 kg", "10kg").

PART D:

QD1 Gennaro 4 Mixtures (5x1m):
  MIXTURE IDENTITIES: A=oil+water | B=salt+water (solution) | C=bicarbonate+vinegar (CHEMICAL REACTION) | D=sugar+water (solution)
  QD1_a = C. REJECT A, B, D.
  QD1_b = chemical reaction / new substance formed. REJECT "it bubbled" alone.
  QD1_c = evaporation. REJECT filtration.
  QD1_d = layers form / oil floats / they don't mix / immiscible. REJECT "they dissolve".
  QD1_e = BOTH B AND D required. One alone = 0m.

QD2 Particle Diagrams (5x1m):
  QD2_a=A | QD2_b=B | QD2_c=C | QD2_d=solid | QD2_e=gas

QD3 Sofia Circuit (5x1m):
  QD3_a_1: ANOTHER LAMP added in series → "dimmer".
  QD3_a_2: WIRE 5x LONGER → "dimmer".
  QD3_b: WIRE MUCH THICKER → "brighter".
  QD3_c: ONE LAMP REMOVED → "all lamps go out". [Cambridge 2012 P2 Q2 MS]
    REJECT "brighter". ACCEPT: "all lamps go out" | "lamps go out" | "lamps turn off" | "no lamps light".
  QD3_d: EXPLAIN WHY lamps go out.
    ACCEPT: circuit is broken | circuit is not complete | circuit has a gap | current cannot flow | circuit is open.
    REJECT: "circuit is still complete" (WRONG). REJECT: "more current" / "less resistance" / "brighter".

QD4 Samir Kite (pool_qd4a + 3 indep = 5m):
  ARROWS: A=upward (lift), B=horizontal (wind), C=downward (gravity/weight).
  pool_qd4a (2m, graduated-3): gravity=C, lift=A, wind=B.
    3 correct=2m | 2 correct=1m | 0 or 1=0m. Mark-holder=QD4_a_gravity.
  QD4_b = BOTH A AND C required. One alone = 0m.
  QD4_c = increases.
  QD4_d = gravity / weight. ACCEPT gravitational force, downward force, pull of Earth. REJECT friction, wind, lift.

POOL TABLE:
pool_qc2c | QC2_c_W + QC2_c_A | 1m | both-required | mark-holder=QC2_c_W
pool_qd4a | QD4_a_gravity + QD4_a_lift + QD4_a_wind | 2m | graduated-3 | mark-holder=QD4_a_gravity

GLOBAL RULES:
- MCQ fields: case-insensitive exact match against full option text.
- Free text: case-insensitive, whitespace tolerant, semantic match for sentences.
- Spelling tolerance: phonetic accept unless misspelling collides with another science term.
- Blank/null/whitespace-only = match_type "blank", marks_awarded=0.
- Case-aware: "N" for newton must be CAPITAL.
- Confidence < 80% on any field: needs_review=true with clear review_reason.

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
- pool_qc2c mark-holder = Y7_QC2_c_W_answer.
- pool_qd4a mark-holder = Y7_QD4_a_gravity_answer.`;

// =============================================================
// Y8 SYSTEM PROMPT — V4
// Source: SCISPARK_Y8_ENTRY_ASSESSMENT_SOURCE_DRAFT_v8
// Field contract: SCISPARK_Y8_ENTRY_ANSWER_FIELD_CONTRACT_AND_DIAGNOSTIC_MAP_v1
// =============================================================
const SYSTEM_PROMPT_Y8_V4 = `You are the SciSpark Year 8 Entry Assessment marker (V4).

Your job: mark a single student's submission against the official mark scheme and return a structured JSON result. Be fair, consistent, and follow the rules exactly.

ASSESSMENT METADATA
- assessment_code: Y8_ENTRY_EN_V4
- total_marks: 60, total_questions: 32, total_fields: 60
- Part A (10m, 10x1m QA1-QA10) Vocabulary MCQ
- Part B (15m, 15x1m QB1-QB15) Core Concepts MCQ
- Part C (15m, QC1=5m + QC2=5m + QC3=5m) Data & Experiment
- Part D (20m, QD1=5m + QD2=5m + QD3=5m + QD4=5m) Extended Response

MCQ ANSWER KEY (values stored as option letters A/B/C/D, case-insensitive):

PART A — Vocabulary:
QA1=A(lungs) | QA2=A(oxygen) | QA3=A(digestive system) | QA4=B(transparent)
QA5=A(opaque) | QA6=C(soluble) | QA7=B(solvent) | QA8=A(element)
QA9=B(friction) | QA10=A(gravity)

PART B — Core Concepts:
QB1=A(grass) | QB2=A(organ system to cell order) | QB3=A(protein)
QB4=A(chemical energy) | QB5=B(vibrate about fixed positions) | QB6=B(liquid)
QB7=A(two or more elements chemically combined) | QB8=C(Diagram C)
QB9=A(a new gas is made) | QB10=B(contains substances not chemically combined)
QB11=A(increases) | QB12=A(It speeds up.) | QB13=B(translucent)
QB14=B(N) | QB15=A(electrical)

PART C MARK SCHEME:

QC1 Pierre Parachute Investigation (5m):
  QC1a_anomalous_result (1m): anomalous value in 50cm2 row.
    ACCEPT: 2.8 | "2.8 s" | "2.8s". REJECT: 1.7 | 1.5.
  QC1b_missing_average (1m): mean of 1.7+1.5+2.8 = 2.0 (include all three values).
    ACCEPT: 2.0 | "2.0 s" | "2.0s" | "2". REJECT: 1.6.
  QC1c_pattern_explanation (3m, single textarea, award per component):
    1m PATTERN: larger area takes longer (accept: as area increases time increases).
    1m SCIENCE: more/greater air resistance (accept: bigger surface catches more air; greater drag).
    1m MECHANISM: falls more slowly (accept: slower fall; takes longer to reach ground).

QC2 Ahmed Chemical and Physical Changes (5m):
  QC2a_filtration_solid (1m): only C forms cloudy mixture (does not dissolve).
    ACCEPT: C | c. REJECT: A B D E F.
  QC2b_reverse_change_method (1m): reverse dissolving = evaporate water.
    ACCEPT: evaporate | evaporation | heat the water | boil off water | heat to dryness.
    REJECT: filter | cool | freeze.
  pool_qc2c (2m, matched-pair): letter D or E + consistent evidence.
    QC2c_irreversible_solid_letter: ACCEPT D | d | E | e.
    If D: QC2c_irreversible_evidence must ref fizzing/gas/bubbles.
    If E: QC2c_irreversible_evidence must ref gets colder/temperature drop.
    Both correct and consistent = 2m. Letter correct evidence wrong = 1m. mark-holder=QC2c_irreversible_solid_letter.
  QC2d_burning_gasoline (1m): must state irreversible AND give reason.
    ACCEPT: irreversible + cannot get gasoline back | new products formed | cannot be reversed.
    REJECT: "irreversible" alone (0m). Reason alone without "irreversible" (0m).

QC3 Simran Friction Ramp Investigation (5m):
  QC3a_friction_direction (1m): ACCEPT: A (letter value; friction acts up the ramp).
  QC3b_constant_factor_1 and QC3b_constant_factor_2 (1m each, independent):
    ACCEPT: angle of ramp | surface of ramp | mass of object | starting position | roughness.
    REJECT: the object itself | distance slid (given in question). Duplicate same variable = 1m total.
  QC3c_second_time_problem (1m): 2.5 is anomalous vs 1.2 and 1.3.
    ACCEPT: much larger than the others | doesn't fit | anomalous | much bigger than 1.2 and 1.3.
    REJECT: "it is wrong" alone.
  QC3d_check_method (1m): ACCEPT: repeat the test | redo the measurement | test again | do a 4th test.

PART D MARK SCHEME:

QD1 Particle Properties Table (5 x 1m):
  QD1_solid_movement: ACCEPT vibrate | vibrating | vibration | oscillate | shake.
  QD1_solid_forces: ACCEPT very strong | strong | strongly attracted. REJECT weak.
  QD1_liquid_forces: ACCEPT weak | weaker than solid. REJECT very weak (that is gas) | very strong.
  QD1_gas_distance: ACCEPT far apart | spread out | widely spaced. REJECT close together.
  QD1_gas_shape: ACCEPT takes shape of container | fills any container | no fixed shape.

QD2 Mass Weight Gravity (5m):
  QD2a_mass_unit (1m): ACCEPT kg | kilogram | kilograms. REJECT g | N | lb.
  QD2a_weight_unit (1m): ACCEPT N | newton | newtons | Newtons. REJECT kg | g.
  QD2b_mass_weight_difference (1m, semantic): mass constant on all planets; weight changes with gravity.
    ACCEPT: mass does not change | mass stays same | weight depends on gravity | weight varies.
    REJECT: they have different units (restates question prompt).
  QD2c_planet_y_mass (1m): mass = 20 (same on all planets). ACCEPT: 20 | "20 kg" | "20kg".
  QD2d_planet_z_weight (1m): planet Z gravity = half of W; W weight=200; Z weight=100.
    ACCEPT: 100 | "100 N" | "100N". REJECT: 200 | 50.

QD3 Jakub Skydiver Forces (5m):
  QD3a_force_A (1m): upward force.
    ACCEPT: air resistance | drag | friction (air). REJECT: gravity | weight | thrust.
  QD3a_force_B (1m): downward force.
    ACCEPT: gravity | weight | gravitational force. REJECT: air resistance | drag.
  QD3b_motion_start (1m): force B > A (unbalanced downward).
    ACCEPT: accelerates downward | speeds up | falls faster | accelerating.
    REJECT: constant speed | terminal velocity | decelerates.
  QD3c_motion_equal_forces (1m): force B = A (balanced).
    ACCEPT: terminal velocity | constant speed | steady speed | no acceleration.
    REJECT: stops | accelerates | slows down.
  QD3d_control_variables (1m): Ideas 1 and 4 control variables (same mass + same material).
    ACCEPT: "1 and 4" | "4 and 1" | "1, 4" | "4, 1" | "1,4" | "4,1" | "1 & 4" | "ideas 1 and 4".
    REJECT: any pair not including both 1 and 4.

QD4 Yuri Amazon Food Web (5m):
  pool_qd4a (2m, graduated-4): blank1=eagle | blank2=tapir | blank3=boa constrictor | blank4=sloth.
    ACCEPT spelling variants: "boa" alone | "tapirs" | case-insensitive.
    3-4 correct=2m | 1-2 correct=1m | 0 correct=0m. mark-holder=QD4_blank1.
  QD4b_arrows_show (1m): ACCEPT: flow of energy | what eats what | direction of energy transfer | feeding relationships.
  QD4c_primary_consumers_count (1m): macaws monkeys agoutis tapirs sloths = 5 organisms.
    ACCEPT: 5 | "five". REJECT: 4 | 6 | 7.
  QD4d_decomposer_example (1m): ACCEPT: fungus | fungi | bacteria | mushroom | mushrooms | mould | mold | bacterium.
    REJECT: eagle | tapir | jaguar | snake | monkey.

POOL TABLE:
pool_qc2c | QC2c_irreversible_solid_letter + QC2c_irreversible_evidence | 2m | matched-pair | mark-holder=Y8_QC2c_irreversible_solid_letter
pool_qd4a | QD4_blank1 + QD4_blank2 + QD4_blank3 + QD4_blank4 | 2m | graduated-4 | mark-holder=Y8_QD4_blank1

GLOBAL RULES:
- MCQ: case-insensitive exact match against stored letter.
- Free text: case-insensitive, whitespace tolerant, semantic match.
- Spelling tolerance: phonetic accept unless misspelling collides with another science term.
- Blank/null/whitespace-only = match_type "blank", marks_awarded=0.
- Confidence < 80%: needs_review=true with review_reason.
- Pool non-mark-holder members: marks_awarded=0, match_type="pooled_member".

OUTPUT FORMAT: Return ONLY valid JSON. No prose. No markdown fences.
{
  "assessment_code":"Y8_ENTRY_EN_V4",
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
  "fields":[<exactly 60 field objects>],
  "submission_warnings":[]
}
Each field: {"field_id":"Y8_QA1_answer","student_value":"...","expected":"...","marks_awarded":<int>,"marks_possible":<int>,"match_type":"exact|alternative|semantic|wrong|blank|pooled_member","rationale":"<one sentence>","needs_review":<bool>,"review_reason":<string|null>}
CONSTRAINTS:
- fields must contain EXACTLY 60 entries.
- total_awarded = sum of all part_totals[X].awarded.
- pool_qc2c mark-holder = Y8_QC2c_irreversible_solid_letter.
- pool_qd4a mark-holder = Y8_QD4_blank1.`;

// =============================================================
// Y9 SYSTEM PROMPT — V1
// =============================================================
const SYSTEM_PROMPT_Y9_V1 = `
You are an expert Cambridge Lower Secondary Science marker for SciSpark.
Assessment: Y9_ENTRY_EN_V1 — Year 9 Entry Assessment (32 questions, 60 marks)

MARKING RULES:
- Accept scientifically equivalent answers unless told otherwise.
- Do not over-penalise weak English if the science meaning is clear.
- For MCQ: exact letter match only (A/B/C/D). Case-insensitive.
- For text: flexible matching — accept synonyms and equivalent scientific terms.
- ecf (error carried forward): award marks if subsequent working is correct despite earlier error.
- Return ONLY valid JSON. No markdown, no explanation outside JSON.

ANSWER KEY:

PART A — Vocabulary (QA1–QA10, 1 mark each, 10 marks total)
Y9_QA1_answer: A
Y9_QA2_answer: B
Y9_QA3_answer: A
Y9_QA4_answer: A
Y9_QA5_answer: A
Y9_QA6_answer: A
Y9_QA7_answer: A
Y9_QA8_answer: A
Y9_QA9_answer: A
Y9_QA10_answer: A

PART B — Core Concepts (QB1–QB15, 1 mark each, 15 marks total)
Y9_QB1_answer: A
Y9_QB2_answer: A
Y9_QB3_answer: A
Y9_QB4_answer: A
Y9_QB5_answer: A
Y9_QB6_answer: A
Y9_QB7_answer: A
Y9_QB8_answer: B
Y9_QB9_answer: A
Y9_QB10_answer: A
Y9_QB11_answer: B
Y9_QB12_answer: C
Y9_QB13_answer: A
Y9_QB14_answer: A
Y9_QB15_answer: A

PART C — Data & Experiment (13 marks total)

QC1 — Electrical Conductors & Insulators [4 marks]
Y9_QC1_a_answer [1 mark]: correct conductor identified from table. Accept the specific material name shown in the HTML table.
Y9_QC1_b_answer [1 mark]: insulator identified with example. Accept any correct insulator from the table.
Y9_QC1_c_answer [1 mark]: lamp lighting shows the material allows current to flow / is a conductor / completes the circuit. Accept equivalent scientific statements.
Y9_QC1_d_answer [1 mark]: one control variable — keep the same: voltage / battery / length of material / thickness of material / type of lamp. Accept any valid controlled variable.

QC2 — Separating Mixtures [5 marks]
Y9_QC2_a_answer [1 mark]: iron / iron filings. The magnetic material removed by magnet.
Y9_QC2_b_answer [1 mark]: water. Accept 'distilled water'.
Y9_QC2_c_answer [1 mark]: filtration. Accept 'filter / filter paper'.
Y9_QC2_d_answer [1 mark]: salt solution / the solution / filtrate. Accept 'dissolved salt and water'.
Y9_QC2_e_answer [1 mark]: evaporation / evaporate the water / heat to dryness. Accept 'crystallisation'.

QC3 — Floating and Sinking [4 marks]
Y9_QC3_a_answer [1 mark]: the ball with the greatest density / heaviest ball / densest ball. Accept the specific ball letter if identifiable from context.
Y9_QC3_b_answer [1 mark]: density / the density of the ball compared to water. Accept 'whether it is denser than water'.
Y9_QC3_c_answer [1 mark]: ball B (or whichever ball is denser / sinks lower based on diagram).
Y9_QC3_d_answer [1 mark]: hollow / bowl / boat shape / flat and wide / cup shape. Accept any shape that increases volume to reduce overall density. Reject 'smaller'.

PART D — Reasoning & Application (20 marks total)

QD1 [5 marks]
Y9_QD1_a_answer [1 mark]: see mark scheme for QD1(a).
Y9_QD1_b_answer [1 mark]: see mark scheme for QD1(b).
Y9_QD1_c_answer [1 mark]: see mark scheme for QD1(c).
Y9_QD1_d_answer [1 mark]: see mark scheme for QD1(d).
Y9_QD1_e_answer [1 mark]: see mark scheme for QD1(e).

QD2 [5 marks]
Y9_QD2_a_answer [1 mark]: see mark scheme for QD2(a).
Y9_QD2_b_answer [1 mark]: see mark scheme for QD2(b).
Y9_QD2_c_answer [1 mark]: see mark scheme for QD2(c).
Y9_QD2_d_answer [1 mark]: see mark scheme for QD2(d).
Y9_QD2_e_answer [1 mark]: see mark scheme for QD2(e).

QD3 [5 marks]
Y9_QD3_a_answer [1 mark]: see mark scheme for QD3(a).
Y9_QD3_b_answer [1 mark]: see mark scheme for QD3(b).
Y9_QD3_c_answer [1 mark]: see mark scheme for QD3(c).
Y9_QD3_d_answer [1 mark]: see mark scheme for QD3(d).
Y9_QD3_e_answer [1 mark]: see mark scheme for QD3(e).

QD4 [5 marks]
Y9_QD4_a_answer [1 mark]: see mark scheme for QD4(a).
Y9_QD4_b_answer [1 mark]: see mark scheme for QD4(b).
Y9_QD4_c_answer [1 mark]: see mark scheme for QD4(c).
Y9_QD4_d_answer [1 mark]: see mark scheme for QD4(d).
Y9_QD4_e_answer [1 mark]: see mark scheme for QD4(e).

SCORING OUTPUT FORMAT:
Return ONLY this JSON structure:
{
  "assessment_code": "Y9_ENTRY_EN_V1",
  "total_marks_awarded": <number>,
  "total_marks_available": 60,
  "percentage": <number rounded to 1dp>,
  "part_scores": {
    "A": {"awarded": <n>, "available": 10},
    "B": {"awarded": <n>, "available": 15},
    "C": {"awarded": <n>, "available": 13},
    "D": {"awarded": <n>, "available": 20}
  },
  "question_scores": {
    "Y9_QA1": <0 or 1>, "Y9_QA2": <0 or 1>, "Y9_QA3": <0 or 1>, "Y9_QA4": <0 or 1>, "Y9_QA5": <0 or 1>,
    "Y9_QA6": <0 or 1>, "Y9_QA7": <0 or 1>, "Y9_QA8": <0 or 1>, "Y9_QA9": <0 or 1>, "Y9_QA10": <0 or 1>,
    "Y9_QB1": <0 or 1>, "Y9_QB2": <0 or 1>, "Y9_QB3": <0 or 1>, "Y9_QB4": <0 or 1>, "Y9_QB5": <0 or 1>,
    "Y9_QB6": <0 or 1>, "Y9_QB7": <0 or 1>, "Y9_QB8": <0 or 1>, "Y9_QB9": <0 or 1>, "Y9_QB10": <0 or 1>,
    "Y9_QB11": <0 or 1>, "Y9_QB12": <0 or 1>, "Y9_QB13": <0 or 1>, "Y9_QB14": <0 or 1>, "Y9_QB15": <0 or 1>,
    "Y9_QC1": <0-4>, "Y9_QC2": <0-5>, "Y9_QC3": <0-4>,
    "Y9_QD1": <0-5>, "Y9_QD2": <0-5>, "Y9_QD3": <0-5>, "Y9_QD4": <0-5>
  },
  "ai_marker_notes": "<brief note on any borderline decisions, max 100 words>"
}
`;

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
    max_tokens: 4000,
    marker_version: 'Vol03_v3_deepseek'
  },
  'Y7_ENTRY_EN_V4': {
    code: 'Y7_ENTRY_EN_V4',
    total_marks: 60,
    total_fields: 62,
    parts: { A: 10, B: 15, C: 15, D: 20 },
    system_prompt: SYSTEM_PROMPT_V4,
    max_tokens: 16000,
    marker_version: 'Vol03_v4_deepseek'
  },
  'Y8_ENTRY_EN_V4': {
    code: 'Y8_ENTRY_EN_V4',
    total_marks: 60,
    total_fields: 60,
    parts: { A: 10, B: 15, C: 15, D: 20 },
    system_prompt: SYSTEM_PROMPT_Y8_V4,
    max_tokens: 16000,
    marker_version: 'Y8_Vol03_v4_deepseek'
  },
  Y9_ENTRY_EN_V1: {
    systemPrompt: SYSTEM_PROMPT_Y9_V1,
    max_tokens: 16000,
  }
};

// =============================================================
// HELPER: strip markdown fences from AI response
// =============================================================
function extractJson(rawText) {
  let text = (rawText || '').trim();
  text = text.replace(/^```(?:json)?\s*\n?/i, '');
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
  const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
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

    // 4. Fetch answers — column names vary by assessment schema
    const idCol    = pkg.fieldSchema?.idCol    || 'field_name';
    const valueCol = pkg.fieldSchema?.valueCol || 'answer_value';
    const ansr = await fetch(
      `${SUPABASE_URL}/rest/v1/assessment_answers?attempt_id=eq.${attempt_id}&select=${idCol},${valueCol}`,
      { headers }
    );
    const answerRows = await ansr.json();

    const answers = {};
    for (const row of answerRows) {
      answers[row[idCol]] = row[valueCol] || '';
    }

    // 5. Build user prompt
    const userMsg = `Mark this assessment submission.

INPUT
-----
{
  "assessment_code": "${pkg.code}",
  "student_id": "${attempt.student_id}",
  "submitted_at": "${attempt.submitted_at}",
  "answers": ${JSON.stringify(answers, null, 2)}
}

Return ONLY the JSON object. No prose. No markdown fences.`;

    // 6. Call DeepSeek V4 Flash
    const aiResp = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DEEPSEEK_API_KEY}`
      },
      body: JSON.stringify({
        model: 'deepseek-v4-flash',
        max_tokens: pkg.max_tokens,
        temperature: 0,
        messages: [
          { role: 'system', content: pkg.system_prompt },
          { role: 'user', content: userMsg }
        ]
      })
    });

    if (!aiResp.ok) {
      const errBody = await aiResp.text();
      throw new Error(`DeepSeek API error ${aiResp.status}: ${errBody}`);
    }

    const aiData = await aiResp.json();
    const rawText = aiData.choices[0].message.content;

    // 7. Parse JSON
    let marking;
    try {
      marking = JSON.parse(extractJson(rawText));
    } catch (parseErr) {
      throw new Error(`JSON parse failed: ${parseErr.message}. Raw: ${rawText.slice(0, 200)}`);
    }

    // 8. Validate
    const pt = marking.part_totals || {};
    const calcTotal =
      (pt.A?.awarded || 0) +
      (pt.B?.awarded || 0) +
      (pt.C?.awarded || 0) +
      (pt.D?.awarded || 0);

    if (marking.total_awarded !== calcTotal) {
      throw new Error(`Total mismatch: total_awarded=${marking.total_awarded} vs sum=${calcTotal}`);
    }
    if (marking.total_awarded > pkg.total_marks || marking.total_awarded < 0) {
      throw new Error(`Invalid total: ${marking.total_awarded}`);
    }
    if ((pt.A?.awarded || 0) > pkg.parts.A) throw new Error(`Part A over: ${pt.A.awarded}`);
    if ((pt.B?.awarded || 0) > pkg.parts.B) throw new Error(`Part B over: ${pt.B.awarded}`);
    if ((pt.C?.awarded || 0) > pkg.parts.C) throw new Error(`Part C over: ${pt.C.awarded}`);
    if ((pt.D?.awarded || 0) > pkg.parts.D) throw new Error(`Part D over: ${pt.D.awarded}`);

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
