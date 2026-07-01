// api/telegram-chatid.js — SciSpark 刀5 · 【临时】取 chat id 小端点
// ============================================================================
// ★★★ 临时用, 用完就删 (删掉本文件再推一次即可)。★★★
//
// 为什么要它 (刀5 工单 §4):
//   老板现在只有 TELEGRAM_BOT_TOKEN, 没有 TELEGRAM_CHAT_ID。
//   拿 chat id 需要调 Telegram getUpdates —— 这一步★必须在服务器端做★,
//   token 才不会离开环境变量 (绝不叫老板把 token 贴进浏览器网址)。
//
// 怎么用:
//   1. 老板在 Telegram 里找到自己的机器人 → 按 Start → 随便发一句 "hi"。
//   2. 浏览器打开:  https://<预览域名>/api/telegram-chatid
//   3. 页面回一个 JSON, 里面 chat_id 就是要的数字。
//   4. 老板把那个数字填进 Vercel 环境变量  TELEGRAM_CHAT_ID
//      (勾 Production + Preview, 跟 token 一样)。
//   5. ★删掉本文件, 再推一次。★
//
// 安全:
//   · 本端点【只】从环境变量读 token, 【只】回传 chat id, ★绝不回传 token★。
//   · 只暴露"给这个机器人发过消息的人"的 chat id (也就是老板自己), 低风险。
//   · 仍然用完即删, 不留在生产。
// ============================================================================

'use strict';

module.exports = async function handler(req, res) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    return res.status(500).json({
      ok: false,
      error: 'TELEGRAM_BOT_TOKEN 环境变量没设 (老板应已在 Vercel 填好, 检查名字是否一字不差)。',
    });
  }

  try {
    const r = await fetch(`https://api.telegram.org/bot${token}/getUpdates`);
    const data = await r.json();
    if (!data.ok) {
      return res.status(502).json({ ok: false, error: 'Telegram getUpdates 失败', telegram: data.description || data });
    }

    // 从 updates 里抽出所有出现过的 chat id (去重), ★只回 id + 名字, 不回 token★。
    const seen = new Map();
    for (const u of (data.result || [])) {
      const chat = (u.message && u.message.chat)
        || (u.edited_message && u.edited_message.chat)
        || (u.channel_post && u.channel_post.chat);
      if (chat && chat.id != null && !seen.has(chat.id)) {
        seen.set(chat.id, {
          chat_id: chat.id,
          type: chat.type,
          name: chat.title || [chat.first_name, chat.last_name].filter(Boolean).join(' ') || chat.username || '',
        });
      }
    }

    const chats = Array.from(seen.values());
    if (!chats.length) {
      return res.status(200).json({
        ok: true,
        chats: [],
        hint: '还没抓到 chat id。请先在 Telegram 里给这个机器人按 Start 并发一句 "hi", 再刷新本页。',
      });
    }

    return res.status(200).json({
      ok: true,
      chats,
      next: '把上面的 chat_id 填进 Vercel 环境变量 TELEGRAM_CHAT_ID (勾 Production + Preview), 然后删掉本文件 api/telegram-chatid.js。',
    });
  } catch (e) {
    return res.status(500).json({ ok: false, error: e && e.message ? e.message : String(e) });
  }
};
