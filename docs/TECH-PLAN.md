# 肌图 MuscleMap — 技术开发计划

> 配套文档:[PRD.md](PRD.md) · 版本:v0.1(立项稿) · 日期:2026-09-07
> 基座:本仓库 human-atlas(Vite 8 + React 19 + Three.js 0.159 + shadcn/ui,纯静态产物,现部署于 Vercel)。

---

## 1. 总体架构

```
┌────────────────────────── 浏览器(纯前端,继承现架构) ──────────────────────────┐
│  React UI(page.tsx 改造)                                                     │
│   ├─ 搜索面板(中/英/拼音/别名 → search-index.json)                           │
│   ├─ 3D 场景(scene.tsx 改造:角色高亮着色)                                    │
│   ├─ 肌肉说明卡(muscles.json / muscle-info.json)                             │
│   ├─ 方案面板(在线 AI 结果 或 离线内置方案)                                   │
│   └─ 动作动画播放器(exercises.json + CDN 媒体,lazy-load)                     │
│  Three.js 批量渲染 + GPU 纹理状态(现机制)                                    │
└───────────────────────────────────┬──────────────────────────────────────────┘
                        fetch /api/plan(流式 JSON)
┌───────────────────────────────────▼──────────────────────────────────────────┐
│  边缘函数(Vercel Functions 或 Cloudflare Workers)                            │
│   ├─ 注册表白名单注入提示词 → LLM(OpenAI 兼容协议,供应商可配置)               │
│   ├─ 结构化输出校验(概念 ID 全部必须命中注册表)                              │
│   └─ 缓存(边缘缓存 + KV,同参数 24h)                                        │
└──────────────────────────────────────────────────────────────────────────────┘

构建期数据管线(Node 脚本,产物入 public/data/,与现有 scripts/ 模式一致):
  atlas.json ──► build-muscle-registry ──► 注册表(骨架)
                    + Wikidata zh 标签/维基摘要(抓取,人工审校)
                    + 拼音 + 别名(人工/AI 辅助)
                 ──► muscles.json / muscle-info.json / search-index.json
  开源动作数据集(git clone)──► import-exercises ──► exercises.json + 媒体上 CDN
                    + 粗分组→概念 ID 映射表(人工审校的桥接数据)
                 ──► plans.builtin.json(离线精选方案)
```

关键架构决策与理由:

| 决策 | 理由 |
| --- | --- |
| 前端保持纯静态 + 增量数据文件 | 继承现仓库的加载/渲染/部署优势;肌肉数据、动作数据全部走构建期产物,可校验、可再生、离线可用 |
| AI 走独立边缘函数,不进前端 | 密钥不入前端;输出在服务端过白名单校验后才下发,前端只信注册表命中的结果;AI 故障时前端无感降级到离线方案 |
| AI 只允许引用注册表概念 ID | 需求 5 要求结果中的肌肉可点击选中——可点击的前提是 ID 可解析到 3D 概念;白名单 + schema 双重约束把"AI 幻觉肌肉"变成可检测、可剔除的工程问题 |
| 动画媒体不进 git 仓库,上 CDN | 动图总量预计数百 MB;仓库保持轻量,媒体不可变缓存 |
| 不引入重型 i18n 框架 | 界面文案中文优先、英文为辅,一个常量文件足够;解剖数据本身走数据文件 |

## 2. 数据工程(项目成败的关键路径)

### 2.1 肌肉注册表 `public/data/muscles.json`

单一事实源,搜索、说明卡、AI 校验、反推高亮共用。生产管线:

1. **骨架生成** `scripts/build-muscle-registry.mjs`:从 `public/models/atlas.json` 提取肌肉概念(现状实测:`system==='muscular'` 的部件 402 个;元素全部为肌肉的概念 679 个),输出骨架:概念 ID(FMA)、英文名、元素网格数、包围盒中心(用于镜头聚焦)。
2. **训练集裁剪**:从 679 个概念中筛出"可训练骨骼肌"约 300 条(剔除乳头肌等心内结构、纯分组概念如 `muscle of head` 可保留为分组节点);标记 `trainable`。
3. **中文名与别名**:用 FMA ID 批量查询 Wikidata(P1402 = FMA ID)取 zh-hans 标签;缺失者人工补(总量可控)。别名含常见叫法("胸肌""二头""小腿三头")。
4. **拼音**:构建期用 `pinyin-pro` 生成全拼与首字母,入索引不入注册表。

```jsonc
// public/data/muscles.json(单条示例)
{
  "conceptId": "FMA9629", "en": "supraspinatus", "zh": "冈上肌",
  "aliases": ["冈上", "旋转袖", "肩袖肌群成员"],
  "coarseGroups": ["肩部", "上肢带肌"], "trainable": true,
  "source": "wikidata:Q203858", "reviewedBy": "human", "reviewDate": "2026-09-20"
}
```

### 2.2 中文说明 `public/data/muscle-info.json`

```jsonc
{ "FMA9629": {
  "summary": "位于肩胛骨冈上窝……", "origin": "冈上窝", "insertion": "肱骨大结节上部",
  "innervation": "肩胛上神经(C5–C6)", "actions": ["肩关节外展(0–15°启动)"],
  "trainingTips": ["与侧平举前 30° 行程关系最大……"],
  "exerciseIds": ["ex-0342", "ex-0517"]
}}
```

生产策略:优先抓中文维基百科对应条目段落做结构化抽取(起止点/神经/功能);维基缺失的条目由 LLM 按固定模板起草,**逐条人工审校后**才入构建产物(审校人写入 `reviewedBy`)。此文件是唯一允许"内容生产"节奏阻塞发版的数据。

### 2.3 动作库与动画 `public/data/exercises.json` + CDN 媒体

选型(均为 GitHub 开源仓库,满足需求"使用开源的 github 仓库"):

| 仓库 | 内容 | 许可 | 用途 |
| --- | --- | --- | --- |
| [hasaneyldrm/exercises-dataset](https://github.com/hasaneyldrm/exercises-dataset) | 1,324 动作,每个 1 个动画 GIF + 缩略图;`target`/`muscle_group`/`secondary_muscles` 字段;步骤文案含**中文**等 10 语言 | 代码与数据 MIT;媒体为 Gym visual 版权,180px 再分发需保留署名 "© Gym visual — https://gymvisual.com/" | **主源**:动画 + 中文步骤 + 目标肌群字段 |
| [yuhonas/free-exercise-db](https://github.com/yuhonas/free-exercise-db) | 800+ 动作,静态图,`primaryMuscles`/`secondaryMuscles`,英文 | Unlicense(公有领域) | **补充与兜底**:公有领域静态图,补主源缺项、规避媒体条款风险 |
| [wger-project/wger](https://github.com/wger-project/wger) | 开源健身应用,REST API 含 动作↔肌肉(主/次) 映射 | AGPL(代码) | **交叉校验源**:校验我们的 粗分组→肌肉 映射;只用数据不抄代码,引用数据库需在法务复核后决定 |

导入脚本 `scripts/import-exercises.mjs`:

- `git clone` 数据集(临时目录,不入本仓库);
- 清洗字段 → 统一 schema;媒体以内容哈希命名上传 CDN(Cloudflare R2 / Vercel 静态,manifest 记录字节数与宽高,前端据此 lazy-load);
- 页脚与关于页按 NOTICE 输出署名字符串(法务复核结论落地处,PRD §7)。

```jsonc
// public/data/exercises.json(单条示例)
{ "id": "ex-0342", "name": "坐姿哑铃侧平举", "en": "Seated Dumbbell Lateral Raise",
  "equipment": "dumbbell", "level": "beginner",
  "stepsZh": ["坐姿,双手持铃置于体侧……"],
  "groups": ["肩部"], "secondaryGroups": ["斜方肌"],
  "media": { "gif": "https://cdn…/a1b2.gif", "poster": "https://cdn…/a1b2.jpg", "bytes": 284112 },
  "source": "hasaneyldrm/exercises-dataset", "license": "MIT + Gym visual attribution" }
```

### 2.4 桥接表:粗分组 → 概念 ID `public/data/muscle-groups.json`

动作库只标到"胸/背/肩/肱二头"级别的粗分组;反推与标签点击需要落到具体 FMA 概念。人工审校一张 30–50 行的映射表(每行:粗分组 → 概念 ID 列表,可再分 main/secondary),这是**离线反推的数据核心**,也随提示词注入 AI。

### 2.5 离线精选方案 `public/data/plans.builtin.json`

按粗分组 × 目标(力量/肥大/耐力/激活)× 器械条件,从动作库编排 40–60 套方案(每套 4–6 动作),字段与 AI 在线方案完全同构(§4.2),保证前端一套渲染代码两种来源。

### 2.6 构建校验(继承 `scripts/validate-atlas.mjs` 的契约式校验风格)

新增三个校验脚本,进 `npm run check` 与发布流程:

- `scripts/validate-muscles.mjs`:注册表条目 ⊆ atlas 概念;trainable 条目的中文名/拼音/别名非空;muscle-info 的键 ⊆ 注册表;粗分组映射的概念 ID 全部存在;
- `scripts/validate-exercises.mjs`:动作 `groups` 全部在粗分组表内;media URL/字节数与 manifest 一致;stepsZh 非空;
- `scripts/validate-plans.mjs`:内置方案引用的动作 ID、概念 ID 全部可解析;离线反推覆盖 ≥ 动作库标注肌肉。

## 3. 前端改造(基于现有代码逐文件落实)

### 3.1 现有文件处置清单

| 文件 | 处置 | 要点 |
| --- | --- | --- |
| `app/anatomy.ts` | 改造 | `DEFAULT_VISIBLE` 改为 `['muscular','skeletal']`;`SYSTEMS` 增加中文名字段;`EXPLANATIONS` 机制保留为非肌肉回退 |
| `app/page.tsx` | 大改 | 默认视图肌肉优先;搜索换索引;详情 Sheet 换肌肉卡;新增方案面板入口(主操作按钮);反推开关写 SceneState |
| `app/scene.tsx` | 增强 | ① hover 文案中文;② 角色高亮着色(见 3.2);③ 选中肌肉时镜头避让遮挡 |
| `app/agent-tools.ts` | 扩展(可选) | 增 `find_muscle`(中英)与 `recommend_plan` 两个 WebMCP 工具,沿用 `registerTool` 模式 |
| `app/explosion-layout.ts` / `app/pointer-tap.ts` / `app/model-download.ts` | 复用不动 | 爆炸布局、点按判定、gzip 解码全兼容 |
| `components/ui/*`(shadcn) | 复用 | Sheet、Combobox、Slider、Tabs 等直接用于新面板 |
| `scripts/convert-anatomy.py` 等 3 个几何脚本 | 备用 | 仅在启动"瘦身构建"优化时使用(见 §7 决策点) |
| `README.md` / `public/ATTRIBUTION.md` | 重写/扩充 | 新项目定位;新增数据集署名 |

新增前端文件(遵循本仓库 app/ 放特性代码的惯例):`app/strings.ts`(界面中文文案)、`app/search.ts`(索引加载与匹配)、`app/muscle-card.tsx`(说明卡)、`app/plan-panel.tsx`(方案 + 反推面板)、`app/exercise-player.tsx`(动画播放器)。

### 3.2 场景角色高亮(核心技术改造点)

现机制(`app/scene.tsx`):两张 `DataTexture` 按部件索引驱动着色器——`partTexture`(float RGBA:xyz 位移、w 可见)与 `selectionTexture`(uint8 R 通道 = 选中 → 混入青色)。改造方案(改动集中在 `materialFor()` 的 `onBeforeCompile` 与 `animate()` 的状态更新块):

- `selectionTexture` 扩用通道:**R**=选中(兼容现状)、**G**=角色索引 0–4(0 无 / 1 主动 / 2 协同 / 3 稳定 / 4 拮抗)、**B**=压暗标志;
- 着色器:角色色经 `uniform vec3 uRoleColors[4]` 混入;压暗时 `diffuseColor.rgb *= 0.35`;
- `SceneState` 增加 `highlight?: { roles: Record<string/*conceptId*/, 1|2|3|4>; dimOthers: boolean }`,由方案面板的反推开关驱动;概念 → 部件的展开复用现有 `concepts.elements` 映射;
- 爆炸视图下沿用同一纹理通道,零额外代码即兼容。

该方案不增加 draw call、不动批渲染结构,是对现有 GPU 状态纹理的自然扩展。

### 3.3 中英文搜索(`app/search.ts`)

- 数据:`public/data/search-index.json`(概念 ID、zh、en、pinyinFull、pinyinInitials、aliases、coarseGroups、trainable),预计 < 200KB;
- 匹配:小写归一化子串 + 拼音连续子串;排序权重:名称前缀命中 > 完全相等 > 包含;trainable 优先;
- 替换 `page.tsx` 中现有 `results` 的 `useMemo` 过滤逻辑(现仅英文 substring),Combobox 交互与 `/` 快捷键原样保留;
- 提供 `resolveMuscle(text)` 单函数出口:搜索框、方案肌肉标签点击、AI 结果校验共用。

### 3.4 动画播放器(`app/exercise-player.tsx`)

`IntersectionObserver` 进入视口才加载 GIF(先出 poster 静帧);点击放大对话框内提供 0.5×/1× 倍速(GIF 倍速用 `<img>` 无法实现,放大态改用 `ImageDecoder`/canvas 逐帧,或首版仅提供暂停/逐帧,倍速列入 backlog);字节预算来自 manifest,超过 2MB 的 GIF 仅在点击后加载。

## 4. AI 服务设计(需求 4/5 的"实时 AI 查询")

### 4.1 部署形态

- **推荐:Vercel Functions**(`api/plan.ts`,仓库已有 `vercel.json` 部署链路);备选 Cloudflare Workers(devDependencies 已含 `wrangler` 与 `@cloudflare/vite-plugin`,迁移成本低)。
- LLM 走 OpenAI 兼容协议,供应商用环境变量配置(`AI_BASE_URL`/`AI_MODEL`/`AI_API_KEY` 仅存服务端)。
- 限流:按 IP 每日配额(如 30 次),超限返回离线方案标记。

### 4.2 接口契约

`POST /api/plan` → 流式 JSON(非流式首版可接受,响应体 ≤ 32KB):

```jsonc
// 请求
{ "conceptId": "FMA9629", "goal": "hypertrophy" , "equipment": ["dumbbell"],
  "level": "beginner", "locale": "zh" }
// 响应(与 plans.builtin.json 同构)
{ "muscle": { "conceptId": "FMA9629", "zh": "冈上肌" },
  "goal": "肥大", "source": "ai" , "validated": true,
  "exercises": [
    { "name": "哑铃侧平举", "en": "Dumbbell Lateral Raise", "exerciseId": "ex-0342",
      "sets": 4, "reps": "12-15", "rest": "60s", "load": "轻重量,注重控制",
      "cuesZh": ["肘部微屈,引领上抬……"],
      "muscles": [ {"conceptId": "FMA9616", "role": "prime"},
                   {"conceptId": "FMA23461", "role": "synergist"},
                   {"conceptId": "FMA9627", "role": "stabilizer"} ] } ],
  "notesZh": ["……"], "safetyZh": ["肩痛即刻停止……"] }
```

`role ∈ {prime, synergist, stabilizer, antagonist}`。**肌肉引用必须带 conceptId** —— 这是"结果中标注肌肉关键信息、点击后选中"的机制基础;前端把每个 `{conceptId, role}` 渲染成可点击标签,点击 → `choose(concept)` 选中并打开说明卡(直接复用现有选中链路)。

### 4.3 提示词与校验(防幻觉的核心)

- 系统提示注入:① 注册表全量(id/zh/en/粗分组,约 300 行);② 动作库 id+名称摘要(AI 优先复用库内动作以获得动画,`exerciseId` 可空时前端按名称模糊匹配);③ 输出 JSON Schema 约束;
- 服务端校验:每个 `conceptId` 必须 ∈ 注册表且 `trainable`;`exerciseId` 若给出必须 ∈ 动作库;`role` 枚举校验;非法条目剔除并计数;
- 剔除率 > 20% → 携错误反馈重试一次;仍超 → 返回 422,前端降级离线方案并提示;
- 响应头带 `X-Validation: passed/dropped:N`,便于统计 PRD 的 ≥95% 校验通过率指标。

### 4.4 缓存与成本

- 缓存键 = sha256(conceptId, goal, equipment, level, locale);边缘/内存缓存 24h;同参数命中不消耗 LLM 调用;
- 前端对同一肌肉的方案结果做 sessionStorage 缓存;
- 预估:提示词约 8–12K token、输出约 1.5K token,主流模型单价下万次请求成本可忽略级,费用控制以限流为主。

## 5. 测试与质量

- 类型检查:`npm run check`(tsc)保持零错误;
- 数据契约:§2.6 三个新校验脚本 + 现有 `validate-atlas.mjs`(atlas 不动则继续通过);
- 交互冒烟:参照 `scripts/validate-interactions.mjs` 模式新增 `validate-search.mjs`(全注册表四种输入命中)与 `validate-plan-flow.mjs`(选中→方案→反推→标签点击闭环);
- 视觉:角色高亮四色在浅色背景对比度 ≥ 3:1;移动端 390×844 / 320×568 / 844×390 布局沿用现有已验证方案;
- 建议补 GitHub Actions:`check + 三校验 + build` 每次 push 必跑。

## 6. 里程碑计划(按 1 名全栈 + AI 辅助估算)

| 里程碑 | 内容 | 产出/出口标准 | 预估 |
| --- | --- | --- | --- |
| **M0 基座** | 复制新仓库;`DEFAULT_VISIBLE` 肌肉优先;文案换肤;皮肤透明度滑杆;perf 基线记录 | 现有全部校验通过;首屏交互 ≤ 3s 达标或立案优化 | 0.5 周 |
| **M1 注册表 + 搜索** | §2.1 管线;Wikidata 拉取;拼音/别名;§3.3 搜索落地 | F1 验收:四种输入前 5 命中 | 1.5 周 |
| **M2 说明卡** | §2.2 内容生产(维基抽取 + LLM 起草 + 人工审校);muscle-card 组件 | F2 验收:全注册表字段齐备 | 1 周(审校可并行拖尾) |
| **M3 动作库 + 动画** | §2.3/§2.4 导入与映射;CDN 媒体;exercise-player | F5 验收:主流 100 动作动画覆盖 ≥ 90% | 1.5 周 |
| **M4 离线方案 + 反推** | §2.5 内置方案;§3.2 角色高亮;plan-panel;标签点击闭环 | F4(离线)验收;反推高亮与爆炸视图兼容 | 1 周 |
| **M5 AI 接入** | §4 全部:endpoint、校验、缓存、限流、降级、流式 UI | F3/F4(在线)验收;校验通过率埋点 | 1.5–2 周 |
| **M6 打磨发布** | 免责与署名文案;移动端 perf;CI;文档;上线 | PRD 非功能需求逐项通过 | 1 周 |

合计约 **7.5–8.5 周**。关键路径在 M1→M2 的数据生产(人工审校),建议 M2 审校与 M3 开发并行。

## 7. 主要风险与对策

| 风险 | 影响 | 对策 |
| --- | --- | --- |
| Gym visual 媒体再分发条款收紧(尺寸/商用限制) | 动画源需更换 | 主源可整体切换到 Unlicense 的 free-exercise-db(静态图);媒体层做了源无关封装(`media` 字段 + CDN);上线前法务复核结论落入 M3 出口条件 |
| 中文解剖术语/说明出错 | 专业可信度受损 | 全部内容 `reviewedBy` 留痕才可入产物;发布前抽检 10%;用户反馈入口 |
| AI 幻觉肌肉/动作 | 返回不可点击的无效结果 | §4.3 白名单 + schema 双校验,剔除率>20% 整体拒绝;前端永远有离线兜底 |
| 首次加载 31.4MB 模型(gzip 实测) | 移动端转化受损 | 分块渐进加载已有;若 M0 基线不达标,启用「瘦身构建」:用现有几何管线只保留肌肉+骨骼+皮肤再跑 convert→optimize→compress(需求"任意肌肉"不受影响),预计显著降体积;此为独立优化项,不阻塞主线 |
| 男性单一参考解剖 | 用户覆盖受限 | v1 文案明示;女性参考解剖(如 HuBMAP HRA)列为 v2(ATTRIBUTION.md 已有历史集成记录可参考) |
| 方案动作无对应动画 | 体验断档 | `exerciseId` 优先命中动作库;名称模糊匹配;仍缺则降级静态图占位 |

## 8. 与现仓库的边界

- 新项目**复制(fork)出独立仓库**开发,不回写 human-atlas;两仓库 MIT(代码)与 CC BY 4.0(几何)许可链各自独立完整;
- 几何产物 `public/models/` 直接沿用(ATTRIBUTION 义务随之携带);
- 若瘦身构建落地,`scripts/convert-anatomy.py` 等脚本的输出目录与 manifest 命名需调整,避免与全量产物混淆。
