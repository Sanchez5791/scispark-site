/* ============================================================
   SciSpark · 家长报告(课后 5 行摘要)— 共用核心 (compute + render)
   建立:2026-06-18  分支:feat/parent-lesson-report
   ------------------------------------------------------------
   一节课上完 → 自动生成一份「家长报告」:5 行摘要 + 可转发金句。
     ① 学了什么   ② 错在哪   ③ 进步   ④ 下一步   ⑤ 用时
   纯逻辑,无网络、无 DOM 取数。
     · computeLessonReport(input) → 把真表数据算成「报告模型」。
     · renderLessonReport(model)  → 把模型画成 HTML 字串。
   真实页(parent-lesson-report.html)喂真数据;
   样本预览(parent-lesson-report-preview.html)喂示例数据 —— 同一套画法。

   ★ 红线:本核心绝不编造数字 / 好评 / 进步。
     没数据的行返回 hasData:false,画面统一显示「暂无」并诚实说明原因
     (例如「本课暂未记录逐题作答」),绝不假装全对或编造分数。
   ★ 中文使用:只在有真实记录时显示,格式 = 场景 + 进步
     (「密度概念用了 3 次中文,第 4 次独立完成」),不准只显示次数。
   颜色 / 字体来自 /public/design-tokens.css(全站一致)。
   ============================================================ */
(function (root) {
  'use strict';

  /* ---------- helpers ---------- */
  var esc = function (s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c];
    });
  };
  function yrNum(yg) { return String(yg == null ? '' : yg).replace(/[^0-9]/g, ''); }
  function clamp(n, lo, hi) { return Math.max(lo, Math.min(hi, n)); }
  function pctOf(score, max) { return (max > 0) ? Math.round((score / max) * 100) : null; }

  function lessonCode(l) {
    if (!l) return '';
    return 'Y' + yrNum(l.year_group) + ' · U' + l.unit_number + ' · L' + l.lesson_number;
  }
  function lessonName(l) {
    if (!l) return 'Lesson · 课程';
    return l.lesson_title_en || lessonCode(l);
  }

  /* 用时:把秒数说成「约 N 分钟(M 分 S 秒)」。诚实——只来自真实时间戳。 */
  function fmtDuration(seconds) {
    if (seconds == null || !(seconds > 0)) return null;
    var s = Math.round(seconds);
    var mins = Math.floor(s / 60), secs = s % 60;
    var approxMin = Math.max(1, Math.round(s / 60));
    var exact = mins > 0 ? (mins + ' 分 ' + secs + ' 秒') : (secs + ' 秒');
    return { approxMin: approxMin, exact: exact, exactEn: (mins > 0 ? (mins + 'm ' + secs + 's') : (secs + 's')) };
  }

  /* ============================================================
     computeLessonReport(input) → model

     input = {
       child:   { full_name, year_group },
       lesson:  { year_group, unit_number, lesson_number,
                  lesson_title_en, lesson_title_zh,
                  core_idea_en, core_idea_zh },     // 核心一句话(可选)
       attempt: { status, started_at, completed_at },   // 本课 lesson_progress 行

       // —— 以下为「加分项」信号,没有就留空,画面显示「暂无」——
       questionsCaptured: bool,                     // 本课是否有逐题作答记录
       questions: [ { concept_en, concept_zh, correct } ],   // 逐题结果
       priorPct:  number|null,                      // 之前同类的分(对比基线)
       thisPct:   number|null,                      // 本课分
       chineseUsage: [ { concept_en, concept_zh, total, independentFrom } ],
       nextLesson: { year_group, unit_number, lesson_number,
                     lesson_title_en, lesson_title_zh }|null,
       allPublishedDone: bool
     }
     ============================================================ */
  function computeLessonReport(input) {
    input = input || {};
    var child = input.child || {};
    var lesson = input.lesson || null;
    var attempt = input.attempt || {};
    var questions = input.questions || [];
    var chineseUsage = input.chineseUsage || [];

    /* ── 行 ① 学了什么 ── (有课就有,来自真表 lessons) */
    var learned = {
      hasData: !!lesson,
      code: lessonCode(lesson),
      title: lessonName(lesson),
      titleZh: lesson && lesson.lesson_title_zh ? lesson.lesson_title_zh : null,
      coreEn: lesson && lesson.core_idea_en ? lesson.core_idea_en : null,
      coreZh: lesson && lesson.core_idea_zh ? lesson.core_idea_zh : null
    };

    /* ── 行 ⑤ 用时 ── (来自真实 started_at / completed_at) */
    var durSec = null;
    if (attempt.started_at && attempt.completed_at) {
      var ms = new Date(attempt.completed_at) - new Date(attempt.started_at);
      if (ms > 0) durSec = clamp(ms / 1000, 1, 120 * 60);   // 1s–120min sanity clamp
    }
    var time = { hasData: durSec != null, dur: fmtDuration(durSec) };

    /* ── 行 ② 错在哪 ── (来自逐题作答;没记录就诚实「暂无」) */
    var wrong = [], right = [];
    questions.forEach(function (q) {
      var item = { en: q.concept_en || '', zh: q.concept_zh || '' };
      if (q.correct) right.push(item); else wrong.push(item);
    });
    var mistakes = {
      captured: !!input.questionsCaptured,
      hasData: !!input.questionsCaptured,     // 有记录才算 hasData
      total: questions.length,
      rightCount: right.length,
      wrong: wrong,                            // 卡住的概念
      allCorrect: input.questionsCaptured && questions.length > 0 && wrong.length === 0
    };

    /* ── 行 ③ 进步 ── (要有「之前」和「这次」两个真分才算;否则诚实「暂无」) */
    var progress = { hasData: false, reason: 'no-baseline' };
    if (input.priorPct != null && input.thisPct != null) {
      var delta = Math.round(input.thisPct - input.priorPct);
      progress = {
        hasData: true,
        priorPct: Math.round(input.priorPct),
        thisPct: Math.round(input.thisPct),
        delta: delta,
        direction: delta > 0 ? 'up' : (delta < 0 ? 'down' : 'flat')
      };
    }

    /* ── 中文使用 ── (场景 + 进步,不准只显示次数;没记录就「暂无」) */
    var zhUse = chineseUsage.filter(function (u) {
      return u && (u.total != null) && (u.concept_zh || u.concept_en);
    }).map(function (u) {
      return {
        en: u.concept_en || '', zh: u.concept_zh || '',
        total: Number(u.total),
        independentFrom: (u.independentFrom != null) ? Number(u.independentFrom) : null
      };
    });
    var chinese = { hasData: zhUse.length > 0, items: zhUse };

    /* ── 行 ④ 下一步 ── (复习卡住的概念 + 下一课;来自真表) */
    var nl = input.nextLesson || null;
    var nextStep = {
      reviewConcept: (mistakes.captured && wrong.length) ? wrong[0] : null,
      nextLesson: nl ? {
        code: lessonCode(nl), title: lessonName(nl),
        titleZh: nl.lesson_title_zh || null
      } : null,
      allDone: !!input.allPublishedDone,
      hasData: !!((mistakes.captured && wrong.length) || nl || input.allPublishedDone)
    };

    /* ── 可转发金句 ── (★ 只用真实信号造句,绝不编造成绩 / 成就) */
    var quote = buildQuote({
      name: child.full_name, learned: learned, time: time,
      mistakes: mistakes, progress: progress, chinese: chinese
    });

    return {
      child: { name: child.full_name || '', year: child.year_group || '' },
      lesson: { code: learned.code, title: learned.title, titleZh: learned.titleZh },
      learned: learned,
      mistakes: mistakes,
      progress: progress,
      nextStep: nextStep,
      time: time,
      chinese: chinese,
      quote: quote
    };
  }

  /* 金句:按「最有料」的真实信号优先造句。每一种都只陈述真实发生的事。
     没有任何 rich 信号时,落到「完成 + 用时」的诚实底句。 */
  function buildQuote(d) {
    var nm = (d.name && String(d.name).trim()) || 'TA';
    var topic = d.learned.titleZh || d.learned.title || '这一课';

    // 1) 真实进步(有基线对比)
    if (d.progress.hasData && d.progress.delta > 0) {
      return {
        zh: nm + ' 这次比上次进步了 ' + d.progress.delta + ' 分(' +
            d.progress.priorPct + '% → ' + d.progress.thisPct + '%)——「' + topic + '」越练越稳了。',
        en: nm + ' improved ' + d.progress.delta + ' points since last time (' +
            d.progress.priorPct + '% → ' + d.progress.thisPct + '%).',
        grounded: '真实进步对比'
      };
    }
    // 2) 真实满分 / 全对
    if (d.mistakes.allCorrect) {
      return {
        zh: '今天 ' + nm + ' 把「' + topic + '」全部答对了,科学脑正在长出来。',
        en: nm + ' got every question in “' + (d.learned.title || topic) + '” right today.',
        grounded: '真实全对'
      };
    }
    // 3) 真实中文使用进步(场景 + 独立)
    if (d.chinese.hasData) {
      var u = d.chinese.items[0];
      if (u.independentFrom != null) {
        return {
          zh: nm + ' 在「' + (u.zh || u.en) + '」概念上用了 ' + u.total +
              ' 次中文,第 ' + u.independentFrom + ' 次起已经能独立完成。',
          en: nm + ' used Chinese support ' + u.total + ' times on “' + (u.en || u.zh) +
              '”, then took it independently.',
          grounded: '真实中文使用进步'
        };
      }
    }
    // 4) 诚实底句:只陈述「自己完成了这一课」+ 真实用时(最稳,永不过誉)
    var timePhrase = d.time.hasData ? ('用 ' + d.time.dur.exact + ' ') : '';
    return {
      zh: nm + ' 今天' + timePhrase + '自己完成了「' + topic + '」——科学的第一步,迈出去了。',
      en: nm + ' finished “' + (d.learned.title || topic) + '” today' +
          (d.time.hasData ? (' in ' + d.time.dur.exactEn) : '') + ' — first step into science, taken.',
      grounded: '真实完成 + 用时'
    };
  }

  /* ============================================================
     renderLessonReport(model) → HTML 字串(报告主体,无 <html> 外壳)
     ============================================================ */
  function lineHead(n, en, zh) {
    return '<div class="lr-line-h"><span class="lr-n">' + n + '</span>' +
      '<span class="lr-line-en">' + en + '</span>' +
      '<span class="lr-line-zh">· ' + zh + '</span></div>';
  }
  function emptyNote(zh, en) {
    return '<div class="lr-empty">' + zh +
      '<span class="lr-en">' + en + '</span></div>';
  }

  function renderLessonReport(m) {
    var H = [];

    /* ── 信头 ── */
    var nm = m.child.name || 'Your child';
    H.push(
      '<header class="lr-head">' +
        '<div class="lr-eyebrow"><span class="lr-dot"></span>Lesson report<span class="lr-zh-tag">· 课后家长报告</span></div>' +
        '<h1 class="lr-name">' + esc(nm) +
          (m.child.year ? ' <span class="lr-yr">' + esc(m.child.year) + '</span>' : '') + '</h1>' +
        '<div class="lr-sub">' + esc(m.lesson.code) + ' &nbsp;·&nbsp; ' + esc(m.lesson.title) +
          (m.lesson.titleZh ? ' <span class="lr-zh-tag">' + esc(m.lesson.titleZh) + '</span>' : '') + '</div>' +
      '</header>'
    );

    /* ── 可转发金句(置顶,最显眼,方便家长截图)── */
    if (m.quote) {
      H.push(
        '<section class="lr-quote">' +
          '<div class="lr-quote-tag">可转发金句 · Share this</div>' +
          '<blockquote class="lr-quote-zh">' + esc(m.quote.zh) + '</blockquote>' +
          '<div class="lr-quote-en">' + esc(m.quote.en) + '</div>' +
        '</section>'
      );
    }

    /* ── ① 学了什么 ── */
    var lr = m.learned, lH = '';
    if (lr.hasData) {
      lH += '<div class="lr-learned-title">' + esc(lr.title) +
        (lr.titleZh ? ' <span class="lr-zh-tag">' + esc(lr.titleZh) + '</span>' : '') + '</div>';
      if (lr.coreZh || lr.coreEn) {
        lH += '<div class="lr-learned-core">🔑 ' + esc(lr.coreZh || lr.coreEn) +
          (lr.coreEn && lr.coreZh ? '<span class="lr-en">' + esc(lr.coreEn) + '</span>' : '') + '</div>';
      }
    } else {
      lH = emptyNote('暂无课程信息。', 'No lesson information.');
    }
    H.push('<section class="lr-line">' + lineHead('①', 'What we learned', '学了什么') + lH + '</section>');

    /* ── ② 错在哪 ── */
    var mk = m.mistakes, mH = '';
    if (!mk.captured) {
      mH = emptyNote('本课暂未记录逐题作答,所以无法列出卡住的概念。',
        'This lesson does not yet record per-question answers, so we can’t list specific gaps.');
    } else if (mk.allCorrect) {
      mH = '<div class="lr-allright">✅ 全部答对(' + mk.total + '/' + mk.total + ')—— 这一课没有卡住的地方。' +
        '<span class="lr-en">All ' + mk.total + ' correct — nothing stuck this lesson.</span></div>';
    } else if (mk.wrong.length) {
      mH = '<div class="lr-sub-line">答对 ' + mk.rightCount + '/' + mk.total +
        ';以下概念卡住了 · Stuck on:</div>' +
        '<ul class="lr-gaps">' + mk.wrong.map(function (w) {
          return '<li><span class="lr-x">✕</span>' + esc(w.zh || w.en) +
            (w.en && w.zh ? ' <span class="lr-en-inline">' + esc(w.en) + '</span>' : '') + '</li>';
        }).join('') + '</ul>';
    } else {
      mH = emptyNote('本课暂无逐题数据。', 'No per-question data for this lesson.');
    }
    H.push('<section class="lr-line">' + lineHead('②', 'Where it got stuck', '错在哪') + mH + '</section>');

    /* ── ③ 进步 ── */
    var pg = m.progress, pH = '';
    if (pg.hasData) {
      var arrow = pg.direction === 'up' ? '▲' : (pg.direction === 'down' ? '▼' : '＝');
      var cls = pg.direction === 'up' ? 'up' : (pg.direction === 'down' ? 'down' : 'flat');
      var word = pg.direction === 'up' ? ('进步 ' + pg.delta + ' 分') :
                 pg.direction === 'down' ? ('回落 ' + Math.abs(pg.delta) + ' 分') : '与上次持平';
      pH = '<div class="lr-prog ' + cls + '"><span class="lr-prog-arrow">' + arrow + '</span>' +
        '<span class="lr-prog-num">' + pg.priorPct + '% → ' + pg.thisPct + '%</span>' +
        '<span class="lr-prog-word">' + word + '</span></div>';
    } else {
      pH = emptyNote('这是该学生第一份可对比的记录,暂无进步基线。',
        'This is the first comparable record — no baseline to compare against yet.');
    }
    H.push('<section class="lr-line">' + lineHead('③', 'Progress', '进步') + pH + '</section>');

    /* ── ④ 下一步 ── */
    var ns = m.nextStep, nH = '';
    if (ns.reviewConcept) {
      nH += '<div class="lr-next-row"><span class="lr-next-ico">🔁</span><div>' +
        '<div class="lr-next-t">复习 · Review</div>' +
        '<div class="lr-next-d">先把「' + esc(ns.reviewConcept.zh || ns.reviewConcept.en) + '」再过一遍。</div></div></div>';
    }
    if (ns.nextLesson) {
      nH += '<div class="lr-next-row"><span class="lr-next-ico">▶</span><div>' +
        '<div class="lr-next-t">下一课 · Next lesson</div>' +
        '<div class="lr-next-d">' + esc(ns.nextLesson.code) + ' —— ' + esc(ns.nextLesson.title) +
        (ns.nextLesson.titleZh ? '(' + esc(ns.nextLesson.titleZh) + ')' : '') + '</div></div></div>';
    } else if (ns.allDone) {
      nH += '<div class="lr-next-row"><span class="lr-next-ico">✓</span><div>' +
        '<div class="lr-next-t">下一课 · Next lesson</div>' +
        '<div class="lr-next-d">已学完所有已上线课程,新课即将上线。<span class="lr-en">All published lessons done — new ones coming soon.</span></div></div></div>';
    }
    if (!nH) {
      nH = emptyNote('暂无下一步建议。', 'No next-step suggestion yet.');
    }
    H.push('<section class="lr-line">' + lineHead('④', 'Next step', '下一步') + nH + '</section>');

    /* ── ⑤ 用时 ── */
    var tm = m.time, tH = '';
    if (tm.hasData) {
      tH = '<div class="lr-time"><span class="lr-time-big">约 ' + tm.dur.approxMin + ' 分钟</span>' +
        '<span class="lr-time-exact">实际 ' + tm.dur.exact + ' · ' + tm.dur.exactEn + '</span></div>' +
        '<div class="lr-foot-note">用时按真实开始 / 完成时间计算。<span class="lr-en">Measured from real start / finish timestamps.</span></div>';
    } else {
      tH = emptyNote('暂无用时记录(缺开始或完成时间)。', 'No duration recorded (missing start or finish time).');
    }
    H.push('<section class="lr-line">' + lineHead('⑤', 'Time spent', '用时') + tH + '</section>');

    /* ── 中文使用(场景 + 进步)── */
    var zh = m.chinese, zH = '';
    if (zh.hasData) {
      zH = '<ul class="lr-zhuse">' + zh.items.map(function (u) {
        var line = '「' + esc(u.zh || u.en) + '」概念用了 ' + u.total + ' 次中文';
        if (u.independentFrom != null) line += ',第 ' + u.independentFrom + ' 次起已能独立完成';
        line += '。';
        return '<li>' + line + '</li>';
      }).join('') + '</ul>';
    } else {
      zH = emptyNote('本课暂未记录中文辅助使用情况。',
        'Chinese-support usage is not recorded for this lesson yet.');
    }
    H.push('<section class="lr-line lr-line--zh">' +
      lineHead('中', 'Chinese support', '中文使用(场景 + 进步)') + zH + '</section>');

    return H.join('\n');
  }

  root.LessonReportCore = {
    computeLessonReport: computeLessonReport,
    renderLessonReport: renderLessonReport,
    _esc: esc,
    _fmtDuration: fmtDuration
  };
})(typeof globalThis !== 'undefined' ? globalThis : (typeof window !== 'undefined' ? window : this));

/* Node (Vercel serverless / future per-lesson email) — let any server job
   require() the SAME compute logic, so email numbers can't drift from the page. */
if (typeof module !== 'undefined' && module.exports) {
  module.exports = (typeof globalThis !== 'undefined' ? globalThis : this).LessonReportCore;
}
