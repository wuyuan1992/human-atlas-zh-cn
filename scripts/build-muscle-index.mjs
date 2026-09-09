// build-muscle-index.mjs — 生成「常用肌肉名 → 概念聚合」索引 public/data/muscle-index.json
//
// 背景(docs/UX-OPTIMIZATION.md §一.2):BodyParts3D 概念粒度到左右侧/亚区,
// 搜「胸大肌」得到 12 条碎片而无主概念。本脚本按「基础名」把 左/右、子结构
// ([xxx]短头 / xxx锁骨部 / 带区) 概念聚合为一组,供搜索置顶与合并高亮。
// schema 与 docs/TECH-PLAN.md §2.1 肌肉注册表字段兼容(zh/en/aliases/pinyin*)。
//
// 数据事实(实测 public/models/atlas.json):
//  - concept: { id, name, 'name-zh', elements: partId[] };part: { id, system, conceptId }
//  - 源数据存在 system 误标:如 肩胛下肌/胫骨前肌/腓骨长肌 的网格被标为
//    'skeletal'、阔筋膜张肌被标为 'connective'(实为骨骼肌),见 RESCUE_BASE_NAMES。
//  - 背阔肌、腹直肌、竖脊肌等整肌概念在 atlas 中不存在,只能建 fallback
//    (conceptIds 指向存在的上位/组成概念)或进缺失清单。

import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { pinyin } from 'pinyin-pro';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ATLAS_PATH = path.join(ROOT, 'public/models/atlas.json');
const OUT_PATH = path.join(ROOT, 'public/data/muscle-index.json');

// ---------------------------------------------------------------------------
// 1. 提取肌肉概念
// ---------------------------------------------------------------------------

// 主阈值:elements 中 system==='muscular' 的占比 ≥ 0.5 即视为肌肉概念。
// 取 0.5 而非 1.0,是因为源数据把部分真实肌肉网格误标为 skeletal/connective/
// respiratory(如 上肢肌 74/78、颈肌 42/54),多数表决可吸收这类脏标;
// 0/2 这种全误标的著名肌肉由下方 RESCUE_BASE_NAMES 显式抢救,不做模糊推断。
const MUSCULAR_RATIO = 0.5;

// 整肌全部网格被误标的著名肌肉(健身高频):仅按中文名抢救,注释留痕。
// 肩胛下肌/肩胛提肌 → 'skeletal';阔筋膜张肌 → 'connective';
// 胫骨前肌/胫骨后肌/腓骨长肌/腓骨短肌/第三腓骨肌 → 'skeletal'。
const RESCUE_BASE_NAMES = new Set([
  '肩胛下肌',
  '肩胛提肌',
  '阔筋膜张肌',
  '胫骨前肌',
  '胫骨后肌',
  '腓骨长肌',
  '腓骨短肌',
  '第三腓骨肌',
]);

// 心脏与泛化器官概念不是训练意义上的骨骼肌(TECH-PLAN §2.1「剔除乳头肌等
// 心内结构」;「肌器官」「器官带区」等为 FMA 泛化类目),按名排除。
const EXCLUDE_ZH = /乳头肌|心肌|心室|心房|心包|室壁|流入道|节段|内膜|器官/;

// ---------------------------------------------------------------------------
// 2. 基础名归一化:去掉「左/右」前缀、「[xxx]」子结构标记、「带区」、
//    「xx部/xx头」亚区后缀,使 左/右/亚区 概念归并到同一基础名。
// ---------------------------------------------------------------------------

function baseNameOf(zhRaw) {
  let zh = zhRaw;
  zh = zh.replace(/^[左右]/, ''); // 左胸大肌 → 胸大肌
  const bracket = zh.match(/\[(.+?)\]/); // [肱二头肌]短头 → 肱二头肌
  if (bracket) zh = bracket[1].trim();
  if (zh.endsWith('带区')) zh = zh.slice(0, -2); // 胸大肌带区 → 胸大肌
  zh = zh.replace(/^(.+肌).{1,5}部$/, '$1'); // 三角肌锁骨部 → 三角肌
  zh = zh.replace(/^(.+肌).{0,5}头$/, '$1'); // 股二头肌头 → 股二头肌
  return zh;
}

// 英文名归一化:与中文基础名规则对齐(zone of / left / right / xx part of / xx head of)
function baseEnOf(enRaw) {
  let s = enRaw.toLowerCase();
  const partWord =
    '(?:clavicular|sternocostal|abdominal|acromial|spinal|ascending|transverse|descending|superior|inferior|medial|lateral|anterior|posterior|oblique|vertical|horizontal|ulnar|humeral|anterolateral|intermediate)';
  const headWord =
    '(?:short|long|medial|lateral|anterior|posterior|oblique|transverse|ulnar|humeral|anterolateral|superior|inferior)';
  for (let i = 0; i < 4; i++) {
    const before = s;
    s = s.replace(/^zone of /, '');
    s = s.replace(/^(?:left|right) /, '');
    s = s.replace(new RegExp(`^${partWord}(?: ${partWord})? part of `), '');
    s = s.replace(new RegExp(`^${headWord}(?: ${headWord})? head of `), '');
    s = s.replace(/^head of /, '');
    if (s === before) break;
  }
  return s;
}

// ---------------------------------------------------------------------------
// 3. 别名与 fallback:人工整理的健身常见叫法;对应不上的不硬造。
//    背阔肌(latissimus dorsi)在 atlas 中连概念与网格都不存在,且无合理
//    上位分组(数据中无 muscle of back),进缺失清单,不建条目。
// ---------------------------------------------------------------------------

const ALIASES_BY_ZH = {
  胸大肌: ['胸肌'],
  肱二头肌: ['二头'],
  肱三头肌: ['三头'],
  股四头肌: ['股四头'],
  腹外斜肌: ['人鱼线'],
  前锯肌: ['鲨鱼肌'],
  腓肠肌: ['小腿肚'],
};

// atlas 中不存在的著名肌肉 → 指向存在的上位分组/组成概念,供搜索空态兜底。
// note 说明数据缺口,前端空态可展示。
const FALLBACK_ENTRIES = [
  {
    zh: '腹直肌',
    en: 'rectus abdominis',
    conceptIds: ['FMA9620', 'FMA20278'], // 腹肌 muscle of abdomen + 腹前壁肌
    aliases: [],
    note: '模型无腹直肌概念,兜底定位到腹肌分组(网格为左右腹外斜肌)',
  },
  {
    zh: '腹横肌',
    en: 'transversus abdominis',
    conceptIds: ['FMA9620', 'FMA20278'],
    aliases: [],
    note: '模型无腹横肌概念,兜底定位到腹肌分组',
  },
  {
    zh: '腹内斜肌',
    en: 'internal oblique',
    conceptIds: ['FMA9620', 'FMA20278'],
    aliases: [],
    note: '模型无腹内斜肌概念,兜底定位到腹肌分组',
  },
  {
    zh: '竖脊肌',
    en: 'erector spinae',
    conceptIds: ['FMA77177', 'FMA77178', 'FMA77179'], // 髂肋肌 + 最长肌 + 棘肌
    aliases: [],
    note: '模型无竖脊肌概念,兜底定位到其三个组成肌柱',
  },
  {
    zh: '髂腰肌',
    en: 'iliopsoas',
    conceptIds: ['FMA22310', 'FMA18060'], // 髂肌 + 腰大肌
    aliases: [],
    note: '模型无髂腰肌复合概念,兜底定位到髂肌与腰大肌',
  },
  {
    zh: '腘绳肌',
    en: 'hamstrings',
    conceptIds: ['FMA45881', 'FMA22357', 'FMA22438'], // 股二头肌头 + 半腱肌 + 半膜肌
    aliases: ['腘绳'],
    note: '模型无腘绳肌群概念,兜底定位到三个组成肌',
  },
  {
    zh: '小腿三头肌',
    en: 'triceps surae',
    conceptIds: ['FMA45950', 'FMA22542'], // 腓肠肌头 + 比目鱼肌
    aliases: ['小腿三头'],
    note: '模型无小腿三头肌概念,兜底定位到腓肠肌与比目鱼肌',
  },
  {
    zh: '三角肌前束',
    en: 'anterior deltoid',
    conceptIds: ['FMA34677', 'FMA34680', 'FMA34681'], // 三角肌锁骨部(左右)
    aliases: ['前束', '肩前束'],
    note: '无独立概念,指向三角肌锁骨部',
  },
  {
    zh: '三角肌中束',
    en: 'lateral deltoid',
    conceptIds: ['FMA34678', 'FMA34682', 'FMA34683'], // 三角肌肩峰部(左右)
    aliases: ['中束', '肩中束'],
    note: '无独立概念,指向三角肌肩峰部',
  },
  {
    zh: '三角肌后束',
    en: 'posterior deltoid',
    conceptIds: ['FMA34679', 'FMA34684', 'FMA34685'], // 三角肌脊柱部(左右)
    aliases: ['后束', '肩后束'],
    note: '无独立概念,指向三角肌脊柱部',
  },
  {
    zh: '肩袖肌群',
    en: 'rotator cuff',
    conceptIds: ['FMA9629', 'FMA32546', 'FMA32550', 'FMA13413'], // 冈上/冈下/小圆/肩胛下
    aliases: ['肩袖', '旋转袖'],
    note: '无独立概念,指向四块组成肌',
  },
  {
    zh: '菱形肌',
    en: 'rhomboids',
    conceptIds: ['FMA13379', 'FMA13380'], // 大菱形肌 + 小菱形肌
    aliases: [],
    note: '无合并概念,指向大/小菱形肌',
  },
];

// 著名肌肉缺失清单(atlas 中连概念/网格都不存在,且无合理兜底)——只进报告,不进数据。
const MISSING_NOTES = [
  '背阔肌 (latissimus dorsi):无概念、无网格、无背部肌上位分组,连 fallback 都不可得',
];

// ---------------------------------------------------------------------------
// 构建
// ---------------------------------------------------------------------------

const atlas = JSON.parse(readFileSync(ATLAS_PATH, 'utf8'));
const partById = new Map(atlas.parts.map((p) => [p.id, p]));
const conceptById = new Map(atlas.concepts.map((c) => [c.id, c]));

// 全拼以空格分隔音节(如 "xiong da ji",前端匹配时可去空格得到 "xiongdaji"),
// 首字母取每个音节首字母("xdj");只保留 a-z 音节,忽略生僻字未识别输出。
const pinyinOf = (zh) => {
  const syllables = pinyin(zh, { toneType: 'none', type: 'array' })
    .join(' ')
    .match(/[a-z]+/g);
  return {
    pinyinFull: (syllables || []).join(' '),
    pinyinInitials: (syllables || []).map((s) => s[0]).join(''),
  };
};

// -- 提取 --
const muscleConcepts = [];
const stats = { total: 0, byMajority: 0, byRescue: 0, excludedName: 0, notMuscleName: 0 };
for (const concept of atlas.concepts) {
  const parts = (concept.elements || []).map((id) => partById.get(id)).filter(Boolean);
  if (parts.length === 0) continue;
  stats.total++;

  const zh = concept['name-zh'];
  if (!zh) continue; // 分组依赖中文名;实测肌肉概念均有 name-zh
  if (EXCLUDE_ZH.test(zh)) {
    stats.excludedName++;
    continue;
  }

  const muscular = parts.filter((p) => p.system === 'muscular').length;
  const ratio = muscular / parts.length;
  const base = baseNameOf(zh);
  const byMajority = ratio >= MUSCULAR_RATIO;
  const byRescue = !byMajority && RESCUE_BASE_NAMES.has(base);
  if (!byMajority && !byRescue) continue;
  if (byMajority) stats.byMajority++;
  else stats.byRescue++;

  // 基础名必须以「肌」结尾:排除混入多数表决的非肌肉概念(器官带区、口咽峡部、
  // 上肢带胸部等)。真实肌群分组(头肌/腹肌/上肢肌/小腿后室浅层肌…)天然满足。
  if (!base.endsWith('肌')) {
    stats.notMuscleName++;
    continue;
  }

  muscleConcepts.push({ concept, base, ratio, byRescue });
}

// -- 聚合 --
const groupMap = new Map(); // base -> { concepts: [], ens: [] }
for (const { concept, base } of muscleConcepts) {
  if (!groupMap.has(base)) groupMap.set(base, { concepts: [], ens: [] });
  const g = groupMap.get(base);
  g.concepts.push(concept);
  g.ens.push(baseEnOf(concept.name));
}

const groups = [];
for (const [base, g] of groupMap) {
  // 代表英文名:组内归一化后出现频次最高者,平频取最短
  const freq = new Map();
  for (const en of g.ens) freq.set(en, (freq.get(en) || 0) + 1);
  let en = [...freq.entries()].sort((a, b) => b[1] - a[1] || a[0].length - b[0].length)[0][0];
  if (!en) en = g.concepts[0].name;

  const conceptIds = g.concepts.map((c) => c.id).sort((a, b) => {
    const ca = conceptById.get(a);
    const cb = conceptById.get(b);
    return cb.elements.length - ca.elements.length || a.localeCompare(b);
  });
  const meshCount = new Set(g.concepts.flatMap((c) => c.elements)).size;
  const { pinyinFull, pinyinInitials } = pinyinOf(base);

  groups.push({
    zh: base,
    en,
    conceptIds,
    meshCount,
    pinyinFull,
    pinyinInitials,
    aliases: ALIASES_BY_ZH[base] || [],
    kind: 'aggregate',
  });
}

// -- fallback --
const fallbackZhSet = new Set(groups.map((g) => g.zh));
for (const fb of FALLBACK_ENTRIES) {
  if (fallbackZhSet.has(fb.zh)) {
    throw new Error(`fallback 「${fb.zh}」与 aggregate 组重名`);
  }
  const { pinyinFull, pinyinInitials } = pinyinOf(fb.zh);
  const meshCount = new Set(fb.conceptIds.flatMap((id) => conceptById.get(id)?.elements || [])).size;
  // note 为 fallback 专有的可选字段(数据缺口说明),前端空态展示用
  const entry = { ...fb, meshCount, pinyinFull, pinyinInitials, kind: 'fallback' };
  groups.push(entry);
  fallbackZhSet.add(fb.zh);
}

// -- 排序与落盘:aggregate 在前、fallback 在后,各自按拼音排序,产物确定 --
groups.sort((a, b) => a.kind.localeCompare(b.kind) || a.pinyinFull.localeCompare(b.pinyinFull));
const out = { version: 1, groups };
const json = JSON.stringify(out, null, 1) + '\n';
writeFileSync(OUT_PATH, json);

// -- 报告 --
const kindCount = groups.reduce((acc, g) => ((acc[g.kind] = (acc[g.kind] || 0) + 1), acc), {});
console.log(`muscle-index.json 写入 ${OUT_PATH}`);
console.log(`  大小: ${Buffer.byteLength(json)} bytes (${(Buffer.byteLength(json) / 1024).toFixed(1)} KB)`);
console.log(`  组数: ${groups.length} | kind 分布: ${JSON.stringify(kindCount)}`);
console.log(`  概念提取: 通过多数表决 ${stats.byMajority} + 名单抢救 ${stats.byRescue};按名排除 ${stats.excludedName} 条,非肌肉名 ${stats.notMuscleName} 条`);
console.log(`  aggregate 覆盖概念数: ${groups.filter((g) => g.kind === 'aggregate').reduce((n, g) => n + g.conceptIds.length, 0)}`);
console.log('  缺失清单(连 fallback 都不可得):');
for (const m of MISSING_NOTES) console.log(`    - ${m}`);
