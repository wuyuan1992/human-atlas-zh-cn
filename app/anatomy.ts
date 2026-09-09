import type {Locale} from './i18n';

export type SystemId = 'skeletal'|'muscular'|'arterial'|'venous'|'nervous'|'digestive'|'respiratory'|'urinary'|'reproductive'|'lymphatic'|'endocrine'|'integumentary'|'connective'|'sensory'|'cardiac';
export const SYSTEMS: {id:SystemId;name:string;nameZh:string;color:string;description:string;descriptionZh:string}[] = [
 {id:'skeletal',name:'Skeleton',nameZh:'骨骼',color:'#e2d9ba',description:'Bones form the supporting framework of the body, protect organs, and provide attachment points for muscles. Their internal tissue also stores minerals and produces blood cells.',descriptionZh:'骨骼构成身体的支撑框架,保护器官并为肌肉提供附着点;骨组织还储存矿物质并产生血细胞。'},
 {id:'muscular',name:'Muscles',nameZh:'肌肉',color:'#a85b50',description:'Skeletal muscles generate movement by pulling on their attachments. Together with tendons, they move joints, stabilize posture, and produce heat.',descriptionZh:'骨骼肌通过牵拉附着点产生运动,与肌腱共同活动关节、稳定姿势并产生热量。'},
 {id:'cardiac',name:'Heart',nameZh:'心脏',color:'#b96760',description:'The heart is a muscular pump with four chambers. Its valves direct blood forward through the pulmonary and systemic circuits.',descriptionZh:'心脏是含有四个腔的肌性泵,瓣膜引导血液向前流经肺循环和体循环。'},
 {id:'sensory',name:'Sensory organs',nameZh:'感觉器官',color:'#b0c8ce',description:'These structures contribute to special senses, including sight, hearing, and balance. Their specialized tissues detect stimuli and work with the nervous system to convey information.',descriptionZh:'这些结构参与视觉、听觉和平衡等特殊感觉,其特化组织感受刺激并与神经系统协同传递信息。'},
 {id:'arterial',name:'Arteries',nameZh:'动脉',color:'#c05245',description:'The heart drives blood through the circulation. Arteries carry blood away from the heart to supply tissues or, in the pulmonary circuit, to the lungs.',descriptionZh:'心脏驱动血液循环,动脉将血液从心脏输送到全身组织,肺循环中则将血液送至肺部。'},
 {id:'venous',name:'Veins',nameZh:'静脉',color:'#527c9f',description:'Veins return blood toward the heart. Superficial and deep networks collect blood from the tissues; the pulmonary veins bring oxygenated blood back from the lungs.',descriptionZh:'静脉将血液送回心脏,浅、深静脉网收集组织中的血液,肺静脉则把含氧血从肺运回。'},
 {id:'nervous',name:'Nervous system',nameZh:'神经系统',color:'#d8b565',description:'The brain, spinal cord, and peripheral nerves carry and process signals. They support sensation, movement, coordination, and automatic regulation of body functions.',descriptionZh:'脑、脊髓和周围神经传递并处理信号,支持感觉、运动、协调以及身体功能的自动调节。'},
 {id:'respiratory',name:'Respiratory',nameZh:'呼吸系统',color:'#b98991',description:'The airways conduct air to the lungs, where oxygen and carbon dioxide move between air and blood. Breathing depends on pressure changes produced by respiratory muscles.',descriptionZh:'呼吸道将空气导入肺部,氧气与二氧化碳在肺内进行交换;呼吸依赖呼吸肌产生的压力变化。'},
 {id:'digestive',name:'Digestive',nameZh:'消化系统',color:'#b8916b',description:'The digestive tract breaks down food, absorbs nutrients and water, and moves waste onward. Accessory organs contribute bile and digestive enzymes.',descriptionZh:'消化道分解食物、吸收营养和水分并向前推进废物,附属器官提供胆汁和消化酶。'},
 {id:'urinary',name:'Urinary',nameZh:'泌尿系统',color:'#b47961',description:'The kidneys filter blood and regulate fluid, electrolyte, and acid–base balance. Urine travels through the ureters to the bladder and exits through the urethra.',descriptionZh:'肾脏过滤血液并调节体液、电解质和酸碱平衡,尿液经输尿管流入膀胱并由尿道排出。'},
 {id:'lymphatic',name:'Lymphatic',nameZh:'淋巴系统',color:'#879f7c',description:'Lymphatic vessels return excess tissue fluid to the circulation. Lymph nodes and other lymphoid organs support immune surveillance and responses.',descriptionZh:'淋巴管将多余的组织液送回血液循环,淋巴结等淋巴器官支持免疫监视与免疫应答。'},
 {id:'endocrine',name:'Endocrine',nameZh:'内分泌系统',color:'#c5a09a',description:'Endocrine organs release hormones into the blood to coordinate processes such as metabolism, growth, stress responses, and reproduction.',descriptionZh:'内分泌器官将激素释放入血液,协调代谢、生长、应激反应和生殖等过程。'},
 {id:'reproductive',name:'Reproductive',nameZh:'生殖系统',color:'#bda098',description:'The male reproductive structures represented here contribute to sperm production, maturation, transport, and the production of sex hormones.',descriptionZh:'此处展示的男性生殖结构参与精子的产生、成熟与运输,并分泌性激素。'},
 {id:'integumentary',name:'Body surface',nameZh:'体被',color:'#ba9b7d',description:'The body surface provides an outer anatomical reference. The integumentary system forms a protective barrier and contributes to sensation and temperature regulation.',descriptionZh:'体被提供外层解剖参照,构成保护屏障并参与感觉和体温调节。'},
 {id:'connective',name:'Connective tissue',nameZh:'结缔组织',color:'#aec3bb',description:'Cartilage, ligaments, and other connective tissues support, connect, and separate structures. Their roles include stabilizing joints and distributing mechanical loads.',descriptionZh:'软骨、韧带等结缔组织起支持、连接和分隔作用,能稳定关节并分散力学负荷。'},
];
const SYSTEM_I18N: Record<SystemId,{fr:string;de:string;descriptionFr:string;descriptionDe:string}> = {
 skeletal:{fr:'Squelette',de:'Skelett',descriptionFr:'Les os forment l’ossature du corps, protègent les organes et servent de points d’attache aux muscles. L’os stocke aussi des minéraux et produit les cellules sanguines.',descriptionDe:'Knochen bilden das Stützgerüst des Körpers, schützen Organe und bieten Muskeln Ansatzpunkte. Das Knochengewebe speichert Mineralien und bildet Blutzellen.'},
 muscular:{fr:'Muscles',de:'Muskeln',descriptionFr:'Les muscles squelettiques produisent le mouvement en tirant sur leurs attaches. Avec les tendons, ils mobilisent les articulations, stabilisent la posture et produisent de la chaleur.',descriptionDe:'Die Skelettmuskeln erzeugen Bewegung, indem sie an ihren Ansätzen ziehen. Zusammen mit den Sehnen bewegen sie Gelenke, stabilisieren die Haltung und produzieren Wärme.'},
 cardiac:{fr:'Cœur',de:'Herz',descriptionFr:'Le cœur est une pompe musculaire à quatre cavités. Ses valvules dirigent le sang vers les circulations pulmonaire et systémique.',descriptionDe:'Das Herz ist eine muskuläre Pumpe mit vier Kammern. Seine Klappen lenken das Blut durch den Lungen- und den Körperkreislauf.'},
 sensory:{fr:'Organes des sens',de:'Sinnesorgane',descriptionFr:'Ces structures contribuent aux sens spéciaux — vue, ouïe, équilibre. Leurs tissus spécialisés détectent les stimulus et travaillent avec le système nerveux.',descriptionDe:'Diese Strukturen dienen den besonderen Sinnen — Sehen, Hören, Gleichgewicht. Ihre spezialisierten Gewebe erfassen Reize und arbeiten mit dem Nervensystem zusammen.'},
 arterial:{fr:'Artères',de:'Arterien',descriptionFr:'Le cœur propulse le sang dans la circulation. Les artères l’éloignent du cœur pour irriguer les tissus — ou vers les poumons dans le circuit pulmonaire.',descriptionDe:'Das Herz treibt das Blut durch den Kreislauf. Arterien führen es vom Herzen zu den Geweben — im Lungenkreislauf zur Lunge.'},
 venous:{fr:'Veines',de:'Venen',descriptionFr:'Les veines ramènent le sang vers le cœur. Les réseaux superficiels et profonds collectent le sang des tissus ; les veines pulmonaires rapportent le sang oxygéné.',descriptionDe:'Venen führen das Blut zum Herzen zurück. Oberflächliche und tiefe Netze sammeln es aus den Geweben; die Lungenvenen bringen sauerstoffreiches Blut zurück.'},
 nervous:{fr:'Système nerveux',de:'Nervensystem',descriptionFr:'Le cerveau, la moelle épinière et les nerfs périphériques véhiculent et traitent les signaux : sensation, mouvement, coordination et régulation automatique.',descriptionDe:'Gehirn, Rückenmark und periphere Nerven leiten und verarbeiten Signale: Empfindung, Bewegung, Koordination und automatische Regulation.'},
 respiratory:{fr:'Système respiratoire',de:'Atmungssystem',descriptionFr:'Les voies aériennes conduisent l’air vers les poumons, où oxygène et gaz carbonique s’échangent ; la respiration repose sur les muscles respiratoires.',descriptionDe:'Die Atemwege führen Luft in die Lungen, wo Sauerstoff und Kohlendioxid ausgetauscht werden; die Atmung beruht auf der Atemmuskulatur.'},
 digestive:{fr:'Système digestif',de:'Verdauungssystem',descriptionFr:'Le tube digestif décompose les aliments, absorbe nutriments et eau, et fait avancer les déchets ; les glandes annexes fournissent bile et enzymes.',descriptionDe:'Der Verdauungstrakt zersetzt Nahrung, absorbiert Nährstoffe und Wasser und transportiert Abfälle weiter; Anhangsdrüsen liefern Galle und Enzyme.'},
 urinary:{fr:'Système urinaire',de:'Harnsystem',descriptionFr:'Les reins filtrent le sang et régulent liquides, électrolytes et équilibre acido-basique ; l’urine rejoint la vessie puis s’évacue par l’urètre.',descriptionDe:'Die Nieren filtern das Blut und regulieren Flüssigkeit, Elektrolyte und Säure-Basen-Haushalt; der Urin gelangt über die Harnleiter in die Blase.'},
 lymphatic:{fr:'Système lymphatique',de:'Lymphsystem',descriptionFr:'Les vaisseaux lymphatiques ramènent le liquide tissulaire vers la circulation ; les ganglions et organes lymphoïdes soutiennent la surveillance immunitaire.',descriptionDe:'Lymphgefäße führen Gewebeflüssigkeit zurück in den Kreislauf; Lymphknoten und lymphatische Organe unterstützen die Immunüberwachung.'},
 endocrine:{fr:'Système endocrinien',de:'Endokrines System',descriptionFr:'Les glandes endocrines libèrent des hormones dans le sang pour coordonner métabolisme, croissance, stress et reproduction.',descriptionDe:'Endokrine Organe setzen Hormone ins Blut frei und koordinieren Stoffwechsel, Wachstum, Stressreaktionen und Fortpflanzung.'},
 reproductive:{fr:'Système reproducteur',de:'Fortpflanzungssystem',descriptionFr:'Les structures reproductives masculines représentées ici participent à la production, la maturation et le transport des spermatozoïdes, ainsi qu’aux hormones sexuelles.',descriptionDe:'Die hier dargestellten männlichen Fortpflanzungsstrukturen dienen der Produktion, Reifung und dem Transport von Spermien sowie der Geschlechtshormone.'},
 integumentary:{fr:'Surface du corps',de:'Körperoberfläche',descriptionFr:'La surface du corps sert de repère anatomique externe. Le tégument forme une barrière protectrice et participe à la sensation et à la thermorégulation.',descriptionDe:'Die Körperoberfläche dient als äußere anatomische Referenz. Die Haut bildet eine Schutzbarriere und trägt zu Empfindung und Wärmeregulation bei.'},
 connective:{fr:'Tissu conjonctif',de:'Bindegewebe',descriptionFr:'Cartilage, ligaments et autres tissus conjonctifs soutiennent, relient et séparent les structures ; ils stabilisent les articulations et répartissent les charges.',descriptionDe:'Knorpel, Bänder und anderes Bindegewebe stützen, verbinden und trennen Strukturen; sie stabilisieren Gelenke und verteilen Lasten.'},
};
export function systemName(system: {id:SystemId;name:string;nameZh:string}, locale: Locale): string {
	if (locale === 'zh') return system.nameZh;
	if (locale === 'en') return system.name;
	return SYSTEM_I18N[system.id][locale];
}
export function systemDescription(system: {id:SystemId;description:string;descriptionZh:string}, locale: Locale): string {
	if (locale === 'zh') return system.descriptionZh;
	if (locale === 'en') return system.description;
	return SYSTEM_I18N[system.id][locale === 'fr' ? 'descriptionFr' : 'descriptionDe'];
}
export interface Part {id:string;name:string;'name-zh'?:string;'name-fr'?:string;'name-de'?:string;conceptId:string;system:SystemId;chunk:number;positions:number;normals:number;indices:number;vertexCount:number;indexCount:number;bounds:[number[],number[]]}
export interface Concept {id:string;name:string;'name-zh'?:string;'name-fr'?:string;'name-de'?:string;elements:string[]}
export interface Atlas {version:string;sex?:'male';source?:string;scope?:string;parts:Part[];concepts:Concept[];chunks:{url:string;bytes:number;gzip?:string;gzipBytes?:number}[];triangles:number}
export type View = 'three-quarter'|'front'|'back'|'side';
export interface SceneState {inspectorOpen?:boolean;explode:number;visible:SystemId[];selected:string[];isolate:boolean;view:View;rotate:boolean;reset:number;skinOpacity?:number;selectionLabel?:string}
// 默认全量可见 = 与「全部解剖」预设一致,首次加载即选中该 tab。
export const DEFAULT_VISIBLE:SystemId[] = SYSTEMS.map(s=>s.id);
export const EXPLANATIONS:Record<string,string> = {
 'heart':'A muscular pump in the chest. Its right side sends blood to the lungs; its left side sends blood through the systemic circulation.',
 'liver':'A large organ beneath the right side of the diaphragm. It processes absorbed nutrients, produces bile, and synthesizes many proteins carried in the blood.',
 'brain':'The central organ of the nervous system. Its interconnected regions support perception, movement, memory, language, and the regulation of bodily functions.',
 'stomach':'A muscular chamber between the esophagus and small intestine. It stores and mixes food with acid and enzymes before releasing it into the duodenum.',
 'spleen':'A lymphoid organ in the upper left abdomen. It filters blood, removes aging blood cells, and participates in immune responses.',
 'pancreas':'An abdominal organ with digestive and endocrine roles. It supplies enzymes to the small intestine and releases hormones including insulin and glucagon.',
 'urinary bladder':'A muscular reservoir in the pelvis that stores urine arriving from the kidneys through the ureters.',
 'trachea':'The main airway connecting the larynx to the bronchi. Its cartilage supports keep the airway open during breathing.',
 'diaphragm':'A broad muscle separating the chest and abdomen. When it contracts, it increases chest volume and helps draw air into the lungs.',
};
export const EXPLANATIONS_ZH:Record<string,string> = {
 'heart':'位于胸腔的肌性泵。右侧将血液送入肺循环,左侧驱动血液流经体循环。',
 'liver':'位于膈右下方的大器官。它处理吸收的营养物质、产生胆汁,并合成多种由血液运输的蛋白质。',
 'brain':'神经系统的中枢器官。相互连接的各区支持感知、运动、记忆、语言以及身体功能的调节。',
 'stomach':'位于食管与小肠之间的肌性囊袋。储存食物并与酸和酶混合,再逐步排入十二指肠。',
 'spleen':'位于左上腹的淋巴器官。过滤血液、清除衰老血细胞,并参与免疫应答。',
 'pancreas':'兼具消化与内分泌功能的腹部器官。向小肠分泌消化酶,并释放胰岛素和胰高血糖素等激素。',
 'urinary bladder':'位于盆腔的肌性储尿器官,储存经输尿管来自肾脏的尿液。',
 'trachea':'连接喉与支气管的主气道。软骨支架在呼吸时保持气道通畅。',
 'diaphragm':'分隔胸腔与腹腔的宽阔肌肉。收缩时增大胸腔容积,帮助吸入空气。',
};
export const EXPLANATIONS_FR:Record<string,string> = {
 'heart':'Une pompe musculaire dans le thorax. Son côté droit envoie le sang vers les poumons ; son côté gauche vers la circulation systémique.',
 'liver':'Un grand organe sous la partie droite du diaphragme. Il traite les nutriments absorbés, produit la bile et synthétise de nombreuses protéines sanguines.',
 'brain':'L’organe central du système nerveux. Ses régions interconnectées soutiennent perception, mouvement, mémoire, langage et régulation des fonctions vitales.',
 'stomach':'Une poche musculaire entre l’œsophage et l’intestin grêle. Elle stocke et mélange les aliments avec acide et enzymes avant de les relâcher dans le duodénum.',
 'spleen':'Un organe lymphoïde dans la partie gauche supérieure de l’abdomen. Il filtre le sang, élimine les vieilles cellules sanguines et participe aux réponses immunitaires.',
 'pancreas':'Un organe abdominal aux rôles digestif et endocrinien. Il fournit des enzymes à l’intestin grêle et libère des hormones dont l’insuline et le glucagon.',
 'urinary bladder':'Un réservoir musculaire du bassin qui stocke l’urine venue des reins par les uretères.',
 'trachea':'La voie aérienne principale reliant le larynx aux bronches. Ses anneaux cartilagineux maintiennent la voie ouverte pendant la respiration.',
 'diaphragm':'Un large muscle séparant thorax et abdomen. En se contractant, il augmente le volume thoracique et aide à inspirer l’air.',
};
export const EXPLANATIONS_DE:Record<string,string> = {
 'heart':'Eine muskuläre Pumpe in der Brust. Ihre rechte Seite sendet das Blut zur Lunge; die linke in den Körperkreislauf.',
 'liver':'Ein großes Organ unter der rechten Zwerchfellkuppel. Es verarbeitet aufgenommene Nährstoffe, produziert Galle und synthetisiert viele Bluteiweiße.',
 'brain':'Das Zentralorgan des Nervensystems. Seine vernetzten Regionen tragen Wahrnehmung, Bewegung, Gedächtnis, Sprache und die Regulation Körperfunktionen.',
 'stomach':'Eine muskuläre Kammer zwischen Speiseröhre und Dünndarm. Sie speichert Nahrung, mischt sie mit Säure und Enzymen und gibt sie ans Duodenum ab.',
 'spleen':'Ein lymphatisches Organ im linken Oberbauch. Es filtert Blut, entfernt gealterte Blutzellen und beteiligt sich an Immunantworten.',
 'pancreas':'Ein Bauchorgan mit Verdauungs- und Hormonfunktion. Es liefert Enzyme an den Dünndarm und setzt Hormone wie Insulin und Glucagon frei.',
 'urinary bladder':'Ein muskuläres Reservoir im Becken, das den von den Nieren kommenden Urin speichert.',
 'trachea':'Die Hauptluftwege zwischen Kehlkopf und Bronchien. Ihre Knorpelspangen halten die Atemwege offen.',
 'diaphragm':'Ein breiter Muskel zwischen Brust und Bauch. Seine Kontraktion vergrößert das Brustvolumen und hilft beim Einatmen.',
};
export function explanation(name:string,system:SystemId,locale:Locale){const key=name.toLowerCase();const table:Record<string,string>|undefined=locale==='zh'?EXPLANATIONS_ZH:locale==='fr'?EXPLANATIONS_FR:locale==='de'?EXPLANATIONS_DE:EXPLANATIONS;const text=table?.[key];if(text)return text;const s=SYSTEMS.find(x=>x.id===system);return s?systemDescription(s,locale):'';}
