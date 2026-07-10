# Special NPC Layout Char Info Viewer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 把 `src/char_info_viewer/venus-layout-preview.html` 的双栏角色图布局合入通用 `char_info_viewer`，并且只在角色姓名命中 `characterImageMap` 时启用 special_npc 布局，否则保持现有普通版。

**Architecture:** `App.vue` 保留为数据加载、错误态、导入按钮和布局分发容器；Special NPC 视觉结构单独放进 `components/specialNpc/*`，样式使用组件 scoped style，不混进默认 viewer。`characterViewModel.ts` 负责判断布局类型和解析图片来源，Vue 组件只消费 view-model，不直接读 `characterImageMap`。

**Tech Stack:** Vue 3 `<script setup lang="ts">`、TypeScript、现有 `characterViewModel.ts` helper、webpack `?url` asset inline 规则、`pnpm run build:dev` 验证。

---

## 当前结构观察

- `venus-layout-preview.html` 是静态 prototype，不应直接塞进 `index.html`。项目规则要求 `index.html` 只保留静态 body，真实 UI 应进 Vue 组件。
- preview DOM 分为：
  - 外层 `.chatroom-sim`：只是预览宿主，正式实现不要照搬。
  - `.preview-shell`：正式对应 Special NPC 根布局。
  - `.portrait-pane`：左侧角色图片，正式从 `vm.imageUrl` 读取。
  - `.data-pane`：右侧滚动内容。
  - `.header-section`：等级、生命层级、姓名、种族/身份/职业。
  - `.tabs-container`：tab 导航。
  - `.panel-home`：属性旗帜 + HP/SP/MP 资源。
  - `.panel-profile`：性格、外貌特质、喜爱、衣物装饰四个文本块。
  - `.panel-skills` / `.panel-equipment`：同一种 list item 卡片。
  - `.panel-divinity`：神性/登神长阶装饰块。
  - `.panel-story`：背景故事文本块。
- 当前 `characterViewModel.ts` 已经导入 `characterImageMap`，但逻辑是 `imageUrl ? 'portrait' : 'default'`。这会让 YAML 里自带 `角色图片` 的角色也进入 portrait layout，不符合“只有姓名命中 map 才启用 special_npc”的目标。
- 当前 `App.vue` 有 1800 行，默认布局、旧 portrait 布局、tab 面板、导入按钮、粒子背景和样式混在一起。新增 Special NPC 时不要继续扩大这个文件。
- webpack 对 CSS URL 设置了 `url: false`，不能依赖 preview 里的 `./123 (1).png` 相对路径。若使用本地 png，应通过 `?url` import；若使用外链，直接写入 `characterImageMap` 即可。

## 文件结构

- Modify: `src/char_info_viewer/services/characterViewModel.ts`
  - 增加“map 命中”的显式判断。
  - 把 `layoutKind` 从 `'default' | 'portrait'` 调整为 `'default' | 'special_npc'`。
  - 保留 YAML 自带图片字段的解析，但它只作为图片 URL，不再自动切 Special NPC。
- Modify: `src/char_info_viewer/App.vue`
  - 只做布局分发和导入按钮保留。
  - `vm.layoutKind === 'special_npc'` 时渲染 Special NPC 组件；否则走现有默认模板。
  - 不在 `App.vue` 新增 Special NPC 大段 CSS。
- Create: `src/char_info_viewer/components/specialNpc/SpecialNpcCharacterSheet.vue`
  - special_npc 布局总组件，负责双栏结构、tab 状态和组合子组件。
- Create: `src/char_info_viewer/components/specialNpc/SpecialNpcHeader.vue`
  - 显示等级、生命层级、姓名和 meta。
- Create: `src/char_info_viewer/components/specialNpc/SpecialNpcTabNav.vue`
  - 横向 tab 导航。
- Create: `src/char_info_viewer/components/specialNpc/SpecialNpcOverviewPanel.vue`
  - 首页：属性旗帜和资源栏。
- Create: `src/char_info_viewer/components/specialNpc/SpecialNpcProfilePanel.vue`
  - 档案：四个文本块。
- Create: `src/char_info_viewer/components/specialNpc/SpecialNpcItemCard.vue`
  - 技能、装备、背包、状态效果共用卡片。
- Create: `src/char_info_viewer/components/specialNpc/SpecialNpcDivinityPanel.vue`
  - 登神长阶专用展示。
- Optional Create: `src/char_info_viewer/assets.d.ts`
  - 仅当 `characterImageMap.ts` 要 import 本地 png 时添加 `*.png?url` 模块声明。

## Data Contract

Special NPC 组件只接收这些 props，不直接解析 YAML：

```ts
import type { CharacterViewModel, TabKey } from '../../services/characterViewModel';

type AttributeView = {
  key: string;
  short: string;
  total: number;
  formula: string;
  formulaParts: Array<{ index: number; text: string; isWarning: boolean }>;
  isTotalAbnormal: boolean;
  hasFormulaWarning: boolean;
  showFormula: boolean;
};

type SpecialNpcSheetProps = {
  vm: CharacterViewModel;
  attributes: AttributeView[];
  activeTab: TabKey;
  importing: boolean;
  importButtonText: string;
  showImportMenu: boolean;
};
```

Special NPC 总组件通过 emits 把动作交还给 `App.vue`：

```ts
const emit = defineEmits<{
  setTab: [tab: TabKey];
  toggleAttributeFormula: [key: string];
  toggleImportMenu: [];
  importMvu: [];
  importWorldbook: [];
}>();
```

## Task 1: 收紧布局判断

**Files:**
- Modify: `src/char_info_viewer/services/characterViewModel.ts`
- Optional Modify: `src/char_info_viewer/characterImageMap.ts`

- [ ] **Step 1: 修改 layout 类型**

把：

```ts
export type CharacterLayoutKind = 'default' | 'portrait';
```

改成：

```ts
export type CharacterLayoutKind = 'default' | 'special_npc';
```

- [ ] **Step 2: 拆分图片来源**

把 `resolveCharacterImageUrl` 改为返回来源信息：

```ts
type CharacterImageResolution = {
  url: string;
  source: 'map' | 'data' | 'none';
};

function resolveCharacterImage(data: CharacterData, nameText: string): CharacterImageResolution {
  const fromMap = characterImageMap[nameText];
  if (fromMap) return { url: fromMap, source: 'map' };

  const fromData = textFromUnknown(pickField(data, '角色图片', '立绘', '图片', 'portrait', 'image'));
  if (fromData) return { url: fromData, source: 'data' };

  return { url: '', source: 'none' };
}
```

- [ ] **Step 3: 只让 map 命中启用 special_npc**

在 `buildCharacterViewModel` 里替换：

```ts
const imageUrl = resolveCharacterImageUrl(data, nameText);
```

为：

```ts
const image = resolveCharacterImage(data, nameText);
const imageUrl = image.url;
```

并把返回值里的：

```ts
layoutKind: imageUrl ? 'portrait' : 'default',
```

改为：

```ts
layoutKind: image.source === 'map' ? 'special_npc' : 'default',
```

- [ ] **Step 4: 如果使用本地 png，先确认 asset import**

若要把 preview 的 `src/char_info_viewer/123 (1).png` 放进 map，不要写相对字符串。新增类型声明：

```ts
declare module '*.png?url' {
  const src: string;
  export default src;
}
```

然后在 `characterImageMap.ts` 使用：

```ts
import specialNpcImageUrl from './123 (1).png?url';

export const characterImageMap: Record<string, string> = {
  维纳丝·珀菈·索伦蒂斯: specialNpcImageUrl,
};
```

如果继续用 catbox / CDN 外链，则不需要新增 `assets.d.ts`。

## Task 2: 建立 Special NPC 组件边界

**Files:**
- Create: `src/char_info_viewer/components/specialNpc/SpecialNpcCharacterSheet.vue`
- Create: `src/char_info_viewer/components/specialNpc/SpecialNpcHeader.vue`
- Create: `src/char_info_viewer/components/specialNpc/SpecialNpcTabNav.vue`

- [ ] **Step 1: SpecialNpcCharacterSheet 只做组装**

根结构对应 preview 的 `.preview-shell`，不要带 `.chatroom-sim` 和 `.prototype-note`：

```vue
<template>
  <main class="special-npc-shell">
    <aside class="special-npc-portrait-pane">
      <img :src="vm.imageUrl" :alt="vm.nameText" class="special-npc-portrait-image" />
    </aside>

    <section class="special-npc-data-pane">
      <SpecialNpcHeader :vm="vm" />
      <SpecialNpcTabNav :tabs="tabs" :active-tab="activeTab" @set-tab="tab => emit('setTab', tab)" />
      <div class="special-npc-panels">
        <!-- panels in later tasks -->
      </div>
    </section>
  </main>
</template>
```

- [ ] **Step 2: SpecialNpcHeader 显示已有 vm 字段**

Header 不读原始 `CharacterData`：

```vue
<template>
  <header class="special-npc-header">
    <div class="special-npc-level-tier">
      <span class="special-npc-level">LV. {{ vm.levelText }}</span>
      <span class="special-npc-badge-separator">✦</span>
      <span class="special-npc-tier">{{ vm.tierText }}</span>
    </div>
    <h1 class="special-npc-name">{{ vm.nameText }}</h1>
    <div class="special-npc-subtitle">
      <template v-for="(item, index) in metaItems" :key="item">
        <span v-if="index > 0" class="special-npc-meta-sep">◆</span>
        <span>{{ item }}</span>
      </template>
    </div>
  </header>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { CharacterViewModel } from '../../services/characterViewModel';

const props = defineProps<{ vm: CharacterViewModel }>();
const metaItems = computed(() =>
  [props.vm.raceText, props.vm.identityText, props.vm.classText].filter(item => item && item !== '-'),
);
</script>
```

- [ ] **Step 3: Tab key 策略**

不要把现有 `profile` 改成首页。新增一个 Special NPC-only 的首页 key 更清晰：

```ts
type SpecialNpcTabKey = 'overview' | TabKey;
```

`SpecialNpcCharacterSheet.vue` 内部构建：

```ts
const tabs = computed(() => [
  { key: 'overview' as const, label: '首页' },
  ...props.vm.visibleTabs,
]);
```

如果执行时希望少改类型，也可暂时复用 `profile` 作为首页，但那会让“档案”面板继续没有独立 tab，不推荐。

## Task 3: 拆 Special NPC 面板

**Files:**
- Create: `src/char_info_viewer/components/specialNpc/SpecialNpcOverviewPanel.vue`
- Create: `src/char_info_viewer/components/specialNpc/SpecialNpcProfilePanel.vue`
- Create: `src/char_info_viewer/components/specialNpc/SpecialNpcItemCard.vue`
- Create: `src/char_info_viewer/components/specialNpc/SpecialNpcDivinityPanel.vue`

- [ ] **Step 1: 首页面板只负责属性和资源**

`SpecialNpcOverviewPanel.vue` props：

```ts
const props = defineProps<{
  attributes: AttributeView[];
  resourceBoxes: ResourceBox[];
}>();
```

保留现有属性公式点击能力：

```vue
<div
  v-for="attr in attributes"
  :key="attr.key"
  class="special-npc-attribute"
  :class="{ 'show-formula': attr.showFormula, 'has-formula': !!attr.formula }"
  @click="emit('toggleAttributeFormula', attr.key)"
>
  <span class="special-npc-attribute-name">{{ attr.short }}</span>
  <span class="special-npc-attribute-total">{{ attr.total }}</span>
  <span v-if="attr.formula" class="special-npc-attribute-formula">
    <template v-for="part in attr.formulaParts" :key="`${attr.key}-${part.index}-${part.text}`">
      <span v-if="part.index > 0">+</span>
      <span :class="{ warning: part.isWarning }">{{ part.text }}</span>
    </template>
  </span>
</div>
```

- [ ] **Step 2: 档案面板固定四块**

`SpecialNpcProfilePanel.vue` 使用 `vm.personalityText`、`vm.appearanceText`、`vm.likesText`、`vm.attireText`。只渲染有内容的块，避免空卡：

```ts
const blocks = computed(() =>
  [
    { title: '性格', text: props.vm.personalityText },
    { title: '外貌特质', text: props.vm.appearanceText },
    { title: '喜爱', text: props.vm.likesText },
    { title: '衣物装饰', text: props.vm.attireText },
  ].filter(block => block.text),
);
```

- [ ] **Step 3: 技能/装备/背包/状态共用 SpecialNpcItemCard**

复用现有 helper，不在组件内重新猜字段名：

```ts
import {
  itemDescription,
  itemEffectEntriesOrDescription,
  itemName,
  itemQuality,
  itemTags,
  itemType,
  qualityClass,
} from '../../services/characterViewModel';
```

卡片显示顺序：

```vue
<article class="special-npc-list-item" :class="qualityClass(item)">
  <div class="special-npc-list-item-header">
    <h3>{{ itemName(item) }}</h3>
    <span v-if="subtitle" class="special-npc-list-item-type">{{ subtitle }}</span>
  </div>
  <div v-if="itemTags(item).length > 0" class="special-npc-tags">
    <span v-for="tag in itemTags(item)" :key="tag" class="special-npc-tag">{{ tag }}</span>
  </div>
  <ul v-if="effects.length > 0" class="special-npc-effect-list">
    <li v-for="entry in effects" :key="`${entry.name}-${entry.content}`">
      <span v-if="!entry.fallback" class="special-npc-effect-name">{{ entry.name }}</span>
      <span>{{ entry.content }}</span>
    </li>
  </ul>
  <p v-if="description">{{ description }}</p>
</article>
```

- [ ] **Step 4: 登神长阶单独组件**

`SpecialNpcDivinityPanel.vue` 接收 `vm`，按现有数据源分区：

```ts
const sections = computed(() => [
  props.vm.divinityKingdom
    ? { title: props.vm.divinityKingdom.name, body: props.vm.divinityKingdom.description }
    : null,
  ...props.vm.divinityElements.map(item => ({ title: itemName(item), body: itemEffectOrDescription(item) })),
  ...props.vm.divinityPowers.map(item => ({ title: itemName(item), body: itemEffectOrDescription(item) })),
  ...props.vm.divinityLaws.map(item => ({
    title: itemName(item),
    body: [itemDescription(item), lawPassive(item), lawActive(item)].filter(Boolean).join('\n'),
  })),
].filter(Boolean));
```

标题优先用 `vm.divinityGodTitle`；没有时用 `登神长阶`。

## Task 4: 让 App.vue 只分发，不吞下 Special NPC 样式

**Files:**
- Modify: `src/char_info_viewer/App.vue`

- [ ] **Step 1: import SpecialNpcCharacterSheet**

```ts
import SpecialNpcCharacterSheet from './components/specialNpc/SpecialNpcCharacterSheet.vue';
```

- [ ] **Step 2: 增加布局判断**

```ts
const isSpecial NPCLayout = computed(() => vm.value?.layoutKind === 'special_npc');
```

- [ ] **Step 3: template 分支**

在成功态里优先分发：

```vue
<SpecialNpcCharacterSheet
  v-if="isSpecial NPCLayout && vm"
  :vm="vm"
  :attributes="attributes"
  :active-tab="activeTab"
  :importing="importing"
  :import-button-text="importButtonText"
  :show-import-menu="showImportMenu"
  @set-tab="activeTab = $event"
  @toggle-attribute-formula="toggleAttributeFormula"
  @toggle-import-menu="toggleImportMenu"
  @import-mvu="onImportMvu"
  @import-worldbook="onImportWorldbook"
/>
<template v-else>
  <!-- keep existing default viewer markup here -->
</template>
```

不要把 Special NPC CSS 放进 `App.vue` 的 `<style scoped>`；只删除旧 portrait CSS 的时机应放到确认 Special NPC 完成后，避免一次改动同时做新功能和大清理。

## Task 5: 样式迁移规则

**Files:**
- Modify/Create under `src/char_info_viewer/components/specialNpc/*.vue`

- [ ] **Step 1: class 加前缀**

preview 里的通用名要加 `special-npc-` 前缀，避免和默认 viewer 的 `.resource-grid`、`.attributes-grid`、`.tab-button` 冲突。

Mapping:

```txt
.preview-shell       -> .special-npc-shell
.portrait-pane       -> .special-npc-portrait-pane
.data-pane           -> .special-npc-data-pane
.header-section      -> .special-npc-header
.tabs-container      -> .special-npc-tabs
.tab-btn             -> .special-npc-tab-button
.resource-grid       -> .special-npc-resource-grid
.attributes-grid     -> .special-npc-attributes-grid
.attribute-item      -> .special-npc-attribute
.text-block          -> .special-npc-text-block
.list-item           -> .special-npc-list-item
.divinity-block      -> .special-npc-divinity-block
```

- [ ] **Step 2: 去掉 preview-only CSS**

不要迁移：

```css
html,
body,
.chatroom-sim,
.prototype-note
```

正式 viewer 的外层尺寸由酒馆 iframe 和 `.viewer-root` 控制。

- [ ] **Step 3: 不引入远程字体 import**

preview 顶部的 `@import url(...)` 不要搬入组件。酒馆环境里外部字体会增加加载风险；先用现有字体栈：

```css
font-family: 'Noto Sans SC', 'Microsoft YaHei', 'PingFang SC', sans-serif;
```

标题需要衬线感时局部使用现有 fallback：

```css
font-family: 'Noto Serif SC', 'Source Han Serif SC', 'Noto Sans SC', serif;
```

- [ ] **Step 4: 用 CSS 变量接主题**

Special NPC 组件继续读 `applyTheme()` 设置的变量：

```css
.special-npc-shell {
  --special-npc-accent: var(--tier-color);
  --special-npc-accent-rgb: var(--tier-color-rgb);
}
```

不要把 preview 的金色写死到所有状态；金色可以作为 fallback：

```css
color: var(--special-npc-accent, #d4af37);
```

## Task 6: 验证

**Files:**
- Verify: `src/char_info_viewer/services/characterViewModel.ts`
- Verify: `src/char_info_viewer/App.vue`
- Verify: `src/char_info_viewer/components/specialNpc/*.vue`

- [ ] **Step 1: 构建检查**

Run:

```powershell
pnpm run build:dev
```

Expected:

```txt
webpack compiled successfully
```

- [ ] **Step 2: map 命中行为检查**

使用姓名为 `维纳丝·珀菈·索伦蒂斯` 的 `<char_info>` 数据，确认：

```txt
vm.layoutKind === 'special_npc'
vm.imageUrl === characterImageMap['维纳丝·珀菈·索伦蒂斯']
```

- [ ] **Step 3: 非 map 角色回退检查**

使用其他姓名但 YAML 自带 `角色图片` 的数据，确认：

```txt
vm.layoutKind === 'default'
vm.imageUrl === YAML 中的图片 URL
```

这一步很关键，它验证“有图片”和“启用 special_npc”已经解耦。

- [ ] **Step 4: UI smoke test**

在 SillyTavern 页面里检查：

```txt
命中 map 的角色：左图右文，首页显示属性和资源，档案 tab 显示四个文本块。
未命中 map 的角色：仍是现有普通版，tab、导入按钮、属性公式点击不退化。
```

- [ ] **Step 5: diff 自查**

确认 diff 里没有这些风险：

```txt
没有改 README 或 rules。
没有修改 unrelated tarot-preview / src/.gitkeep。
没有把 preview 的 html/body/chatroom-sim/prototype-note 搬进正式组件。
没有让 YAML 自带图片自动启用 special_npc。
没有把远程字体 @import 加进 Vue scoped style。
没有新增 dependency。
```

## Recommended Execution Order

1. 先做 Task 1，跑一次 `pnpm run build:dev`，确认布局判断没破。
2. 做 Task 2 和 Task 3，先让 Special NPC 结构能显示真实数据。
3. 做 Task 4，把 Special NPC 接入 `App.vue`。
4. 做 Task 5，把 preview 样式迁移并加前缀。
5. 做 Task 6，确认 map 命中和普通版回退都正常。

## Open Decision

图片来源有两条路：

1. 推荐：继续在 `characterImageMap.ts` 使用外链 URL，最少改动。
2. 如果必须使用本地 `123 (1).png`：新增 `assets.d.ts`，通过 `?url` import，避免构建产物找不到相对图片。
