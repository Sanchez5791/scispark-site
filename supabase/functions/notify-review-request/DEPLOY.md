# ③ 求救通知 — 部署手册 (Deploy runbook)

免费方案:学生按「请老师复核」→ 老板 **Gmail/邮件** + **WhatsApp** 都收到。
- 邮件 = Resend(免费额度)
- WhatsApp = CallMeBot(免费,个人用)
- ★ 不用付费 WhatsApp Business API。

整条链路:
`学生按钮 → review_requests 插入一行 → AFTER INSERT 触发器(pg_net)→ 调一次 Edge Function → 发邮件 + 发WhatsApp → 写回 notified_at(防重复)`

代码不碰共用引擎 `lesson-shell-v4.js`,所以**不会**和 #57语音 / #64豆豆 / 付款 互相盖。

---

## 老板要先准备的东西

| # | 东西 | 怎么拿 |
|---|------|--------|
| 1 | **WhatsApp 号码**(带国码纯数字,如 `60123456789`) | 老板自己的号码 |
| 2 | **CallMeBot apikey** | 见下方「激活 CallMeBot」 |
| 3 | **通知邮箱**(收求救的邮箱) | 老板定 |
| 4 | **Resend API key** + 验证发件域名 | resend.com 免费注册 |
| 5 | Supabase 项目的部署权限(deploy token 或 dashboard) | 老板/GM |

### 激活 CallMeBot(一次性,免费)
1. 老板手机用 WhatsApp 加这个号码为联系人:**+34 644 51 95 23**
2. 给它发一句:`I allow callmebot to send me messages`
3. 它会回一条带 **apikey** 的消息。记下这个 apikey。
（官方说明:https://www.callmebot.com/blog/free-api-whatsapp-messages/ ）

---

## 部署步骤(GM / 老板执行)

### A. 跑数据库迁移
```bash
supabase db push        # 应用 20260620_review_notify_trigger.sql
```
这会:加 `review_requests.notified_at` 列、装 `pg_net`、建触发器。
（触发器在没配 URL 前是 no-op,先跑也安全。）

### B. 部署 Edge Function(不验 JWT —— 它靠共享密钥保护)
```bash
supabase functions deploy notify-review-request --no-verify-jwt
```

### C. 设置 Function 的 secrets
```bash
# 随便生成一个强随机串当共享密钥
NOTIFY_SECRET=$(openssl rand -hex 24)

supabase secrets set \
  NOTIFY_TRIGGER_SECRET="$NOTIFY_SECRET" \
  RESEND_API_KEY="re_xxx"                       \
  NOTIFY_EMAIL_TO="老板邮箱@example.com"          \
  NOTIFY_EMAIL_FROM="SciSpark Alerts <alerts@scisparklab.com>" \
  CALLMEBOT_PHONE="60123456789"                 \
  CALLMEBOT_APIKEY="CallMeBot给的apikey"         \
  SITE_URL="https://scisparklab.com"
```
> 邮件或 WhatsApp 任一组没填 → 那个渠道自动跳过,另一个照发。先上邮件、晚点补 WhatsApp 也行。

### D. 把 URL + 同一个密钥告诉数据库触发器
在 Supabase SQL editor 跑(把 `<ref>` 换成项目 ref,密钥用上面同一个 `$NOTIFY_SECRET`):
```sql
alter database postgres
  set app.notify_function_url = 'https://<ref>.supabase.co/functions/v1/notify-review-request';
alter database postgres
  set app.notify_secret = '把上面NOTIFY_SECRET的值粘进来';
-- 让新设置立刻生效(不用重启):
select pg_reload_conf();
```

---

## 验收(出截图给老板)
1. 用一个学生测试号,在任意课节按「请老师复核」交一次。
2. 几秒内:
   - 老板邮箱收到一封 `🆘 学生请老师复核 …` 邮件 → 截图。
   - 老板 WhatsApp 收到一条 `🆘 SciSpark 学生请老师复核 …` → 截图。
3. 再按一次 / 刷新 → 不会重复轰炸(同一行 `notified_at` 已写)。

## 排查
- 没收到:Supabase → Edge Functions → `notify-review-request` → Logs 看返回的 `email` / `whatsapp` 明细。
- 看触发器有没有发出去:`select * from net._http_response order by created desc limit 5;`
- CallMeBot 偶尔限速/排队属正常;邮件是兜底。
