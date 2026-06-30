// 给所有「git 追踪中的 .html」在 <head> 紧接处插入一行 GA loader。
// 幂等：已含 /ga.js 的档跳过。只动第一个 <head ...> 开标签后面。
import { execSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';

const TAG = '<script src="/ga.js"></script>';
const files = execSync('git ls-files *.html', { encoding: 'utf8' })
  .split('\n').map(s => s.trim()).filter(Boolean);

let added = 0, skipped = 0, nohead = 0;
const addedList = [], noheadList = [];

// 找「真正的」<head> 开标签：略过出现在 HTML 注释 <!-- ... --> 里的假 head。
function realHeadEnd(html) {
  const re = /<head\b[^>]*>/gi;
  let m;
  while ((m = re.exec(html)) !== null) {
    const before = html.slice(0, m.index);
    const lastOpen = before.lastIndexOf('<!--');
    const lastClose = before.lastIndexOf('-->');
    const inComment = lastOpen > lastClose; // 注释开了还没关 → 这个 head 在注释里
    if (!inComment) return m.index + m[0].length;
  }
  return -1;
}

for (const f of files) {
  let html = readFileSync(f, 'utf8');
  if (html.includes('/ga.js')) { skipped++; continue; }
  const idx = realHeadEnd(html);
  if (idx < 0) { nohead++; noheadList.push(f); continue; }
  html = html.slice(0, idx) + '\n' + TAG + html.slice(idx);
  writeFileSync(f, html);
  added++; addedList.push(f);
}

console.log(`总档数 ${files.length}`);
console.log(`已装(新增) ${added}`);
console.log(`跳过(本来就有) ${skipped}`);
console.log(`没有 <head> 标签 ${nohead}`);
if (noheadList.length) console.log('无 head 档:\n  ' + noheadList.join('\n  '));
