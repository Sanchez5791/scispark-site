// api/notify-telegram.js — SciSpark 求救系统 Phase1 · 刀5 · 求救/危机通知 (主发送函数)
// ============================================================================
// Vercel serverless function — POST /api/notify-telegram
// 多渠道: Telegram + 邮件(Resend) + WhatsApp(CallMeBot)。每个渠道各自靠环境变量开关,
//   没配就跳过; 任一渠道发出即算通知到。三条渠道内容【都匿名】(红线2)。
//
// 链路 (server-authoritative, 不靠学生浏览器):
//   学生按求救/危机 → v8 引擎写一行 review_requests(status='submitted')
//   → 数据库 AFTER INSERT 触发器 trg_notify_telegram (pg_net)
//   → 调本函数一次 (带共享密钥头 x-notify-secret)
//   → 本函数在【服务器端】发所有已配置渠道 (Telegram/邮件/WhatsApp)
//   → 任一成功: 写 review_requests.tg_notified_at (防重复); 失败渠道: 写 notify_failures (可补发)
//
// ★ 三条最高红线 (刀5 工单 §2):
//   1. Telegram 只在服务器端发。token 只从 Vercel 环境变量读, 绝不进浏览器。
//   2. 推到老板手机的消息【匿名】: 不夹小孩真名、不夹危机原文。只写"有X条求救/危机,
//      去复核台看", 附课节参考/题号。原文与身份, 老板到复核台再看。
//   3. 防滥用绝不吞掉真危机: 节流只挡"同源短时重复"的【通知推送】; 记录本身早已在
//      review_requests (复核台=唯一真相源), 永不丢、不限次 — 本函数从不删/改记录内容。
//
// ★ 环境变量名【锁死】(刀5 工单 §1c, 不准改名):
//     TELEGRAM_BOT_TOKEN   ← 老板已在 Vercel 填好
//     TELEGRAM_CHAT_ID     ← 老板拿到后填 (见 api/telegram-chatid.js)
//     TELEGRAM_NOTIFY_SECRET ← 共享密钥, 与数据库 GUC app.telegram_notify_secret 相同
//   复用现成 (api/mark*.js 已在用):
//     SUPABASE_URL, SUPABASE_SERVICE_KEY
//   邮件渠道 (可选, 不填则跳过):
//     RESEND_API_KEY, NOTIFY_EMAIL_TO, [NOTIFY_EMAIL_FROM 默认 onboarding@resend.dev]
//   WhatsApp 渠道 (可选, 免费 CallMeBot, 不可靠, 不填则跳过):
//     CALLMEBOT_PHONE, CALLMEBOT_APIKEY
//   可选:
//     SITE_URL (默认 https://scisparklab.com)
// ============================================================================

'use strict';

// ── 节流窗口 (双手房自定, 工单 §5 Q3 授权; 只挡通知刷屏, 不动记录) ──
// 同一学生在窗口内已推过一条 → 本条合并 (不再推), 但复核台记录照在。
// 危机窗口更短 (宁可多提醒一次也别漏), 普通求救窗口更长 (更省)。
const THROTTLE_CRISIS_MS  = 20 * 1000;   // 危机: 20 秒内同一学生合并
const THROTTLE_NORMAL_MS  = 90 * 1000;   // 普通: 90 秒内同一学生合并

function siteUrl() {
  return (process.env.SITE_URL || 'https://scisparklab.com').replace(/\/+$/, '');
}

// 触发来源 → 匿名标签 (不含任何身份/原文)
function sourceLabel(row) {
  if (row.is_crisis || row.trigger_type === 'CRISIS') return { icon: '🆘🔴', name: '危机求救' };
  if (row.trigger_type === 'SYSTEM_RED_A')            return { icon: '🔴',   name: '系统标红(判分崩)' };
  if (row.trigger_type === 'SYSTEM_RED_B')            return { icon: '🔴',   name: '系统标红(疑难)' };
  return { icon: '🙋', name: '学生请老师复核' };
}

// ★匿名★消息: 只有类型 + 课节参考 + 题号 + 参考号 + 复核台链接。无真名、无原文。
function buildMessage(row) {
  const s        = sourceLabel(row);
  const lesson   = row.lesson_label || row.lesson_path || '—';
  const qid      = row.question_id || '—';
  const ref      = String(row.id || '').slice(0, 8);   // 会话参考 (匿名, 供老板复核台对号)
  const console_ = siteUrl() + '/review-console';
  const head     = (row.is_crisis || row.trigger_type === 'CRISIS')
    ? `${s.icon} SciSpark 危机提醒 — 请立刻处理`
    : `${s.icon} SciSpark 求救提醒`;
  return [
    head,
    `类型: ${s.name}`,
    `课节参考: ${lesson}  ${qid}`,
    `参考号: #${ref}`,
    ``,
    `请打开复核台查看详情 →`,
    console_,
  ].join('\n');
}

// PostgREST 小工具 (复用 service key, 与 api/mark*.js 同套路)
function sbHeaders() {
  const key = process.env.SUPABASE_SERVICE_KEY;
  return {
    'apikey': key,
    'Authorization': 'Bearer ' + key,
    'Content-Type': 'application/json',
  };
}

async function loadRow(id) {
  const url = `${process.env.SUPABASE_URL}/rest/v1/review_requests`
    + `?id=eq.${encodeURIComponent(id)}`
    + `&select=id,student_id,lesson_path,lesson_label,question_id,trigger_type,is_crisis,tg_notified_at`;
  const r = await fetch(url, { headers: sbHeaders() });
  if (!r.ok) throw new Error(`load row ${r.status}: ${(await r.text()).slice(0, 200)}`);
  const rows = await r.json();
  return Array.isArray(rows) && rows.length ? rows[0] : null;
}

// 节流: 数一数同一学生在窗口内【已推送过】的条数 (tg_notified_at 非空)。>=1 → 合并本条。
async function recentlyNotified(studentId, windowMs) {
  if (!studentId) return false;
  const sinceIso = new Date(Date.now() - windowMs).toISOString();
  const url = `${process.env.SUPABASE_URL}/rest/v1/review_requests`
    + `?student_id=eq.${encodeURIComponent(studentId)}`
    + `&tg_notified_at=gte.${encodeURIComponent(sinceIso)}`
    + `&select=id`;
  const r = await fetch(url, { headers: Object.assign({ 'Prefer': 'count=exact' }, sbHeaders()) });
  if (!r.ok) return false;                 // fail-OPEN: 数不出来就照发, 宁多勿漏
  const rows = await r.json();
  return Array.isArray(rows) && rows.length > 0;
}

async function stampNotified(id) {
  const url = `${process.env.SUPABASE_URL}/rest/v1/review_requests?id=eq.${encodeURIComponent(id)}`;
  await fetch(url, {
    method: 'PATCH',
    headers: Object.assign({ 'Prefer': 'return=minimal' }, sbHeaders()),
    body: JSON.stringify({ tg_notified_at: new Date().toISOString() }),
  });
}

// 失败/未配置 → 记一笔, 供 §6④ 补发 + 看日志。绝不影响复核台里的原始记录。
async function logFailure(id, reason) {
  try {
    const url = `${process.env.SUPABASE_URL}/rest/v1/notify_failures`;
    await fetch(url, {
      method: 'POST',
      headers: Object.assign({ 'Prefer': 'return=minimal' }, sbHeaders()),
      body: JSON.stringify({ review_request_id: id, channel: 'telegram', error: String(reason).slice(0, 500) }),
    });
  } catch (e) { /* 日志失败也不能挡主流程; 复核台记录仍在 */ }
}

// 每个渠道返回统一形状: {channel, ok, skipped, detail}
//   skipped=true  → 没配这个渠道 (不算失败, 不记账)
//   ok=true       → 真发出去了
//   ok=false      → 配了但发失败 (记账 + 可补发)

// ── 渠道1: Telegram (服务器端) ──
async function sendTelegram(text) {
  const token  = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) return { channel: 'telegram', ok: false, skipped: true, detail: 'not configured' };
  try {
    const r = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text, disable_web_page_preview: true }),
    });
    const body = await r.text();
    if (!r.ok) return { channel: 'telegram', ok: false, detail: `telegram ${r.status}: ${body.slice(0, 160)}` };
    return { channel: 'telegram', ok: true, detail: 'sent' };
  } catch (e) {
    return { channel: 'telegram', ok: false, detail: `telegram error: ${e && e.message ? e.message : String(e)}` };
  }
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
}

// ── 渠道2: 邮件 (Resend)。★匿名★: 无真名、无原文, 只类型+课节参考+题号+参考号+复核台链。──
async function sendEmail(row) {
  const key = process.env.RESEND_API_KEY;
  const to  = process.env.NOTIFY_EMAIL_TO;
  const from = process.env.NOTIFY_EMAIL_FROM || 'SciSpark Alerts <onboarding@resend.dev>';
  if (!key || !to) return { channel: 'email', ok: false, skipped: true, detail: 'not configured' };
  const s       = sourceLabel(row);
  const isCrisis = !!(row.is_crisis || row.trigger_type === 'CRISIS');
  const lesson  = row.lesson_label || row.lesson_path || '—';
  const qid     = row.question_id || '—';
  const ref     = String(row.id || '').slice(0, 8);
  const console_ = siteUrl() + '/review-console';
  const subject = isCrisis ? `${s.icon} SciSpark 危机提醒 — 请立刻处理` : `${s.icon} SciSpark 求救提醒`;
  const html = `
    <div style="font-family:Geist,'Noto Sans SC',system-ui,sans-serif;color:#0F172A;line-height:1.55">
      <h2 style="margin:0 0 4px">${escapeHtml(subject)}</h2>
      <p style="margin:0 0 14px;color:#6b6358">SciSpark · 自动通知（匿名）</p>
      <table style="border-collapse:collapse;font-size:14px">
        <tr><td style="padding:3px 12px 3px 0;color:#6b6358">类型</td><td><b>${escapeHtml(s.name)}</b></td></tr>
        <tr><td style="padding:3px 12px 3px 0;color:#6b6358">课节参考</td><td>${escapeHtml(lesson)} ${escapeHtml(qid)}</td></tr>
        <tr><td style="padding:3px 12px 3px 0;color:#6b6358">参考号</td><td>#${escapeHtml(ref)}</td></tr>
      </table>
      <p style="margin:18px 0 0">
        <a href="${console_}" style="background:#EA580C;color:#fff;text-decoration:none;padding:10px 18px;border-radius:999px;font-weight:700;display:inline-block">前往复核台 →</a>
      </p>
    </div>`;
  try {
    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from, to: [to], subject, html }),
    });
    if (!r.ok) return { channel: 'email', ok: false, detail: `resend ${r.status}: ${(await r.text()).slice(0, 160)}` };
    return { channel: 'email', ok: true, detail: 'sent' };
  } catch (e) {
    return { channel: 'email', ok: false, detail: `email error: ${e && e.message ? e.message : String(e)}` };
  }
}

// ── 渠道3: WhatsApp (CallMeBot 免费, ★不可靠, 兜底而非主报警★)。同样匿名。──
async function sendWhatsApp(text) {
  const phone  = process.env.CALLMEBOT_PHONE;
  const apikey = process.env.CALLMEBOT_APIKEY;
  if (!phone || !apikey) return { channel: 'whatsapp', ok: false, skipped: true, detail: 'not configured' };
  const url = `https://api.callmebot.com/whatsapp.php?phone=${encodeURIComponent(phone)}`
            + `&text=${encodeURIComponent(text)}&apikey=${encodeURIComponent(apikey)}`;
  try {
    const r = await fetch(url, { method: 'GET' });
    const body = await r.text();
    if (!r.ok) return { channel: 'whatsapp', ok: false, detail: `callmebot ${r.status}: ${body.slice(0, 160)}` };
    return { channel: 'whatsapp', ok: true, detail: 'sent' };
  } catch (e) {
    return { channel: 'whatsapp', ok: false, detail: `whatsapp error: ${e && e.message ? e.message : String(e)}` };
  }
}

// ── 同时发所有【已配置】的渠道; 任一成功即算通知到 ──
async function sendAllChannels(row) {
  const text = buildMessage(row);
  const results = await Promise.all([sendTelegram(text), sendEmail(row), sendWhatsApp(text)]);
  const anySent = results.some((r) => r.ok);
  // 配了但发失败的渠道 (skipped 的不算失败)
  const failed = results.filter((r) => !r.ok && !r.skipped);
  return { anySent, results, failed };
}

const json = (res, status, body) => res.status(status).json(body);

// ── 处理单条 review_request → 尝试推 Telegram ──
async function processOne(row) {
  // 幂等: 已推过 → 跳过 (防触发器重放 / 手动补发时重复)
  if (row.tg_notified_at) return { id: row.id, skipped: 'already notified' };

  const isCrisis = !!(row.is_crisis || row.trigger_type === 'CRISIS');

  // 节流 (只挡通知; 复核台记录不动 — 记录在插入时已落库)
  const windowMs = isCrisis ? THROTTLE_CRISIS_MS : THROTTLE_NORMAL_MS;
  if (await recentlyNotified(row.student_id, windowMs)) {
    // 合并: 不推送, 但把本条也标记为已处理, 避免下次重放又数它 (记录本身照在复核台)。
    await stampNotified(row.id);
    return { id: row.id, throttled: true, crisis: isCrisis };
  }

  const { anySent, results, failed } = await sendAllChannels(row);
  // 配了但发失败的渠道各记一笔 (供补发 + 看日志)。复核台记录仍在, 危机没丢。
  for (const f of failed) await logFailure(row.id, `${f.channel}: ${f.detail}`);

  if (anySent) {
    // 至少一个渠道发出去了 → 盖章 (视为已通知)。
    await stampNotified(row.id);
    return { id: row.id, sent: true, crisis: isCrisis, channels: results.map((r) => ({ [r.channel]: r.ok ? 'sent' : (r.skipped ? 'skip' : 'fail') })) };
  }
  // 全部渠道未配置或全失败 → 不盖章 (留着补发)。
  return { id: row.id, sent: false, crisis: isCrisis, channels: results.map((r) => ({ [r.channel]: r.skipped ? 'skip' : 'fail' })) };
}

// ── 补发模式: 找出最近 24h 内失败(未盖章)的记录, 重试 ──
// §6④: 修好 chat id 后能补发。POST { retryPending: true } + 密钥。
async function retryPending() {
  const sinceIso = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
  // 取最近 24h、status=submitted、还没盖章 tg_notified_at 的记录 (危机优先)
  const url = `${process.env.SUPABASE_URL}/rest/v1/review_requests`
    + `?tg_notified_at=is.null`
    + `&status=eq.submitted`
    + `&created_at=gte.${encodeURIComponent(sinceIso)}`
    + `&select=id,student_id,lesson_path,lesson_label,question_id,trigger_type,is_crisis,tg_notified_at`
    + `&order=is_crisis.desc,created_at.asc&limit=50`;
  const r = await fetch(url, { headers: sbHeaders() });
  if (!r.ok) throw new Error(`retry scan ${r.status}: ${(await r.text()).slice(0, 200)}`);
  const rows = await r.json();
  const results = [];
  for (const row of (Array.isArray(rows) ? rows : [])) {
    results.push(await processOne(row));
  }
  return results;
}

// ============================================================================
// HANDLER
// ============================================================================
module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return json(res, 405, { error: 'Method not allowed' });

  // 共享密钥闸: 本端点只给服务器调 (数据库触发器 / 补发脚本), 不给浏览器。
  const SECRET = process.env.TELEGRAM_NOTIFY_SECRET || '';
  if (!SECRET || req.headers['x-notify-secret'] !== SECRET) {
    return json(res, 403, { error: 'forbidden' });
  }
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) {
    return json(res, 500, { error: 'supabase env missing' });
  }

  let payload = {};
  try { payload = req.body && typeof req.body === 'object' ? req.body : JSON.parse(req.body || '{}'); }
  catch { return json(res, 400, { error: 'bad json' }); }

  // 补发模式
  if (payload.retryPending) {
    try {
      const results = await retryPending();
      return json(res, 200, { ok: true, mode: 'retry', results });
    } catch (e) {
      return json(res, 200, { ok: false, mode: 'retry', error: e && e.message ? e.message : String(e) });
    }
  }

  // 正常模式: 接受 { id } (我们的触发器) 或 { record: { id } } (Supabase DB-webhook 形状)
  const id = payload.id || (payload.record && payload.record.id);
  if (!id) return json(res, 400, { error: 'missing id' });

  try {
    const row = await loadRow(id);
    if (!row) return json(res, 404, { error: 'row not found' });
    const result = await processOne(row);
    return json(res, 200, { ok: true, result });
  } catch (e) {
    // 任何异常都不能让触发器报错卡住; 记一笔失败, 复核台记录仍安全。
    await logFailure(id, e && e.message ? e.message : String(e));
    return json(res, 200, { ok: false, error: e && e.message ? e.message : String(e) });
  }
};
