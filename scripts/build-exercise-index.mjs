// Build the muscle ↔ exercise index from the upstream exercises-dataset.
// Usage: node scripts/build-exercise-index.mjs [path-to-exercises-dataset]
// Reads data/exercises.json from the dataset clone plus public/data/muscle-groups.json,
// then writes public/data/exercise-index.json with:
//   groups    — the bridging table (dataset muscle group → atlas FMA concepts)
//   exercises — slim records (id, names, equipment, media paths, Chinese steps)
//   byMuscle  — FMA concept id → [{exercise, role}]  (role: primary | secondary)
// Media files stay in the dataset clone; only relative paths and byte sizes are recorded.
import fs from 'node:fs';

const datasetDir = process.argv[2] ?? 'exercises-dataset';
const root = new URL('..', import.meta.url);
const read = p => JSON.parse(fs.readFileSync(new URL(p, root), 'utf8'));

const groupsTable = read('public/data/muscle-groups.json');
const namesZh = read('public/data/exercise-names-zh.json');
const atlas = read('public/models/atlas.json');
const exercises = read(`${datasetDir}/data/exercises.json`);

// 数据集的脏肌群名 → 桥接表 key(未列出的名字保留原样去小写作 key)
const ALIASES = {
	'shoulders': 'shoulders', 'deltoids': 'shoulders', 'delts': 'shoulders',
	'rear deltoids': 'rear-deltoids',
	'traps': 'traps', 'trapezius': 'traps',
	'lats': 'lats', 'latissimus dorsi': 'lats', 'back': 'lats', 'upper back': 'upper-back',
	'rhomboids': 'rhomboids',
	'abs': 'abs', 'abdominals': 'abs', 'lower abs': 'abs', 'core': 'core',
	'obliques': 'obliques',
	'chest': 'chest', 'pectorals': 'chest', 'upper chest': 'upper-chest',
	'biceps': 'biceps', 'brachialis': 'brachialis',
	'triceps': 'triceps',
	'forearms': 'forearms', 'wrists': 'forearms',
	'wrist flexors': 'wrist-flexors', 'wrist extensors': 'wrist-extensors',
	'grip muscles': 'grip-muscles',
	'quadriceps': 'quads', 'quads': 'quads',
	'hamstrings': 'hamstrings',
	'glutes': 'glutes',
	'abductors': 'abductors',
	'adductors': 'adductors', 'inner thighs': 'adductors', 'groin': 'adductors',
	'hip flexors': 'hip-flexors',
	'calves': 'calves', 'soleus': 'soleus',
	'shins': 'shins',
	'ankles': 'ankles', 'ankle stabilizers': 'ankles',
	'feet': 'feet', 'hands': 'hands',
	'lower back': 'lower-back', 'spine': 'spine',
	'rotator cuff': 'rotator-cuff',
	'serratus anterior': 'serratus-anterior',
	'levator scapulae': 'levator-scapulae',
	'sternocleidomastoid': 'sternocleidomastoid',
};
// 与肌肉无关的目标,索引中保留动作但不绑定概念
const NON_MUSCLE = new Set(['cardiovascular system']);

const groupKey = name => ALIASES[name.toLowerCase()] ?? name.toLowerCase();
const conceptExists = id => atlas.concepts.some(c => c.id === id);
const mediaBytes = rel => {
	try { return fs.statSync(new URL(`${datasetDir}/${rel}`, root)).size; } catch { return 0; }
};

const slim = [];
const byMuscle = {};
let unbound = 0;

for (const ex of exercises) {
	const primary = groupKey(ex.target ?? '');
	const secondaries = [...new Set((ex.secondary_muscles ?? []).map(groupKey))];
	const muscleGroupKeys = [...new Set([primary, ...secondaries])].filter(k => k && k !== 'undefined');
	if (!muscleGroupKeys.some(k => groupsTable.groups[k])) unbound++;

	slim.push({
		id: ex.id,
		name: ex.name,
		nameZh: namesZh[ex.name] ?? null,
		equipment: ex.equipment,
		category: ex.category,
		bodyPart: ex.body_part,
		target: ex.target,
		targetZh: groupsTable.groups[ALIASES[ex.target?.toLowerCase()] ?? '']?.zh ?? null,
		secondary: ex.secondary_muscles ?? [],
		secondaryZh: [...new Set(ex.secondary_muscles ?? [])].map(m => groupsTable.groups[ALIASES[m.toLowerCase()] ?? '']?.zh).filter(Boolean),
		gif: ex.gif_url,
		image: ex.image,
		gifBytes: mediaBytes(ex.gif_url),
		stepsZh: ex.instruction_steps?.zh ?? [],
		stepsEn: ex.instruction_steps?.en ?? [],
	});

	for (const key of muscleGroupKeys) {
		const group = groupsTable.groups[key];
		if (!group) continue;
		const role = key === primary ? 'primary' : 'secondary';
		for (const conceptId of group.concepts) {
			(byMuscle[conceptId] ??= []).push({ exercise: ex.id, role });
		}
	}
}

// 去重:同一动作可能通过多个组绑到同一概念,保留更高角色
const rank = { primary: 1, secondary: 0 };
const merge = (targetId, items) => {
	const list = (byMuscle[targetId] ??= []);
	list.push(...items);
	const best = new Map();
	for (const item of list) {
		const prev = best.get(item.exercise);
		if (!prev || rank[item.role] > rank[prev.role]) best.set(item.exercise, item);
	}
	byMuscle[targetId] = [...best.values()].sort((a, b) =>
		rank[b.role] - rank[a.role] || String(a.exercise).localeCompare(String(b.exercise)));
};
for (const conceptId of Object.keys(byMuscle)) merge(conceptId, []);

// 展开到变体概念:选中「右肱二头肌短头」这类具体概念也应拿到动作。
// 变体 = 去掉侧别词(right/left)后名称包含基础概念名(去 zone of 前缀)、且部件全部为可渲染肌肉网格的概念。
// 侧别词可能出现在名称任意位置(「short head of RIGHT biceps brachii」),必须归一化后比较。
const stripSide = s => s.replace(/\b(?:right|left)\s+/gi, '').replace(/\s+/g, ' ').trim();
const renderablePartIds = new Set(atlas.parts.filter(p => ['muscular', 'skeletal', 'connective'].includes(p.system)).map(p => p.id));
const conceptName = id => atlas.concepts.find(c => c.id === id)?.name ?? '';
for (const [conceptId, list] of Object.entries(byMuscle)) {
	const baseName = stripSide(conceptName(conceptId).replace(/^zone of /, ''));
	if (!baseName) continue;
	for (const c of atlas.concepts) {
		if (c.id === conceptId || c.name === conceptName(conceptId)) continue;
		if (!c.elements.length || !c.elements.every(e => renderablePartIds.has(e))) continue;
		if (stripSide(c.name).includes(baseName)) merge(c.id, list);
	}
}

const index = {
	version: 1,
	source: 'hasaneyldrm/exercises-dataset (MIT; media © Gym visual, attribution required)',
	groups: groupsTable.groups,
	exercises: slim,
	byMuscle,
};
fs.writeFileSync(new URL('public/data/exercise-index.json', root), JSON.stringify(index));

const conceptsWithExercises = Object.keys(byMuscle).length;
const totalBindings = Object.values(byMuscle).reduce((n, l) => n + l.length, 0);
console.log(JSON.stringify({
	exercises: slim.length,
	missingNameZh: slim.filter(e => !e.nameZh).length,
	muscleGroupsMapped: Object.keys(groupsTable.groups).length,
	unboundExercises: unbound,
	conceptsWithExercises: conceptsWithExercises,
	totalBindings: totalBindings,
	missingGifs: slim.filter(e => !e.gifBytes).length,
}, null, 2));
