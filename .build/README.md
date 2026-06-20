# Intake "Learning Starting Point Check" — build provenance

Generated page: `assessment/starting-point/en/index.html` (+ `intake.js`).

Source question papers (NOT committed — 1.5 MB; from the strategist handover
`SciSpark_IntakeTest_FULL_HANDOVER_2026-06-20.zip`): place
`assessment-y7-EN.html`, `assessment-y8-EN.html`, `assessment-y9-EN.html`
in this folder, then run:

    python build_intake.py   # extracts the 12 Part C/D blocks, strips original
                             # form controls, keeps figures/tables, adds one
                             # long-answer box per question
    python assemble.py       # injects fragments into index_template.html

Question selection (strategist-locked, do not change):
Y7 Q26/Q27/Q29/Q31, Y8 Q27/Q26/Q29/Q32, Y9 Q27/Q28/Q30/Q31 -> Q1..Q12,
12 questions / 60 marks, all human-marked (no auto-grading).
