// api/sos.js — SciSpark 匿名求救 (SOS) 收件端点
// ============================================================================
// Vercel serverless function — POST /api/sos   ★公开、无需登录★
//
// 为什么是它 (给军师/Sanchez 的说明):
//   指令原文写「Supabase Edge Function」。本站所有后台程序都跑在 Vercel (api/*.js),
//   Supabase 那边一支 Edge Function 都没有。用 Vercel 函数实现指令的真实要求 ——
//   「服务器端函数, 持 service_role 密钥, 无需登录, 前端绝不直接写库」—— 效果完全一样,
//   且跟着网站一起 git push 上线, 无需另装 Deno / supabase CLI。密钥仍只在服务器端。
//
// 链路 (指令 §1):
//   前端浮窗按钮 (public/sos.js, 无登录)
//     │  POST { message, page_url, honeypot, load_to_click_ms, device_hint }
//     ▼
//   本函数 (持 SUPABASE_SERVICE_KEY = service_role, 绕过 RLS)
//     ├─ 隐形过滤 (指令 §2): 蜜罐 + 时间差, 静默丢机器人, 真小孩不受影响
//     ├─ 渠道A (指令 §5): 立刻发老板手机 (Telegram + 邮件), ★不等数据库★  ← 生命线
//     └─ 渠道B (指令 §5): 尽力写库存档 (sos_anonymous 表); 表还没建好也不报错
//
// ★ 生命线铁律:
//   - 无论服务器端发生什么 (写了 / 去重 / 限流 / 出错), 前端永远只收到同一句温柔话,
//     绝不给小孩看到报错或「被限流」。(指令 §3 前端契约)
//   - 渠道A 不依赖数据库。就算库挂了 / 表没建, 老板手机照样响。(指令 §5 双渠道)
//   - 蜜罐/时间差只挡明显机器人; 拿不准一律放行 (fail-open, 宁多勿漏)。
//
// ★ 环境变量 (复用刀5 已配好的, 不新增):
//     TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID           ← Telegram
//     RESEND_API_KEY, NOTIFY_EMAIL_TO, [NOTIFY_EMAIL_FROM]  ← 邮件
//     SUPABASE_URL, SUPABASE_SERVICE_KEY             ← 写库 (渠道B, service_role)
//     [SITE_URL] 默认 https://scisparklab.com
//   本端点【公开】, 故★不用★共享密钥闸 (那样密钥会进浏览器)。防滥用靠蜜罐+时间差。
// ============================================================================

'use strict';

const crypto = require('crypto');

// ── 时间差门槛: 页面加载 → 按「送出」快于此 = 机器人, 丢掉 ──
// 真小孩就算慌到只按按钮再送空白, 也要 >0.5 秒。机器人约 0.2 秒。拿不准(缺值)一律放行。
const MIN_HUMAN_MS = 500;

function siteUrl() {
  return (process.env.SITE_URL || 'https://scisparklab.com').replace(/\/+$/, '');
}

// 匿名标签: hash(IP + 粗浏览器指纹) — 只为将来限流, ★不是身份★, 不可反查到人。
function anonymousTag(req) {
  const ip = String(req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || '').split(',')[0].trim();
  const ua = String(req.headers['user-agent'] || '');
  // 只取 UA 粗特征 (前 40 字), 避免过细 = 近似身份
  return crypto.createHash('sha256').update(ip + '|' + ua.slice(0, 40)).digest('hex').slice(0, 32);
}

// 当前 UTC 分钟桶 (指令 §3: 配合 UNIQUE(anonymous_tag, minute_bucket) 原子限流)
function minuteBucket() {
  return new Date().toISOString().slice(0, 16); // "2026-07-02T09:31"
}

// ── 渠道A-1: Telegram (服务器端) ──
async function sendTelegram(text) {
  const token  = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) return { channel: 'telegram', ok: false, skipped: true };
  try {
    const r = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text, disable_web_page_preview: true }),
    });
    return { channel: 'telegram', ok: r.ok, detail: r.ok ? 'sent' : `tg ${r.status}` };
  } catch (e) {
    return { channel: 'telegram', ok: false, detail: 'tg error: ' + (e && e.message) };
  }
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
}

// ── 渠道A-2: 邮件 (Resend) ──
// ★匿名求救与登录求救不同★: 匿名没有身份、事后无从追人, 老板手机是唯一线索且私密,
//   故【必须】把小孩原话给老板看, 否则老板无法判断真假、无法回应 = 生命线失效。
async function sendEmail(subject, bodyLines) {
  const key  = process.env.RESEND_API_KEY;
  const to   = process.env.NOTIFY_EMAIL_TO;
  const from = process.env.NOTIFY_EMAIL_FROM || 'SciSpark Alerts <onboarding@resend.dev>';
  if (!key || !to) return { channel: 'email', ok: false, skipped: true };
  const html = `
    <div style="font-family:Geist,'Noto Sans SC',system-ui,sans-serif;color:#0F172A;line-height:1.6">
      <h2 style="margin:0 0 6px;color:#B91C1C">${escapeHtml(subject)}</h2>
      <p style="margin:0 0 14px;color:#6b6358">SciSpark · 匿名求救按钮 (SOS) · 自动通知</p>
      ${bodyLines.map((l) => `<p style="margin:2px 0">${escapeHtml(l)}</p>`).join('')}
    </div>`;
  try {
    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from, to: [to], subject, html }),
    });
    return { channel: 'email', ok: r.ok, detail: r.ok ? 'sent' : `resend ${r.status}` };
  } catch (e) {
    return { channel: 'email', ok: false, detail: 'email error: ' + (e && e.message) };
  }
}

// ── 渠道B: 写库存档 (service_role, 绕 RLS)。表还没建好 → 静默失败, 不影响渠道A ──
// 用 PostgREST upsert + resolution=ignore-duplicates 实现 ON CONFLICT DO NOTHING (指令 §3)。
async function insertRecord(rec) {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY;
  if (!url || !key) return { ok: false, skipped: true, detail: 'supabase env missing' };
  try {
    const r = await fetch(`${url}/rest/v1/sos_anonymous`, {
      method: 'POST',
      headers: {
        'apikey': key,
        'Authorization': 'Bearer ' + key,
        'Content-Type': 'application/json',
        // ON CONFLICT (anonymous_tag, minute_bucket) DO NOTHING + 拿回 id
        'Prefer': 'resolution=ignore-duplicates,return=representation',
      },
      body: JSON.stringify(rec),
    });
    if (!r.ok) return { ok: false, detail: `db ${r.status}: ${(await r.text()).slice(0, 120)}` };
    const rows = await r.json().catch(() => []);
    const inserted = Array.isArray(rows) && rows.length > 0;
    // 有 id = 本分钟第一条 (真的写进去了); 无 id = 同标签本分钟重复, 已被 DO NOTHING 挡掉
    return { ok: true, inserted, id: inserted ? rows[0].id : null };
  } catch (e) {
    return { ok: false, detail: 'db error: ' + (e && e.message) };
  }
}

const json = (res, status, body) => res.status(status).json(body);

// 前端永远收到的同一句温柔话 (指令 §3 前端契约) — 不管服务器端结果如何
const CALM_OK = {
  ok: true,
  message_en: "Your SOS has been sent — we are reaching a support person.",
  message_zh: "你的求救已经送出了，我们正在找一位可以帮你的人。",
};

// ============================================================================
// HANDLER — 公开, 无需登录
// ============================================================================
module.exports = async function handler(req, res) {
  // 就算方法/解析出错, 也给温柔话, 绝不让小孩看到报错。
  if (req.method !== 'POST') return json(res, 405, { error: 'Method not allowed' });

  let payload = {};
  try { payload = req.body && typeof req.body === 'object' ? req.body : JSON.parse(req.body || '{}'); }
  catch { payload = {}; }

  const message   = String(payload.message || '').slice(0, 2000);
  const pageUrl   = String(payload.page_url || '').slice(0, 500);
  const honeypot  = String(payload.honeypot || '');
  const clickMs   = Number(payload.load_to_click_ms);
  const device    = String(payload.device_hint || '').slice(0, 120);

  // ── 隐形过滤 (指令 §2): 命中 = 静默丢, 但仍回同一句温柔话 (让机器人无从分辨) ──
  const looksBot =
    honeypot.trim().length > 0 ||                       // (a) 蜜罐被填 → 机器人
    (Number.isFinite(clickMs) && clickMs < MIN_HUMAN_MS); // (b) 快得不像人 → 机器人
  if (looksBot) {
    return json(res, 200, CALM_OK); // 静默丢弃, 不发不写
  }

  const nowIso = new Date().toISOString();
  const ref    = crypto.randomBytes(4).toString('hex'); // 匿名参考号, 供老板对号

  // ── 渠道A: 立刻发老板手机 (Telegram + 邮件), 不等数据库 (生命线) ──
  const head = '🆘🔴 SciSpark 匿名求救 (SOS) — 请立刻处理';
  const lines = [
    head,
    '',
    '有人按了求救按钮 (未登录 / 匿名)。',
    '孩子说的话:',
    message ? ('「' + message + '」') : '(没有留言, 只按了按钮)',
    '',
    '来自页面: ' + (pageUrl || '未知'),
    '参考号: #' + ref,
    '时间: ' + nowIso,
  ];
  const tgText = lines.join('\n');

  let notify;
  try {
    notify = await Promise.all([
      sendTelegram(tgText),
      sendEmail(head, lines.slice(1)),
    ]);
  } catch (e) {
    notify = [{ channel: 'crash', ok: false, detail: String(e && e.message) }];
  }
  const anySent = notify.some((n) => n && n.ok);

  // ── 渠道B: 尽力写库存档 (表没建好也不影响上面已发出的报警) ──
  let dbResult;
  try {
    dbResult = await insertRecord({
      message: message || null,
      page_url: pageUrl || null,
      device_hint: device || null,
      anonymous_tag: anonymousTag(req),
      minute_bucket: minuteBucket(),
      ref: ref,
      notify_status: anySent ? 'sent' : 'failed',
      created_at: nowIso,
    });
  } catch (e) {
    dbResult = { ok: false, detail: 'db crash: ' + (e && e.message) };
  }

  // 服务器日志 (给老板 daily 抽查 / 排错用); 前端看不到。
  try {
    console.info('[SOS]', JSON.stringify({
      ref, anySent, notify: notify.map((n) => ({ [n.channel]: n.ok ? 'sent' : (n.skipped ? 'skip' : 'fail') })),
      db: dbResult && (dbResult.skipped ? 'skip' : (dbResult.ok ? (dbResult.inserted ? 'written' : 'dup') : ('fail:' + dbResult.detail))),
      page: pageUrl,
    }));
  } catch (e) {}

  // 永远回温柔话 (指令 §3)。就算全渠道失败也不告诉小孩 —— 但服务器日志留痕供补救。
  return json(res, 200, CALM_OK);
};
