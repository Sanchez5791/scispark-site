# 课程骨架系统 · Lesson Frame System

老板白话版。两个东西 + 一条规矩。

## 一句话原理

每个课文件 = **门面**（导航、进度条、侧栏、页脚、脚本 —— 每课一模一样）
＋ **你写的 3 块**：
1. `SCISPARK:MANIFEST` —— 这课的身份（标题 / 单元 / 科目）
2. `SCISPARK:CONTENT` —— 课程正文（5 个屏：Hook / Learn / Try / Test / Wrap）
3. `SCISPARK:BUBBLE` —— 对白（豆豆台词）

**门面没人手改**，它由唯一的模板生成：`lessons/_template/lesson-frame.html`
**颜色和字体不在模板里** —— 它们在共享样式表 `/public/lesson-shell-v4.css`（用 CSS 变量）。
所以首页定稿要换配色，是改那张 CSS，不用碰 400 个课。

## 新建一课

```
node scripts/build-lessons.mjs new y8/u7/l02
```
生成一个带门面 + 空白 3 块的文件，你只填那 3 块。

## 外壳升级 / 改门面结构后，一键刷全部课

1. 改 `lessons/_template/lesson-frame.html`（比如把 v4 换成 v6）
2. 双击 `scripts/更新所有课程-UPDATE-ALL-LESSONS.bat`
   —— 它先给你看「会改哪些」，你按 y 才真的改。

命令行等价：
```
node scripts/build-lessons.mjs check   # 先看会改什么（不写文件）
node scripts/build-lessons.mjs sync    # 真的刷下去
node scripts/build-lessons.mjs list    # 看哪些课已纳入管理
```

## 唯一规矩

> 课文件里，**只动 MANIFEST / CONTENT / BUBBLE 这 3 块**。
> 其余一律不手改 —— 改了下次 `sync` 会被模板覆盖。

`sync` 只会处理「带这 3 个标记」的文件；没标记的老文件它一律跳过、不碰。
