# -*- coding: utf-8 -*-
"""
test_mark_lesson.py -- logic tests for mark-lesson.js (Python mirror)
Tests spec 9.2 cases 1-8, 10-11 (scoring + error detection).
Case 9 (DB write) tested separately via Supabase REST.
Case 12 (no-auth 401) is code-level: verified by reading mark-lesson.js line 94-95.
"""

import json, os, re, sys

CONFIG_DIR = os.path.join(os.getcwd(), "ray-configs")

# -- Mirrors mark-lesson.js loadRayConfig --
def load_ray_config(question_id):
    if not re.match(r'^[A-Z0-9_]+$', question_id, re.IGNORECASE):
        raise ValueError("Invalid question_id format")
    path = os.path.join(CONFIG_DIR, question_id + ".json")
    if not os.path.exists(path):
        raise FileNotFoundError("Config not found for " + question_id)
    with open(path, encoding='utf-8') as f:
        config = json.load(f)
    required = ["correct_line", "correct_direction", "marks", "feedback_routing"]
    for field in required:
        if field not in config:
            raise ValueError("Incomplete config for " + question_id)
    m = config["marks"]
    if m["line"] + m["direction"] != m["total"]:
        raise ValueError("Config marks inconsistent for " + question_id)
    return config

# -- Mirrors mark-lesson.js marking logic --
def mark(question_id, picked_line, picked_direction):
    # Validate inputs (400 errors)
    if not question_id or not re.match(r'^[A-Z0-9_]+$', str(question_id), re.IGNORECASE):
        return {"error": "Invalid question_id", "status": 400}
    if not picked_line or not str(picked_line).strip():
        return {"error": "Missing picked_line", "status": 400}
    if not picked_direction or not str(picked_direction).strip():
        return {"error": "Missing picked_direction", "status": 400}

    try:
        config = load_ray_config(question_id)
    except FileNotFoundError as e:
        return {"error": str(e), "status": 500}
    except ValueError as e:
        return {"error": str(e), "status": 500}

    line_correct = (picked_line == config["correct_line"])
    dir_correct  = (picked_direction == config["correct_direction"])
    score    = (config["marks"]["line"] if line_correct else 0) + \
               (config["marks"]["direction"] if dir_correct else 0)
    max_score = config["marks"]["total"]

    if line_correct and dir_correct:
        variant = config["feedback_routing"]["full"]
    elif line_correct:
        variant = config["feedback_routing"]["line_only"]
    elif dir_correct:
        variant = config["feedback_routing"]["direction_only"]
    else:
        variant = config["feedback_routing"]["neither"]

    return {
        "status": 200,
        "score": score,
        "max_score": max_score,
        "feedback_key": variant["key"],
        "feedback_variant": variant["variant"]
    }

# -- Test runner --
def check(case_num, result, expected_status, expected_fv=None, expected_score=None):
    ok = True
    reasons = []
    if result.get("status") != expected_status:
        ok = False; reasons.append("status=%s want %s" % (result.get("status"), expected_status))
    if expected_fv and result.get("feedback_variant") != expected_fv:
        ok = False; reasons.append("variant=%s want %s" % (result.get("feedback_variant"), expected_fv))
    if expected_score is not None and result.get("score") != expected_score:
        ok = False; reasons.append("score=%s want %s" % (result.get("score"), expected_score))
    tag = "PASS" if ok else "FAIL"
    detail = "  " + " | ".join(reasons) if reasons else ""
    print("  [%s] Case %02d%s" % (tag, case_num, detail))
    return ok

results = []
print("\n=== mark-lesson.js logic tests (Python mirror) ===\n")

# Case 1: TEST_Q1, B + up  -> score 2, FULL
results.append(check(1,  mark("TEST_Q1","B","up"),              200, "FULL",           2))
# Case 2: TEST_Q1, A + up  -> line wrong dir right -> score 1, PARTIAL_DIR_OK
results.append(check(2,  mark("TEST_Q1","A","up"),              200, "PARTIAL_DIR_OK", 1))
# Case 3: TEST_Q1, B + down -> line right dir wrong -> score 1, PARTIAL_LINE_OK
results.append(check(3,  mark("TEST_Q1","B","down"),            200, "PARTIAL_LINE_OK",1))
# Case 4: TEST_Q1, A + down -> both wrong -> score 0, WRONG
results.append(check(4,  mark("TEST_Q1","A","down"),            200, "WRONG",          0))
# Case 5: TEST_Q1, "X" + "up" -> line wrong dir right -> score 1, PARTIAL_DIR_OK
results.append(check(5,  mark("TEST_Q1","X","up"),              200, "PARTIAL_DIR_OK", 1))
# Case 6: TEST_Q1, B + ""  -> 400 Missing picked_direction
results.append(check(6,  mark("TEST_Q1","B",""),                400))
# Case 7: empty question_id -> 400 Invalid question_id
results.append(check(7,  mark("","B","up"),                     400))
# Case 8: nonexistent config -> 500
results.append(check(8,  mark("TEST_NONEXISTENT_Q9","B","up"),  500))
# Case 10: TEST_Q2, B + ball_to_eye -> score 2, FULL
results.append(check(10, mark("TEST_Q2","B","ball_to_eye"),     200, "FULL",           2))
# Case 11: TEST_Q3, B + downward -> score 2, FULL
results.append(check(11, mark("TEST_Q3","B","downward"),        200, "FULL",           2))

passed = sum(results)
total  = len(results)
print("\n  %d/%d passed" % (passed, total))
print("\n  Case 9  (DB write)    -> tested separately via Supabase REST")
print("  Case 12 (401 no-auth) -> mark-lesson.js line 94-95: no token -> return 401")
print()
sys.exit(0 if passed == total else 1)
