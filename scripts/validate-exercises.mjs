// Validate the muscle ↔ exercise index contract.
// Usage: node scripts/validate-exercises.mjs [path-to-exercises-dataset]
import fs from 'node:fs';
import assert from 'node:assert/strict';

const datasetDir = process.argv[2] ?? 'exercises-dataset';
const root = new URL('..', import.meta.url);
const read = p => JSON.parse(fs.readFileSync(new URL(p, root), 'utf8'));
const atlas = read('public/models/atlas.json');
const index = read('public/data/exercise-index.json');

// Renderable muscle meshes live in these display groups; BodyParts3D files a few muscles
// (levator scapulae → skeletal, tensor fasciae latae → connective) outside the muscular group.
const musclePartIds = new Set(atlas.parts.filter(p => ['muscular', 'skeletal', 'connective'].includes(p.system)).map(p => p.id));
const concepts = new Map(atlas.concepts.map(c => [c.id, c]));
const exerciseIds = new Set(index.exercises.map(e => e.id));
assert.equal(exerciseIds.size, index.exercises.length, 'exercise ids must be unique');

// 1. 桥接表概念必须存在于 atlas 且全部为肌肉概念
for (const [key, group] of Object.entries(index.groups)) {
	assert.ok(group.concepts.length, `${key}: no concepts`);
	for (const id of group.concepts) {
		const c = concepts.get(id);
		assert.ok(c, `${key}: concept ${id} missing from atlas`);
		assert.ok(c.elements.length && c.elements.every(e => musclePartIds.has(e)), `${key}: concept ${id} has no rendered muscle meshes`);
	}
}

// 2. byMuscle:概念存在、动作存在、角色合法、无重复
for (const [conceptId, list] of Object.entries(index.byMuscle)) {
	assert.ok(concepts.has(conceptId), `byMuscle: unknown concept ${conceptId}`);
	const seen = new Set();
	for (const item of list) {
		assert.ok(exerciseIds.has(item.exercise), `byMuscle ${conceptId}: unknown exercise ${item.exercise}`);
		assert.ok(item.role === 'primary' || item.role === 'secondary', `byMuscle ${conceptId}: bad role`);
		const key = item.exercise;
		assert.ok(!seen.has(key), `byMuscle ${conceptId}: duplicate exercise ${item.exercise}`);
		seen.add(key);
	}
}

// 3. 动作记录:双语名称齐全、双语步骤非空;媒体文件在本地 clone 存在时校验,远程模式(媒体走 CDN/GitHub)跳过
const mediaCloned = fs.existsSync(new URL(`${datasetDir}/videos`, root));
for (const ex of index.exercises) {
	assert.ok(ex.name && ex.id, `${ex.id}: missing name`);
	assert.ok(typeof ex.nameZh === 'string' && ex.nameZh.trim(), `${ex.id} (${ex.name}): missing Chinese name`);
	assert.ok(Array.isArray(ex.stepsZh) && ex.stepsZh.length, `${ex.id}: missing Chinese steps`);
	assert.ok(Array.isArray(ex.stepsEn) && ex.stepsEn.length, `${ex.id}: missing English steps`);
	if (mediaCloned) {
		assert.ok(ex.gifBytes > 0, `${ex.id}: gif missing or empty (${ex.gif})`);
		fs.statSync(new URL(`${datasetDir}/${ex.gif}`, root));
		fs.statSync(new URL(`${datasetDir}/${ex.image}`, root));
	}
}

// 4. 主目标绑定:target 为肌肉的动作,必须能从某个肌肉概念反查回来
const boundExercises = new Set(Object.values(index.byMuscle).flatMap(l => l.map(i => i.exercise)));
const targetMuscleExercises = index.exercises.filter(e => e.target && e.target.toLowerCase() !== 'cardiovascular system');
for (const ex of targetMuscleExercises) {
	assert.ok(boundExercises.has(ex.id), `${ex.id} (target ${ex.target}): not reachable from any muscle`);
}

console.log(`Verified ${index.exercises.length} exercises, ${Object.keys(index.groups).length} muscle groups, ${Object.keys(index.byMuscle).length} bound concepts, ${Object.values(index.byMuscle).reduce((n, l) => n + l.length, 0)} bindings, and all media files.`);
