// notify-review-request/index.ts
// ============================================================================
// SciSpark · 求救通知 (③ 派工卡 2026-06-20 · 军师房 → 双手房)
// ----------------------------------------------------------------------------
// A student presses 「请老师复核」 → a row lands in public.review_requests →
// an AFTER INSERT trigger (pg_net) calls THIS function once → the boss gets:
//    (a) a Gmail/email   via Resend         (free tier)
//    (b) a WhatsApp ping via CallMeBot      (free, personal use)
//
// ★ FREE only — no paid WhatsApp Business API (军师红线).
// ★ Two channels on purpose: CallMeBot is a 3rd-party freebie that could vanish;
//   email is the durable backup. If one is unconfigured/down, the other still goes.
//
// 别重复发 / no double-send: the function is IDEMPOTENT. It stamps
//   review_requests.notified_at after sending; if that column is already set it
//   returns immediately. The trigger fires exactly once per INSERT, and this
//   guard covers any retry / replay on top of that.
//
// 每日封顶 / daily cap (军师 2026-06-20): at most NOTIFY_DAILY_CAP pings/day (default 30,
//   env-tunable). Past the cap the row is still stamped + lands in the console, but the
//   owner isn't pinged for the overflow — stops a student spamming the boss's phone.
//
// Auth: called server-to-server by the DB trigger, NOT by a browser. There is no
//   user JWT. Instead the trigger sends a shared secret header (x-notify-secret)
//   that must equal NOTIFY_TRIGGER_SECRET. Deploy with --no-verify-jwt.
// ============================================================================

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL          = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY      = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const TRIGGER_SECRET        = Deno.env.get("NOTIFY_TRIGGER_SECRET") ?? "";

// email (Resend) — leave unset to skip the email channel
const RESEND_API_KEY        = Deno.env.get("RESEND_API_KEY") ?? "";
const NOTIFY_EMAIL_TO       = Deno.env.get("NOTIFY_EMAIL_TO") ?? "";
const NOTIFY_EMAIL_FROM     = Deno.env.get("NOTIFY_EMAIL_FROM") ?? "SciSpark Alerts <alerts@scisparklab.com>";

// WhatsApp (CallMeBot) — leave either unset to skip the WhatsApp channel
const CALLMEBOT_PHONE       = Deno.env.get("CALLMEBOT_PHONE") ?? "";   // intl digits, e.g. 60123456789
const CALLMEBOT_APIKEY      = Deno.env.get("CALLMEBOT_APIKEY") ?? "";

// Daily cap (军师 派工 2026-06-20): at most N pings/day so a student can't spam the boss.
// Past the Nth of the (UTC) day we stop pinging but still mark the row handled — it still
// lands in the teacher console, the owner just isn't pinged for the overflow. Env-tunable.
const NOTIFY_DAILY_CAP      = Math.max(1, parseInt(Deno.env.get("NOTIFY_DAILY_CAP") ?? "30", 10) || 30);

const CONSOLE_URL           = (Deno.env.get("SITE_URL") ?? "https://scisparklab.com") + "/review-console";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

function reasonLabel(code: string): string {
  switch (code) {
    case "think_correct":       return "我认为我的答案是对的";
    case "ai_marked_wrong_spot": return "AI 标错了地方";
    case "question_problem":     return "题目本身有问题";
    case "system_broken":        return "系统/页面坏了";
    default:                     return code || "—";
  }
}

async function sendEmail(row: Record<string, unknown>): Promise<{ ok: boolean; detail: string }> {
  if (!RESEND_API_KEY || !NOTIFY_EMAIL_TO) return { ok: false, detail: "email not configured" };
  const label  = (row.lesson_label as string) || (row.lesson_path as string) || "—";
  const qid    = (row.question_id as string) || "—";
  const reason = reasonLabel(row.student_reason_code as string);
  const txt    = (row.student_reason as string) || "";
  const ans    = (row.student_answer as string) || "";
  const subject = `🆘 学生请老师复核 · ${label} ${qid}`;
  const html = `
    <div style="font-family:Geist,'Noto Sans SC',system-ui,sans-serif;color:#0F172A;line-height:1.55">
      <h2 style="margin:0 0 4px">🆘 有学生请老师复核</h2>
      <p style="margin:0 0 14px;color:#6b6358">SciSpark · 自动通知</p>
      <table style="border-collapse:collapse;font-size:14px">
        <tr><td style="padding:3px 12px 3px 0;color:#6b6358">课节</td><td><b>${label}</b></td></tr>
        <tr><td style="padding:3px 12px 3px 0;color:#6b6358">题号</td><td><b>${qid}</b></td></tr>
        <tr><td style="padding:3px 12px 3px 0;color:#6b6358">原因</td><td>${reason}</td></tr>
        <tr><td style="padding:3px 12px 3px 0;color:#6b6358;vertical-align:top">学生说明</td><td>${escapeHtml(txt)}</td></tr>
        <tr><td style="padding:3px 12px 3px 0;color:#6b6358;vertical-align:top">学生答案</td><td>${escapeHtml(ans)}</td></tr>
      </table>
      <p style="margin:18px 0 0">
        <a href="${CONSOLE_URL}" style="background:#EA580C;color:#fff;text-decoration:none;padding:10px 18px;border-radius:999px;font-weight:700;display:inline-block">前往复核清单 →</a>
      </p>
    </div>`;
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Authorization": `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: NOTIFY_EMAIL_FROM, to: [NOTIFY_EMAIL_TO], subject, html }),
    });
    if (!res.ok) return { ok: false, detail: `resend ${res.status}: ${await res.text()}` };
    return { ok: true, detail: "email sent" };
  } catch (e) {
    return { ok: false, detail: `email error: ${e instanceof Error ? e.message : String(e)}` };
  }
}

async function sendWhatsApp(row: Record<string, unknown>): Promise<{ ok: boolean; detail: string }> {
  if (!CALLMEBOT_PHONE || !CALLMEBOT_APIKEY) return { ok: false, detail: "callmebot not configured" };
  const label  = (row.lesson_label as string) || (row.lesson_path as string) || "—";
  const qid    = (row.question_id as string) || "—";
  const reason = reasonLabel(row.student_reason_code as string);
  const msg = `🆘 SciSpark 学生请老师复核\n${label} ${qid}\n原因: ${reason}\n→ ${CONSOLE_URL}`;
  const url = `https://api.callmebot.com/whatsapp.php?phone=${encodeURIComponent(CALLMEBOT_PHONE)}`
            + `&text=${encodeURIComponent(msg)}&apikey=${encodeURIComponent(CALLMEBOT_APIKEY)}`;
  try {
    const res = await fetch(url, { method: "GET" });
    const body = await res.text();
    if (!res.ok) return { ok: false, detail: `callmebot ${res.status}: ${body.slice(0, 160)}` };
    return { ok: true, detail: "whatsapp sent" };
  } catch (e) {
    return { ok: false, detail: `whatsapp error: ${e instanceof Error ? e.message : String(e)}` };
  }
}

function escapeHtml(s: string): string {
  return String(s).replace(/[&<>"]/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c] as string));
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return json({ error: "method not allowed" }, 405);

  // shared-secret gate (this endpoint is server-to-server only)
  if (!TRIGGER_SECRET || req.headers.get("x-notify-secret") !== TRIGGER_SECRET) {
    return json({ error: "forbidden" }, 403);
  }

  let payload: { id?: string; record?: { id?: string } };
  try { payload = await req.json(); } catch { return json({ error: "bad json" }, 400); }
  // accept either { id } (our trigger) or { record:{id} } (Supabase DB-webhook shape)
  const id = payload.id ?? payload.record?.id;
  if (!id) return json({ error: "missing id" }, 400);

  const sb = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

  const { data: row, error } = await sb
    .from("review_requests")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error || !row) return json({ error: "row not found", detail: error?.message }, 404);

  // 别重复发: already notified → stop
  if (row.notified_at) return json({ ok: true, skipped: "already notified" });

  // ── Daily cap ── count rows already stamped notified_at today (UTC day boundary; v1 keeps
  // it simple per 军师 note). The count includes both real sends and prior cap-skips, so once
  // we hit N the rest of the day stays capped. Fail-OPEN: if the count query errors we still
  // send — a counting glitch must never silence a genuine help request.
  const now = new Date();
  const startOfUtcDay = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())).toISOString();
  const { count: sentToday, error: capErr } = await sb
    .from("review_requests")
    .select("id", { count: "exact", head: true })
    .gte("notified_at", startOfUtcDay);
  if (capErr) {
    console.warn(`[notify] daily-cap count failed, failing open: ${capErr.message}`);
  } else if ((sentToday ?? 0) >= NOTIFY_DAILY_CAP) {
    // over cap → don't ping, but stamp notified_at so the row is marked handled (no re-fire storm).
    await sb.from("review_requests").update({ notified_at: new Date().toISOString() }).eq("id", id);
    console.log(`[notify] daily cap reached (${sentToday}/${NOTIFY_DAILY_CAP}) — row ${id} logged in console, owner not pinged`);
    return json({ ok: true, capped: true, sent_today: sentToday, cap: NOTIFY_DAILY_CAP });
  }

  const [email, whatsapp] = await Promise.all([sendEmail(row), sendWhatsApp(row)]);

  // stamp notified_at so a retry/replay never double-sends (even if one channel failed —
  // we don't want a flaky channel to cause endless re-notify storms).
  await sb.from("review_requests")
    .update({ notified_at: new Date().toISOString() })
    .eq("id", id);

  return json({ ok: true, email, whatsapp, sent_today: (sentToday ?? 0) + 1, cap: NOTIFY_DAILY_CAP });
});
