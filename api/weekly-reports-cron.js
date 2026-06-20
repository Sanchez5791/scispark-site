// api/weekly-reports-cron.js — SciSpark 家长周报 每周一自动生成 + 发邮件
// Vercel serverless function, triggered by Vercel Cron (see vercel.json "crons").
// ------------------------------------------------------------------
// 每周一为「上一周有学习记录」的孩子生成周报快照并发邮件。
// 红线:
//   • 假数据永不上线 — 数字全部来自 WeeklyReportCore.computeReport(真表)。
//   • 空周不打扰 — 上周没学习的孩子:不写快照、不发邮件(skipped_empty)。
//   • 隐私 — 邮件只发给孩子绑定家长(parent_id → profiles.email)。
//   • 没邮件服务/没收件人 — 仍写快照,状态标 no_email_service / no_recipient,绝不报错乱发。
// 触发保护:必须带正确的 CRON_SECRET,否则 401(防止被公网随意调用)。
// 邮件:用 Resend REST API(需 RESEND_API_KEY)。没配 key → 只生成快照、不发送。
// ------------------------------------------------------------------

const Core = require('../public/weekly-report-core.js');

module.exports = async function handler(req, res) {
  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
  const CRON_SECRET = process.env.CRON_SECRET;
  const RESEND_API_KEY = process.env.RESEND_API_KEY;             // 暂未配 → 只生成、不发邮件
  const FROM_EMAIL = process.env.WEEKLY_REPORT_FROM || 'SciSpark <reports@scisparklab.com>';
  const SITE_URL = process.env.SITE_URL || 'https://scisparklab.com';

  // —— 触发保护:Vercel Cron 会带 Authorization: Bearer <CRON_SECRET> ——
  const auth = req.headers['authorization'] || '';
  const givenSecret = auth.replace(/^Bearer\s+/i, '') || (req.query && req.query.secret) || '';
  if (!CRON_SECRET || givenSecret !== CRON_SECRET) {
    return res.status(401).json({ error: 'unauthorized' });
  }
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    return res.status(500).json({ error: 'missing supabase env' });
  }

  const SB_HEADERS = {
    'apikey': SUPABASE_SERVICE_KEY,
    'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
    'Content-Type': 'application/json'
  };
  const sbGet = async (pathQs) => {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/${pathQs}`, { headers: SB_HEADERS });
    if (!r.ok) throw new Error(`GET ${pathQs} → ${r.status} ${await r.text()}`);
    return r.json();
  };

  try {
    // —— 目标周 = 最近一个完整的 Mon–Sun(周一跑时即「上一周」) ——
    // 允许 ?week_start=YYYY-MM-DD 覆盖(测试用)。
    let anchor;
    if (req.query && req.query.week_start) {
      anchor = new Date(req.query.week_start + 'T12:00:00Z');
    } else {
      const thisWeek = Core.weekBounds(new Date());
      anchor = new Date(thisWeek.start.getTime() - 24 * 3600 * 1000); // 上周日
    }
    const wb = Core.weekBounds(anchor);
    const weekStartISO = ymd(wb.start);
    const weekEndISO = ymd(wb.end);

    const dryRun = !!(req.query && (req.query.dry === '1' || req.query.dry === 'true'));

    // —— 批量取数(service key 绕过 RLS,一次拉齐,内存里按孩子分组) ——
    const [children, lessons, progress, qAttempts, attempts] = await Promise.all([
      sbGet('children?select=id,parent_id,full_name,year_group'),
      sbGet('lessons?is_published=eq.true&select=id,year_group,unit_number,lesson_number,lesson_title_en,lesson_title_zh,is_published'),
      sbGet('lesson_progress?select=child_id,lesson_id,status,started_at,completed_at,updated_at'),
      sbGet('lesson_question_attempts?select=child_id,lesson_id,score,max_score,marked_at'),
      sbGet('assessment_attempts?select=student_id,assessment_code,total_score,total_marks,time_spent_seconds,submitted_at')
    ]);

    // parent emails
    const parentIds = [...new Set(children.map(c => c.parent_id).filter(Boolean))];
    let emailByParent = {};
    if (parentIds.length) {
      const inList = parentIds.map(encodeURIComponent).join(',');
      const profs = await sbGet(`profiles?id=in.(${inList})&select=id,email,full_name`);
      profs.forEach(p => { emailByParent[p.id] = p.email; });
    }

    const byChild = (arr, key) => {
      const m = {};
      arr.forEach(r => { (m[r[key]] = m[r[key]] || []).push(r); });
      return m;
    };
    const progByChild = byChild(progress, 'child_id');
    const qaByChild = byChild(qAttempts, 'child_id');
    const atByChild = byChild(attempts, 'student_id');

    const anchorDate = new Date(wb.start.getTime() + 3 * 24 * 3600 * 1000); // 周中,落在目标周内
    const snapshots = [];
    const summary = { week_start: weekStartISO, week_end: weekEndISO, total: children.length,
      generated: 0, skipped_empty: 0, emailed: 0, no_email_service: 0, no_recipient: 0, failed: 0, dryRun };

    for (const c of children) {
      let model;
      try {
        model = Core.computeReport({
          child: c,
          weekDate: anchorDate,
          lessons: lessons,
          progress: progByChild[c.id] || [],
          questionAttempts: qaByChild[c.id] || [],
          attempts: atByChild[c.id] || []
        });
      } catch (e) {
        summary.failed++; continue;
      }

      // 空周不打扰(老板拍板:本周没学的孩子不发邮件)
      if (!model.anyActivity) { summary.skipped_empty++; continue; }

      const recipient = emailByParent[c.parent_id] || null;
      let email_status = 'pending';
      if (!recipient) email_status = 'no_recipient';
      else if (!RESEND_API_KEY) email_status = 'no_email_service';

      // 发邮件(只有有 key + 有收件人时才真正发)
      let email_error = null, email_sent_at = null;
      if (email_status === 'pending' && !dryRun) {
        try {
          await sendEmail({ RESEND_API_KEY, FROM_EMAIL, to: recipient, model, SITE_URL, childId: c.id });
          email_status = 'sent'; email_sent_at = new Date().toISOString();
          summary.emailed++;
        } catch (e) {
          email_status = 'failed'; email_error = String(e.message || e).slice(0, 500);
          summary.failed++;
        }
      } else if (email_status === 'no_email_service') summary.no_email_service++;
      else if (email_status === 'no_recipient') summary.no_recipient++;

      snapshots.push({
        child_id: c.id, parent_id: c.parent_id || null,
        week_start: weekStartISO, week_end: weekEndISO,
        report: model,
        lessons_completed: model.overview.lessonsCompleted,
        avg_score: model.overview.avgScore,
        study_minutes: model.overview.minutes,
        email_status, email_to: recipient, email_sent_at, email_error
      });
      summary.generated++;
    }

    // upsert snapshots (on conflict child_id+week_start)
    if (snapshots.length && !dryRun) {
      const r = await fetch(`${SUPABASE_URL}/rest/v1/weekly_reports?on_conflict=child_id,week_start`, {
        method: 'POST',
        headers: { ...SB_HEADERS, 'Prefer': 'resolution=merge-duplicates,return=minimal' },
        body: JSON.stringify(snapshots)
      });
      if (!r.ok) throw new Error(`upsert weekly_reports → ${r.status} ${await r.text()}`);
    }

    return res.status(200).json({ success: true, ...summary });
  } catch (err) {
    console.error('[weekly-reports-cron] error:', err.message);
    return res.status(500).json({ error: err.message });
  }
};

/* ---------- helpers ---------- */
function ymd(d) {
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}

async function sendEmail({ RESEND_API_KEY, FROM_EMAIL, to, model, SITE_URL, childId }) {
  const html = renderEmailHtml(model, SITE_URL, childId);
  const subject = `${model.child.name || '孩子'} 的本周学习周报 · SciSpark Weekly Report (${model.week.label})`;
  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: FROM_EMAIL, to: [to], subject, html })
  });
  if (!r.ok) throw new Error(`resend → ${r.status} ${await r.text()}`);
  return r.json();
}

/* Email body — inline styles only (email clients strip <style>/external CSS).
   Same brand box: 米色底 + 橙 #EA580C + serif headings, 双语. */
function renderEmailHtml(m, SITE_URL, childId) {
  const esc = Core._esc;
  const O = '#EA580C', INK = '#171413', MUTED = '#8b8178', BG = '#FBF8F4', PAPER = '#FFFFFF', LINE = '#E6DFD3';
  const ov = m.overview;
  const reportUrl = `${SITE_URL}/parent-weekly-report?child_id=${encodeURIComponent(childId)}`;

  const stat = (label, val) =>
    `<td style="padding:10px 8px;text-align:center;vertical-align:top">
       <div style="font-size:11px;color:${MUTED};letter-spacing:.04em">${label}</div>
       <div style="font-size:22px;font-weight:700;color:${INK};font-family:Georgia,serif;margin-top:4px">${val}</div>
     </td>`;

  const pill = (pct) => {
    if (pct == null) return `<span style="font-size:11px;color:${MUTED}">无评分</span>`;
    const col = pct >= 80 ? '#2E7D5B' : pct >= 60 ? '#B45309' : '#B91C1C';
    return `<span style="font-size:12px;font-weight:700;color:${col}">${pct}%</span>`;
  };
  const learnedRows = m.learned.items.map(it =>
    `<tr><td style="padding:8px 0;border-bottom:1px solid #F0EBE2;font-size:14px;color:${INK}">${esc(it.title)}
       ${it.titleZh ? `<span style="color:${MUTED};font-size:12px">· ${esc(it.titleZh)}</span>` : ''}</td>
     <td style="padding:8px 0;border-bottom:1px solid #F0EBE2;text-align:right">${pill(it.pct)}</td></tr>`
  ).join('');

  let insight = '';
  if (m.insight.highlight) {
    const h = m.insight.highlight;
    insight += `<div style="background:#DCFCE7;border-radius:8px;padding:12px 14px;margin-bottom:8px;font-size:14px;color:${INK}">
      <b style="color:#2E7D5B">亮点 · Highlight</b><br>${h.type === 'subject'
        ? `${subjZh(h.subjectKey)} 表现最稳(${h.pct}%)` : `「${esc(h.title)}」做得最好(${h.pct}%)`}</div>`;
  }
  if (m.insight.strengthen) {
    const s = m.insight.strengthen;
    insight += `<div style="background:#FEF3C7;border-radius:8px;padding:12px 14px;font-size:14px;color:${INK}">
      <b style="color:#B45309">加强 · To strengthen</b><br>${s.type === 'subject'
        ? `${subjZh(s.subjectKey)} 可以再加强(${s.pct}%)` : `「${esc(s.title)}」建议再复习(${s.pct}%)`}</div>`;
  }

  let sugg = '';
  if (m.suggestion.review) sugg += `<li style="margin-bottom:6px"><b>复习 · Review:</b> 先把「${esc(m.suggestion.review.title)}」再过一遍。</li>`;
  if (m.suggestion.nextLesson) sugg += `<li><b>下一课 · Next:</b> Y${esc(m.suggestion.nextLesson.year)} · U${esc(m.suggestion.nextLesson.unit)} · L${esc(m.suggestion.nextLesson.lesson)} — ${esc(m.suggestion.nextLesson.title)}</li>`;
  else if (m.suggestion.allDone) sugg += `<li>已学完所有已上线课程,敬请期待新课。</li>`;

  return `<!DOCTYPE html><html><body style="margin:0;padding:0;background:${BG}">
  <div style="max-width:600px;margin:0 auto;padding:24px 16px;font-family:Helvetica,Arial,'Noto Sans SC',sans-serif">
    <div style="font-size:11px;letter-spacing:.16em;text-transform:uppercase;color:${MUTED}">SciSpark · 家长周报</div>
    <h1 style="font-family:Georgia,'Noto Serif SC',serif;font-size:26px;font-weight:600;color:${INK};margin:8px 0 2px">
      ${esc(m.child.name || '孩子')}${m.child.year ? ` <span style="font-size:13px;color:${O}">${esc(m.child.year)}</span>` : ''}</h1>
    <div style="font-size:14px;color:${MUTED};border-bottom:2px solid ${O};padding-bottom:14px">${esc(m.week.label)} · 本周</div>

    <div style="background:${PAPER};border:1px solid ${LINE};border-radius:12px;padding:8px;margin:18px 0">
      <table width="100%" cellpadding="0" cellspacing="0"><tr>
        ${stat('完成课程 Lessons', ov.lessonsCompleted)}
        ${stat('平均分 Avg', ov.avgScore != null ? ov.avgScore + '%' : '—')}
        ${stat('学习时长 Time', ov.minutes != null ? '约' + ov.minutes + '分' : '—')}
      </tr></table>
    </div>

    <h3 style="font-family:Georgia,serif;font-size:16px;color:${INK};margin:18px 0 6px">这周学了什么 · What we covered</h3>
    <table width="100%" cellpadding="0" cellspacing="0">${learnedRows}</table>

    <h3 style="font-family:Georgia,serif;font-size:16px;color:${INK};margin:20px 0 10px">亮点 &amp; 加强 · Strengths &amp; focus</h3>
    ${insight}

    <h3 style="font-family:Georgia,serif;font-size:16px;color:${INK};margin:20px 0 6px">下周建议 · For next week</h3>
    <ul style="font-size:14px;color:${INK};line-height:1.6;padding-left:18px;margin:0">${sugg}</ul>

    <div style="text-align:center;margin:26px 0 10px">
      <a href="${reportUrl}" style="display:inline-block;background:${O};color:#fff;text-decoration:none;font-weight:600;font-size:14px;padding:12px 26px;border-radius:100px">在控制台查看完整周报 · Open full report</a>
    </div>
    <p style="font-size:11px;color:${MUTED};text-align:center;line-height:1.6;margin-top:18px">
      本周报只含您绑定孩子的真实学习数据。没有学习的一周我们不会发送此邮件。<br>
      You only ever receive your own child's real data. We don't email on weeks with no activity.
    </p>
  </div></body></html>`;
}

function subjZh(key) {
  return ({ chem: '化学 Chemistry', phys: '物理 Physics', bio: '生物 Biology', earth: '地球与太空', sci: '理科 Science' })[key] || '理科 Science';
}
