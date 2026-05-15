// api/mark.js â€” SciSpark Y7 AI Marking Endpoint (V3 + V4 routing)
// Vercel serverless function
// Called by Supabase webhook when new assessment_attempt is inserted
// 2026-05-02 â€” Updated to use DeepSeek V4 Flash for all marking

// =============================================================
// V3 SYSTEM PROMPT â€” DO NOT MODIFY (used by old 27-question HTML)
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

PART A â€” Vocabulary MCQ (full option text, case-insensitive):
QA1=food chain (accept food-chain) | QA2=animal | QA3=where they live
QA4=melting | QA5=water | QA6=iron | QA7=iron
QA8=gravity (accept gravitational force) | QA9=Sun (accept the Sun, sun)
QA10=Moon (accept the Moon, moon)

PART B â€” Core Concepts MCQ:
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
  QC1_c = "blue to brown" â€” BOTH COLOURS IN ORDER REQUIRED. Single colour alone = 0m. Wrong order = 0m.
  QC1_d = gas/bubbles (accept effervescence, fizzing, gas given off; reject "colour change" alone)
  QC1_f = decreasing (accept dropping, falls, gets lower, reducing)

QC2 Bacteria & Acid Investigation (4 indep + pool_qc2c = 5m):
  CONTEXT: Investigation tests TYPES OF ACID killing bacteria. IV = type of acid. DV = bacteria growth.
  QC2_a_1 (1m, independent): any valid controlled variable. ACCEPT: temperature, time, type of bacteria, dish size, amount of solution/bacteria, light, nutrients.
    REJECT: type of acid (IV), amount of bacteria growth (DV).
  QC2_a_2 (1m, independent): same logic; must be DIFFERENT from a_1.
    DUPLICATE rule: if a_1 and a_2 state the same variable, award 1m total not 2m.
  QC2_b_risk (1m, independent): any biological/chemical lab risk.
    ACCEPT: bacteria spread/harmful/infection, pathogens, contamination, acid spill/burn/corrosive, sharp/glass cuts, dishes/glassware could break.
    REJECT: experiment might fail, results might be wrong, getting wet.
  QC2_b_reduce (1m, independent): any safety measure. SCORED INDEPENDENTLY from b_risk.
    ACCEPT: wash hands, wear gloves, wear goggles/safety glasses, wear lab coat, wear PPE, handle acid carefully, use tongs/forceps, seal dishes, dispose carefully, sterilise equipment.
    REJECT: be careful (vague), work faster, be more precise (vague).
  pool_qc2c (1m, both-required): W=top-left + A=bottom-centre.
    W accepts: "top left" / "topleft" / "top-left" (case-insensitive, whitespace-tolerant).
    A accepts: "bottom centre" / "bottom center" / "bottom-centre" / "bottomcentre" / "bottom middle".
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

QD3 Sofia Circuit (pool_qd3a + 3 indep = 5m):
  pool_qd3a (2m, graduated-4): read BOTH QD3_a_1 and QD3_a_2; combine and deduplicate all components named (case-insensitive).
    Acceptable components: cell/battery | lamp/bulb | switch | wire/connecting wire/wires
    4 unique correct â†’ 2m | 2 or 3 unique correct â†’ 1m | 0 or 1 â†’ 0m. Mark-holder=QD3_a_1.
  QD3_b: YES + valid explanation. ACCEPT: circuit complete / current flows / closed loop / electricity can flow.
  QD3_c: brighter / gets brighter / increases / more bright / brighter light. ACCEPT any similar phrasing.
  QD3_d: lamp lights / still works / circuit still complete / brighter. ACCEPT any answer indicating the circuit still functions when switch is removed.

QD4 Samir Kite (pool_qd4a + 3 indep = 5m):
  ARROWS: A=upward (lift/upward force), B=horizontal (wind force, pushes kite away from Samir), C=downward (gravity/weight), D=toward Samir (Samir's pulling force on string).
  pool_qd4a (2m, graduated-3): gravity=C, Samir's pull=D (field Y7_QD4_a_lift_answer), wind=B.
    3 correct=2m | 2 correct=1m | 0 or 1=0m. Mark-holder=QD4_a_gravity.
    Letter matching is case-insensitive; accept "c", "C", " C ", etc.
  QD4_b = BOTH B AND D required, in any order with any separator. One alone = 0m.
    ACCEPT: "B and D" / "D and B" / "B, D" / "D, B" / "B D" / "D B" / "BD" / "DB".
  QD4_c = Samir's pulling force INCREASES.
    ACCEPT: increases / gets bigger / gets stronger / pulls harder / more force / grows / larger / bigger.
    REJECT: stays the same / decreases / no change.
  QD4_d = kite may move down / drop / fall. ACCEPT: moves down / falls / comes down / fall lower / drop / lose height / descend / fall down.
    REJECT: stays the same / goes up / moves higher.

POOL TABLE:
pool_qd3a | QD3_a_1 + QD3_a_2 | 2m | graduated-4 | mark-holder=QD3_a_1
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
- pool_qd3a mark-holder = Y7_QD3_a_1_answer.
- pool_qc2c mark-holder = Y7_QC2_c_W_answer.
- pool_qd4a mark-holder = Y7_QD4_a_gravity_answer.`;

// =============================================================
// Y8 SYSTEM PROMPT â€” V4
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

PART A â€” Vocabulary:
QA1=A(lungs) | QA2=A(oxygen) | QA3=A(digestive system) | QA4=B(transparent)
QA5=A(opaque) | QA6=C(soluble) | QA7=B(solvent) | QA8=A(element)
QA9=B(friction) | QA10=A(gravity)

PART B â€” Core Concepts:
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
// Y8 SYSTEM PROMPT â€” redesign 2026-05-10 (Y8_ENTRY_EN)
// Source: SCISPARK_Y8_ENTRY_ASSESSMENT_SOURCE_DRAFT_v8
// Field contract: SCISPARK_Y8_ENTRY_ANSWER_FIELD_CONTRACT_v9
// =============================================================
const SYSTEM_PROMPT_Y8 = `You are the SciSpark Year 8 Entry Assessment marker (V4).

Your job: mark a single student's submission against the official mark scheme and return a structured JSON result. Be fair, consistent, and follow the rules exactly.

ASSESSMENT METADATA
- assessment_code: Y8_ENTRY_EN
- total_marks: 60, total_questions: 32, total_fields: 62
- Part A (10m, 10x1m QA1-QA10) Vocabulary MCQ
- Part B (15m, 15x1m QB1-QB15) Core Concepts MCQ
- Part C (15m, QC1=5m + QC2=5m + QC3=5m) Data & Experiment
- Part D (20m, QD1=5m + QD2=5m + QD3=5m + QD4=5m) Extended Response

MCQ ANSWER KEY (values stored as option letters A/B/C/D, case-insensitive):

PART A â€” Vocabulary:
QA1=A(lungs) | QA2=A(oxygen) | QA3=A(digestive system) | QA4=B(transparent)
QA5=A(opaque) | QA6=C(soluble) | QA7=B(solvent) | QA8=A(element)
QA9=B(friction) | QA10=A(gravity)

PART B â€” Core Concepts:
QB1=A(grass) | QB2=A(organ system to cell order) | QB3=A(protein)
QB4=A(chemical energy) | QB5=B(vibrate about fixed positions) | QB6=B(liquid)
QB7=A(two or more elements chemically combined) | QB8=C(Diagram C)
QB9=A(a new gas is made) | QB10=B(contains substances not chemically combined)
QB11=A(increases) | QB12=A(It speeds up.) | QB13=B(translucent)
QB14=B(N) | QB15=D(a mixture)

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

QC3 Simran Neutralisation Graph Investigation (5m):
  QC3a_temperature_change (1m): temperature change at neutralisation point = 24 Â°C.
    ACCEPT: 24 | "24Â°C" | "24 Â°C" | "24 degrees". REJECT: any other number.

=== Q28 GRAPH FIELDS â€” PRECOMPUTED MARKS ===
The following Q28 fields are marked deterministically before this prompt runs.
Use the precomputed values verbatim. DO NOT re-evaluate the graph yourself.

graph_points:      mark={{Q28_GRAPH_POINTS_MARK}}, reason="{{Q28_GRAPH_POINTS_REASON}}", needs_teacher={{Q28_GRAPH_POINTS_TEACHER}}
graph_axis_labels: mark={{Q28_AXIS_LABELS_MARK}},  reason="{{Q28_AXIS_LABELS_REASON}}",  needs_teacher={{Q28_AXIS_LABELS_TEACHER}}
line_best_fit:     mark={{Q28_LINE_MARK}},          reason="{{Q28_LINE_REASON}}",          needs_teacher={{Q28_LINE_TEACHER}}

For Y8_QC3a (temperature change) and Y8_QC3d (pattern): mark normally per mark scheme.
=== END Q28 GRAPH FIELDS ===

  QC3b_graph_raw (0m): raw canvas evidence only. Always marks_awarded=0. match_type="blank" regardless of value.
  QC3c_line_raw (0m): raw canvas evidence only. Always marks_awarded=0. match_type="blank" regardless of value.
  QC3d_pattern (1m): as volume of alkali increases, change in temperature increases.
    ACCEPT: any statement that correctly identifies a positive relationship between volume of alkali and temperature change.
    REJECT: inverse/negative relationship, or no relationship stated.

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
  "assessment_code":"Y8_ENTRY_EN",
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
// Y9 SYSTEM PROMPT (v8, 2026-05-13)
// Field contract: Y9_ENTRY_EN, 32 questions, 60 fields
// =============================================================
const SYSTEM_PROMPT_Y9 = `You are the SciSpark Year 9 Entry Assessment marker (v8).

Your job: mark a single student's submission against the official mark scheme and return a structured JSON result. Be fair, consistent, and follow the rules exactly.

ASSESSMENT METADATA
- assessment_code: Y9_ENTRY_EN
- total_marks: 60, total_questions: 32, total_fields: 60
- Part A (10m, 10x1m Q1-Q10) Vocabulary MCQ
- Part B (15m, 15x1m Q11-Q25) Core Concepts MCQ
- Part C (15m, Q26=5m + Q27=5m + Q28=5m) Data and Experiment
- Part D (20m, Q29=5m + Q30=5m + Q31=5m + Q32=5m) Extended Response

MCQ ANSWER KEY (values stored as option letters A/B/C/D, case-insensitive):

Q1=C  Q2=C  Q3=A  Q4=B  Q5=A
Q6=B  Q7=A  Q8=A  Q9=B  Q10=A
Q11=A Q12=A Q13=B Q14=B Q15=B
Q16=B Q17=A Q18=A Q19=A Q20=A
Q21=A Q22=A Q23=A Q24=A Q25=A

PART C MARK SCHEME:

Q26 Electricity Investigation (5m):
  Y9_Q26a_current_unit (1m): unit for current.
    ACCEPT: A | amp | ampere | amperes | amps (case-insensitive).
    REJECT: mA | V | W | ohm.
=== Q26 GRAPH FIELDS — PRECOMPUTED MARKS ===
The following Q26 fields are marked deterministically before this prompt runs.
Use the precomputed values verbatim. DO NOT re-evaluate the graph yourself.

axis_labels:     mark={{Q26_AXIS_LABELS_MARK}},  reason="{{Q26_AXIS_LABELS_REASON}}",  needs_teacher={{Q26_AXIS_LABELS_TEACHER}}
plotted_points:  mark={{Q26_GRAPH_POINTS_MARK}}, reason="{{Q26_GRAPH_POINTS_REASON}}", needs_teacher={{Q26_GRAPH_POINTS_TEACHER}}
best_fit_line:   mark={{Q26_LINE_MARK}},          reason="{{Q26_LINE_REASON}}",          needs_teacher={{Q26_LINE_TEACHER}}

For Y9_Q26a_current_unit and Y9_Q26c_relationship: mark normally per mark scheme.
=== END Q26 GRAPH FIELDS ===
  Y9_Q26c_relationship (1m): relationship between number of lamps and current.
    ACCEPT: as number of lamps increases current decreases | inverse relationship | current goes down as lamps increase.
    REJECT: current increases | no relationship | unrelated answer.

Q27 Chemistry Investigation (5m):
  Y9_Q27a_temperature_changes (1m): three missing temperature changes.
    ACCEPT: +11 and -4 and +16 (all three values present, any order, any separator).
    PARTIAL: if only 2 correct values mentioned = 0m (all three required).
  Y9_Q27b_reaction_types (1m): four reaction types (row1=exothermic, row2=endothermic, row3=endothermic, row4=exothermic).
    ACCEPT: if student states all four correctly in any format.
  Y9_Q27c_mixture_releases_most_energy (1m): which mixture releases most energy.
    ACCEPT: dilute sulfuric acid and magnesium ribbon | sulfuric acid + magnesium | row 4.
    REJECT: copper sulfate | ethanoic acid | potassium carbonate.
  Y9_Q27d_explanation (1m): why that mixture releases most energy.
    ACCEPT: largest temperature increase | +16 degrees C increase | biggest temperature change.
    REJECT: "it reacts faster" alone | "it gets hot" without reference to largest change.
  Y9_Q27e_reliability (1m): how to make results more reliable.
    ACCEPT: repeat the experiment | repeat measurements | calculate a mean | do it more than once.
    REJECT: use a bigger beaker | add more chemicals | change the reactants.

Q28 Pressure Investigation (5m):
  Y9_Q28a_plan_place_measure_dent (1m): plan step 1.
    ACCEPT: place the block with masses on the clay and measure the depth/size of the dent.
    REJECT: just "push block" without measurement | irrelevant steps.
  Y9_Q28a_plan_repeat_different_blocks_masses (1m): plan step 2.
    ACCEPT: repeat with blocks of different areas | repeat with different masses/weights.
    REJECT: only mentioning one variable | not repeating.
  Y9_Q28b_measurements (1m): measurements needed.
    ACCEPT: any two from: area of block | mass/weight/force | depth of dent.
    REJECT: only one measurement | irrelevant measurements.
  Y9_Q28c_repeat_reason (1m): why Azim repeats measurements.
    ACCEPT: to improve reliability | to check for anomalies | to reduce experimental error | to get more accurate results.
    REJECT: "to save time" | "to use more equipment".
  Y9_Q28d_results_table (1m): results table with suitable headings.
    ACCEPT: table with at least two suitable column headings from: area, force/mass, depth/dent.
    REJECT: no headings | single column | headings unrelated to investigation.

PART D MARK SCHEME:

Q29 Corrosion of Metals (5m):
  Y9_Q29a_prediction_no (1m): does the evidence support Zeki's prediction.
    ACCEPT: No | the evidence does not support the prediction | No, it does not support.
    REJECT: Yes | correct | supported.
  Y9_Q29a_table_explanation (1m): explanation using table data.
    ACCEPT: aluminium has lower corrosion values than iron | aluminium corrodes more slowly than iron | iron has higher corrosion scores than aluminium in all conditions.
    REJECT: aluminium corrodes faster | no reference to table values.
  Y9_Q29b_copper_lead_same (1m): why Zeki cannot decide between copper and lead.
    ACCEPT: copper and lead have the same corrosion speed values in all conditions | the values for copper and lead are identical | they have the same numbers in all columns.
    REJECT: they are both metals | they react the same way (must reference table values).
  Y9_Q29c_acid_rain_vs_sea_water (1m): conclusion about acid rain vs sea water.
    ACCEPT: corrosion is faster in acid rain than sea water for all metals | acid rain causes more corrosion than sea water | all metals corrode faster in acid rain than sea water.
    REJECT: sea water causes more corrosion | they are the same | no comparison stated.
  Y9_Q29d_safety_precaution (1m): one safety precaution when using sulfuric acid.
    ACCEPT: wear goggles | wear safety glasses | wear gloves | wear lab coat | handle acid carefully | wash hands after | keep away from skin and eyes | use a fume cupboard.
    REJECT: "be careful" alone (too vague) | no specific precaution named.

Q30 Acid Neutralisation (5m):
  Y9_Q30a_all_three_blanks (1m): all three blanks combined (pipe-separated: b1|b2|b3).
    ACCEPT: award 1 if answer contains all three: neutralise/neutralizes AND alkaline AND salt.
    REJECT: award 0 if any one is missing or wrong.
  Y9_Q30b_i_indicator_compare (1m): what Tom uses to compare the tablets.
    ACCEPT: Universal Indicator | indicator | pH | colour (case-insensitive).
    REJECT: no mention of indicator, pH, or colour.
  Y9_Q30b_i_least_acidic_neutral (1m): what Tom looks for.
    ACCEPT: least acidic | closest to neutral | green | highest pH (case-insensitive).
    REJECT: vague answers with no reference to acidity/neutrality/pH/colour.
  Y9_Q30b_i_greatest_neutralisation (1m): what the best tablet shows.
    ACCEPT: greatest neutralisation | biggest colour change | most change away from acidic (case-insensitive).
    REJECT: vague answers | no reference to neutralisation or colour change.
  Y9_Q30b_ii_control_variable (1m): control variable.
    ACCEPT: same volume of acid | same concentration of acid | same amount of indicator | same temperature | same type of acid.
    REJECT: type of tablet (that is the IV) | colour change (that is the DV).

Q31 Respiratory System (5m):
  Y9_Q31a_diffusion (1m): process by which oxygen moves from alveoli into blood.
    ACCEPT: diffusion (case-insensitive).
    REJECT: osmosis | active transport | breathing | filtration.
  Y9_Q31b_alveoli_function (1m): one function of the alveoli.
    ACCEPT: gas exchange | exchange of oxygen and carbon dioxide | oxygen passes into blood and CO2 passes out.
    REJECT: "they breathe" | "they pump blood" | "they store air".
  Y9_Q31c_adaptation (1m): one adaptation of the alveoli.
    ACCEPT: large surface area | thin walls | moist surface | good blood supply | rich capillary network.
    REJECT: hard walls | no blood supply | thick membrane.
  Y9_Q31c_explanation (1m): how that adaptation helps gas exchange.
    ACCEPT: explanation linked to the stated adaptation (large surface area = more area for diffusion; thin walls = short diffusion distance; moist = gases dissolve; blood supply = maintains concentration gradient).
    REJECT: explanation that does not match stated adaptation | no explanation.
    NOTE: Mark independently of Y9_Q31c_adaptation.
  Y9_Q31d_iron (1m): mineral needed to make red blood cells.
    ACCEPT: iron | Fe (case-insensitive).
    REJECT: calcium | zinc | protein | haemoglobin alone.

Q32 Weather and Climate Change (5m):
  Y9_Q32a_i_weather_definition (1m): meaning of "weather".
    ACCEPT: the atmospheric conditions at a place over a short period of time | temperature, wind, rain etc. at a specific time and place.
    REJECT: "long-term climate patterns" (that is climate) | "the season" alone.
  Y9_Q32a_ii_graph_values (1m): 1920 graph values for Feb and Aug.
    ACCEPT: Feb=8 and Aug=20 and difference=12 (all three values required, any format).
    PARTIAL: only 2 correct values = 0m (all three required).
  Y9_Q32b_i_climate_evidence (1m): how graphs provide evidence of climate change.
    ACCEPT: temperatures in 2020 are higher than in 1920 | the graph shows an increase in temperature over 100 years.
    REJECT: "the graphs look different" without noting direction of change.
  Y9_Q32b_ii_climate_reason (1m): one reason why climate has changed.
    ACCEPT: burning fossil fuels | increased CO2 emissions | deforestation | greenhouse effect | methane from farming | global warming caused by human activity.
    REJECT: "it gets hot in summer" | natural seasons | "the sun is bigger".
  Y9_Q32c_accuracy_reason (1m): why 1920 temperatures may be less accurate.
    ACCEPT: older/less precise thermometers | no digital equipment | fewer weather stations | paper/manual records prone to error | measurement technology less advanced.
    REJECT: "it was colder then" | "different country" | no equipment-based reason.
GLOBAL RULES:
- MCQ fields: case-insensitive exact match against stored option letter (A/B/C/D).
- Free text: case-insensitive, whitespace tolerant, semantic match for sentences.
- Spelling tolerance: phonetic accept unless misspelling collides with another science term.
- Blank/null/whitespace-only = match_type "blank", marks_awarded=0.
- Confidence < 80%: needs_review=true with clear review_reason.
- Do NOT finalise Level 1/2/3. Teacher has final authority. AI marking is provisional.
- No pool/matched-pair fields in this assessment. Each field is independent 1-mark.

OUTPUT FORMAT: Return ONLY valid JSON. No prose. No markdown fences.
{
  "assessment_code":"Y9_ENTRY_EN",
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
Each field: {"field_id":"Y9_Q1_answer","student_value":"...","expected":"...","marks_awarded":<int>,"marks_possible":<int>,"match_type":"exact|alternative|semantic|wrong|blank","rationale":"<one sentence>","needs_review":<bool>,"review_reason":<string|null>}
CONSTRAINTS:
- fields must contain EXACTLY 60 entries.
- total_awarded = sum of all part_totals[X].awarded.
- All Part A and Part B fields are MCQ (1 mark each, expected = stored option letter).
- All Part C and Part D fields are free text (1 mark each).
- Field IDs MUST match the contract: Y9_Q1_answer .. Y9_Q25_answer, Y9_Q26a_current_unit, Y9_Q26b_axis_labels, Y9_Q26b_plotted_points, Y9_Q26b_best_fit_line, Y9_Q26c_relationship, Y9_Q27a_temperature_changes, Y9_Q27b_reaction_types, Y9_Q27c_mixture_releases_most_energy, Y9_Q27d_explanation, Y9_Q27e_reliability, Y9_Q28a_plan_place_measure_dent, Y9_Q28a_plan_repeat_different_blocks_masses, Y9_Q28b_measurements, Y9_Q28c_repeat_reason, Y9_Q28d_results_table, Y9_Q29a_prediction_no, Y9_Q29a_table_explanation, Y9_Q29b_copper_lead_same, Y9_Q29c_acid_rain_vs_sea_water, Y9_Q29d_safety_precaution, Y9_Q30a_blank1_neutralise, Y9_Q30a_blank2_alkaline, Y9_Q30a_blank3_salt, Y9_Q30b_i_decide_best_tablet, Y9_Q30b_ii_control_variable, Y9_Q31a_diffusion, Y9_Q31b_alveoli_function, Y9_Q31c_adaptation, Y9_Q31c_explanation, Y9_Q31d_iron, Y9_Q32a_i_weather_definition, Y9_Q32a_ii_graph_values, Y9_Q32b_i_climate_evidence, Y9_Q32b_ii_climate_reason, Y9_Q32c_accuracy_reason.`;

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
  'Y8_ENTRY_EN': {
    code: 'Y8_ENTRY_EN',
    total_marks: 60,
    total_fields: 62,
    parts: { A: 10, B: 15, C: 15, D: 20 },
    system_prompt: SYSTEM_PROMPT_Y8,
    max_tokens: 16000,
    marker_version: 'Y8_redesign_2026-05-10_corrected_deepseek'
  },
  'Y9_ENTRY_EN': {
    code: 'Y9_ENTRY_EN',
    total_marks: 60,
    total_fields: 60,
    parts: { A: 10, B: 15, C: 15, D: 20 },
    system_prompt: SYSTEM_PROMPT_Y9,
    max_tokens: 16000,
    marker_version: 'Y9_entry_v12_noQ32d_2026_05_14'
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
// DETERMINISTIC MARKER â€” Q28 graph fields (Y8_ENTRY_EN)
// =============================================================
function markQ28Graph(responses) {
  var EXPECTED = [
    {x:10,y:6},{x:20,y:11},{x:30,y:16},{x:40,y:20},{x:50,y:24}
  ];
  var PT_TOL  = 0.5;
  var LN_TOL  = 2;
  var AXIS_X_ACCEPT = ['volume of alkali added / cm3','volume of alkali added /cm3','volume of alkali / cm3','volume of alkali added cm3'];
  var AXIS_Y_ACCEPT = ['change in temperature / Â°c','change in temperature /Â°c','change in temperature (Â°c)','temperature change / Â°c'];

  var result = {
    graph_points:  { mark: 0, reason: '', needs_teacher: false },
    axis_labels:   { mark: 0, reason: '', needs_teacher: false },
    line_best_fit: { mark: 0, reason: '', needs_teacher: false }
  };

  // --- graph_points ---
  var ptsRaw = responses['Y8_QC3b_graph_points'] ? responses['Y8_QC3b_graph_points'].raw : '';
  if (!ptsRaw || ptsRaw === '[]' || ptsRaw === '') {
    result.graph_points.needs_teacher = true;
    result.graph_points.reason = 'No coordinate data captured â€” teacher review required';
  } else {
    try {
      var pts = JSON.parse(ptsRaw);
      var correct = pts.filter(function(p) {
        return EXPECTED.some(function(e) {
          return Math.abs(p.x-e.x) <= PT_TOL && Math.abs(p.y-e.y) <= PT_TOL;
        });
      }).length;
      if (correct >= 4) {
        result.graph_points.mark = 1;
        result.graph_points.reason = correct + '/5 points within tolerance';
      } else {
        result.graph_points.mark = 0;
        result.graph_points.reason = 'Only ' + correct + '/5 points within tolerance â€” minimum 4 required';
      }
    } catch(e) {
      result.graph_points.needs_teacher = true;
      result.graph_points.reason = 'Malformed graph_points JSON â€” teacher review required';
    }
  }

  // --- axis_labels ---
  var axRaw = responses['Y8_QC3b_graph_axis_labels'] ? responses['Y8_QC3b_graph_axis_labels'].raw : '';
  if (!axRaw) {
    result.axis_labels.mark = 0;
    result.axis_labels.reason = 'No axis labels provided';
  } else {
    try {
      var ax = JSON.parse(axRaw);
      var xLabel = (ax.x_axis_label || '').toLowerCase().trim();
      var yLabel = (ax.y_axis_label || '').toLowerCase().trim();
      var xOk = AXIS_X_ACCEPT.some(function(a){ return xLabel.indexOf(a) !== -1 || a.indexOf(xLabel) !== -1; });
      var yOk = AXIS_Y_ACCEPT.some(function(a){ return yLabel.indexOf(a) !== -1 || a.indexOf(yLabel) !== -1; });
      if (xOk && yOk) {
        result.axis_labels.mark = 1;
        result.axis_labels.reason = 'Both axis labels correct';
      } else if (!xOk && !yOk) {
        result.axis_labels.mark = 0;
        result.axis_labels.reason = 'Both axis labels incorrect';
      } else {
        result.axis_labels.needs_teacher = true;
        result.axis_labels.reason = 'One axis label borderline â€” teacher review required';
      }
    } catch(e) {
      result.axis_labels.needs_teacher = true;
      result.axis_labels.reason = 'Malformed axis_labels JSON â€” teacher review required';
    }
  }

  // --- line_best_fit ---
  var lineRaw = responses['Y8_QC3c_line_best_fit'] ? responses['Y8_QC3c_line_best_fit'].raw : '';
  if (!lineRaw || lineRaw === '' || lineRaw === 'drawn') {
    result.line_best_fit.needs_teacher = true;
    result.line_best_fit.reason = 'No line coordinate data â€” teacher review required';
  } else {
    try {
      var ln = JSON.parse(lineRaw);
      var allClose = EXPECTED.every(function(p) {
        var dx = ln.end.x-ln.start.x, dy = ln.end.y-ln.start.y;
        var lenSq = dx*dx+dy*dy;
        if (lenSq===0) return false;
        var t = Math.max(0,Math.min(1,((p.x-ln.start.x)*dx+(p.y-ln.start.y)*dy)/lenSq));
        var distSq = Math.pow(p.x-(ln.start.x+t*dx),2)+Math.pow(p.y-(ln.start.y+t*dy),2);
        return Math.sqrt(distSq) <= LN_TOL;
      });
      if (allClose) {
        result.line_best_fit.mark = 1;
        result.line_best_fit.reason = 'Line of best fit passes within tolerance of all data points';
      } else {
        result.line_best_fit.mark = 0;
        result.line_best_fit.reason = 'Line does not pass close enough to data points';
      }
    } catch(e) {
      result.line_best_fit.needs_teacher = true;
      result.line_best_fit.reason = 'Malformed line JSON â€” teacher review required';
    }
  }

  return result;
}

// =============================================================
// DETERMINISTIC MARKER — Q26 graph fields (Y9_ENTRY_EN)
// Data points: (1,12),(2,9),(3,7),(4,5),(5,2) — lamps vs current (A)
// =============================================================
function markQ26Graph(responses) {
  var EXPECTED = [
    {x:1,y:12},{x:2,y:9},{x:3,y:7},{x:4,y:5},{x:5,y:2}
  ];
  var PT_TOL = 0.5;
  var LN_TOL = 1;

  var result = {
    axis_labels:   { mark: 0, reason: '', needs_teacher: false },
    graph_points:  { mark: 0, reason: '', needs_teacher: false },
    line_best_fit: { mark: 0, reason: '', needs_teacher: false }
  };

  // --- axis_labels ---
  // Format: "x: <user input>, y: <user input>"  (plain string, not JSON)
  var axRaw = responses['Y9_Q26b_axis_labels'] ? responses['Y9_Q26b_axis_labels'].raw : '';
  if (!axRaw) {
    result.axis_labels.mark = 0;
    result.axis_labels.reason = 'No axis labels provided';
  } else {
    var axLower = axRaw.toLowerCase();
    var yIdx   = axLower.indexOf(', y:');
    var xPart  = yIdx !== -1 ? axLower.substring(0, yIdx) : axLower;
    var yPart  = yIdx !== -1 ? axLower.substring(yIdx)    : '';
    var xOk = xPart.indexOf('lamp') !== -1;
    var yOk = yPart.indexOf('current') !== -1 &&
              (yPart.indexOf(' a') !== -1 || yPart.indexOf('/a') !== -1 || yPart.indexOf('amp') !== -1);
    if (xOk && yOk) {
      result.axis_labels.mark = 1;
      result.axis_labels.reason = 'Both axis labels correct (x: lamps, y: current with unit A)';
    } else {
      result.axis_labels.mark = 0;
      result.axis_labels.reason = 'Axis labels incorrect — x needs "lamp", y needs "current" and "A"/"amp". Got: ' + axRaw;
    }
  }

  // --- graph_points ---
  // Format: [{"x":1,"y":12}, ...]  — coordinates in graph units, precision 0.5
  var ptsRaw = responses['Y9_Q26b_plotted_points'] ? responses['Y9_Q26b_plotted_points'].raw : '';
  if (!ptsRaw || ptsRaw === '[]' || ptsRaw === '') {
    result.graph_points.needs_teacher = true;
    result.graph_points.reason = 'No coordinate data captured — teacher review required';
  } else {
    try {
      var pts = JSON.parse(ptsRaw);
      var correct = pts.filter(function(p) {
        return EXPECTED.some(function(e) {
          return Math.abs(p.x - e.x) <= PT_TOL && Math.abs(p.y - e.y) <= PT_TOL;
        });
      }).length;
      if (correct >= 4) {
        result.graph_points.mark = 1;
        result.graph_points.reason = correct + '/5 points within ±0.5 tolerance';
      } else {
        result.graph_points.mark = 0;
        result.graph_points.reason = 'Only ' + correct + '/5 points within tolerance — minimum 4 required';
      }
    } catch(e) {
      result.graph_points.needs_teacher = true;
      result.graph_points.reason = 'Malformed plotted_points JSON — teacher review required';
    }
  }

  // --- best_fit_line ---
  // Format: {"start":{"x":...,"y":...},"end":{"x":...,"y":...}}
  var lineRaw = responses['Y9_Q26b_best_fit_line'] ? responses['Y9_Q26b_best_fit_line'].raw : '';
  if (!lineRaw || lineRaw === '') {
    result.line_best_fit.needs_teacher = true;
    result.line_best_fit.reason = 'No line coordinate data — teacher review required';
  } else {
    try {
      var ln = JSON.parse(lineRaw);
      var dx = ln.end.x - ln.start.x;
      var dy = ln.end.y - ln.start.y;
      var lenSq = dx * dx + dy * dy;
      var closeCount = EXPECTED.filter(function(p) {
        if (lenSq === 0) return false;
        var t = Math.max(0, Math.min(1,
          ((p.x - ln.start.x) * dx + (p.y - ln.start.y) * dy) / lenSq));
        var distSq = Math.pow(p.x - (ln.start.x + t * dx), 2) +
                     Math.pow(p.y - (ln.start.y + t * dy), 2);
        return Math.sqrt(distSq) <= LN_TOL;
      }).length;
      if (closeCount >= 3) {
        result.line_best_fit.mark = 1;
        result.line_best_fit.reason = 'Line of best fit passes within ±1 unit of ' + closeCount + '/5 data points';
      } else {
        result.line_best_fit.mark = 0;
        result.line_best_fit.reason = 'Line passes within ±1 unit of only ' + closeCount + '/5 points — minimum 3 required';
      }
    } catch(e) {
      result.line_best_fit.needs_teacher = true;
      result.line_best_fit.reason = 'Malformed best_fit_line JSON — teacher review required';
    }
  }

  return result;
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

    // 4. Fetch answers â€” column names vary by assessment schema
    // Retry loop guards against race condition where webhook fires before
    // answer rows are committed (answers inserted immediately after attempt).
    const idCol    = pkg.fieldSchema?.idCol    || 'field_name';
    const valueCol = pkg.fieldSchema?.valueCol || 'answer_value';
    const MIN_EXPECTED_ROWS = Math.ceil(pkg.total_fields * 0.5); // at least half
    const MAX_RETRIES = 6;
    const RETRY_DELAY_MS = 2000;

    let answerRows = [];
    for (let attempt_n = 0; attempt_n <= MAX_RETRIES; attempt_n++) {
      if (attempt_n > 0) {
        await new Promise(r => setTimeout(r, RETRY_DELAY_MS));
      }
      const ansr = await fetch(
        `${SUPABASE_URL}/rest/v1/assessment_answers?attempt_id=eq.${attempt_id}&select=${idCol},${valueCol}`,
        { headers }
      );
      answerRows = await ansr.json();
      if (answerRows.length >= MIN_EXPECTED_ROWS) break;
      console.log(`[SciSpark mark] Attempt ${attempt_id}: only ${answerRows.length} answer rows on try ${attempt_n + 1}/${MAX_RETRIES + 1}, retryingâ€¦`);
    }

    const answers = {};
    for (const row of answerRows) {
      answers[row[idCol]] = row[valueCol] || '';
    }


    // 5a. Pre-compute Q28 graph marks (Y8_ENTRY_EN only)
    let q28Marks = null;
    let systemPrompt = pkg.system_prompt;
    if (pkg.code === 'Y8_ENTRY_EN') {
      const responses = {};
      for (const k in answers) {
        responses[k] = { raw: answers[k] || '', normalized: (answers[k] || '').toLowerCase().trim() };
      }
      q28Marks = markQ28Graph(responses);
      systemPrompt = systemPrompt
        .replace('{{Q28_GRAPH_POINTS_MARK}}',    String(q28Marks.graph_points.mark))
        .replace('{{Q28_GRAPH_POINTS_REASON}}',  q28Marks.graph_points.reason)
        .replace('{{Q28_GRAPH_POINTS_TEACHER}}', String(q28Marks.graph_points.needs_teacher))
        .replace('{{Q28_AXIS_LABELS_MARK}}',     String(q28Marks.axis_labels.mark))
        .replace('{{Q28_AXIS_LABELS_REASON}}',   q28Marks.axis_labels.reason)
        .replace('{{Q28_AXIS_LABELS_TEACHER}}',  String(q28Marks.axis_labels.needs_teacher))
        .replace('{{Q28_LINE_MARK}}',            String(q28Marks.line_best_fit.mark))
        .replace('{{Q28_LINE_REASON}}',          q28Marks.line_best_fit.reason)
        .replace('{{Q28_LINE_TEACHER}}',         String(q28Marks.line_best_fit.needs_teacher));
    }

    // 5b. Pre-compute Q26 graph marks (Y9_ENTRY_EN only)
    let q26Marks = null;
    if (pkg.code === 'Y9_ENTRY_EN') {
      const responsesY9 = {};
      for (const k in answers) {
        responsesY9[k] = { raw: answers[k] || '', normalized: (answers[k] || '').toLowerCase().trim() };
      }
      q26Marks = markQ26Graph(responsesY9);
      systemPrompt = systemPrompt
        .replace('{{Q26_AXIS_LABELS_MARK}}',     String(q26Marks.axis_labels.mark))
        .replace('{{Q26_AXIS_LABELS_REASON}}',   q26Marks.axis_labels.reason)
        .replace('{{Q26_AXIS_LABELS_TEACHER}}',  String(q26Marks.axis_labels.needs_teacher))
        .replace('{{Q26_GRAPH_POINTS_MARK}}',    String(q26Marks.graph_points.mark))
        .replace('{{Q26_GRAPH_POINTS_REASON}}',  q26Marks.graph_points.reason)
        .replace('{{Q26_GRAPH_POINTS_TEACHER}}', String(q26Marks.graph_points.needs_teacher))
        .replace('{{Q26_LINE_MARK}}',            String(q26Marks.line_best_fit.mark))
        .replace('{{Q26_LINE_REASON}}',          q26Marks.line_best_fit.reason)
        .replace('{{Q26_LINE_TEACHER}}',         String(q26Marks.line_best_fit.needs_teacher));
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
          { role: 'system', content: systemPrompt },
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


    // 7a. Override Q28 graph field marks with deterministic values
    if (pkg.code === 'Y8_ENTRY_EN' && q28Marks) {
      const q28Overrides = {
        'Y8_QC3b_graph_points':      q28Marks.graph_points,
        'Y8_QC3b_graph_axis_labels': q28Marks.axis_labels,
        'Y8_QC3c_line_best_fit':     q28Marks.line_best_fit
      };
      let markDelta = 0;
      for (const field of marking.fields || []) {
        const ov = q28Overrides[field.field_id];
        if (ov !== undefined) {
          markDelta += ov.mark - (field.marks_awarded || 0);
          field.marks_awarded = ov.mark;
          field.needs_review  = ov.needs_teacher;
          field.rationale     = ov.reason;
          field.review_reason = ov.needs_teacher ? ov.reason : null;
        }
      }
      if (markDelta !== 0) {
        marking.total_awarded = (marking.total_awarded || 0) + markDelta;
        if (marking.part_totals && marking.part_totals['C'])
          marking.part_totals['C'].awarded = (marking.part_totals['C'].awarded || 0) + markDelta;
      }
    }

    // 7b. Override Q26 graph field marks with deterministic values (Y9_ENTRY_EN only)
    if (pkg.code === 'Y9_ENTRY_EN' && q26Marks) {
      const q26Overrides = {
        'Y9_Q26b_axis_labels':    q26Marks.axis_labels,
        'Y9_Q26b_plotted_points': q26Marks.graph_points,
        'Y9_Q26b_best_fit_line':  q26Marks.line_best_fit
      };
      let markDelta = 0;
      for (const field of marking.fields || []) {
        const ov = q26Overrides[field.field_id];
        if (ov !== undefined) {
          markDelta += ov.mark - (field.marks_awarded || 0);
          field.marks_awarded = ov.mark;
          field.needs_review  = ov.needs_teacher;
          field.rationale     = ov.reason;
          field.review_reason = ov.needs_teacher ? ov.reason : null;
        }
      }
      if (markDelta !== 0) {
        marking.total_awarded = (marking.total_awarded || 0) + markDelta;
        if (marking.part_totals && marking.part_totals['C'])
          marking.part_totals['C'].awarded = (marking.part_totals['C'].awarded || 0) + markDelta;
      }
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
