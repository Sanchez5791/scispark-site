/* ============================================================
   SciSpark · 家长周报 — 共用核心 (compute + render)
   建立:2026-06-16  分支:feat/parent-weekly-report
   ------------------------------------------------------------
   纯逻辑,无网络、无 DOM 取数。
   ① computeReport(input) → 把真表数据算成 5 块「报告模型」。
   ② renderReport(model)  → 把模型画成 HTML 字串。
   真实页(parent-weekly-report.html)用真数据喂它;
   样本预览(...-preview.html)用示例数据喂它 —— 同一套画法。

   红线:本核心绝不编造数字。没数据的块返回 hasData:false,
        画面统一显示「本周暂无学习记录」之类的诚实占位。
   颜色/字体来自 /public/design-tokens.css(全站一致)。
   ============================================================ */
(function (root) {
  'use strict';

  /* ---------- helpers ---------- */
  var esc = function (s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c];
    });
  };
  var MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  function fmtDay(d) { return d.getDate() + ' ' + MONTHS[d.getMonth()]; }
  function fmtRange(start, end) {
    // e.g. "9 – 15 Jun 2026"  /  same-month collapse
    if (start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear()) {
      return start.getDate() + ' – ' + end.getDate() + ' ' + MONTHS[end.getMonth()] + ' ' + end.getFullYear();
    }
    return fmtDay(start) + ' – ' + fmtDay(end) + ' ' + end.getFullYear();
  }
  function clamp(n, lo, hi) { return Math.max(lo, Math.min(hi, n)); }
  function yrNum(yg) { return String(yg == null ? '' : yg).replace(/[^0-9]/g, ''); }
  function pctOf(score, max) { return (max > 0) ? Math.round((score / max) * 100) : null; }

  /* week bounds (Mon 00:00 → Sun 23:59:59.999), local time, for any date inside it */
  function weekBounds(anyDate) {
    var d = new Date(anyDate.getFullYear(), anyDate.getMonth(), anyDate.getDate());
    var dow = (d.getDay() + 6) % 7;             // 0 = Monday
    var start = new Date(d); start.setDate(d.getDate() - dow); start.setHours(0, 0, 0, 0);
    var end = new Date(start); end.setDate(start.getDate() + 6); end.setHours(23, 59, 59, 999);
    return { start: start, end: end };
  }
  function inWeek(iso, b) {
    if (!iso) return false;
    var t = new Date(iso).getTime();
    return t >= b.start.getTime() && t <= b.end.getTime();
  }

  /* subject map — best-effort (year_group, unit_number) → subject.
     Unknown units degrade to a neutral "Science · 理科" so we never mislabel. */
  var SUBJECTS = {
    chem: ['Chemistry', '化学'],
    phys: ['Physics', '物理'],
    bio: ['Biology', '生物'],
    earth: ['Earth & Space', '地球与太空'],
    sci: ['Science', '理科']
  };
  var UNIT_SUBJECT = {
    '7-0': 'sci', '7-1': 'chem', '7-2': 'chem', '7-3': 'chem', '7-4': 'phys',
    '7-5': 'bio', '7-6': 'bio', '7-7': 'phys', '7-8': 'phys', '7-9': 'earth',
    '8-1': 'chem', '8-2': 'phys', '8-3': 'bio', '8-4': 'phys', '8-5': 'phys',
    '9-1': 'chem', '9-2': 'phys', '9-3': 'bio', '9-4': 'phys', '9-5': 'phys'
  };
  function subjectKey(lesson) {
    if (!lesson) return 'sci';
    return UNIT_SUBJECT[yrNum(lesson.year_group) + '-' + lesson.unit_number] || 'sci';
  }
  function lessonLabel(l) {
    if (!l) return 'Lesson · 课程';
    return l.lesson_title_en || ('Y' + yrNum(l.year_group) + ' U' + l.unit_number + ' L' + l.lesson_number);
  }

  /* ============================================================
     computeReport(input) → model
     input = {
       child:            { full_name, year_group },
       weekDate:         Date (any day inside the target week; default = today),
       lessons:          [ {id, year_group, unit_number, lesson_number,
                            lesson_title_en, lesson_title_zh, is_published} ],
       progress:         [ {lesson_id, status, started_at, completed_at, updated_at} ],
       questionAttempts: [ {lesson_id, score, max_score, marked_at} ],
       attempts:         [ {assessment_code, total_score, total_marks,
                            time_spent_seconds, submitted_at} ]
     }
     ============================================================ */
  function computeReport(input) {
    var child = input.child || {};
    var lessons = input.lessons || [];
    var progress = input.progress || [];
    var qAttempts = input.questionAttempts || [];
    var attempts = input.attempts || [];
    var b = weekBounds(input.weekDate || new Date());

    var lessonById = {};
    lessons.forEach(function (l) { lessonById[l.id] = l; });

    /* —— lessons completed THIS WEEK —— */
    var weekDone = progress.filter(function (p) {
      return p.status === 'completed' && inWeek(p.completed_at || p.updated_at, b);
    });

    /* —— per-lesson score this week, from lesson_question_attempts —— */
    var byLessonScore = {};   // lesson_id → { score, max }
    qAttempts.forEach(function (q) {
      if (!inWeek(q.marked_at, b)) return;
      if (q.score == null || q.max_score == null) return;
      var s = byLessonScore[q.lesson_id] || (byLessonScore[q.lesson_id] = { score: 0, max: 0 });
      s.score += Number(q.score); s.max += Number(q.max_score);
    });

    /* —— assessments submitted this week (entry / diagnostic) —— */
    var weekAttempts = attempts.filter(function (a) { return inWeek(a.submitted_at, b); });

    /* ===== BLOCK 2 — 本周概况 ===== */
    var lessonsCompleted = weekDone.length;

    // study minutes: derive from real timestamps + tracked assessment time. Honest approximation.
    var minutes = 0, minutesHasSrc = false;
    weekDone.forEach(function (p) {
      if (p.started_at && p.completed_at) {
        var m = (new Date(p.completed_at) - new Date(p.started_at)) / 60000;
        if (m > 0) { minutes += clamp(m, 1, 120); minutesHasSrc = true; }
      }
    });
    weekAttempts.forEach(function (a) {
      if (a.time_spent_seconds != null && a.time_spent_seconds > 0) {
        minutes += a.time_spent_seconds / 60; minutesHasSrc = true;
      }
    });
    minutes = minutesHasSrc ? Math.round(minutes) : null;

    // average score: per-lesson % (this week) + assessment % (this week)
    var pcts = [];
    Object.keys(byLessonScore).forEach(function (id) {
      var p = pctOf(byLessonScore[id].score, byLessonScore[id].max);
      if (p != null) pcts.push(p);
    });
    weekAttempts.forEach(function (a) {
      var p = pctOf(a.total_score, a.total_marks);
      if (p != null) pcts.push(p);
    });
    var avgScore = pcts.length ? Math.round(pcts.reduce(function (x, y) { return x + y; }, 0) / pcts.length) : null;

    var overview = {
      lessonsCompleted: lessonsCompleted,
      avgScore: avgScore,                       // % or null
      minutes: minutes,                          // approx minutes or null
      hasData: lessonsCompleted > 0 || weekAttempts.length > 0
    };

    /* ===== BLOCK 3 — 这周学了什么 ===== */
    var learnedItems = weekDone.map(function (p) {
      var l = lessonById[p.lesson_id];
      var sc = byLessonScore[p.lesson_id];
      var pct = sc ? pctOf(sc.score, sc.max) : null;
      return {
        title: lessonLabel(l),
        titleZh: l && l.lesson_title_zh ? l.lesson_title_zh : null,
        subjectKey: subjectKey(l),
        pct: pct,
        score: sc ? sc.score : null,
        max: sc ? sc.max : null,
        when: p.completed_at || p.updated_at
      };
    }).sort(function (a, c) { return new Date(c.when || 0) - new Date(a.when || 0); });
    // also surface this-week assessments as learned items (no lesson, but real activity)
    weekAttempts.forEach(function (a) {
      learnedItems.push({
        title: (a.assessment_code || 'Assessment').replace(/_/g, ' '),
        titleZh: '测评',
        subjectKey: 'sci',
        pct: pctOf(a.total_score, a.total_marks),
        score: a.total_score, max: a.total_marks,
        when: a.submitted_at, isAssessment: true
      });
    });
    var learned = { items: learnedItems, hasData: learnedItems.length > 0 };

    /* ===== BLOCK 4 — 亮点 & 加强 ===== */
    // group scored learned items by subject
    var bySubj = {};
    learnedItems.forEach(function (it) {
      if (it.pct == null) return;
      var k = it.subjectKey;
      (bySubj[k] = bySubj[k] || { sum: 0, n: 0, key: k }).sum += it.pct;
      bySubj[k].n++;
    });
    var subjAvgs = Object.keys(bySubj).map(function (k) {
      return { key: k, avg: Math.round(bySubj[k].sum / bySubj[k].n), n: bySubj[k].n };
    }).sort(function (a, c) { return c.avg - a.avg; });

    var highlight = null, strengthen = null;
    var scoredItems = learnedItems.filter(function (it) { return it.pct != null; });
    if (subjAvgs.length >= 2) {
      highlight = { type: 'subject', subjectKey: subjAvgs[0].key, pct: subjAvgs[0].avg };
      var weakest = subjAvgs[subjAvgs.length - 1];
      if (weakest.avg < 80) strengthen = { type: 'subject', subjectKey: weakest.key, pct: weakest.avg };
    } else if (scoredItems.length >= 1) {
      // single subject (or single lesson) — highlight best lesson, flag any low lesson
      var best = scoredItems.slice().sort(function (a, c) { return c.pct - a.pct; })[0];
      var low = scoredItems.slice().sort(function (a, c) { return a.pct - c.pct; })[0];
      highlight = { type: 'lesson', title: best.title, pct: best.pct };
      if (low.pct < 60) strengthen = { type: 'lesson', title: low.title, pct: low.pct };
    }
    var insight = {
      highlight: highlight,
      strengthen: strengthen,
      hasData: scoredItems.length > 0
    };

    /* ===== BLOCK 5 — 下周建议 ===== */
    // review = lowest-scoring lesson this week (if any scored)
    var review = null;
    if (scoredItems.length) {
      var lowest = scoredItems.slice().sort(function (a, c) { return a.pct - c.pct; })[0];
      review = { title: lowest.title, pct: lowest.pct };
    }
    // next lesson = first published lesson (by year,unit,lesson) the child hasn't completed
    var completedIds = {};
    progress.forEach(function (p) { if (p.status === 'completed') completedIds[p.lesson_id] = 1; });
    var ordered = lessons.filter(function (l) { return l.is_published; }).slice().sort(function (a, c) {
      return (yrNum(a.year_group) - yrNum(c.year_group)) ||
        (a.unit_number - c.unit_number) || (a.lesson_number - c.lesson_number);
    });
    var nextLesson = null, allDone = false;
    for (var i = 0; i < ordered.length; i++) {
      if (!completedIds[ordered[i].id]) { nextLesson = ordered[i]; break; }
    }
    if (!nextLesson && ordered.length > 0) allDone = true;
    var suggestion = {
      review: review,
      nextLesson: nextLesson ? {
        title: lessonLabel(nextLesson), titleZh: nextLesson.lesson_title_zh || null,
        year: yrNum(nextLesson.year_group), unit: nextLesson.unit_number, lesson: nextLesson.lesson_number
      } : null,
      allDone: allDone,
      hasData: !!(review || nextLesson || allDone)
    };

    return {
      child: { name: child.full_name || '', year: child.year_group || '' },
      week: { start: b.start, end: b.end, label: fmtRange(b.start, b.end) },
      anyActivity: overview.hasData,
      overview: overview,
      learned: learned,
      insight: insight,
      suggestion: suggestion
    };
  }

  /* ============================================================
     renderReport(model) → HTML string (report body, no <html> shell)
     ============================================================ */
  function subjName(key) { var s = SUBJECTS[key] || SUBJECTS.sci; return { en: s[0], zh: s[1] }; }

  function scorePill(pct) {
    if (pct == null) return '<span class="wr-pill grey">No score · 无评分</span>';
    var cls = pct >= 80 ? 'green' : pct >= 60 ? 'amber' : 'red';
    return '<span class="wr-pill ' + cls + '">' + pct + '%</span>';
  }

  function renderReport(m) {
    var H = [];

    /* ── BLOCK 1 · 信头 ── */
    var nm = m.child.name || 'Your child';
    H.push(
      '<header class="wr-head">' +
        '<div class="wr-eyebrow"><span class="wr-dot"></span>Weekly report<span class="zh">· 家长周报</span></div>' +
        '<h1 class="wr-name">' + esc(nm) +
          (m.child.year ? ' <span class="wr-yr">' + esc(m.child.year) + '</span>' : '') + '</h1>' +
        '<div class="wr-week">' + esc(m.week.label) + ' <span class="zh">· 本周</span></div>' +
      '</header>'
    );

    /* If the whole week is empty → one honest notice, then still show next-lesson nudge */
    if (!m.anyActivity) {
      H.push(
        '<section class="wr-card wr-empty-week">' +
          '<div class="wr-empty-big">本周暂无学习记录</div>' +
          '<div class="wr-empty-sub">No learning activity recorded this week.</div>' +
          '<p class="wr-empty-note">' +
            '这周还没有上课或测评记录,所以没有可统计的数据 —— 我们不编造数字。' +
            '<span class="zh-en">Nothing was logged this week, so there is nothing to summarise — we never invent numbers.</span>' +
          '</p>' +
        '</section>'
      );
      // still offer the "next lesson" nudge if we know it
      if (m.suggestion.nextLesson || m.suggestion.allDone) {
        H.push(renderSuggestion(m.suggestion, true));
      }
      return H.join('\n');
    }

    /* ── BLOCK 2 · 本周概况 ── */
    var ov = m.overview;
    function statCell(kEn, kZh, val, empty) {
      var has = val != null && val !== '';
      return '<div class="wr-stat">' +
        '<div class="wr-stat-k">' + kEn + ' <span class="zh">· ' + kZh + '</span></div>' +
        '<div class="wr-stat-v' + (has ? '' : ' empty') + '">' + (has ? val : (empty || '暂无')) + '</div>' +
      '</div>';
    }
    H.push(
      '<section class="wr-card">' +
        '<div class="wr-card-h"><span class="wr-n">01</span>本周概况<span class="zh">· This week at a glance</span></div>' +
        '<div class="wr-stats3">' +
          statCell('Lessons done', '完成课程', ov.lessonsCompleted > 0 ? (ov.lessonsCompleted + ' <span class="wr-unit">节 lessons</span>') : null, '0 节') +
          statCell('Avg score', '平均分', ov.avgScore != null ? (ov.avgScore + '<span class="wr-unit">%</span>') : null) +
          statCell('Study time', '学习时长', ov.minutes != null ? ('约 ' + ov.minutes + ' <span class="wr-unit">分钟 min</span>') : null) +
        '</div>' +
        (ov.minutes != null ? '<div class="wr-foot-note">学习时长按真实开始 / 完成时间估算。<span class="zh-en">Study time is estimated from real start / finish timestamps.</span></div>' : '') +
      '</section>'
    );

    /* ── BLOCK 3 · 这周学了什么 ── */
    var learnRows = m.learned.items.map(function (it) {
      return '<div class="wr-row">' +
        '<div class="wr-row-ico' + (it.isAssessment ? ' assess' : '') + '">' + (it.isAssessment ? '📋' : '📘') + '</div>' +
        '<div class="wr-row-body">' +
          '<div class="wr-row-title">' + esc(it.title) + '</div>' +
          '<div class="wr-row-sub">' + (it.titleZh ? esc(it.titleZh) + ' · ' : '') + subjName(it.subjectKey).zh + '</div>' +
        '</div>' +
        '<div class="wr-row-right">' + scorePill(it.pct) + '</div>' +
      '</div>';
    }).join('');
    H.push(
      '<section class="wr-card">' +
        '<div class="wr-card-h"><span class="wr-n">02</span>这周学了什么<span class="zh">· What we covered</span></div>' +
        '<div class="wr-list">' + learnRows + '</div>' +
      '</section>'
    );

    /* ── BLOCK 4 · 亮点 & 加强 ── */
    var ins = m.insight, insideH = '';
    if (ins.hasData) {
      if (ins.highlight) {
        var hl = ins.highlight.type === 'subject'
          ? (subjName(ins.highlight.subjectKey).zh + ' ' + subjName(ins.highlight.subjectKey).en + ' 表现最稳(' + ins.highlight.pct + '%)')
          : ('「' + esc(ins.highlight.title) + '」做得最好(' + ins.highlight.pct + '%)');
        insideH += '<div class="wr-insight good"><div class="wr-insight-k">亮点 · Highlight</div><div class="wr-insight-v">' + hl + '</div></div>';
      }
      if (ins.strengthen) {
        var st = ins.strengthen.type === 'subject'
          ? (subjName(ins.strengthen.subjectKey).zh + ' ' + subjName(ins.strengthen.subjectKey).en + ' 可以再加强(' + ins.strengthen.pct + '%)')
          : ('「' + esc(ins.strengthen.title) + '」建议再复习一次(' + ins.strengthen.pct + '%)');
        insideH += '<div class="wr-insight warn"><div class="wr-insight-k">加强 · To strengthen</div><div class="wr-insight-v">' + st + '</div></div>';
      }
      if (!ins.strengthen) {
        insideH += '<div class="wr-insight good"><div class="wr-insight-k">加强 · To strengthen</div><div class="wr-insight-v">本周各项都稳,继续保持就好。<span class="zh-en">All steady this week — keep it up.</span></div></div>';
      }
    } else {
      insideH = '<div class="wr-insight muted"><div class="wr-insight-v">本周暂无评分数据,无法判断强弱项。<span class="zh-en">No scored work this week, so we can\'t flag strengths or gaps yet.</span></div></div>';
    }
    H.push(
      '<section class="wr-card">' +
        '<div class="wr-card-h"><span class="wr-n">03</span>亮点 & 加强<span class="zh">· Strengths & focus</span></div>' +
        insideH +
      '</section>'
    );

    /* ── BLOCK 5 · 下周建议 ── */
    H.push(renderSuggestion(m.suggestion, false));

    return H.join('\n');
  }

  function renderSuggestion(s, weekEmpty) {
    var rows = '';
    if (s.review) {
      rows += '<div class="wr-sugg"><span class="wr-sugg-ico">🔁</span><div>' +
        '<div class="wr-sugg-t">复习 · Review</div>' +
        '<div class="wr-sugg-d">先把「' + esc(s.review.title) + '」再过一遍(本周 ' + s.review.pct + '%)。' +
        '<span class="zh-en">Revisit “' + esc(s.review.title) + '” first.</span></div></div></div>';
    }
    if (s.nextLesson) {
      rows += '<div class="wr-sugg"><span class="wr-sugg-ico">▶</span><div>' +
        '<div class="wr-sugg-t">下一课 · Next lesson</div>' +
        '<div class="wr-sugg-d">Y' + esc(s.nextLesson.year) + ' · U' + esc(s.nextLesson.unit) + ' · L' + esc(s.nextLesson.lesson) +
        ' —— ' + esc(s.nextLesson.title) +
        (s.nextLesson.titleZh ? '(' + esc(s.nextLesson.titleZh) + ')' : '') + '</div></div></div>';
    } else if (s.allDone) {
      rows += '<div class="wr-sugg"><span class="wr-sugg-ico">✓</span><div>' +
        '<div class="wr-sugg-t">下一课 · Next lesson</div>' +
        '<div class="wr-sugg-d">已学完所有已上线课程,敬请期待新课。<span class="zh-en">All published lessons done — new ones coming soon.</span></div></div></div>';
    }
    if (!rows) {
      rows = '<div class="wr-sugg muted"><div class="wr-sugg-d">暂无建议。<span class="zh-en">No suggestions yet.</span></div></div>';
    }
    return '<section class="wr-card">' +
      '<div class="wr-card-h"><span class="wr-n">' + (weekEmpty ? '01' : '04') + '</span>下周建议<span class="zh">· For next week</span></div>' +
      rows +
    '</section>';
  }

  root.WeeklyReportCore = {
    computeReport: computeReport,
    renderReport: renderReport,
    weekBounds: weekBounds,
    _esc: esc
  };
})(typeof window !== 'undefined' ? window : this);
