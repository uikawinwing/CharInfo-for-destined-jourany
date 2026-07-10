# Special NPC Handover Brief

更新时间：2026-07-10

这份文档给下一位接手 `char_info_viewer` special NPC 工作的 LLM / agent 使用。当前任务不是从零重做，而是在已经拆出的 special NPC 组件基础上继续修整 Venus 主题、移动端兼容和后续 NPC 扩展。

## 当前结论

- `char_info_viewer` 仍然应该保持 Tavern Helper 前端界面模式，不要改成脚本 wrapper。
- 普通角色继续走默认 viewer。
- 名字能在 special NPC profile 中解析到的角色走 `special_npc` layout。
- Venus 是当前唯一有完整定制方向的 special NPC。
- `登神长阶` 可以按 NPC 单独 override；不要把 Venus 的全屏舞台/幕布动画写死成所有 special NPC 的默认样式。

## 关键文件

- `src/char_info_viewer/App.vue`
  - 入口渲染逻辑。
  - 严格 YAML 解析失败时提供“尝试宽松读取”按钮。
  - `special_npc` layout 时切到 `SpecialNpcCharacterSheet`。
- `src/char_info_viewer/services/characterViewModel.ts`
  - 构建 `CharacterViewModel`。
  - 通过 `resolveSpecialNpcProfile(name)` 决定 `layoutKind: 'special_npc'`。
  - 合并 `角色故事` / `背景故事` 的 tab 逻辑从这里和 special NPC shell 一起看。
- `src/char_info_viewer/specialNpcProfiles.ts`
  - special NPC profile resolver。
  - 当前 Venus override 在这里：`visualTheme: 'venus'`、`divinityVariant: 'venusCurtain'`、`divinityStageBackgroundUrl`。
- `src/char_info_viewer/characterImageMap.ts`
  - 仍然是 special NPC 是否有图的基础来源。
- `src/char_info_viewer/characterStoryBookMap.ts`
  - 角色故事跳转映射。
  - Venus 目前映射到《阿芙罗黛蒂之冠》，对应 `倾国倾城祭`。
- `src/char_info_viewer/services/yamlParser.ts`
  - `parseCharacterYaml` 是正常严格解析。
  - `parseCharacterYamlLoose` 是救急解析，只抓固定 key 之间的内容。
- `src/char_info_viewer/components/specialNpc/`
  - special NPC 组件目录。
  - 主要组件见下面章节。
- `src/char_info_viewer/components/specialNpc/venusAssets.ts`
  - Venus SVG 装饰的 raw import 和 CSS variable 输出。
  - 不要改回 CSS 相对路径。
- `assets/char_info_viewer/materials/`
  - SVG 装饰资源目录。
- `docs/previews/char_info_viewer/venus-layout-preview-divinity-stage-bg-v8.html`
  - 另一个 LLM 调整过的 Venus prototype，可作为视觉参考，不是生产代码。
- `docs/previews/char_info_viewer/venus-layout-preview.html`
  - 旧 preview / prototype，可能已经落后于生产 Vue 组件。

## 已完成

### 1. special NPC 组件拆分

已经拆出：

- `SpecialNpcCharacterSheet.vue`
- `SpecialNpcHeader.vue`
- `SpecialNpcTabNav.vue`
- `SpecialNpcPageTitle.vue`
- `SpecialNpcOverviewPanel.vue`
- `SpecialNpcProfilePanel.vue`
- `SpecialNpcItemCard.vue`
- `SpecialNpcDivinityPanel.vue`
- `SpecialNpcDefaultDivinityPanel.vue`
- `divinitySections.ts`
- `types.ts`

设计方向：

- shell / tab / header / profile / item card 是 shared special NPC 结构。
- Venus 视觉通过 `visualTheme: 'venus'` 加 class 和 CSS variable。
- `登神长阶` 通过 `divinityVariant` 单独分支；默认 special NPC 用 `SpecialNpcDefaultDivinityPanel`。

### 2. Venus 主题已有一部分迁入生产组件

目前生产 special NPC 已经不只是默认红/青旧版：

- Venus 外框改成蓝金方向。
- 头像区域有 Venus 专用 frame / corner decoration。
- 首页属性 flag 改成 3 上 2 下。
- 数字改成白色。
- Venus header 有上下装饰线和 SVG。
- tab nav 已经放到底部正常 layout row。
- save/import 入口已放到 nav 内，不再是独立悬浮在右下角的旧按钮。

### 3. Venus `登神长阶` 已接入定制舞台

当前 Venus 使用：

- `divinityVariant: 'venusCurtain'`
- `divinityStageBackgroundUrl: 'https://files.catbox.moe/3by4cx.png'`

交互方向：

- 默认显示舞台/幕布。
- 点击后开幕。
- 开幕后隐藏 `Le Théâtre des Rêves / 煌海梦幻大剧场` 标题，只显示内部条目。
- 条目来自 `buildDivinitySections(vm)`，不是硬编码文案。

注意：用户明确要 v8 的全屏幕布方向，因为蓝色背景和红色幕布直接混在一起不好看。不要再退回小卡片版。

### 4. `角色故事` 与 calendar_float 初步联动

已经新增 `characterStoryBookMap.ts`：

```ts
'维纳丝·珀菈·索伦蒂斯': {
  bookId: '阿芙罗黛蒂之冠',
  title: '阿芙罗黛蒂之冠',
  festivalName: '倾国倾城祭',
}
```

special NPC shell 内有 `openCharacterStory()`，会尝试找：

- `window.parent.CalendarFloatWidget`
- `window.CalendarFloatWidget`

优先调用：

- `CalendarFloatWidget.openBook(bookId)`

没有接口时 fallback：

- `CalendarFloatWidget.open?.()`
- 显示 warning：需要更新 `calendar_float`。

下一轮若继续做这一块，要去 `calendar_float` 确认实际暴露 API 名字是否真是 `openBook(bookId)`。

### 5. 宽松 YAML 解析按钮已加

严格解析失败时，错误面板会显示：

- `尝试宽松读取`

宽松逻辑：

- 不依赖 YAML 缩进。
- 按顶层 key 抓取 key 与下一个 key 之间的内容。
- 目前主要恢复基础字段、数组字段、文本档案、属性、资源。
- 不保证恢复技能、装备、复杂嵌套结构。

安全措施：

- 宽松读取成功后会显示 warning。
- 宽松读取状态下导入 MVU / 世界书前会弹确认。

### 6. SVG 缺失问题已修过

之前所有 SVG 缺失的根因：

- CSS 里写了 `../../../../assets/char_info_viewer/materials/...svg` 之类的相对路径。
- 打包后组件运行在 `srcdoc` iframe 内。
- `srcdoc` 没有正常文件基准路径，所以浏览器找不到 SVG。

现在的修法：

- 在 `venusAssets.ts` 用 `?raw` import SVG。
- `encodeURIComponent` 后转成 `data:image/svg+xml`。
- 通过 CSS variables 注入：
  - `--venus-portrait-corner-url`
  - `--venus-name-left-flourish-url`
  - `--venus-name-right-flourish-url`
  - `--venus-name-center-crest-url`
  - `--venus-name-bottom-crest-url`

以后不要把这些 SVG 改回 CSS 文件相对路径。

## 未完成 / 需要下一轮继续

### 1. 需要在真实 SillyTavern 页面复查 Venus SVG 是否已显示

代码和 build 已修，但用户页面可能仍然显示旧 iframe bundle。

下一轮建议：

1. 连接用户当前 Chrome / SillyTavern 页面。
2. 检查“酒馆助手-实时监听-允许监听”是否开启。
3. 重新触发或刷新当前 char_info 楼层 iframe。
4. 看头像四角、姓名框上下装饰、登神长阶装饰是否真实显示。

### 2. Venus 主题还需要视觉 QA

需要重点看：

- 桌面宽度下右侧内容是否太空。
- mobile overview 的姓名框是否压住太多图。
- mobile 非首页是否隐藏图片并保留可读内容。
- tab nav 是否仍然会盖住内容。
- `登神长阶` 幕布开幕后右侧内容是否齐、滚动是否自然。
- save/import 放在 nav 内后是否足够明显。

### 3. `角色故事` 跳转需要和 calendar_float 对齐

目前 char_info 侧只是假定存在：

```ts
CalendarFloatWidget.openBook(bookId)
```

但这个接口是否已经在 `calendar_float` 实作、参数是否叫 bookId、是否支持直接跳页，还需要跨 repo 确认。

如果 calendar_float 没有这个 API，下一轮要么：

- 在 calendar_float 暴露 `openBook(bookId)`。
- 或修改 char_info 侧去调用 calendar_float 已有的实际 API。

### 4. 后续 NPC 扩展还没做

现在 profile resolver 已经留了扩展点，但只有 Venus override：

- `visualTheme: 'venus'`
- `divinityVariant: 'venusCurtain'`

后续 NPC 应该新增 profile override，不要复制整套 Venus 组件。

建议扩展方式：

- shared shell 不动。
- 每个 NPC 只 override：
  - `visualTheme`
  - `divinityVariant`
  - image / stage background / SVG asset group
  - 极少数独有 panel。

### 5. preview 文件未完全同步生产结构

`venus-layout-preview.html` 和 `venus-layout-preview-divinity-stage-bg-v8.html` 都是 prototype / LLM 设计参考。

它们可能与 Vue 生产组件不同步。下一轮不要直接拿 preview 覆盖生产组件；要先比对后迁移需要的视觉。

## 不要重复踩的坑

- 不要用 `vh` 控制 iframe 高度；用 width + `aspect-ratio`。
- 不要让主体完全 absolute 脱离文档流，否则宿主楼层高度会错。
- 不要把 tab nav 写成 `position: sticky` 放进 scroll content；之前会浮在技能卡中间。
- 不要把 save/import button 固定到浏览器 viewport。
- 不要在 mobile 非首页继续显示大图。
- 不要把 tier color 用到所有内部元素。
- 不要把 Venus 的幕布舞台当作所有 special NPC 的默认样式。
- 不要把 SVG 以 CSS 相对路径引用；`srcdoc` iframe 会丢资源。
- 不要把图片 base64 写进 profile；图片 URL 保持 URL，让浏览器缓存处理。

## 建议下一轮执行顺序

1. 先跑：

```powershell
pnpm run build:dev
```

2. 连接当前 SillyTavern 页面做视觉 smoke test。
3. 如果 SVG 仍不显示，先检查 runtime bundle 是否已经更新，不要马上改 CSS。
4. 修 Venus 视觉时只碰：

```text
src/char_info_viewer/components/specialNpc/*
src/char_info_viewer/specialNpcProfiles.ts
assets/char_info_viewer/materials/*
```

5. 若要做 calendar_float 跳转，先去 calendar_float repo 确认 API，再改 `characterStoryBookMap.ts` 或 `openCharacterStory()`。
6. 完成后至少跑：

```powershell
pnpm run build:dev
```

必要时再做页面截图验证。

## 当前验证记录

最近一次已跑过：

```powershell
pnpm run build:dev
```

结果：

- webpack development build passed。
- `dist/char_info_viewer/index.html` 已更新。
- 旧的 SVG 相对路径已从打包产物中清掉。

注意：这只证明编译和 bundle 路径处理正确，不等于真实 SillyTavern 页面已经刷新到了最新 iframe。
