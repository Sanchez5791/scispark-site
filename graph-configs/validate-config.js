// validate-config.js — SciSpark 画图题 config 配置层「守门员」
// 第③块。算账脑①无条件信任 config —— config 写错，会静悄悄把每个学生都判错，
// 没有「转老师」兜底。这个校验器就是在 config 上线前把错挡下来。
// 原则：结构不对 / 字段缺 / 类型错 → 报 error（挡下）；可疑但能跑 → 报 warning（提醒）。
// 2026-06-01

(function (root) {
  'use strict';

  // 算账脑①真正认得的评分项 → 它实际给的满分
  // （注意：marks_breakdown 里写的数字算账脑其实不看，它按这张表算满分）
  var CRITERION_MAX = {
    axis_labels:    1,
    point_plotting: 1,
    line_best_fit:  1,
    bar_height:     1,
    value_reading:  1,
    gradient_calc:  3,
    correlation:    1,
    pattern_text:   1,
    anomaly_marked: 1,
    curve_best_fit: 1
  };

  // 说明书 §5.2 + §3 列出的 graph_type（不在表里只警告，不挡 —— 留余地给新题型）
  var KNOWN_GRAPH_TYPES = [
    'line_plot_fit', 'line_plot_only', 'bar_chart_fill', 'scatter_correlation',
    'read_from_graph', 'gradient_calc', 'describe_pattern', 'curve_best_fit'
  ];

  function isNum(v) { return typeof v === 'number' && isFinite(v); }
  function isNonEmptyStr(v) { return typeof v === 'string' && v.trim().length > 0; }
  function isArr(v) { return Array.isArray(v); }

  // 每个评分项要求 config 里必须有的东西。
  // 返回 error 字符串数组（空数组 = 这一项配齐了）。warn 用 push 到外层。
  function checkCriterionFields(crit, cfg, warnings) {
    var errs = [];
    switch (crit) {
      case 'axis_labels': {
        var ax = cfg.expected_axes;
        if (!ax || typeof ax !== 'object') { errs.push('axis_labels 需要 expected_axes，但缺失/不是对象'); break; }
        ['x_axis', 'y_axis'].forEach(function (k) {
          var a = ax[k];
          if (!a || typeof a !== 'object') { errs.push('expected_axes.' + k + ' 缺失/不是对象'); return; }
          if (!isArr(a.variable_keywords) || a.variable_keywords.length === 0)
            errs.push('expected_axes.' + k + '.variable_keywords 必须是非空数组');
          if (a.unit_required === true && (!isArr(a.unit_keywords) || a.unit_keywords.length === 0))
            errs.push('expected_axes.' + k + ' unit_required=true 但 unit_keywords 空 —— 永远判不出单位');
        });
        break;
      }
      case 'point_plotting':
      case 'line_best_fit': {
        var pts = cfg.expected_points;
        if (!isArr(pts) || pts.length === 0) {
          errs.push(crit + ' 需要非空的 expected_points 数组');
        } else {
          pts.forEach(function (p, i) {
            if (!p || !isNum(p.x) || !isNum(p.y))
              errs.push('expected_points[' + i + '] 坐标不是数字（config 也不许有坏类型）');
          });
        }
        break;
      }
      case 'bar_height': {
        var bars = cfg.expected_bars;
        if (!isArr(bars) || bars.length === 0) { errs.push('bar_height 需要非空的 expected_bars 数组'); break; }
        bars.forEach(function (b, i) {
          if (!b || !isNonEmptyStr(b.category)) errs.push('expected_bars[' + i + '].category 必须是非空字符串');
          if (!b || !isNum(b.height)) errs.push('expected_bars[' + i + '].height 必须是数字');
        });
        break;
      }
      case 'value_reading': {
        if (!isNum(cfg.expected_value)) errs.push('value_reading 需要数字 expected_value');
        if (!isNonEmptyStr(cfg.expected_unit))
          warnings.push('value_reading 没写 expected_unit —— 那就只比数值、不验单位，确认是有意的');
        if (cfg.value_tolerance_pct != null && !isNum(cfg.value_tolerance_pct))
          errs.push('value_tolerance_pct 写了但不是数字');
        break;
      }
      case 'gradient_calc': {
        if (!isNum(cfg.expected_value)) errs.push('gradient_calc 需要数字 expected_value');
        if (!isNonEmptyStr(cfg.expected_unit)) errs.push('gradient_calc 需要 expected_unit（斜率单位要验）');
        if (cfg.min_triangle_size == null)
          warnings.push('gradient_calc 没写 min_triangle_size —— 默认 0，任何小三角都算合格，确认是有意的');
        else if (!isNum(cfg.min_triangle_size)) errs.push('min_triangle_size 不是数字');
        break;
      }
      case 'correlation': {
        if (!isNonEmptyStr(cfg.expected_correlation)) errs.push('correlation 需要非空字符串 expected_correlation');
        break;
      }
      case 'pattern_text': {
        if (!isArr(cfg.expected_keywords) || cfg.expected_keywords.length === 0)
          errs.push('pattern_text 需要非空的 expected_keywords 数组');
        if (cfg.min_keywords != null && !isNum(cfg.min_keywords))
          errs.push('min_keywords 写了但不是数字');
        break;
      }
      case 'anomaly_marked':
        // expected_anomaly 可有可无（没有=应判断「没有异常点」），不强制
        break;
      case 'curve_best_fit': {
        var curve = cfg.expected_curve;
        if (!isArr(curve) || curve.length < 2) {
          errs.push('curve_best_fit 需要至少 2 点的 expected_curve 数组（期望曲线模型）');
        } else {
          curve.forEach(function (p, i) {
            if (!p || !isNum(p.x) || !isNum(p.y))
              errs.push('expected_curve[' + i + '] 坐标不是数字（config 也不许有坏类型）');
          });
        }
        if (!isNum(cfg.curve_tolerance) || cfg.curve_tolerance <= 0)
          errs.push('curve_best_fit 需要正数 curve_tolerance（每个采样点 y 的容差带）');
        if (cfg.min_fraction_in_band != null &&
            (!isNum(cfg.min_fraction_in_band) || cfg.min_fraction_in_band <= 0 || cfg.min_fraction_in_band > 1))
          errs.push('min_fraction_in_band 写了但不是 0~1 之间的数字');
        if (cfg.sample_step != null && (!isNum(cfg.sample_step) || cfg.sample_step <= 0))
          errs.push('sample_step 写了但不是正数');
        break;
      }
    }
    return errs;
  }

  // ────────────────────────────────────────────
  // 主入口：validateConfig(cfg) → { ok, errors, warnings, question_id }
  // ────────────────────────────────────────────
  function validateConfig(cfg) {
    var errors = [], warnings = [];

    if (!cfg || typeof cfg !== 'object' || Array.isArray(cfg)) {
      return { ok: false, errors: ['config 不是一个对象'], warnings: warnings, question_id: null };
    }

    // —— 基本字段 ——
    if (!isNonEmptyStr(cfg.question_id)) errors.push('question_id 缺失或不是非空字符串');
    if (!isNonEmptyStr(cfg.field_prefix)) errors.push('field_prefix 缺失或不是非空字符串（算账脑靠它读学生栏位）');
    if (cfg.graph_type != null && KNOWN_GRAPH_TYPES.indexOf(cfg.graph_type) === -1)
      warnings.push('graph_type "' + cfg.graph_type + '" 不在已知清单里 —— 拼错了吗？');
    if (!isNum(cfg.total_marks) || cfg.total_marks <= 0) errors.push('total_marks 必须是正数');

    // —— marks_breakdown ——
    var mb = cfg.marks_breakdown;
    if (!mb || typeof mb !== 'object' || Array.isArray(mb) || Object.keys(mb).length === 0) {
      errors.push('marks_breakdown 缺失或为空 —— 没有任何要打分的项');
      return { ok: errors.length === 0, errors: errors, warnings: warnings, question_id: cfg.question_id || null };
    }

    var computedMax = 0;
    Object.keys(mb).forEach(function (crit) {
      if (!(crit in CRITERION_MAX)) {
        errors.push('marks_breakdown 里有算账脑不认得的项："' + crit + '"（拼错？算账脑会直接忽略它 → 漏判）');
        return;
      }
      var v = mb[crit];
      if (!isNum(v) || v <= 0 || v % 1 !== 0)
        errors.push('marks_breakdown.' + crit + ' 应是正整数，现在是 ' + JSON.stringify(v));
      // 作者写的分值若和算账脑实际满分对不上 → 提醒（算账脑按自己的满分算）
      if (isNum(v) && v !== CRITERION_MAX[crit])
        warnings.push('marks_breakdown.' + crit + '=' + v + '，但算账脑实际按 ' + CRITERION_MAX[crit] + ' 分算');
      computedMax += CRITERION_MAX[crit];
      // 该项要求的 config 字段齐不齐
      checkCriterionFields(crit, cfg, warnings).forEach(function (e) { errors.push(e); });
    });

    // —— total_marks 必须 = 各项真实满分之和（算账脑实际会给出的满分）——
    if (isNum(cfg.total_marks) && computedMax > 0 && cfg.total_marks !== computedMax)
      errors.push('total_marks=' + cfg.total_marks + ' 对不上各评分项满分之和 ' + computedMax);

    // —— 部署闸门：source / 校准没填好只警告 ——
    if (typeof cfg.source === 'string' && /PENDING|VERIFY|TODO/i.test(cfg.source))
      warnings.push('source 还是 PENDING/VERIFY —— 上线前必须人工核对 mark scheme');
    if (cfg.graph_canvas && /PENDING/i.test(JSON.stringify(cfg.graph_canvas)))
      warnings.push('graph_canvas 校准还是 PENDING（注：当前算账脑不消费它，但 schema 要求填）');

    return { ok: errors.length === 0, errors: errors, warnings: warnings, question_id: cfg.question_id || null };
  }

  // 从 JSON 字符串校验（先安全解析，坏 JSON → error，不崩）
  function validateConfigJSON(raw) {
    var cfg;
    try { cfg = JSON.parse(raw); }
    catch (e) { return { ok: false, errors: ['config JSON 解析失败：' + e.message], warnings: [], question_id: null }; }
    return validateConfig(cfg);
  }

  var api = { validateConfig: validateConfig, validateConfigJSON: validateConfigJSON, CRITERION_MAX: CRITERION_MAX, KNOWN_GRAPH_TYPES: KNOWN_GRAPH_TYPES };

  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.GraphConfigValidator = api;

})(typeof self !== 'undefined' ? self : this);
