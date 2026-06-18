/* ============================================================================
 * SciSpark · 学生分等级 Level 系统 (方案 B) — 共用前端引擎
 * Order: SciSpark_Order_To_HandsRoom_StudentLevel_PlanB_2026-06-18
 * ----------------------------------------------------------------------------
 * 一个文件给 课堂页 / 入学定级 / 家长台 / level-demo 共用.
 * 方案 B = 难度 + 提示 (不做游戏化; 那是方案 C, 见 CONFIG.rewards 预留).
 *
 * 死规则 (与 sql/student_level_system.sql 对齐):
 *   • 真实等级 backend_level 可升可降, 决定题目难度 + 提示量.
 *   • 显示等级 display_level 只升不降 (= 历史最高), 给学生/家长看.
 *   • 真数据才显示; 没有 → 调用方显示「暂无」.
 *   • 方案 C 奖励层以后才加 → 结构上用 rewards 预留, 现在不渲染.
 * 阈值与 SQL 函数保持一致, 改一处记得两边都改.
 * ==========================================================================*/
(function (global) {
  'use strict';

  var CONFIG = {
    // 三个等级的呈现 + 方案B行为 (难度档 + 提示档)
    levels: {
      1: {
        key: 1, label_en: 'Level 1', short: 'L1', name_zh: '起步',
        desc_en: 'Easier questions, step-by-step hints',
        desc_zh: '以简单题为主 · 提示多、手把手',
        difficulty: 'easy',   // 题目难度档
        hint_tier: 'full',    // 提示档: 提示多
        color: '#2563EB', pale: '#EFF6FF', ink: '#1E40AF'
      },
      2: {
        key: 2, label_en: 'Level 2', short: 'L2', name_zh: '进阶',
        desc_en: 'Medium questions, balanced hints',
        desc_zh: '中等难度题 · 提示适中',
        difficulty: 'medium',
        hint_tier: 'medium',  // 提示中
        color: '#EA580C', pale: '#FFF6EE', ink: '#9A3412'
      },
      3: {
        key: 3, label_en: 'Level 3', short: 'L3', name_zh: '挑战',
        desc_en: 'Harder challenge questions, minimal hints',
        desc_zh: '难题、挑战题 · 提示少、让你自己想',
        difficulty: 'hard',
        hint_tier: 'light',   // 提示少
        color: '#7C3AED', pale: '#F5F3FF', ink: '#5B21B6'
      }
    },

    // 入学定级阈值 (0..100). 必须与 SQL apply_placement_result 一致.
    placement: { thresholds: [ { min: 80, level: 3 }, { min: 50, level: 2 }, { min: 0, level: 1 } ] },

    // 单元末重算: 每次最多动 ±1 级 (与 SQL recompute_student_level 一致).
    recompute: { maxStep: 1, thresholds: [ { min: 80, level: 3 }, { min: 50, level: 2 }, { min: 0, level: 1 } ] },

    // ── 方案 C 预留 (现在不做, 只留位; DB 端对应 student_levels.rewards jsonb) ──
    // 以后老板说加游戏化时, 在这里挂徽章/星星/SparkJar 的渲染, 不必改 DB.
    rewards: { enabled: false }
  };

  function clampLevel(n) { n = parseInt(n, 10); return (n >= 1 && n <= 3) ? n : 2; }

  /* 把总正确率 (0..100) 映射成等级 — 镜像 SQL */
  function levelFromPct(pct) {
    var t = CONFIG.placement.thresholds;
    for (var i = 0; i < t.length; i++) { if (pct >= t[i].min) return t[i].level; }
    return 1;
  }

  /* 单元末重算: 由平均分 + 当前后台等级算新后台等级 (温和 ±1) — 镜像 SQL */
  function recomputeBackend(avgScore, currentBackend) {
    var t = CONFIG.recompute.thresholds, raw = 1;
    for (var i = 0; i < t.length; i++) { if (avgScore >= t[i].min) { raw = t[i].level; break; } }
    if (currentBackend == null) return raw;
    var step = CONFIG.recompute.maxStep;
    return Math.min(Math.max(raw, currentBackend - step), currentBackend + step);
  }

  /* 显示等级永远只升不降 */
  function displayFrom(prevDisplay, backend) {
    return Math.max(prevDisplay == null ? backend : prevDisplay, backend);
  }

  function info(level) { return CONFIG.levels[clampLevel(level)]; }
  function difficultyForLevel(level) { return info(level).difficulty; }
  function hintTierForLevel(level) { return info(level).hint_tier; }

  /* ── 等级徽章 (给学生/家长看的是 displayLevel) ─────────────────────────── */
  function badgeHTML(displayLevel, opts) {
    opts = opts || {};
    var L = info(displayLevel);
    var sub = opts.subtitle != null ? opts.subtitle
            : (L.name_zh + ' · ' + L.desc_zh.split(' · ')[0]);
    return ''
      + '<span class="lvl-badge lvl-' + L.key + '"'
      +   ' style="--lvl-c:' + L.color + ';--lvl-p:' + L.pale + ';--lvl-i:' + L.ink + '">'
      +   '<span class="lvl-badge-dot"></span>'
      +   '<span class="lvl-badge-main">' + L.label_en + ' <b>' + L.short + '</b></span>'
      +   (opts.hideSub ? '' : '<span class="lvl-badge-sub zh">' + sub + '</span>')
      + '</span>';
  }

  /* 难度小标签 (课堂题目上) */
  function difficultyTagHTML(level) {
    var d = difficultyForLevel(level);
    var map = { easy: ['Easier', '简单'], medium: ['Medium', '中等'], hard: ['Challenge', '挑战'] };
    var L = info(level);
    return '<span class="lvl-difftag lvl-' + L.key + '" style="--lvl-c:' + L.color + ';--lvl-p:' + L.pale + '">'
         + map[d][0] + ' · <span class="zh">' + map[d][1] + '</span></span>';
  }

  /* ── 题目: 按等级切换难度版本 + 提示档 ─────────────────────────────────
   * 约定 (供内容房/工厂房作者用):
   *   题块里放难度版本:  <div data-variant="easy|medium|hard"> ... </div>
   *   提示三档:          <div data-hint="full|medium|light"> ... </div>
   * 没标注的就原样显示 (向后兼容, 旧课不受影响).
   */
  function applyLevelToQuestion(blockEl, level) {
    var diff = difficultyForLevel(level);
    var tier = hintTierForLevel(level);
    // 难度版本: 显示匹配的, 藏其它
    var variants = blockEl.querySelectorAll('[data-variant]');
    if (variants.length) {
      variants.forEach(function (v) {
        v.hidden = (v.getAttribute('data-variant') !== diff);
      });
    }
    // 提示档: 显示匹配的提示, 藏其它
    var hints = blockEl.querySelectorAll('[data-hint]');
    if (hints.length) {
      hints.forEach(function (h) {
        h.hidden = (h.getAttribute('data-hint') !== tier);
      });
    }
    blockEl.setAttribute('data-active-level', level);
  }

  function applyLevelToAll(root, level) {
    (root || document).querySelectorAll('[data-question]').forEach(function (b) {
      applyLevelToQuestion(b, level);
    });
    if (root && root.setAttribute) root.setAttribute('data-active-level', level);
  }

  /* ── 只升不降趋势图 (家长台) ──────────────────────────────────────────
   * events: [{display_level, created_at}] 时间升序; 只画 display_level → 只升不降.
   */
  function trendSVG(events, opts) {
    opts = opts || {};
    var W = opts.width || 320, H = opts.height || 96, pad = 22;
    if (!events || !events.length) return '';
    var n = events.length;
    var x = function (i) { return n === 1 ? W / 2 : pad + (W - 2 * pad) * i / (n - 1); };
    var y = function (lv) { return H - pad - (H - 2 * pad) * (clampLevel(lv) - 1) / 2; }; // L1底 L3顶
    // 阶梯线 (等级是离散的)
    var d = '', i;
    for (i = 0; i < n; i++) {
      var px = x(i), py = y(events[i].display_level);
      if (i === 0) { d += 'M' + px + ',' + py; }
      else { d += ' L' + x(i) + ',' + y(events[i - 1].display_level) + ' L' + px + ',' + py; }
    }
    var dots = '';
    for (i = 0; i < n; i++) {
      dots += '<circle cx="' + x(i) + '" cy="' + y(events[i].display_level) + '" r="3.5" fill="var(--lvl-trend,#EA580C)"/>';
    }
    var grid = '';
    [1, 2, 3].forEach(function (lv) {
      var gy = y(lv);
      grid += '<line x1="' + pad + '" y1="' + gy + '" x2="' + (W - pad) + '" y2="' + gy + '" stroke="#EFEAE1" stroke-width="1"/>';
      grid += '<text x="6" y="' + (gy + 3) + '" font-size="9" fill="#999">L' + lv + '</text>';
    });
    return '<svg viewBox="0 0 ' + W + ' ' + H + '" width="100%" height="' + H + '" role="img" aria-label="Level trend">'
      + grid
      + '<path d="' + d + '" fill="none" stroke="var(--lvl-trend,#EA580C)" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/>'
      + dots
      + '</svg>';
  }

  /* ── DEMO 数据 (仅供 level-demo / ?demo 预览; 真账号绝不使用) ──────────── */
  var DEMO = {
    // 样题 (清楚标注 SAMPLE; 真题由内容房供)
    placementQuestions: [
      { q_en: 'Which is a physical change?', q_zh: '下列哪个是物理变化?',
        opts: [['Ice melting','冰融化'], ['Wood burning','木头燃烧'], ['Iron rusting','铁生锈']], correct: 0 },
      { q_en: 'What does a thermometer measure?', q_zh: '温度计测量什么?',
        opts: [['Mass','质量'], ['Temperature','温度'], ['Volume','体积']], correct: 1 },
      { q_en: 'Particles in a gas are…', q_zh: '气体中的粒子…',
        opts: [['Tightly packed','排列紧密'], ['Far apart, fast-moving','间距大、快速运动'], ['Fixed in a lattice','固定在晶格中']], correct: 1 }
    ],
    // 样例等级历史 (家长台趋势; 只升不降)
    trend: [
      { display_level: 1, created_at: '2026-05-02' },
      { display_level: 1, created_at: '2026-05-16' },
      { display_level: 2, created_at: '2026-05-30' },
      { display_level: 2, created_at: '2026-06-13' },
      { display_level: 3, created_at: '2026-06-18' }
    ]
  };

  global.SciSparkLevel = {
    CONFIG: CONFIG,
    info: info,
    levelFromPct: levelFromPct,
    recomputeBackend: recomputeBackend,
    displayFrom: displayFrom,
    difficultyForLevel: difficultyForLevel,
    hintTierForLevel: hintTierForLevel,
    badgeHTML: badgeHTML,
    difficultyTagHTML: difficultyTagHTML,
    applyLevelToQuestion: applyLevelToQuestion,
    applyLevelToAll: applyLevelToAll,
    trendSVG: trendSVG,
    DEMO: DEMO
  };
})(window);
