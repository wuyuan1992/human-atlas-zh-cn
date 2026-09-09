import type {Concept} from './anatomy';

/** One entry of public/data/muscle-index.json: a common training name mapped onto
    one or more atlas concepts. `fallback` groups point at a stand-in concept that is
    not the exact muscle (the atlas has no such concept) and render with a marker. */
export interface MuscleGroup {
	zh: string;
	en: string;
	conceptIds: string[];
	meshCount: number;
	/** Space-separated pinyin syllables, e.g. "gong er tou ji". */
	pinyinFull: string;
	/** Pinyin initials, e.g. "getj". */
	pinyinInitials: string;
	aliases: string[];
	kind: 'aggregate' | 'fallback';
	note?: string;
}
export interface MuscleIndexData {version: number; groups: MuscleGroup[]}

/** A concept as shown in search results. Aggregate groups become synthetic concepts
    carrying the union of their members' elements plus the ids needed by the exercise list. */
export interface SearchConcept extends Concept {
	conceptIds?: string[];
	groupKind?: 'aggregate' | 'fallback';
}

// Exercise index records (moved here so the shared loader owns the types).
export interface ExerciseRecord {id: string; name: string; nameZh: string | null; nameFr: string | null; nameDe: string | null; equipment: string; target: string; targetZh: string | null; targetFr: string | null; targetDe: string | null; secondaryZh: string[]; secondaryFr: string[]; secondaryDe: string[]; gif: string; image: string; stepsZh: string[]; stepsEn: string[]; stepsFr: string[]}
export interface ExerciseIndexData {exercises: ExerciseRecord[]; byMuscle: Record<string, {exercise: string; role: 'primary' | 'secondary'}[]>}

/** Lazy single-flight loaders. The promise is cached at module level so the idle
    prefetch and the first detail open can never race into duplicate requests; a
    failed load clears the cache so a later attempt can retry. */
let musclePromise: Promise<MuscleIndexData | null> | null = null;
export function loadMuscleIndex(): Promise<MuscleIndexData | null> {
	if (!musclePromise) {
		musclePromise = fetch('/data/muscle-index.json').then(r => {
			if (!r.ok) throw new Error(String(r.status));
			return r.json() as Promise<MuscleIndexData>;
		}).catch(() => {
			musclePromise = null;
			return null;
		});
	}
	return musclePromise;
}

let exercisePromise: Promise<ExerciseIndexData | null> | null = null;
export function loadExerciseIndex(): Promise<ExerciseIndexData | null> {
	if (!exercisePromise) {
		exercisePromise = fetch('/data/exercise-index.json').then(r => {
			if (!r.ok) throw new Error(String(r.status));
			return r.json() as Promise<ExerciseIndexData>;
		}).catch(() => {
			exercisePromise = null;
			return null;
		});
	}
	return exercisePromise;
}

/** Match strength: exact > prefix > contains > none. */
const strength = (field: string, needle: string): number => (needle && field === needle ? 3 : field.startsWith(needle) ? 2 : field.includes(needle) ? 1 : 0);

export interface GroupMatch {group: MuscleGroup; score: number}

/** Match a query against group zh/en/aliases plus pinyin (full, spaces removed, and
    initials). Pinyin comparison also ignores spaces in the query ("gu si tou ji" ≡ "gusitouji"). */
export function matchMuscleGroups(groups: MuscleGroup[], term: string): GroupMatch[] {
	if (!term) return [];
	const lower = term.toLowerCase(), compact = lower.replace(/\s+/g, '');
	const matches: GroupMatch[] = [];
	for (const group of groups) {
		const pinyin = group.pinyinFull.replace(/\s+/g, '');
		let score = Math.max(
			strength(group.zh, term),
			strength(group.en.toLowerCase(), lower),
			strength(pinyin, compact),
			strength(group.pinyinInitials, compact),
		);
		for (const alias of group.aliases) score = Math.max(score, strength(alias, term), strength(alias.toLowerCase(), lower));
		if (score > 0) matches.push({group, score});
	}
	return matches;
}

/** Stable synthetic concept id for a group (`group:<en>`; en names are unique in the index). */
export const groupConceptId = (group: MuscleGroup): string => `group:${group.en}`;

/** Expand a group into a selectable concept: elements are the union of every member
    concept's elements, so choosing it highlights and inspects all parts at once. */
export function buildGroupConcept(group: MuscleGroup, conceptsById: Map<string, Concept>): SearchConcept {
	const elements: string[] = [], seen = new Set<string>();
	for (const id of group.conceptIds) {
		const concept = conceptsById.get(id);
		if (!concept) continue;
		for (const element of concept.elements) if (!seen.has(element)) {seen.add(element); elements.push(element);}
	}
	return {id: groupConceptId(group), name: group.en, 'name-zh': group.zh, elements, conceptIds: [...group.conceptIds], groupKind: group.kind};
}

/** True when all characters of `needle` appear in `hay` in order (gaps allowed). */
const isSubsequence = (needle: string, hay: string): boolean => {
	let i = 0;
	for (const ch of hay) {
		if (ch === needle[i]) i++;
		if (i === needle.length) return true;
	}
	return i === needle.length;
};

/** Near-miss groups for the zero-result state: pinyin-initial subsequences for latin
    input, shared characters or partial aliases for CJK input. */
export function fuzzyMuscleGroups(groups: MuscleGroup[], term: string, limit = 5): MuscleGroup[] {
	const query = term.trim().toLowerCase(), compact = query.replace(/\s+/g, '');
	if (compact.length < 2) return [];
	const scored: {group: MuscleGroup; score: number}[] = [];
	for (const group of groups) {
		let score = 0;
		if (/^[a-z]+$/.test(compact)) {
			if (isSubsequence(compact, group.pinyinInitials)) score = Math.max(score, 2);
			else if (isSubsequence(compact, group.pinyinFull.replace(/\s+/g, ''))) score = Math.max(score, 1);
		} else {
			let shared = 0;
			for (const ch of term) if (group.zh.includes(ch)) shared++;
			score = Math.max(score, shared);
			for (const alias of group.aliases) if (alias.includes(term) || term.includes(alias)) score = Math.max(score, 3);
		}
		if (score > 0) scored.push({group, score});
	}
	return scored.sort((a, b) => b.score - a.score || b.group.meshCount - a.group.meshCount).slice(0, limit).map(x => x.group);
}

/** Search-result tiers (smaller ranks higher): aggregate group, fallback group, then
    concepts as main term > grouping concept > left/right variant > subdivision.
    Concepts without muscular parts are pushed below every muscle concept but stay visible. */
const GROUPING_NAME = /^(?:muscles?|zone|group|region|part|set|division)s?\s+of\b/i;
export function conceptTier(concept: Concept, isMuscle: boolean): number {
	const zh = concept['name-zh'] ?? '';
	let tier: number;
	if (/^(?:left|right)\s/.test(concept.name) || /^[左右]/.test(zh)) tier = 4;
	else if (GROUPING_NAME.test(concept.name)) tier = 3;
	else if (/\bof\b/.test(concept.name) || zh.includes('[')) tier = 5;
	else tier = 2;
	return isMuscle ? tier : tier + 4;
}

/** Recently viewed structures, kept in localStorage (last 5 selections). */
export interface RecentEntry {id: string; 'name-zh': string; name: string; ts: number}
const RECENT_KEY = 'atlas-recent', RECENT_MAX = 5;

export function readRecent(): RecentEntry[] {
	try {
		const raw = localStorage.getItem(RECENT_KEY);
		if (!raw) return [];
		const list: unknown = JSON.parse(raw);
		if (!Array.isArray(list)) return [];
		return list.filter((e): e is RecentEntry => !!e && typeof e === 'object' && typeof (e as RecentEntry).id === 'string' && typeof (e as RecentEntry).name === 'string').slice(0, RECENT_MAX);
	} catch {/* Private browsing can block storage. */}
	return [];
}

export function pushRecent(entry: Omit<RecentEntry, 'ts'>): RecentEntry[] {
	const next = [{...entry, ts: Date.now()}, ...readRecent().filter(e => e.id !== entry.id)].slice(0, RECENT_MAX);
	try {localStorage.setItem(RECENT_KEY, JSON.stringify(next));} catch {/* Ignore persistence failures. */}
	return next;
}
