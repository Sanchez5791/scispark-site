// test-validate.js — 第③块 config 守门员测试
// 证明两件事：(1) 真配置过得了关；(2) 各种写错的配置会被挡下，不放行。
// 跑法：node test-validate.js
const V = require('./validate-config.js');

let pass = 0, fail = 0;
function check(name, got, want) {
  const ok = got === want;
  console.log((ok ? '  ✓ ' : '  ✗ ') + name + '  得到=' + got + ' 应为=' + want);
  if (ok) pass++; else fail++;
}
function hasErr(res, substr) {
  return res.errors.some(function (e) { return e.indexOf(substr) !== -1; });
}

console.log('=========================================');
console.log('第③块 config 守门员 测试');
console.log('=========================================\n');

// ── A. 真配置必须过关 ──
console.log('A 真配置过关（warning 允许，error 必须 0）');
const real1 = require('./Y9_Q2b.json');
let r = V.validateConfig(real1);
check('Y9_Q2b 通过', r.ok, true);
check('Y9_Q2b 0 个 error', r.errors.length, 0);
check('Y9_Q2b 有 warning(source VERIFY)', r.warnings.length > 0, true);

const real2 = require('./Y8_U3_L12_Q4.json');
r = V.validateConfig(real2);
check('Y8 读数题 通过', r.ok, true);
check('Y8 读数题 0 个 error', r.errors.length, 0);

// ── B. 写错的配置必须被挡 ──
console.log('\nB 写错的配置必须被挡（ok=false）');

// B1 分值对不上
r = V.validateConfig({
  question_id:'X', field_prefix:'X', graph_type:'line_plot_fit', total_marks:5,
  marks_breakdown:{ axis_labels:1, point_plotting:1, line_best_fit:1 },
  expected_axes:{x_axis:{variable_keywords:['a'],unit_required:false,unit_keywords:[]},y_axis:{variable_keywords:['b'],unit_required:false,unit_keywords:[]}},
  expected_points:[{x:1,y:1}]
});
check('B1 total_marks 对不上 → 挡', r.ok, false);
check('B1 错误点名 total', hasErr(r, 'total_marks'), true);

// B2 要画点却没给 expected_points
r = V.validateConfig({
  question_id:'X', field_prefix:'X', graph_type:'line_plot_fit', total_marks:1,
  marks_breakdown:{ point_plotting:1 }
});
check('B2 缺 expected_points → 挡', r.ok, false);

// B3 config 里坐标是字符串（坏类型）
r = V.validateConfig({
  question_id:'X', field_prefix:'X', graph_type:'line_plot_fit', total_marks:1,
  marks_breakdown:{ point_plotting:1 },
  expected_points:[{x:'1',y:'2'}]
});
check('B3 坐标字符串 → 挡', r.ok, false);
check('B3 错误点名坐标', hasErr(r, '坐标'), true);

// B4 评分项拼错（算账脑不认得 → 会漏判）
r = V.validateConfig({
  question_id:'X', field_prefix:'X', graph_type:'line_plot_fit', total_marks:1,
  marks_breakdown:{ point_ploting:1 },   // 少个 t
  expected_points:[{x:1,y:1}]
});
check('B4 评分项拼错 → 挡', r.ok, false);
check('B4 错误点名不认得', hasErr(r, '不认得'), true);

// B5 读数题没给 expected_value
r = V.validateConfig({
  question_id:'X', field_prefix:'X', graph_type:'read_from_graph', total_marks:1,
  marks_breakdown:{ value_reading:1 }, expected_unit:'°C'
});
check('B5 读数题缺 expected_value → 挡', r.ok, false);

// B6 轴要求单位却没给单位关键词（永远判不出单位）
r = V.validateConfig({
  question_id:'X', field_prefix:'X', graph_type:'line_plot_fit', total_marks:1,
  marks_breakdown:{ axis_labels:1 },
  expected_axes:{x_axis:{variable_keywords:['a'],unit_required:true,unit_keywords:[]},y_axis:{variable_keywords:['b'],unit_required:false,unit_keywords:[]}}
});
check('B6 unit_required 但 unit_keywords 空 → 挡', r.ok, false);

// B7 缺 field_prefix（算账脑读不到学生栏位）
r = V.validateConfig({
  question_id:'X', graph_type:'read_from_graph', total_marks:1,
  marks_breakdown:{ value_reading:1 }, expected_value:5, expected_unit:'°C'
});
check('B7 缺 field_prefix → 挡', r.ok, false);

// B8 坏 JSON 字符串 → 不崩，报 error
r = V.validateConfigJSON('{bad json');
check('B8 坏 JSON → 挡（不崩）', r.ok, false);

console.log('\n=========================================');
console.log('结果：通过 ' + pass + ' 项，失败 ' + fail + ' 项');
console.log('=========================================');
process.exit(fail === 0 ? 0 : 1);
