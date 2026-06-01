// graph-marker.js — SciSpark 画图题「算账脑」
// 第①块。独立模块，不碰任何现有文件。
// 照 SCISPARK_GRAPH_MARKING_REFERENCE_v1.md §6 的算法死算。
// 原则：不靠看图猜分，靠学生画的坐标数据算。同样输入永远同样输出。
// 2026-06-01  (+ §6.11 curve_best_fit 曲线评分，2026-06-01)

(function (root) {
  'use strict';

  // ────────────────────────────────────────────
  // 工具：安全解析 JSON（学生提交的栏位是 JSON 字符串）
  // 坏掉/空的 → 回 null，由上层判 needs_teacher，绝不直接 0 分
  // ────────────────────────────────────────────
  function safeParse(raw) {
    if (raw === null || raw === undefined) return null;
    if (typeof raw === 'object') return raw;          // 已经是对象
    if (typeof raw !== 'string') return null;
    var s = raw.trim();
    if (s === '') return null;
    try { return JSON.parse(s); } catch (e) { return undefined; } // undefined = 坏掉
  }

  // 轴标签文字正规化（§8.4：cm2/cm^2 等都当一样）
  // 防护：非字符串（数字/对象等坏数据）一律当空字符串，绝不让 .toLowerCase 崩。
  // 这是「暗病①」的病根修复。 normalize 被多处调用，根上塵死就全塵死。
  function normalize(text) {
    if (typeof text !== 'string') text = '';
    return text
      .toLowerCase()
      .replace(/\s+/g, ' ')
      .replace(/²|\^2/g, '2')
      .replace(/³|\^3/g, '3')
      .replace(/°c|deg c|degrees c|oc/g, 'c')
      .trim();
  }

  // ────────────────────────────────────────────────────────────
  // §6.1 轴标签
  // ────────────────────────────────────────────────────────────
  function markAxisLabels(studentRaw, expectedAxes) {
    var student = safeParse(studentRaw);
    if (student === undefined) {
      return { mark: 0, max: 1, reason: '轴标签数据坏掉，无法解析', needs_teacher: true };
    }
    if (!student || (!student.x_axis_label && !student.y_axis_label)) {
      return { mark: 0, max: 1, reason: '两个轴标签都空白', needs_teacher: true };
    }
    // 暗病①：标签存在但不是文字（前端 bug 传了数字/对象）→ 坏数据，转老师
    if ((student.x_axis_label != null && typeof student.x_axis_label !== 'string') ||
        (student.y_axis_label != null && typeof student.y_axis_label !== 'string')) {
      return { mark: 0, max: 1, reason: '轴标签类型异常（非文字），转老师', needs_teacher: true };
    }

    function checkAxis(text, spec) {
      var t = normalize(text);
      var hasVar = spec.variable_keywords.some(function (k) {
        return t.indexOf(normalize(k)) !== -1;
      });
      var hasUnit = !spec.unit_required ||
        spec.unit_keywords.some(function (k) { return t.indexOf(normalize(k)) !== -1; });
      return { hasVar: hasVar, hasUnit: hasUnit };
    }

    var x = checkAxis(student.x_axis_label, expectedAxes.x_axis);
    var y = checkAxis(student.y_axis_label, expectedAxes.y_axis);

    if (x.hasVar && x.hasUnit && y.hasVar && y.hasUnit) {
      return { mark: 1, max: 1, reason: '两轴的正确标注（变量+单位）', needs_teacher: false };
    }
    // §9 触发条件6：两轴都有字但只有一边对 → 老师看
    return {
      mark: 0, max: 1,
      reason: 'x轴: 变量=' + x.hasVar + ' 单位=' + x.hasUnit +
              '; y轴: 变量=' + y.hasVar + ' 单位=' + y.hasUnit,
      needs_teacher: !(x.hasVar && y.hasVar)
    };
  }

  // ────────────────────────────────────────────────────────────
  // §6.2 画点
  // ────────────────────────────────────────────────────────────
  function markPointPlotting(studentRaw, expectedPoints, tolerance, minMatch) {
    var pts = safeParse(studentRaw);
    if (pts === undefined) {
      return { mark: 0, max: 1, reason: '画点数据坏掉，无法解析', needs_teacher: true };
    }
    if (!Array.isArray(pts) || pts.length === 0) {
      return { mark: 0, max: 1, reason: '没有画任何点', needs_teacher: true };
    }
    // §9 触发条件7：画的点超过应有的 2 倍 → 可能没擦干净 → 老师看
    if (pts.length > expectedPoints.length * 2) {
      return {
        mark: 0, max: 1,
        reason: '画了 ' + pts.length + ' 点，远超应有 ' + expectedPoints.length + ' 点（可能没擦干净）',
        needs_teacher: true
      };
    }

    // 暗病②：数组非空但没有一个点的坐标是数字（前端 bug：字符串坐标/空对象）
    // → 这是坏数据，不是「学生画错」→ 转老师，绝不静悄悄判 0
    var validPts = pts.filter(function (sp) {
      return sp && typeof sp.x === 'number' && typeof sp.y === 'number';
    });
    if (validPts.length === 0) {
      return { mark: 0, max: 1, reason: '画点坐标格式异常（无有效数字坐标），转老师', needs_teacher: true };
    }

    var matched = 0;
    expectedPoints.forEach(function (exp) {
      var hit = pts.some(function (sp) {
        return typeof sp.x === 'number' && typeof sp.y === 'number' &&
               Math.abs(sp.x - exp.x) <= tolerance &&
               Math.abs(sp.y - exp.y) <= tolerance;
      });
      if (hit) matched++;
    });

    if (matched >= minMatch) {
      return { mark: 1, max: 1, reason: matched + '/' + expectedPoints.length + ' 点在 ±' + tolerance + ' 容差内', needs_teacher: false };
    }
    return {
      mark: 0, max: 1,
      reason: '只有 ' + matched + '/' + expectedPoints.length + ' 点在容差内（需要 ' + minMatch + '）',
      needs_teacher: false
    };
  }

  // ────────────────────────────────────────────────────────────
  // §6.3 最佳直线
  // ────────────────────────────────────────────────────────────
  function markLineBestFit(lineRaw, expectedPoints, lineTolerance, minLength) {
    var line = safeParse(lineRaw);
    if (line === undefined) {
      return { mark: 0, max: 1, reason: '直线数据坏掉，无法解析', needs_teacher: true };
    }
    if (!line || !line.start || !line.end) {
      return { mark: 0, max: 1, reason: '没有画线', needs_teacher: true };
    }
    // 暗病②：起终点存在但坐标不是数字（前端 bug）→ 坏数据，转老师，不让 NaN 静悄悄判 0
    if (typeof line.start.x !== 'number' || typeof line.start.y !== 'number' ||
        typeof line.end.x !== 'number' || typeof line.end.y !== 'number') {
      return { mark: 0, max: 1, reason: '直线坐标格式异常（非数字），转老师', needs_teacher: true };
    }

    var dx = line.end.x - line.start.x;
    var dy = line.end.y - line.start.y;
    var len = Math.sqrt(dx * dx + dy * dy);

    // §9 触发条件4：线太短 → 可能误点 → 老师看
    if (len < minLength) {
      return { mark: 0, max: 1, reason: '线太短（' + len.toFixed(1) + ' 单位）', needs_teacher: true };
    }

    // 每个标准点到这条线的垂直距离
    var allWithin = expectedPoints.every(function (p) {
      var num = Math.abs(dy * (p.x - line.start.x) - dx * (p.y - line.start.y));
      var dist = num / len;
      return dist <= lineTolerance;
    });

    if (allWithin) {
      return { mark: 1, max: 1, reason: '线在所有标准点 ±' + lineTolerance + ' 内穿过', needs_teacher: false };
    }
    return { mark: 0, max: 1, reason: '线离标准点太远，不够接近', needs_teacher: false };
  }

  // ────────────────────────────────────────────────────────────
  // §6.11 最佳曲线（手绘曲线对期望模型；§13.4 widget 吐 {prefix}_curve_best_fit）
  // 学生提交的是沿 x 等距采样的 [{x,y},...]。整条曲线对模型，不是单点。
  // ────────────────────────────────────────────────────────────
  function markCurveBestFit(curveRaw, config) {
    var curve = safeParse(curveRaw);
    if (curve === undefined) {
      return { mark: 0, max: 1, reason: '曲线数据坏掉，无法解析', needs_teacher: true };
    }
    if (!Array.isArray(curve) || curve.length < 2) {
      return { mark: 0, max: 1, reason: '没有画曲线（点太少）', needs_teacher: true };
    }
    // 暗病②同款防护：采样点坐标必须是数字，否则是坏数据 → 转老师
    var validPts = curve.filter(function (p) {
      return p && typeof p.x === 'number' && typeof p.y === 'number';
    });
    if (validPts.length < 2) {
      return { mark: 0, max: 1, reason: '曲线坐标格式异常（无有效数字坐标），转老师', needs_teacher: true };
    }

    var exp = config.expected_curve || [];
    if (exp.length === 0) {
      return { mark: 0, max: 1, reason: 'config 缺 expected_curve，无法评曲线', needs_teacher: true };
    }
    var tol = config.curve_tolerance != null ? config.curve_tolerance : 5;
    var minFrac = config.min_fraction_in_band != null ? config.min_fraction_in_band : 0.8;
    var requireDec = config.require_decreasing === true;

    // 用 validPts（已按 x 单调采样）在某个 x 插值取学生的 y
    function yAt(xq) {
      if (xq < validPts[0].x || xq > validPts[validPts.length - 1].x) return null;
      for (var i = 0; i < validPts.length - 1; i++) {
        var A = validPts[i], B = validPts[i + 1];
        if (xq >= A.x && xq <= B.x) {
          var t = (xq - A.x) / ((B.x - A.x) || 1e-9);
          return A.y + t * (B.y - A.y);
        }
      }
      return validPts[validPts.length - 1].y;
    }

    var inBand = 0, drawnYs = [];
    exp.forEach(function (e) {
      var y = yAt(e.x);
      if (y === null) return;                 // 这个 x 学生没画到
      drawnYs.push(y);
      if (Math.abs(y - e.y) <= tol) inBand++;
    });
    var frac = inBand / exp.length;

    // 形状检查：整体下降。手抖容差 = curve_tolerance（手画的平段会上下抖一个容差带，
    // 只有跳幅 > 容差才算「上升」）。和 widget 端的判分逻辑一致。
    var decreasing = true;
    for (var j = 1; j < drawnYs.length; j++) {
      if (drawnYs[j] > drawnYs[j - 1] + tol) { decreasing = false; break; }
    }

    var shapeOk = frac >= minFrac && (!requireDec || decreasing);
    if (shapeOk) {
      return {
        mark: 1, max: 1,
        reason: inBand + '/' + exp.length + ' 采样点在 ±' + tol + ' 带内（' + Math.round(frac * 100) + '%）',
        needs_teacher: false
      };
    }
    if (requireDec && !decreasing) {
      return { mark: 0, max: 1, reason: '曲线整体不是下降的，形状不对', needs_teacher: false };
    }
    return {
      mark: 0, max: 1,
      reason: '只有 ' + inBand + '/' + exp.length + ' 采样点在容差内（' + Math.round(frac * 100) +
              '%，需要 ' + Math.round(minFrac * 100) + '%）',
      needs_teacher: false
    };
  }

  // ────────────────────────────────────────────────────────────
  // §6.4 柱状图高度
  // ────────────────────────────────────────────────────────────
  function markBarHeights(barsRaw, expectedBars, tolerance) {
    var bars = safeParse(barsRaw);
    if (bars === undefined) {
      return { mark: 0, max: 1, reason: '柱状图数据坏掉', needs_teacher: true };
    }
    if (!Array.isArray(bars) || bars.length === 0) {
      return { mark: 0, max: 1, reason: '没有画柱子', needs_teacher: true };
    }
    var matched = 0;
    expectedBars.forEach(function (exp) {
      var m = bars.find(function (s) { return s.category === exp.category; });
      if (m && Math.abs(m.height - exp.height) <= tolerance) matched++;
    });
    if (matched === expectedBars.length) {
      return { mark: 1, max: 1, reason: '所有柱子高度正确', needs_teacher: false };
    }
    return { mark: 0, max: 1, reason: matched + '/' + expectedBars.length + ' 柱子正确', needs_teacher: false };
  }

  // ────────────────────────────────────────────────────────────
  // §6.5 读数
  // ────────────────────────────────────────────────────────────
  function markValueReading(valueRaw, expectedValue, tolerancePct, expectedUnit) {
    var v = safeParse(valueRaw);
    if (v === undefined) {
      return { mark: 0, max: 1, reason: '读数数据坏掉', needs_teacher: true };
    }
    if (v == null || v.value == null || typeof v.value !== 'number') {
      return { mark: 0, max: 1, reason: '没有填数值', needs_teacher: true };
    }
    var allowedDelta = Math.abs(expectedValue) * tolerancePct / 100;
    var withinValue = Math.abs(v.value - expectedValue) <= allowedDelta;
    var unitOk = !expectedUnit ||
      normalize(v.unit) === normalize(expectedUnit);

    if (withinValue && unitOk) {
      return { mark: 1, max: 1, reason: v.value + ' 在 ' + expectedValue + ' 的 ±' + tolerancePct + '% 内', needs_teacher: false };
    }
    if (withinValue && !unitOk) {
      return { mark: 0, max: 1, reason: '数值对，单位缺/错', needs_teacher: true };
    }
    return { mark: 0, max: 1, reason: v.value + ' 超出 ' + expectedValue + ' 的 ±' + tolerancePct + '%', needs_teacher: false };
  }

  // ────────────────────────────────────────────────────────────
  // §6.6 斜率（三角形 + 数值 + 单位，各 1 分）
  // ────────────────────────────────────────────────────────────
  function markGradient(gradRaw, expected, tolerancePct) {
    var s = safeParse(gradRaw);
    if (s === undefined) {
      return { mark: 0, max: 3, reason: '斜率数据坏掉', needs_teacher: true };
    }
    if (!s) {
      return { mark: 0, max: 3, reason: '没有作答', needs_teacher: true };
    }
    // 暗病①：交了个空壳 {}（widget 没碰过却被初始化成空对象）→ 等于没作答
    // 三个有意义的栏位一个都没有 → 转老师，不能当「答了全错」静悄悄判 0/3
    var hasAnything = (s.triangle != null) ||
                      (s.gradient_value != null) ||
                      (s.unit != null && s.unit !== '');
    if (!hasAnything) {
      return { mark: 0, max: 3, reason: '空作答（没有三角形/数值/单位），转老师', needs_teacher: true };
    }
    var report = { triangle_ok: false, value_ok: false, unit_ok: false };

    if (s.triangle && s.triangle.p1 && s.triangle.p2) {
      var dx = s.triangle.p2.x - s.triangle.p1.x;
      var dy = s.triangle.p2.y - s.triangle.p1.y;
      var triHyp = Math.sqrt(dx * dx + dy * dy);
      report.triangle_ok = triHyp >= expected.min_triangle_size;
    }
    var allowedDelta = Math.abs(expected.value) * tolerancePct / 100;
    // 暗病②（斜率数值版）：数值栏存在但不是数字（前端 bug 存成字符串等）
    // → 坏数据，不是「学生算错」→ 转老师，别静悄悄扣掉数值分
    var badValueType = s.gradient_value != null && typeof s.gradient_value !== 'number';
    report.value_ok = typeof s.gradient_value === 'number' &&
      Math.abs(s.gradient_value - expected.value) <= allowedDelta;
    report.unit_ok = normalize(s.unit) === normalize(expected.unit);

    var mark = (report.triangle_ok ? 1 : 0) +
               (report.value_ok ? 1 : 0) +
               (report.unit_ok ? 1 : 0);
    return {
      mark: mark, max: 3,
      reason: '三角形=' + report.triangle_ok + ' 数值=' + report.value_ok + ' 单位=' + report.unit_ok +
              (badValueType ? '（数值类型异常，转老师）' : ''),
      needs_teacher: badValueType
    };
  }

  // ────────────────────────────────────────────────────────────
  // §6.7 相关性
  // ────────────────────────────────────────────────────────────
  function markCorrelation(corrRaw, expected) {
    var s = safeParse(corrRaw);
    if (s === undefined || !s) {
      return { mark: 0, max: 1, reason: '没有选相关性', needs_teacher: true };
    }
    var val = typeof s === 'string' ? s : s.value;
    if (!val) return { mark: 0, max: 1, reason: '没有选相关性', needs_teacher: true };
    return normalize(val) === normalize(expected)
      ? { mark: 1, max: 1, reason: '相关性选对了：' + expected, needs_teacher: false }
      : { mark: 0, max: 1, reason: '学生选 ' + val + '，应为 ' + expected, needs_teacher: false };
  }

  // ────────────────────────────────────────────────────────────
  // §6.8 文字描述趋势（关键词比对）
  // ────────────────────────────────────────────────────────────
  function markPatternText(textRaw, expectedKeywords, minKeywords) {
    var text = typeof textRaw === 'string' ? textRaw : (safeParse(textRaw) || '');
    if (typeof text !== 'string' || text.trim().length < 5) {
      return { mark: 0, max: 1, reason: '没有写描述', needs_teacher: true };
    }
    var t = text.toLowerCase();
    var hits = expectedKeywords.filter(function (kw) {
      return Array.isArray(kw)
        ? kw.some(function (syn) { return t.indexOf(syn.toLowerCase()) !== -1; })
        : t.indexOf(kw.toLowerCase()) !== -1;
    }).length;
    if (hits >= minKeywords) {
      return { mark: 1, max: 1, reason: hits + '/' + expectedKeywords.length + ' 关键词命中', needs_teacher: false };
    }
    // §9 触发条件5：只命中 1 个 → 有点懂但没抓重点 → 老师看
    return { mark: 0, max: 1, reason: '只命中 ' + hits + ' 关键词（需要 ' + minKeywords + '）', needs_teacher: hits > 0 };
  }

  // ────────────────────────────────────────────────────────────
  // §6.10 异常点
  // ────────────────────────────────────────────────────────────
  function markAnomaly(anomalyRaw, expectedAnomaly, tolerance) {
    var a = safeParse(anomalyRaw);
    if (a === undefined) {
      return { mark: 0, max: 1, reason: '异常点数据坏掉', needs_teacher: true };
    }
    if (!expectedAnomaly) {
      return (a == null)
        ? { mark: 1, max: 1, reason: '正确地没标异常点', needs_teacher: false }
        : { mark: 0, max: 1, reason: '没有异常点却标了一个', needs_teacher: true };
    }
    if (!a) {
      return { mark: 0, max: 1, reason: '没标出异常点', needs_teacher: false };
    }
    var dist = Math.sqrt(
      Math.pow(a.x - expectedAnomaly.x, 2) +
      Math.pow(a.y - expectedAnomaly.y, 2)
    );
    return dist <= tolerance
      ? { mark: 1, max: 1, reason: '异常点圈对了', needs_teacher: false }
      : { mark: 0, max: 1, reason: '圈错了点当异常点', needs_teacher: true };
  }

  // ────────────────────────────────────────────────────────────
  // 总入口：markGraphQuestion(config, submission)
  // 读 config 里 marks_breakdown 有哪几项，逐项算，汇总。
  // §14 输出格式。
  // ────────────────────────────────────────────────────────────
  function markGraphQuestion(config, submission) {
    var prefix = config.field_prefix;
    function field(role) { return submission[prefix + '_' + role]; }

    var breakdown = {};
    var totalAwarded = 0;
    var totalPossible = 0;
    var anyTeacher = false;

    // 异常点：若允许且学生标了，先从标准点里剔除（§13.1）
    var expectedPoints = config.expected_points ? config.expected_points.slice() : [];
    if (config.allow_one_anomaly) {
      var aRaw = field('anomaly');
      var a = safeParse(aRaw);
      if (a && typeof a.x === 'number') {
        expectedPoints = expectedPoints.filter(function (p) {
          return !(Math.abs(p.x - a.x) <= 0.5 && Math.abs(p.y - a.y) <= 0.5);
        });
      }
    }

    var crit = config.marks_breakdown || {};

    if ('axis_labels' in crit) {
      breakdown.axis_labels = markAxisLabels(field('axis_labels'), config.expected_axes);
    }
    if ('point_plotting' in crit) {
      var minMatch = config.min_points_to_award != null
        ? config.min_points_to_award
        : Math.max(1, expectedPoints.length - 1);
      breakdown.point_plotting = markPointPlotting(
        field('graph_points'), expectedPoints,
        config.point_tolerance != null ? config.point_tolerance : 0.5,
        minMatch
      );
    }
    if ('line_best_fit' in crit) {
      breakdown.line_best_fit = markLineBestFit(
        field('line_best_fit'), expectedPoints,
        config.line_tolerance_units != null ? config.line_tolerance_units : 1.0,
        config.line_min_length_units != null ? config.line_min_length_units : 4
      );
    }
    if ('curve_best_fit' in crit) {
      breakdown.curve_best_fit = markCurveBestFit(field('curve_best_fit'), config);
    }
    if ('bar_height' in crit) {
      breakdown.bar_height = markBarHeights(
        field('bar_heights'), config.expected_bars,
        config.bar_tolerance != null ? config.bar_tolerance : 0.5
      );
    }
    if ('value_reading' in crit) {
      breakdown.value_reading = markValueReading(
        field('value_reading'), config.expected_value,
        config.value_tolerance_pct != null ? config.value_tolerance_pct : 5,
        config.expected_unit
      );
    }
    if ('gradient_calc' in crit) {
      breakdown.gradient_calc = markGradient(
        field('gradient_calc'),
        { value: config.expected_value, unit: config.expected_unit, min_triangle_size: config.min_triangle_size || 0 },
        config.value_tolerance_pct != null ? config.value_tolerance_pct : 10
      );
    }
    if ('correlation' in crit) {
      breakdown.correlation = markCorrelation(field('correlation'), config.expected_correlation);
    }
    if ('pattern_text' in crit) {
      breakdown.pattern_text = markPatternText(
        field('pattern_text'), config.expected_keywords,
        config.min_keywords != null ? config.min_keywords : 1
      );
    }
    if ('anomaly_marked' in crit) {
      breakdown.anomaly_marked = markAnomaly(
        field('anomaly'), config.expected_anomaly,
        config.anomaly_tolerance != null ? config.anomaly_tolerance : 1.0
      );
    }

    Object.keys(breakdown).forEach(function (k) {
      totalAwarded += breakdown[k].mark;
      totalPossible += breakdown[k].max;
      if (breakdown[k].needs_teacher) anyTeacher = true;
    });

    return {
      question_id: config.question_id,
      total_marks_possible: totalPossible,
      total_marks_awarded: totalAwarded,
      needs_teacher_review: anyTeacher,
      breakdown: breakdown,
      audit_trail: {
        marker_version: 'graph-marker-v1',
        config_id: config.question_id,
        ran_at: new Date().toISOString(),
        tolerance_used: config.point_tolerance != null ? config.point_tolerance : 0.5
      }
    };
  }

  var api = {
    markGraphQuestion: markGraphQuestion,
    // 单项也导出，方便测试
    markAxisLabels: markAxisLabels,
    markPointPlotting: markPointPlotting,
    markLineBestFit: markLineBestFit,
    markCurveBestFit: markCurveBestFit,
    markBarHeights: markBarHeights,
    markValueReading: markValueReading,
    markGradient: markGradient,
    markCorrelation: markCorrelation,
    markPatternText: markPatternText,
    markAnomaly: markAnomaly
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;          // Node（网站后端用这个）
  } else {
    root.GraphMarker = api;        // 浏览器
  }

})(typeof self !== 'undefined' ? self : this);
