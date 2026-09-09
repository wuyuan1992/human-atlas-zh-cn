// validate-muscle-index.mjs — 校验 public/data/muscle-index.json 的数据契约
// 用法:node scripts/validate-muscle-index.mjs(通过退出码 0,失败非 0 并打印错误)
//
// 契约(docs/UX-OPTIMIZATION.md §一.2 / docs/TECH-PLAN.md §2.6 校验风格):
//  ① 所有 conceptIds 存在于 atlas.json;
//  ② zh 与拼音(pinyinFull / pinyinInitials)非空;
//  ③ conceptIds 非空;
//  ④ fallback 条目指向的概念存在(① 的子集,单独复核)且 kind 合法;
//  ⑤ groups 无重复 zh 键;
//  ⑥ 附加:文件 < 300KB(规模控制),meshCount 为正整数,en 非空。

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ATLAS_PATH = path.join(ROOT, 'public/models/atlas.json');
const INDEX_PATH = path.join(ROOT, 'public/data/muscle-index.json');
const MAX_BYTES = 300 * 1024;

const errors = [];
const fail = (msg) => errors.push(msg);

// -- 载入 --
let atlas;
let index;
let bytes;
try {
  atlas = JSON.parse(readFileSync(ATLAS_PATH, 'utf8'));
  index = JSON.parse(readFileSync(INDEX_PATH, 'utf8'));
  bytes = readFileSync(INDEX_PATH).byteLength;
} catch (err) {
  console.error(`加载失败:${err.message}`);
  process.exit(1);
}

const conceptIds = new Set(atlas.concepts.map((c) => c.id));
const groups = Array.isArray(index.groups) ? index.groups : [];

// -- 结构基线 --
if (index.version !== 1) fail(`version 应为 1,实际 ${JSON.stringify(index.version)}`);
if (groups.length === 0) fail('groups 为空');

const seenZh = new Map(); // zh -> kind(用于 ⑤ 重复键检测)

for (const g of groups) {
  const label = JSON.stringify(g.zh ?? g.en ?? '<unnamed>');

  // ③ conceptIds 非空(数组且至少一项)
  if (!Array.isArray(g.conceptIds) || g.conceptIds.length === 0) {
    fail(`${label}: conceptIds 为空`);
  } else {
    // ① 所有 conceptIds 存在于 atlas
    for (const id of g.conceptIds) {
      if (!conceptIds.has(id)) fail(`${label}: conceptId ${id} 不存在于 atlas.json`);
    }
    if (new Set(g.conceptIds).size !== g.conceptIds.length) {
      fail(`${label}: conceptIds 存在重复项`);
    }
  }

  // ② zh 与拼音非空
  if (typeof g.zh !== 'string' || g.zh.trim() === '') fail(`${label}: zh 为空`);
  if (typeof g.pinyinFull !== 'string' || g.pinyinFull.trim() === '') fail(`${label}: pinyinFull 为空`);
  if (typeof g.pinyinInitials !== 'string' || g.pinyinInitials.trim() === '') {
    fail(`${label}: pinyinInitials 为空`);
  }

  // 附加:en 非空、meshCount 正整数
  if (typeof g.en !== 'string' || g.en.trim() === '') fail(`${label}: en 为空`);
  if (!Number.isInteger(g.meshCount) || g.meshCount <= 0) fail(`${label}: meshCount 非正整数`);

  // kind 合法;④ fallback 条目额外复核其指向概念存在(上面 ① 已查,这里确保 fallback 语义正确)
  if (g.kind !== 'aggregate' && g.kind !== 'fallback') {
    fail(`${label}: kind 非法(${g.kind}),应为 aggregate | fallback`);
  } else if (g.kind === 'fallback') {
    const targets = (g.conceptIds || []).filter((id) => conceptIds.has(id));
    if (targets.length !== (g.conceptIds || []).length) {
      fail(`${label}: fallback 指向的概念存在性复核未通过`);
    }
    if (typeof g.note !== 'string' || g.note.trim() === '') {
      fail(`${label}: fallback 缺少 note(数据缺口说明)`);
    }
  }

  // ⑤ 无重复 zh
  if (seenZh.has(g.zh)) fail(`重复 zh:「${g.zh}」(${seenZh.get(g.zh)} 与 ${g.kind})`);
  else seenZh.set(g.zh, g.kind);

  // aliases 必须是字符串数组且不含组自身 zh(别名与正名重复无意义)
  if (!Array.isArray(g.aliases)) fail(`${label}: aliases 非数组`);
  else for (const a of g.aliases) {
    if (typeof a !== 'string' || a.trim() === '') fail(`${label}: alias 项为空`);
    if (a === g.zh) fail(`${label}: alias「${a}」与 zh 重复`);
  }
}

// ⑥ 规模控制
if (bytes >= MAX_BYTES) fail(`文件大小 ${bytes} bytes 超出 300KB 上限`);

// -- 结果 --
const kindCount = groups.reduce((acc, g) => ((acc[g.kind] = (acc[g.kind] || 0) + 1), acc), {});
if (errors.length > 0) {
  console.error(`validate-muscle-index: 失败,共 ${errors.length} 处错误:`);
  for (const e of errors) console.error(`  - ${e}`);
  process.exit(1);
}
console.log(
  `validate-muscle-index: 通过 — ${groups.length} 组 ${JSON.stringify(kindCount)},` +
    `conceptIds ${groups.reduce((n, g) => n + g.conceptIds.length, 0)} 条全部存在于 atlas,` +
    `无重复 zh,大小 ${(bytes / 1024).toFixed(1)}KB < 300KB`,
);
process.exit(0);
