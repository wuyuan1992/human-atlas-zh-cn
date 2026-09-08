import {useEffect, useState} from 'react';

export type Locale = 'zh' | 'en';
const STORAGE_KEY = 'atlas-locale';

/** Default to Chinese; remember an explicit choice across sessions. */
export function initialLocale(): Locale {
	try {
		const saved = localStorage.getItem(STORAGE_KEY);
		if (saved === 'zh' || saved === 'en') return saved;
	} catch {/* Private browsing can block storage. */}
	return 'zh';
}

export function useLocale() {
	const [locale, setLocale] = useState<Locale>(initialLocale);
	useEffect(() => {
		try {
			localStorage.setItem(STORAGE_KEY, locale);
		} catch {/* Ignore persistence failures. */}
		document.documentElement.lang = locale === 'zh' ? 'zh-CN' : 'en';
		document.title = t(locale, 'documentTitle');
	}, [locale]);
	return [locale, () => setLocale(l => (l === 'zh' ? 'en' : 'zh'))] as const;
}

type ZhStrings = typeof STRINGS.zh;

export function t<K extends keyof ZhStrings>(locale: Locale, key: K): ZhStrings[K] extends string ? string : ZhStrings[K] {
	type Result = ZhStrings[K] extends string ? string : ZhStrings[K];
	return ((STRINGS[locale] as Record<string, unknown>)[key] ?? (STRINGS.en as Record<string, unknown>)[key]) as Result;
}

export const STRINGS = {
	zh: {
		documentTitle: '人体图鉴 Human Atlas',
		eyebrow: '交互式人体解剖',
		title: '人体图鉴',
		identityMeta: (n: string) => `${n} 个建模部件 · BodyParts3D`,
		searchButton: '查找结构',
		searchAria: '搜索解剖结构',
		cameraControls: '视角控制',
		languageAria: '切换语言',
		aboutAria: '关于本图鉴',
		systemsTitle: '系统分层',
		presetAll: '全部',
		presetSkeleton: '骨骼',
		presetOrgans: '内脏',
		closeSystems: '关闭系统面板',
		closeSearch: '关闭搜索',
		piecesVisible: (n: string) => `${n} 个部件可见`,
		hideAll: '全部隐藏',
		showOnly: (name: string) => `仅显示${name}`,
		showSystem: (name: string) => `显示${name}`,
		searchPlaceholder: '心脏、股骨、脑神经……',
		searchAriaLabel: '搜索具名解剖结构',
		noResults: '没有匹配的结构。',
		searchNoteEmpty: '从一个主要器官开始,或搜索任何具名结构。',
		searchNoteQuery: '最多显示 80 条结果,请细化搜索词。',
		pieces: (n: number) => `${n} 个部件`,
		viewAria: (v: string) => `${v}视角`,
		viewThreeQuarter: '3/4',
		viewFront: '正面',
		viewSide: '侧面',
		viewBack: '背面',
		rotateAria: '旋转人体',
		pauseAria: '暂停旋转',
		resetAria: '重置视图与图层',
		captionAssembled: '成年人体 · 男性',
		captionSeparated: '分离结构',
		captionInventory: '解剖部件总览',
		captionSelected: '已选结构',
		explodeLabel: '分解解剖结构',
		assembled: '整体',
		everyPiece: '全部部件',
		dockSystems: '系统',
		dockReset: '重置',
		footerOrbit: '拖拽旋转',
		footerPan: '拖拽平移',
		footerZoom: '双指缩放',
		footerInspect: '点按查看',
		sourceCredits: '来源与致谢',
		loadingTitle: '正在准备解剖模型',
		loadingBody: (percent: number, n: string) => `${percent}% · 正在加载 ${n} 个部件`,
		catalogueError: '解剖目录加载失败。',
		contextLostError: '3D 会话被系统暂停,请重新加载继续。',
		webglError: '当前浏览器无法启动 3D 显示,请尝试支持 WebGL 的浏览器。',
		reload: '重新加载',
		loadError: '解剖模型加载失败。',
		atlasFallback: '解剖',
		atlasReference: '图鉴编号',
		selectedPieces: '已选部件',
		includedStructures: '包含的结构',
		andMore: (n: number) => `以及其他 ${n} 个建模部件。`,
		viewSource: '查看解剖来源',
		isolate: '隔离显示',
		showSurrounding: '显示周围结构',
		clearSelection: '清除选择',
		contextNote: '系统概述 · 基于源解剖数据识别',
		aboutEyebrow: '来源与范围',
		aboutTitle: '来源与作者',
		aboutMaleHeading: '男性 · BodyParts3D',
		aboutMaleBody: '来自成年男性参考解剖的 2,234 个独立网格与 3,432 个具名概念。',
		aboutScope1: '本参考模型并不包含所有人体结构及其变异。一个具名概念可包含多个部件;每个源网格只渲染一次。',
		aboutScope2: '配色与系统分组为探索浏览而设计。几何体经过简化以适配网页,简短说明仅提供一般性学习参考。本图鉴是解剖参考工具,不用于诊断或手术。',
		aboutSourceHeading: '数据来源',
		aboutSourceBody: 'BodyParts3D,© 生命科学数据库中心,采用 CC BY 4.0 国际许可授权。',
		aboutLicenseLink: '数据集许可',
		aboutDataLink: '原始几何与元数据',
		aboutPublicationLink: '阅读来源论文',
		aboutProjectHeading: '源项目与作者',
		creditsRepo: '源代码仓库 · GitHub',
		creditsDemo: '原项目在线演示',
		creditsAuthor: '在 X 上访问 @ashebytes',
		twitterTimelineAria: '@ashebytes 的 X 时间线',
		twitterFallback: '无法加载 X 嵌入(可能是网络受限),点击直接访问 @ashebytes。',
	},
	en: {
		documentTitle: 'Human Atlas',
		eyebrow: 'INTERACTIVE ANATOMY',
		title: 'Human Atlas',
		identityMeta: (n: string) => `${n} modeled pieces · BodyParts3D`,
		searchButton: 'Find a structure',
		searchAria: 'Search anatomy',
		cameraControls: 'Camera controls',
		languageAria: 'Switch language',
		aboutAria: 'About this atlas',
		systemsTitle: 'Systems',
		presetAll: 'All',
		presetSkeleton: 'Skeleton',
		presetOrgans: 'Organs',
		closeSystems: 'Close systems',
		closeSearch: 'Close search',
		piecesVisible: (n: string) => `${n} pieces visible`,
		hideAll: 'Hide all',
		showOnly: (name: string) => `Show only ${name.toLowerCase()}`,
		showSystem: (name: string) => `Show ${name.toLowerCase()}`,
		searchPlaceholder: 'Heart, femur, cranial nerve…',
		searchAriaLabel: 'Search named anatomical structures',
		noResults: 'No structures match your search.',
		searchNoteEmpty: 'Start with a major organ, or search every named structure.',
		searchNoteQuery: 'Showing up to 80 matches. Refine your search to find smaller structures.',
		pieces: (n: number) => `${n} ${n === 1 ? 'piece' : 'pieces'}`,
		viewAria: (v: string) => `${v} view`,
		viewThreeQuarter: 'three-quarter',
		viewFront: 'front',
		viewSide: 'side',
		viewBack: 'back',
		rotateAria: 'Rotate body',
		pauseAria: 'Pause rotation',
		resetAria: 'Reset view and layers',
		captionAssembled: 'ADULT HUMAN · MALE',
		captionSeparated: 'SEPARATED STRUCTURES',
		captionInventory: 'ANATOMICAL INVENTORY',
		captionSelected: 'SELECTED STRUCTURE',
		explodeLabel: 'Explode anatomy',
		assembled: 'Assembled',
		everyPiece: 'Every piece',
		dockSystems: 'Systems',
		dockReset: 'Reset',
		footerOrbit: 'Drag to orbit',
		footerPan: 'Drag to pan',
		footerZoom: 'Pinch to zoom',
		footerInspect: 'Tap to inspect',
		sourceCredits: 'Source & credits',
		loadingTitle: 'Preparing the anatomy',
		loadingBody: (percent: number, n: string) => `Loading ${n} pieces`,
		catalogueError: 'The anatomy catalogue could not be loaded.',
		contextLostError: 'The 3D session was paused by your device. Reload to continue.',
		webglError: 'This browser could not start the 3D viewer. Please try a browser with WebGL enabled.',
		reload: 'Reload viewer',
		loadError: 'Could not load the anatomy.',
		atlasFallback: 'ANATOMY',
		atlasReference: 'Atlas reference',
		selectedPieces: 'Selected pieces',
		includedStructures: 'Included structures',
		andMore: (n: number) => `And ${n} more modeled pieces.`,
		viewSource: 'View anatomical source',
		isolate: 'Isolate structure',
		showSurrounding: 'Show surrounding anatomy',
		clearSelection: 'Clear selection',
		contextNote: 'System overview · structure identified from source anatomy',
		aboutEyebrow: 'SOURCE & SCOPE',
		aboutTitle: 'Credits & sources',
		aboutMaleHeading: 'Male · BodyParts3D',
		aboutMaleBody: '2,234 individual meshes and 3,432 named concepts from an adult male reference anatomy.',
		aboutScope1: 'This reference does not contain every human structure or variation. Named concepts can contain multiple pieces; each source mesh is rendered once.',
		aboutScope2: 'Colors and system groupings are designed for exploration. The geometry is simplified for the web, and short explanations provide general educational context. This is an anatomical reference, not a diagnostic or surgical tool.',
		aboutSourceHeading: 'Source',
		aboutSourceBody: 'BodyParts3D, © The Database Center for Life Science licensed under CC Attribution 4.0 International.',
		aboutLicenseLink: 'Dataset license',
		aboutDataLink: 'Original geometry & metadata',
		aboutPublicationLink: 'Read the source publication',
		aboutProjectHeading: 'Upstream project & author',
		creditsRepo: 'Source repository · GitHub',
		creditsDemo: 'Original live demo',
		creditsAuthor: 'Visit @ashebytes on X',
		twitterTimelineAria: 'X timeline of @ashebytes',
		twitterFallback: 'The X embed could not load (network restricted?). Open @ashebytes directly.',
	},
} as const;

/** Localized display name for a manifest part or concept, falling back to the English name. */
export function localizedName(item: {name: string; 'name-zh'?: string}, locale: Locale): string {
	return locale === 'zh' ? item['name-zh'] ?? item.name : item.name;
}

/** The other language's name, shown as a subtitle when it differs. */
export function secondaryName(item: {name: string; 'name-zh'?: string}, locale: Locale): string {
	return locale === 'zh' ? item.name : item['name-zh'] ?? '';
}
