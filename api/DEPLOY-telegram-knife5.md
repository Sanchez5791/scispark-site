# 刀5 · Telegram 求救通知 — 部署手册 (Deploy runbook)

学生一求救(尤其危机) → 老板手机 Telegram 立刻收到一条【匿名】提醒 → 去复核台看。
外加:防刷屏 + 发送失败也不丢记录(复核台永远兜底)。

整条链路:
`学生按求救/危机 → 引擎写一行 review_requests → AFTER INSERT 触发器(pg_net) → Vercel 函数 /api/notify-telegram → 服务器端调 Telegram → 老板手机 → 写回 tg_notified_at 防重复`

★ Telegram 只在【服务器端】发, token 只活在 Vercel 环境变量, 绝不进浏览器/代码/GitHub。
★ 完全不动现有的邮件/WhatsApp 老链路(那是另一个触发器)。

---

## 这次新增的文件(共 4 个)

| 文件 | 是什么 |
|------|--------|
| `api/notify-telegram.js` | 主发送函数(服务器端调 Telegram + 防刷屏 + 失败兜底 + 补发) |
| `api/telegram-chatid.js` | **临时**取 chat id 小端点(拿完就删) |
| `supabase/migrations/20260701_telegram_notify.sql` | 加列 + 失败表 + 独立第二触发器(纯增量·可回滚) |
| `api/DEPLOY-telegram-knife5.md` | 本手册 |

---

## 老板/GM 要做的步骤(照顺序)

### 步骤 A — 生成共享密钥,填进 Vercel
1. 生成一条强随机串(终端跑 `openssl rand -hex 24`,或任意 48 位随机串)。
2. Vercel → 项目 → Settings → Environment Variables,新增:
   - `TELEGRAM_NOTIFY_SECRET` = 上面那条随机串 (勾 Production + Preview)
   - `TELEGRAM_BOT_TOKEN` = 你的机器人 token **(你已填好)**
   - `SITE_URL` = `https://scisparklab.com` (若没填过)
   > `SUPABASE_URL` / `SUPABASE_SERVICE_KEY` 现成已有,不用动。

### 步骤 A2 — (可选)加邮件 + WhatsApp 渠道(同样匿名;不填就只走 Telegram)
> 三个渠道各自独立:没填某个渠道的钥匙 → 自动跳过, 不影响别的。任一渠道发出即算通知到。

**邮件(Resend, 免费, 发到你自己的 Gmail 不用验证域名):**
1. 去 resend.com 用**你的 Gmail** 免费注册 → 拿一把 `API Key`(形如 `re_xxx`)。
2. Vercel 环境变量新增(勾 Production + Preview):
   - `RESEND_API_KEY` = `re_xxx`
   - `NOTIFY_EMAIL_TO` = 你的 Gmail(收报警的邮箱)
   > 用测试发件人 `onboarding@resend.dev` 只能发到你注册用的那个邮箱 —— 正好够用, 免域名验证。
   > 以后想发到别的邮箱, 再去 Resend 验证一个发信域名, 并设 `NOTIFY_EMAIL_FROM`。

**WhatsApp(CallMeBot, 免费但★不可靠★, 只当兜底别当唯一报警):**
1. 手机 WhatsApp 加联系人 **+34 644 51 95 23**, 发一句 `I allow callmebot to send me messages`。
2. 它回一条带 `apikey` 的消息, 记下。
3. Vercel 环境变量新增(勾 Production + Preview):
   - `CALLMEBOT_PHONE` = 你的号码(带国码纯数字, 如 `60123456789`)
   - `CALLMEBOT_APIKEY` = 上面拿到的 apikey

### 步骤 B — 推分支,拿 Vercel 预览域名
- 双手房推 `feat/knife5-telegram-notify` → Vercel 自动出一个预览域名(形如 `https://scispark-site-xxxx.vercel.app`)。
- 记下这个预览域名,后面 SQL 和取号都用它。

### 步骤 C — 拿 TELEGRAM_CHAT_ID(临时端点,token 不外露)
1. 手机 Telegram 找到你的机器人 → 按 **Start** → 随便发一句 `hi`。
2. 浏览器打开:`https://<预览域名>/api/telegram-chatid`
3. 页面回一个 JSON,里面 `chat_id` 就是要的数字(例:`123456789`)。
4. 回 Vercel 环境变量,新增:
   - `TELEGRAM_CHAT_ID` = 那个数字 (勾 Production + Preview)
5. **拿到后,删掉 `api/telegram-chatid.js` 再推一次**(双手房做)。

### 步骤 D — 跑数据库迁移 + 写配置表(卡⑫:纯增量·可回滚,不删不改现有数据)
> ★不用 `alter database ... set`★:Supabase 的 postgres 角色没权限设数据库参数(会报
> 42501 permission denied)。改用一张私有【配置表】private.notify_config 存 URL+密钥。
1. 应用迁移(Supabase SQL editor 贴 `20260701_telegram_notify.sql` 全文跑,或 `supabase db push`)。
2. 在 SQL editor 再跑(把 `<预览域名>` 换成真域名;密钥用步骤 A 同一条):
   ```sql
   insert into private.notify_config (key, value) values
     ('telegram_notify_url',    'https://<预览域名>/api/notify-telegram'),
     ('telegram_notify_secret', '<和 TELEGRAM_NOTIFY_SECRET 一模一样的那条>')
   on conflict (key) do update set value = excluded.value;
   ```
   > ★密钥两处必须【一字不差】相同★:Vercel 的 `TELEGRAM_NOTIFY_SECRET` = 配置表的
   > `telegram_notify_secret`。不一样 = 静默 403 不发。

---

## 验收(★老板本人 · 看手机★,刀5 核心只有你验得了)

先看这 4 条(双手房会先在预览自测,你照着复验):

- ☐ ① 触发一条危机:在 **Ask teacher 弹窗里的【理由框】** 打命中词
       → 手机 Telegram 收到一条【匿名】提醒 + 复核台照样置顶那条危机。
- ☐ ② 提醒消息里【没有】小孩真名、【没有】危机原文(只有"去复核台看"+课节参考+参考号)。
- ☐ ③ 短时间连按几次 → 通知有节流不刷屏,但复核台记录一条不少。
- ☐ ④ 故意让发送失败(例:临时把 `TELEGRAM_CHAT_ID` 填错)→ 复核台记录仍在没丢;
       修好后能补发(见下)/在 `notify_failures` 表看得到失败日志。

### 验的坑(别重演)
- 用【正确的刀5 预览域名】(双手房给的那条),别用旧分支网址。
- 先【登录】再测(没登录写不进库 → 触发器不发)。
- 危机词打进【Ask teacher 弹窗里的理由框】,不是答题框。

### 补发(§6④,发失败修好后)
向 `/api/notify-telegram` 发一个 POST(带密钥头),重扫最近 24 小时没推出去的记录并补发:
```bash
curl -X POST "https://<预览域名>/api/notify-telegram" \
  -H "x-notify-secret: <TELEGRAM_NOTIFY_SECRET>" \
  -H "Content-Type: application/json" \
  -d '{"retryPending": true}'
```

---

## 排查
- 没收到:Vercel → 项目 → Logs 看 `/api/notify-telegram` 返回;或查 `select * from public.notify_failures order by created_at desc limit 10;`。
- 看触发器有没有发出去:`select * from net._http_response order by created desc limit 5;`
- 403 forbidden = 两处密钥不一致。500 supabase env missing = Vercel 缺 SUPABASE_* 变量。
- 消息说 `TELEGRAM_CHAT_ID not set` = 步骤 C 没填/名字打错。

---

## 回滚(要撤刀5,不影响邮件/WhatsApp)
见迁移文件末尾的 ROLLBACK 段(drop 掉本刀的触发器/函数/表/列即可)。
