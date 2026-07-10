<template>
  <div class="viewer-root">
    <div v-if="parseError" class="error-card">
      <h3>⚠️ YAML 解析失败</h3>
      <div class="error-body">
        <div class="yaml-error-row yaml-error-sub"><b>技术信息：</b>{{ parseError.message }}</div>
        <div v-if="parseError.line !== undefined" class="yaml-error-row">
          <b>定位：</b>第 {{ (parseError.line ?? 0) + 1 }} 行，第 {{ (parseError.column ?? 0) + 1 }} 列
        </div>

        <div v-if="parseErrorTips.length > 0" class="yaml-fix-box">
          <div class="yaml-fix-title">宝宝别急，三角老师带你一步步排查</div>
          <ul class="yaml-fix-list">
            <li v-for="tip in parseErrorTips" :key="tip">{{ tip }}</li>
          </ul>
        </div>

        <div class="yaml-rescue-box">
          <button class="yaml-rescue-button" type="button" :disabled="looseParsing" @click="tryLooseParse">
            {{ looseParsing ? '读取中...' : '尝试宽松读取' }}
          </button>
          <p>这会改用“按关键字之间的内容切段”的方式救回资料，适合缩进被弄乱时临时查看。</p>
        </div>

        <template v-if="parseError.cleanedLine">
          <div class="yaml-error-title">系统定位到的出错行（请重点检查）</div>
          <pre class="yaml-error-pre"
            >{{ parseError.cleanedLine }}
{{ parseError.caretLine }}</pre
          >
        </template>

        <details v-if="parseError.originalLine" class="yaml-error-details">
          <summary>查看你输入的原始内容（可选）</summary>
          <pre class="yaml-error-pre alt">{{ parseError.originalLine }}</pre>
        </details>
      </div>
    </div>

    <template v-else-if="sheetData">
      <div v-if="looseParseWarning" class="parse-warning-card">
        {{ looseParseWarning }}
      </div>

      <SpecialNpcCharacterSheet
        v-if="isSpecialNpcLayout && vm"
        :vm="vm"
        :attributes="attributes"
        :importing="importing"
        :import-button-text="importButtonText"
        :show-import-menu="showImportMenu"
        @toggle-attribute-formula="toggleAttributeFormula"
        @toggle-import-menu="toggleImportMenu"
        @import-mvu="onImportMvu"
        @import-worldbook="onImportWorldbook"
      />

      <div v-else :class="[wrapperClasses, { 'portrait-mode': isPortraitLayout }]">
      <div class="frame-layer" :class="{ show: tierNumber >= 5 }" aria-hidden="true">
        <svg class="frame-svg frame-top" viewBox="0 0 400 100" preserveAspectRatio="none">
          <path d="M 5,100 A 195,80 0 0,1 395,100" />
          <path d="M 15,100 A 185,70 0 0,1 385,100" stroke-width="1" opacity="0.6" />
          <line x1="60" y1="60" x2="60" y2="90" stroke-width="1" />
          <line x1="340" y1="60" x2="340" y2="90" stroke-width="1" />
          <circle cx="60" cy="92" r="3" fill="var(--tier-color)" stroke="none" />
          <circle cx="340" cy="92" r="3" fill="var(--tier-color)" stroke="none" />
          <path
            d="M 200,2 L 205,15 L 220,20 L 205,25 L 200,38 L 195,25 L 180,20 L 195,15 Z"
            fill="var(--tier-color)"
            stroke="none"
          />
        </svg>
        <svg class="frame-svg frame-body" viewBox="0 0 400 100" preserveAspectRatio="none">
          <line x1="5" y1="0" x2="5" y2="100" />
          <line x1="395" y1="0" x2="395" y2="100" />
          <line x1="15" y1="0" x2="15" y2="98" stroke-width="1" opacity="0.6" />
          <line x1="385" y1="0" x2="385" y2="98" stroke-width="1" opacity="0.6" />
          <line x1="5" y1="100" x2="395" y2="100" />
        </svg>
      </div>

      <div ref="bgLayerRef" class="card-background-layer">
        <canvas id="particle-canvas" ref="canvasRef"></canvas>
      </div>

      <div class="sheet-content-wrapper">
        <header v-if="!isPortraitLayout" class="sheet-header">
          <span class="level-badge">Lv.{{ levelText }}</span>
          <h1 class="char-name">{{ nameText }}</h1>
          <div class="char-meta-row">
            <span>{{ raceText }}</span>
            <span class="meta-separator">◆</span>
            <span>{{ identityText }}</span>
            <span class="meta-separator">◆</span>
            <span>{{ classText }}</span>
            <span class="meta-separator">◆</span>
            <span class="tier-name">{{ tierText }}</span>
          </div>
        </header>

        <div class="sheet-body" :class="{ 'portrait-body': isPortraitLayout, 'is-detail-tab': isPortraitDetailTab }">
          <section v-if="isPortraitLayout" class="portrait-main-panel">
            <div class="portrait-image-shell">
              <img class="portrait-image" :src="portraitImageUrl" :alt="nameText" />
            </div>
            <div class="portrait-info-panel">
              <span class="level-badge portrait-level-badge">Lv.{{ levelText }}</span>
              <h1 class="char-name portrait-name">{{ nameText }}</h1>
              <div class="char-meta-row portrait-meta-row">
                <span>{{ raceText }}</span>
                <span class="meta-separator">◆</span>
                <span>{{ identityText }}</span>
                <span class="meta-separator">◆</span>
                <span>{{ classText }}</span>
                <span class="meta-separator">◆</span>
                <span class="tier-name">{{ tierText }}</span>
              </div>
              <div class="portrait-compact-stats">
                <span v-for="attr in attributes" :key="`portrait-${attr.key}`">
                  {{ attr.short }} {{ attr.total }}
                </span>
              </div>
              <div v-if="resourceBoxes.length > 0" class="portrait-compact-resources">
                <span v-for="resource in resourceBoxes" :key="resource.key">
                  {{ resource.label }} {{ resource.value }}
                </span>
              </div>
            </div>
          </section>

          <template v-else>
            <div class="attributes-grid">
              <div
                v-for="attr in attributes"
                :key="attr.key"
                class="attribute-item"
                :class="{
                  'show-formula': attr.showFormula,
                  'has-formula': !!attr.formula,
                  'has-warning': attr.isTotalAbnormal || attr.hasFormulaWarning,
                }"
                @click="toggleAttributeFormula(attr.key)"
              >
                <span class="attribute-name">{{ attr.short }}</span>
                <span class="attribute-total" :class="{ 'is-warning': attr.isTotalAbnormal }">{{ attr.total }}</span>
                <span v-if="attr.formula" class="attribute-formula">
                  <template v-for="part in attr.formulaParts" :key="`${attr.key}-${part.index}-${part.text}`">
                    <span v-if="part.index > 0" class="formula-part-separator">+</span>
                    <span class="formula-part" :class="{ 'formula-part-warning': part.isWarning }">{{ part.text }}</span>
                  </template>
                </span>
              </div>
            </div>

            <div v-if="resourceBoxes.length > 0" class="resource-grid">
              <div v-for="resource in resourceBoxes" :key="resource.key" class="resource-item">
                <span class="resource-name">{{ resource.label }}</span>
                <span class="resource-value">{{ resource.value }}</span>
              </div>
            </div>
          </template>

          <div :class="isPortraitLayout ? 'portrait-tab-nav' : 'tab-nav'">
            <button
              v-for="tab in visibleTabs"
              :key="tab.key"
              class="tab-button"
              :class="{ active: activeTab === tab.key }"
              @click="activeTab = tab.key"
            >
              {{ tab.label }}
            </button>
          </div>

          <section v-if="!isPortraitLayout || activeTab !== 'profile'" class="tab-content">
            <template v-if="activeTab === 'profile'">
              <div class="profile-grid">
                <div class="profile-row">
                  <div class="profile-cell">
                    <template v-if="personalityText">
                      <h3 class="subsection-title">性格</h3>
                      <div class="story profile-panel">{{ personalityText }}</div>
                    </template>
                  </div>

                  <div class="profile-cell">
                    <template v-if="appearanceText">
                      <h3 class="subsection-title">外貌特质</h3>
                      <div class="story profile-panel">{{ appearanceText }}</div>
                    </template>
                  </div>
                </div>

                <div class="profile-row">
                  <div class="profile-cell">
                    <template v-if="likesText">
                      <h3 class="subsection-title">喜爱</h3>
                      <div class="story profile-panel">{{ likesText }}</div>
                    </template>
                  </div>

                  <div class="profile-cell">
                    <template v-if="attireText">
                      <h3 class="subsection-title">衣物装饰</h3>
                      <div class="story profile-panel">{{ attireText }}</div>
                    </template>
                  </div>
                </div>
              </div>
            </template>

            <template v-else-if="activeTab === 'skills'">
              <article v-for="(item, index) in skills" :key="`skill-${index}-${itemName(item)}`" class="card">
                <div class="card-header">
                  <h3 class="card-title" :class="qualityClass(item)">{{ itemName(item) }}</h3>
                  <span v-if="itemQuality(item)" class="card-subtitle" :class="qualityClass(item)">{{
                    itemQuality(item)
                  }}</span>
                </div>
                <div class="card-body">
                  <div v-if="itemTags(item).length > 0" class="card-tags">
                    <span v-for="tag in itemTags(item)" :key="`skill-tag-${index}-${tag}`" class="card-tag">
                      {{ tag }}
                    </span>
                  </div>
                  <p v-if="itemType(item)"><span class="card-label">类型:</span>{{ itemType(item) }}</p>
                  <p v-if="itemCost(item)"><span class="card-label">消耗:</span>{{ itemCost(item) }}</p>
                  <template v-if="itemEffectEntries(item).length > 0">
                    <p><span class="card-label">效果:</span></p>
                    <ul class="effect-list">
                      <li
                        v-for="(entry, effectIndex) in itemEffectEntries(item)"
                        :key="`skill-effect-${index}-${effectIndex}-${entry.name}`"
                        class="effect-item"
                      >
                        <span v-if="!entry.fallback" class="effect-name">{{ entry.name }}</span>
                        <span class="effect-text">{{ entry.content }}</span>
                      </li>
                    </ul>
                  </template>
                  <p v-else><span class="card-label">效果:</span>无</p>
                  <p v-if="itemDescription(item)" class="card-description">{{ itemDescription(item) }}</p>
                </div>
              </article>
            </template>

            <template v-else-if="activeTab === 'equipment'">
              <article v-for="(item, index) in equipments" :key="`equip-${index}-${itemName(item)}`" class="card">
                <div class="card-header">
                  <h3 class="card-title" :class="qualityClass(item)">{{ itemName(item) }}</h3>
                  <span v-if="itemQuality(item)" class="card-subtitle" :class="qualityClass(item)">{{
                    itemQuality(item)
                  }}</span>
                </div>
                <div class="card-body">
                  <div v-if="itemTags(item).length > 0" class="card-tags">
                    <span v-for="tag in itemTags(item)" :key="`equip-tag-${index}-${tag}`" class="card-tag">
                      {{ tag }}
                    </span>
                  </div>
                  <p v-if="itemType(item)"><span class="card-label">类型:</span>{{ itemType(item) }}</p>
                  <template v-if="itemEffectEntries(item).length > 0">
                    <p><span class="card-label">效果:</span></p>
                    <ul class="effect-list">
                      <li
                        v-for="(entry, effectIndex) in itemEffectEntries(item)"
                        :key="`equip-effect-${index}-${effectIndex}-${entry.name}`"
                        class="effect-item"
                      >
                        <span v-if="!entry.fallback" class="effect-name">{{ entry.name }}</span>
                        <span class="effect-text">{{ entry.content }}</span>
                      </li>
                    </ul>
                  </template>
                  <p v-else><span class="card-label">效果:</span>无</p>
                  <p v-if="itemDescription(item)" class="card-description">{{ itemDescription(item) }}</p>
                </div>
              </article>
            </template>

            <template v-else-if="activeTab === 'inventory'">
              <template v-for="section in inventorySections" :key="section.key">
                <h3 class="subsection-title">{{ section.title }}</h3>
                <article
                  v-for="(item, index) in section.items"
                  :key="`${section.key}-${index}-${itemName(item)}`"
                  class="card"
                >
                  <div class="card-header">
                    <h3 class="card-title" :class="qualityClass(item)">{{ itemName(item) }}</h3>
                    <span v-if="itemQuality(item)" class="card-subtitle" :class="qualityClass(item)">{{
                      itemQuality(item)
                    }}</span>
                  </div>
                  <div class="card-body">
                    <div v-if="itemTags(item).length > 0" class="card-tags">
                      <span v-for="tag in itemTags(item)" :key="`${section.key}-${index}-${tag}`" class="card-tag">
                        {{ tag }}
                      </span>
                    </div>
                    <p v-if="itemType(item)"><span class="card-label">类型:</span>{{ itemType(item) }}</p>
                    <template v-if="itemEffectEntriesOrDescription(item).length > 0">
                      <p><span class="card-label">效果:</span></p>
                      <ul class="effect-list">
                        <li
                          v-for="(entry, effectIndex) in itemEffectEntriesOrDescription(item)"
                          :key="`${section.key}-${index}-${effectIndex}-${entry.name}`"
                          class="effect-item"
                        >
                          <span v-if="!entry.fallback" class="effect-name">{{ entry.name }}</span>
                          <span class="effect-text">{{ entry.content }}</span>
                        </li>
                      </ul>
                    </template>
                    <p v-else><span class="card-label">效果:</span>无</p>
                    <p v-if="itemDescription(item) && itemEffectEntries(item).length > 0" class="card-description">
                      {{ itemDescription(item) }}
                    </p>
                  </div>
                </article>
              </template>
            </template>

            <template v-else-if="activeTab === 'divinity'">
              <h3 v-if="divinityGodTitle" class="subsection-title divinity-main-title">{{ divinityGodTitle }}</h3>

              <article v-if="divinityKingdom" class="card divinity-card">
                <div class="card-header">
                  <h3 class="card-title">{{ divinityKingdom.name }}</h3>
                </div>
                <div class="card-body">
                  <p>{{ divinityKingdom.description || '无' }}</p>
                </div>
              </article>

              <template v-if="divinityElements.length > 0">
                <h3 class="subsection-title">要素</h3>
                <article
                  v-for="(item, index) in divinityElements"
                  :key="`elem-${index}-${itemName(item)}`"
                  class="card divinity-card"
                >
                  <div class="card-header">
                    <h3 class="card-title">{{ itemName(item) }}</h3>
                  </div>
                  <div class="card-body">
                    <p>{{ itemEffectOrDescription(item) }}</p>
                  </div>
                </article>
              </template>

              <template v-if="divinityPowers.length > 0">
                <h3 class="subsection-title">权能</h3>
                <article
                  v-for="(item, index) in divinityPowers"
                  :key="`power-${index}-${itemName(item)}`"
                  class="card divinity-card"
                >
                  <div class="card-header">
                    <h3 class="card-title">{{ itemName(item) }}</h3>
                  </div>
                  <div class="card-body">
                    <p>{{ itemEffectOrDescription(item) }}</p>
                  </div>
                </article>
              </template>

              <template v-if="divinityLaws.length > 0">
                <h3 class="subsection-title">法则</h3>
                <article
                  v-for="(item, index) in divinityLaws"
                  :key="`law-${index}-${itemName(item)}`"
                  class="card divinity-card"
                >
                  <div class="card-header">
                    <h3 class="card-title">{{ itemName(item) }}</h3>
                  </div>
                  <div class="card-body">
                    <p v-if="itemDescription(item)">{{ itemDescription(item) }}</p>
                    <p v-if="lawPassive(item)"><span class="card-label">被动:</span>{{ lawPassive(item) }}</p>
                    <p v-if="lawActive(item)"><span class="card-label">主动:</span>{{ lawActive(item) }}</p>
                  </div>
                </article>
              </template>
            </template>

            <template v-else-if="activeTab === 'statusEffects'">
              <article
                v-for="(item, index) in statusEffects"
                :key="`status-effect-${index}-${itemName(item)}`"
                class="card"
              >
                <div class="card-header">
                  <h3 class="card-title">{{ itemName(item) }}</h3>
                  <span v-if="statusEffectType(item)" class="card-subtitle">{{ statusEffectType(item) }}</span>
                </div>
                <div class="card-body">
                  <p v-if="statusEffectDescription(item)">
                    <span class="card-label">效果:</span>{{ statusEffectDescription(item) }}
                  </p>
                  <p v-if="statusEffectLayers(item)">
                    <span class="card-label">层数:</span>{{ statusEffectLayers(item) }}
                  </p>
                  <p v-if="statusEffectDuration(item)">
                    <span class="card-label">剩余时间:</span>{{ statusEffectDuration(item) }}
                  </p>
                  <p v-if="statusEffectSource(item)">
                    <span class="card-label">来源:</span>{{ statusEffectSource(item) }}
                  </p>
                </div>
              </article>
            </template>

            <template v-else>
              <div class="story">{{ backstoryText || '暂无故事' }}</div>
            </template>
          </section>
        </div>

        <button id="import-action-btn" :disabled="importing" @click.stop="toggleImportMenu">
          {{ importButtonText }}
        </button>
        <div id="import-action-menu" :class="{ show: showImportMenu }">
          <button type="button" :disabled="importing" @click="onImportMvu">导入到 MVU 变量</button>
          <button type="button" :disabled="importing" @click="onImportWorldbook">导入到 聊天世界书</button>
        </div>
      </div>
      </div>
    </template>

    <div v-else class="loading-card">等待 YAML 数据...</div>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watchEffect } from 'vue';

import {
  ATTRIBUTE_KEYS,
  buildAttributeWarningMap,
  getAttributeRawValue,
  splitAttributeFormula,
} from './services/attributeWarning';
import {
  buildCharacterViewModel,
  itemCost,
  itemDescription,
  itemEffectEntries,
  itemEffectEntriesOrDescription,
  itemEffectOrDescription,
  itemName,
  itemQuality,
  itemTags,
  itemType,
  lawActive,
  lawPassive,
  pickField,
  qualityClass,
  statusEffectDescription,
  statusEffectDuration,
  statusEffectLayers,
  statusEffectSource,
  statusEffectType,
  type TabKey,
} from './services/characterViewModel';
import { importToMvuVariables, saveToChatWorldbook } from './services/importService';
import { createParticleEngine, type ParticleEngine } from './services/particleEngine';
import { applyTheme, resolveTheme } from './services/themeService';
import { parseCharacterYaml, parseCharacterYamlLoose } from './services/yamlParser';
import type { CharacterData, FriendlyYamlError, ThemeResolved } from './types';
import SpecialNpcCharacterSheet from './components/specialNpc/SpecialNpcCharacterSheet.vue';

const sheetData = ref<CharacterData | null>(null);
const parseError = ref<FriendlyYamlError | null>(null);
const originalYamlText = ref('');
const parseMode = ref<'strict' | 'loose'>('strict');
const parseWarnings = ref<string[]>([]);
const looseParsing = ref(false);
const theme = ref<ThemeResolved | null>(null);
const activeTab = ref<TabKey>('profile');

const canvasRef = ref<HTMLCanvasElement | null>(null);
const bgLayerRef = ref<HTMLElement | null>(null);
let engine: ParticleEngine | null = null;

const showImportMenu = ref(false);
const importing = ref(false);
const defaultImportButtonText = '📥';
const importButtonText = ref(defaultImportButtonText);
let importButtonResetTimer: ReturnType<typeof setTimeout> | null = null;

const defaultParseErrorTips = [
  '1. 先看这行里小箭头 ^ 指着哪里，就改那里',
  '2. 看"键: 值"的格式有沒有问题（通常是多了个冒号或内容写法不对）',
  '3. 看这一行开头前面的空格，尽量和附近长得像的行保持一样多（缩进错误）',
  '4. 内容可能缺少引号、括号，或上一行没有正确结束',
];

const parseErrorTips = computed(() => parseError.value?.tips?.length ? parseError.value.tips : defaultParseErrorTips);
const looseParseWarning = computed(() => (parseMode.value === 'loose' ? parseWarnings.value[0] || '当前使用宽松读取，导入前请先检查内容。' : ''));

const attributeLabelMap: Record<string, string> = {
  力量: '力',
  敏捷: '敏',
  体质: '体',
  智力: '智',
  精神: '精',
};

const tierNumber = computed(() => theme.value?.tier ?? 1);
const wrapperClasses = computed(() => ({
  'card-wrapper': true,
  [`tier-${tierNumber.value}`]: true,
  'high-tier': tierNumber.value >= 5,
}));

const vm = computed(() => (sheetData.value ? buildCharacterViewModel(sheetData.value) : null));
const isSpecialNpcLayout = computed(() => vm.value?.layoutKind === 'special_npc');
const isPortraitLayout = computed(() => false);
const isPortraitDetailTab = computed(() => isPortraitLayout.value && activeTab.value !== 'profile');
const portraitImageUrl = computed(() => vm.value?.imageUrl || '');
const nameText = computed(() => vm.value?.nameText || 'Unknown');
const levelText = computed(() => vm.value?.levelText || '?');
const raceText = computed(() => vm.value?.raceText || '其他');
const tierText = computed(() => vm.value?.tierText || 'Unknown');
const identityText = computed(() => vm.value?.identityText || '-');
const classText = computed(() => vm.value?.classText || '-');
const personalityText = computed(() => vm.value?.personalityText || '');
const likesText = computed(() => vm.value?.likesText || '');
const appearanceText = computed(() => vm.value?.appearanceText || '');
const attireText = computed(() => vm.value?.attireText || '');
const backstoryText = computed(() => vm.value?.backstoryText || '');
const resourceBoxes = computed(() => vm.value?.resourceBoxes || []);

const attributeFormulaState = ref<Record<string, boolean>>({});

const attributes = computed(() => {
  const attrObj = (pickField(sheetData.value, '属性', '属性') || {}) as Record<string, unknown>;
  const warningMap = buildAttributeWarningMap(attrObj, pickField(sheetData.value, '等级'));

  return ATTRIBUTE_KEYS.map(key => {
    const parsed = splitAttributeFormula(getAttributeRawValue(attrObj, key));
    const warningState = warningMap[key as keyof typeof warningMap];

    return {
      key,
      short: attributeLabelMap[key] || key,
      total: parsed.total,
      formula: parsed.formula,
      formulaParts: warningState?.formulaPartWarnings || [],
      isTotalAbnormal: !!warningState?.isTotalAbnormal,
      hasFormulaWarning: !!warningState?.hasFormulaWarning,
      showFormula: !!parsed.formula && !!attributeFormulaState.value[key],
    };
  });
});

function toggleAttributeFormula(key: string) {
  if (!ATTRIBUTE_KEYS.includes(key as (typeof ATTRIBUTE_KEYS)[number])) return;

  const attrObj = (pickField(sheetData.value, '属性', '属性') || {}) as Record<string, unknown>;
  const parsed = splitAttributeFormula(getAttributeRawValue(attrObj, key as (typeof ATTRIBUTE_KEYS)[number]));
  if (!parsed.formula) return;

  attributeFormulaState.value = {
    ...attributeFormulaState.value,
    [key]: !attributeFormulaState.value[key],
  };
}

const skills = computed(() => vm.value?.skills || []);
const equipments = computed(() => vm.value?.equipments || []);
const inventorySections = computed(() => vm.value?.inventorySections || []);
const statusEffects = computed(() => vm.value?.statusEffects || []);
const divinityGodTitle = computed(() => vm.value?.divinityGodTitle || '');
const divinityKingdom = computed(() => vm.value?.divinityKingdom || null);
const divinityElements = computed(() => vm.value?.divinityElements || []);
const divinityPowers = computed(() => vm.value?.divinityPowers || []);
const divinityLaws = computed(() => vm.value?.divinityLaws || []);
const visibleTabs = computed(() => vm.value?.visibleTabs || []);

watchEffect(() => {
  if (!visibleTabs.value.some(tab => tab.key === activeTab.value)) {
    activeTab.value = visibleTabs.value[0]?.key || 'profile';
  }
});

function detectIOSSafari(): boolean {
  const ua = navigator.userAgent || '';
  const isIOS = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const isSafari = /Safari/i.test(ua) && !/CriOS|FxiOS|EdgiOS|OPiOS/i.test(ua);
  return isIOS && isSafari;
}

function setupParticleEngine() {
  if (!canvasRef.value || !bgLayerRef.value || !theme.value) return;
  engine?.destroy();
  engine = createParticleEngine({
    canvas: canvasRef.value,
    host: bgLayerRef.value,
    tier: theme.value.tier,
    colorHex: theme.value.tierHex,
    isIOSSafari: detectIOSSafari(),
  });
  engine.start();
}

function initFromYaml() {
  const scriptElement = document.getElementById('data-source');
  const yamlText = scriptElement?.textContent?.trim() || '';

  originalYamlText.value = yamlText;
  sheetData.value = null;
  parseError.value = null;
  parseMode.value = 'strict';
  parseWarnings.value = [];
  theme.value = null;

  if (!yamlText) {
    parseError.value = { message: '未检测到 YAML 数据（#data-source 为空）。' };
    return;
  }

  const parsed = parseCharacterYaml(yamlText);
  if (!parsed.success) {
    parseError.value = parsed.error;
    return;
  }

  applyParsedCharacterData(parsed.data, parsed.mode ?? 'strict', parsed.warnings ?? []);

  nextTick(() => setupParticleEngine());
}

function applyParsedCharacterData(data: CharacterData, mode: 'strict' | 'loose', warnings: string[] = []) {
  sheetData.value = data;
  parseError.value = null;
  parseMode.value = mode;
  parseWarnings.value = warnings;
  theme.value = resolveTheme(data);
  applyTheme(theme.value);
}

async function tryLooseParse() {
  if (!originalYamlText.value || looseParsing.value) return;
  looseParsing.value = true;

  try {
    const parsed = parseCharacterYamlLoose(originalYamlText.value);
    if (!parsed.success) {
      parseError.value = parsed.error;
      return;
    }

    applyParsedCharacterData(parsed.data, parsed.mode ?? 'loose', parsed.warnings ?? []);
    await nextTick();
    setupParticleEngine();
  } finally {
    looseParsing.value = false;
  }
}

function toggleImportMenu() {
  showImportMenu.value = !showImportMenu.value;
}

function closeImportMenu() {
  showImportMenu.value = false;
}

function flashImportButton(temp: string, duration = 1200) {
  if (importButtonResetTimer) {
    clearTimeout(importButtonResetTimer);
    importButtonResetTimer = null;
  }
  importButtonText.value = temp;
  importButtonResetTimer = setTimeout(() => {
    importButtonText.value = defaultImportButtonText;
    importButtonResetTimer = null;
  }, duration);
}

async function onImportMvu() {
  if (!sheetData.value || importing.value) return;
  importing.value = true;
  closeImportMenu();

  try {
    const ok = window.confirm(
      `确定要将角色 "${sheetData.value.姓名 || 'Unknown'}" 导入到 MVU 变量系统(关系列表)吗？\n如果已存在同名角色，将会覆盖其数据。`,
    );
    if (!ok) return;

    if (parseMode.value === 'loose') {
      const looseOk = window.confirm('当前资料来自宽松读取，可能缺少技能、装备或嵌套结构。确认检查无误后再导入？');
      if (!looseOk) return;
    }

    importButtonText.value = '⏳';
    await importToMvuVariables(sheetData.value);
    flashImportButton('✅', 1600);
  } catch (err: any) {
    console.error('MVU Import Error:', err);
    flashImportButton('❌', 1800);
    window.alert(`导入失败: ${err?.message || String(err)}`);
  } finally {
    importing.value = false;
  }
}

async function onImportWorldbook() {
  if (!sheetData.value || importing.value) return;
  importing.value = true;
  closeImportMenu();

  try {
    if (parseMode.value === 'loose') {
      const looseOk = window.confirm('当前资料来自宽松读取，原始 YAML 可能仍有格式错误。确认仍要保存到聊天世界书？');
      if (!looseOk) return;
    }

    importButtonText.value = '⏳';
    console.info('[CharInfo Viewer] Chat worldbook import started', {
      characterName: sheetData.value.姓名 || 'Unknown',
      yamlLength: originalYamlText.value.length,
    });
    const result = await saveToChatWorldbook(sheetData.value, originalYamlText.value);
    console.info('[CharInfo Viewer] Chat worldbook import succeeded', result);
    flashImportButton('✅', 1200);
  } catch (err: any) {
    console.error('Worldbook Save Error:', err);
    flashImportButton('❌', 1800);
    window.alert(`保存失败: ${err?.message || String(err)}`);
  } finally {
    importing.value = false;
  }
}

function onDocumentClick() {
  if (showImportMenu.value) closeImportMenu();
}

function onKeydown(ev: KeyboardEvent) {
  if (ev.key === 'Escape') closeImportMenu();
}

onMounted(() => {
  initFromYaml();
  document.addEventListener('click', onDocumentClick);
  document.addEventListener('keydown', onKeydown);
});

onBeforeUnmount(() => {
  engine?.destroy();
  engine = null;
  if (importButtonResetTimer) {
    clearTimeout(importButtonResetTimer);
    importButtonResetTimer = null;
  }
  document.removeEventListener('click', onDocumentClick);
  document.removeEventListener('keydown', onKeydown);
});
</script>

<style scoped>
:root {
  --race-color: #ffffff;
  --race-color-rgb: 255, 255, 255;
  --tier-color: #808080;
  --tier-color-rgb: 128, 128, 128;
  --name-font-stack:
    'Noto Serif SC', 'Source Han Serif SC', 'Noto Sans SC', 'Microsoft YaHei', 'PingFang SC', sans-serif;
  --name-shadow: rgba(0, 0, 0, 0.58);
  --name-glow: rgba(var(--tier-color-rgb), 0.12);
  --tier-label-fg: #f3f6ff;
}

.viewer-root {
  min-height: 100vh;
  padding: 24px 12px 48px;
  color: #f0f0f0;
  font-family: 'Noto Sans SC', sans-serif;
}

.loading-card,
.error-card {
  max-width: 720px;
  margin: 0 auto;
  border-radius: 12px;
  background: rgba(0, 0, 0, 0.5);
  border: 1px solid rgba(255, 255, 255, 0.15);
  padding: 16px;
}

.error-body {
  margin-top: 10px;
  font-size: 0.9rem;
}

.yaml-error-row {
  margin-bottom: 6px;
}

.yaml-error-title {
  font-weight: 700;
  margin-bottom: 6px;
}

.yaml-error-pre {
  margin: 0;
  padding: 10px;
  border-radius: 6px;
  background: rgba(0, 0, 0, 0.35);
  border: 1px solid rgba(255, 255, 255, 0.12);
  white-space: pre;
  overflow: auto;
}

.yaml-error-pre.alt {
  margin-top: 8px;
  background: rgba(0, 0, 0, 0.25);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.yaml-error-details {
  margin-top: 10px;
}

.yaml-error-details summary {
  cursor: pointer;
  user-select: none;
}

.yaml-rescue-box,
.parse-warning-card {
  margin: 12px 0;
  padding: 12px 14px;
  border-radius: 10px;
  border: 1px solid rgba(246, 217, 130, 0.36);
  background:
    radial-gradient(ellipse at 0 0, rgba(246, 217, 130, 0.14), transparent 58%),
    rgba(15, 22, 36, 0.76);
  color: rgba(255, 252, 242, 0.92);
}

.yaml-rescue-box p {
  margin: 8px 0 0;
  color: rgba(255, 252, 242, 0.72);
  line-height: 1.55;
}

.yaml-rescue-button {
  min-height: 34px;
  padding: 0 14px;
  border: 1px solid rgba(246, 217, 130, 0.62);
  border-radius: 8px;
  background: linear-gradient(180deg, rgba(246, 217, 130, 0.16), rgba(246, 217, 130, 0.06));
  color: #ffe79c;
  cursor: pointer;
  font-weight: 800;
}

.yaml-rescue-button:disabled {
  opacity: 0.62;
  cursor: wait;
}

.parse-warning-card {
  max-width: 920px;
  margin: 0 auto 14px;
  font-size: 13px;
  font-weight: 700;
}

.card-wrapper {
  --card-shell-radius: 16px;
  --edge-glow-expand: 10px;
  --edge-glow-radius-offset: 8px;
  --edge-glow-blur: 8px;
  --edge-glow-ring-alpha: 0.2;
  --edge-glow-outer-alpha: 0.22;
  --edge-glow-top-alpha: 0.34;
  position: relative;
  width: 100%;
  max-width: 750px;
  margin: 0 auto;
  border-radius: var(--card-shell-radius);
  overflow: visible;
  z-index: 1;
}

.card-wrapper::before {
  content: '';
  position: absolute;
  inset: calc(var(--edge-glow-expand) * -1);
  border-radius: calc(var(--card-shell-radius) + var(--edge-glow-radius-offset));
  pointer-events: none;
  z-index: -1;
  background:
    radial-gradient(
      120% 75% at 50% -5%,
      rgba(var(--tier-color-rgb), var(--edge-glow-top-alpha)) 0%,
      rgba(var(--tier-color-rgb), 0.14) 38%,
      transparent 74%
    ),
    linear-gradient(
      180deg,
      rgba(var(--tier-color-rgb), var(--edge-glow-outer-alpha)) 0%,
      rgba(var(--tier-color-rgb), 0.06) 30%,
      transparent 62%
    );
  box-shadow:
    0 0 0 1px rgba(var(--tier-color-rgb), var(--edge-glow-ring-alpha)),
    0 0 24px rgba(var(--tier-color-rgb), var(--edge-glow-outer-alpha));
  filter: blur(var(--edge-glow-blur));
  opacity: 1;
}

.frame-layer {
  position: absolute;
  top: -25px;
  left: -5px;
  width: calc(100% + 10px);
  height: calc(100% + 50px);
  z-index: 4;
  pointer-events: none;
  display: none;
  flex-direction: column;
}

.frame-layer.show {
  display: flex;
}

.frame-svg {
  width: 100%;
  fill: none;
  stroke: var(--tier-color);
  stroke-width: 2;
  vector-effect: non-scaling-stroke;
  filter: drop-shadow(0 0 2px rgba(0, 0, 0, 0.8)) drop-shadow(0 0 5px rgba(var(--tier-color-rgb), 0.8));
}

.frame-top {
  width: 100%;
  height: 100px;
  flex-shrink: 0;
}

.frame-body {
  width: 100%;
  flex-grow: 1;
}

.card-background-layer {
  position: absolute;
  inset: 0;
  z-index: 0;
  border-radius: inherit;
  overflow: hidden;
  background: linear-gradient(
    180deg,
    rgba(16, 21, 32, 0.9) 0%,
    rgba(13, 18, 29, 0.92) 56%,
    rgba(10, 14, 23, 0.94) 100%
  );
  border: 1px solid rgba(var(--tier-color-rgb), 0.72);
  border-top: 2px solid rgba(var(--tier-color-rgb), 1);
  box-shadow:
    0 14px 36px rgba(0, 0, 0, 0.78),
    0 0 28px rgba(var(--tier-color-rgb), 0.24),
    0 -2px 30px rgba(var(--tier-color-rgb), 0.42),
    inset 0 0 30px rgba(0, 0, 0, 0.34),
    inset 0 1px 0 rgba(var(--tier-color-rgb), 0.75);
  backdrop-filter: blur(2px) saturate(136%);
  -webkit-backdrop-filter: blur(2px) saturate(136%);
}

.card-background-layer::before,
.card-background-layer::after {
  content: '';
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.card-background-layer::before {
  z-index: 1;
  mix-blend-mode: screen;
  background-image:
    radial-gradient(
      140% 95% at 50% -8%,
      rgba(var(--tier-color-rgb), 0.66) 0%,
      rgba(var(--tier-color-rgb), 0.3) 32%,
      rgba(var(--tier-color-rgb), 0.08) 58%,
      transparent 78%
    ),
    linear-gradient(
      180deg,
      rgba(var(--tier-color-rgb), 0.48) 0%,
      rgba(var(--tier-color-rgb), 0.16) 26%,
      transparent 56%
    );
}

.card-background-layer::after {
  z-index: 1;
  opacity: 0.92;
  background-image:
    radial-gradient(circle at 50% 82%, rgba(var(--race-color-rgb), 0.26) 0%, transparent 74%),
    radial-gradient(circle at 50% 48%, transparent 58%, rgba(0, 0, 0, 0.33) 100%);
}

#particle-canvas {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  z-index: 2;
  pointer-events: none;
  mix-blend-mode: normal;
  opacity: 0.78;
}

.card-wrapper.high-tier .card-background-layer {
  border: 1px solid rgba(var(--tier-color-rgb), 0.95);
  border-top: 3px solid rgba(var(--tier-color-rgb), 1);
}

.sheet-content-wrapper {
  position: relative;
  z-index: 3;
}

.sheet-header {
  padding: 50px 20px 25px;
  text-align: center;
  position: relative;
  margin-bottom: 10px;
  border-bottom: 1px solid rgba(var(--tier-color-rgb), 0.2);
  background: radial-gradient(ellipse at 50% 0%, rgba(var(--tier-color-rgb), 0.15) 0%, transparent 80%);
}

.sheet-header::after {
  content: '';
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: -1;
  background-image:
    linear-gradient(90deg, transparent 95%, rgba(var(--tier-color-rgb), 0.1) 95%),
    linear-gradient(0deg, transparent 95%, rgba(var(--tier-color-rgb), 0.1) 95%);
  background-size: 40px 40px;
  mask-image: linear-gradient(to bottom, rgba(148, 148, 148, 0.72) 0%, transparent 100%);
  -webkit-mask-image: linear-gradient(to bottom, rgba(148, 148, 148, 0.72) 0%, transparent 100%);
}

.level-badge {
  display: inline-block;
  padding: 4px 16px;
  border-radius: 50px;
  border: 1px solid var(--tier-color);
  color: var(--tier-color);
  font-weight: 700;
  margin-bottom: 15px;
  background: rgba(0, 0, 0, 0.7);
  box-shadow: 0 0 15px rgba(var(--tier-color-rgb), 0.2);
  text-shadow: 0 0 8px rgba(var(--tier-color-rgb), 0.6);
}

.char-name {
  margin: 0 0 10px;
  font-size: 3rem;
  color: #ffffff;
  font-family: var(--name-font-stack);
  font-weight: 700;
  letter-spacing: 0.25px;
  line-height: 1.08;
  text-shadow:
    0 1px 2px var(--name-shadow),
    0 0 4px var(--name-glow);
}

.char-meta-row {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  justify-content: center;
  align-items: center;
  font-size: 0.95rem;
}

.meta-separator {
  color: rgba(242, 247, 255, 0.78);
  text-shadow:
    0 1px 2px rgba(0, 0, 0, 0.86),
    0 0 3px rgba(var(--tier-color-rgb), 0.22);
}

.tier-name {
  display: inline-flex;
  align-items: center;
  padding: 1px 11px;
  border-radius: 999px;
  border: 1px solid rgba(var(--tier-color-rgb), 0.9);
  color: var(--tier-label-fg);
  background: linear-gradient(180deg, rgba(8, 10, 16, 0.84) 0%, rgba(10, 12, 18, 0.68) 100%);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.18),
    0 0 0 1px rgba(0, 0, 0, 0.52),
    0 0 10px rgba(var(--tier-color-rgb), 0.34);
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.9);
  font-weight: 700;
  letter-spacing: 0.12px;
  line-height: 1.2;
}

.sheet-body {
  padding: 20px 30px 90px;
}

.card-wrapper.portrait-mode {
  max-width: 1120px;
}

.portrait-mode .sheet-body {
  padding: 24px 24px 88px;
}

.portrait-body {
  display: grid;
  grid-template-columns: minmax(320px, 1.08fr) 112px minmax(300px, 0.92fr);
  gap: 14px;
  align-items: start;
}

.portrait-main-panel {
  min-width: 0;
}

.portrait-image-shell {
  position: relative;
  width: 100%;
  aspect-ratio: 4 / 5;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid rgba(var(--tier-color-rgb), 0.5);
  background: rgba(0, 0, 0, 0.28);
  box-shadow:
    0 12px 28px rgba(0, 0, 0, 0.46),
    0 0 22px rgba(var(--tier-color-rgb), 0.16);
}

.portrait-image {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.portrait-info-panel {
  margin-top: 10px;
  padding: 14px;
  border-radius: 8px;
  border: 1px solid rgba(78, 255, 151, 0.55);
  background:
    linear-gradient(180deg, rgba(6, 45, 34, 0.88) 0%, rgba(5, 31, 32, 0.82) 100%),
    rgba(4, 30, 28, 0.9);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.08),
    0 0 18px rgba(44, 205, 128, 0.18);
}

.portrait-level-badge {
  margin-bottom: 8px;
}

.portrait-name {
  margin-bottom: 8px;
  font-size: 2.2rem;
}

.portrait-meta-row {
  justify-content: flex-start;
  font-size: 0.86rem;
}

.portrait-compact-stats,
.portrait-compact-resources {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 10px;
  font-size: 0.86rem;
  color: rgba(245, 255, 250, 0.92);
}

.portrait-compact-stats span,
.portrait-compact-resources span {
  display: inline-flex;
  align-items: center;
  min-height: 24px;
  padding: 3px 8px;
  border-radius: 999px;
  border: 1px solid rgba(134, 255, 185, 0.2);
  background: rgba(0, 0, 0, 0.18);
}

.portrait-tab-nav {
  display: flex;
  flex-direction: column;
  gap: 8px;
  position: sticky;
  top: 12px;
  min-width: 0;
}

.portrait-tab-nav .tab-button {
  flex: 0 0 auto;
  width: 100%;
  min-height: 42px;
  padding: 10px 8px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 6px;
  background: rgba(0, 0, 0, 0.22);
  color: #a8a8a8;
}

.portrait-tab-nav .tab-button.active {
  color: var(--race-color);
  border-color: rgba(var(--race-color-rgb), 0.62);
  background: rgba(var(--race-color-rgb), 0.12);
  font-weight: 700;
}

.portrait-body > .tab-content {
  min-width: 0;
  margin: 0;
}

.attributes-grid {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 10px;
  margin-bottom: 18px;
  --flag-width: 96px;
  --flag-min-height: 118px;
  --flag-top-padding: 15px;
  --flag-bottom-padding: 30px;
  --flag-name-size: clamp(1rem, calc(var(--flag-width) * 0.2), 1.08rem);
  --flag-total-size: clamp(2rem, calc(var(--flag-width) * 0.4), 2.45rem);
  --flag-formula-size: clamp(0.76rem, calc(var(--flag-width) * 0.115), 0.86rem);
  --flag-total-offset: 0px;
}

.resource-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
  margin: 0 0 22px;
}

.resource-item {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 10px 8px 12px;
  border-radius: 10px;
  border: 1px solid rgba(var(--race-color-rgb), 0.18);
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.03) 100%);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.08),
    0 0 18px rgba(var(--tier-color-rgb), 0.1);
  overflow: hidden;
}

.resource-item::before {
  content: '';
  position: absolute;
  inset: 0;
  pointer-events: none;
  background: linear-gradient(180deg, rgba(var(--tier-color-rgb), 0.12) 0%, transparent 100%);
}

.resource-name,
.resource-value {
  position: relative;
  z-index: 1;
}

.resource-name {
  font-size: 0.8rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  color: rgba(255, 255, 255, 0.82);
}

.resource-value {
  font-family: 'Cinzel', 'Times New Roman', serif;
  font-size: 1.25rem;
  line-height: 1;
  font-weight: 700;
  color: #ffffff;
  text-shadow: 0 0 12px rgba(var(--race-color-rgb), 0.25);
}

.attribute-item {
  flex: 0 0 var(--flag-width);
  width: var(--flag-width);
  min-width: var(--flag-width);
  max-width: var(--flag-width);
  min-height: var(--flag-min-height);
  box-sizing: border-box;
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-top: 2px solid var(--race-color);
  clip-path: polygon(0% 0%, 100% 0%, 100% 85%, 50% 100%, 0% 85%);
  padding: var(--flag-top-padding) 5px var(--flag-bottom-padding);
  text-align: center;
  cursor: default;
  transition:
    transform 0.2s,
    background 0.2s,
    border-color 0.2s,
    box-shadow 0.2s;
}

.attribute-item.has-formula {
  cursor: pointer;
}

.attribute-item.has-warning {
  border-top-color: #ff7875;
  box-shadow: 0 0 0 1px rgba(255, 120, 117, 0.16);
}

.attribute-item:hover {
  transform: translateY(-3px);
  background: rgba(var(--race-color-rgb), 0.1);
  box-shadow: 0 5px 20px rgba(var(--race-color-rgb), 0.15);
  border-color: rgba(var(--race-color-rgb), 0.4);
}

.attribute-name {
  display: block;
  font-size: var(--flag-name-size);
  color: #fff;
  margin-bottom: 6px;
  font-weight: 700;
  line-height: 1.05;
  opacity: 0.96;
}

.attribute-total {
  display: block;
  margin-top: var(--flag-total-offset, 0px);
  font-family: 'Cinzel', 'Times New Roman', serif;
  font-size: var(--flag-total-size);
  line-height: 1;
  font-weight: 700;
  text-shadow: 0 2px 15px rgba(var(--race-color-rgb), 0.45);
}

.attribute-total.is-warning {
  color: #ff9b9b;
  text-shadow: 0 0 10px rgba(255, 77, 77, 0.42);
}

.attribute-formula {
  display: none;
  margin-top: 6px;
  font-size: var(--flag-formula-size);
  color: var(--race-color);
  font-weight: 700;
  line-height: 1.2;
  flex-wrap: wrap;
  justify-content: center;
  gap: 2px;
}

.formula-part {
  display: inline-block;
}

.formula-part-separator {
  display: inline-block;
  opacity: 0.85;
}

.formula-part-warning {
  color: #ff4d4d;
  text-shadow: 0 0 8px rgba(255, 77, 77, 0.35);
}

.attribute-item.show-formula .attribute-total {
  display: none;
}

.attribute-item.show-formula .attribute-formula {
  display: inline-flex;
}

.tab-nav {
  display: flex;
  border-bottom: 1px solid rgba(255, 255, 255, 0.12);
  margin-bottom: 14px;
  overflow-x: auto;
  scrollbar-width: none;
}

.tab-nav::-webkit-scrollbar {
  display: none;
}

.tab-button {
  flex: 1;
  background: transparent;
  border: none;
  color: #9a9a9a;
  padding: 12px 16px;
  cursor: pointer;
  white-space: nowrap;
  transition:
    color 0.2s ease,
    border-color 0.2s ease;
}

.tab-button.active {
  color: var(--race-color);
  border-bottom: 2px solid var(--race-color);
  font-weight: 700;
}

.tab-content {
  display: block;
}

.profile-grid {
  display: grid;
  gap: 8px;
}

.profile-row {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
  align-items: stretch;
}

.profile-cell {
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.profile-panel {
  height: 100%;
  box-sizing: border-box;
}

.subsection-title {
  font-size: 1.08rem;
  margin: 0 0 8px;
  padding-left: 8px;
  border-left: 3px solid var(--race-color);
  color: var(--race-color);
}

.divinity-main-title {
  text-align: center;
  border-left: none;
  color: var(--tier-color);
}

.story {
  white-space: pre-line;
  line-height: 1.58;
  margin-bottom: 12px;
  background: rgba(0, 0, 0, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 6px;
  padding: 12px;
}

.tags-box {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 12px;
  background: rgba(0, 0, 0, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 6px;
  padding: 10px;
}

.card {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-left: 3px solid var(--race-color);
  padding: 12px;
  margin-bottom: 12px;
  border-radius: 6px;
}

.divinity-card {
  border-left-color: var(--tier-color);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 10px;
  margin-bottom: 8px;
  padding-bottom: 5px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.card-title {
  margin: 0;
  font-size: 1.05rem;
  color: #fff;
  font-weight: 700;
}

.card-subtitle {
  font-size: 0.85rem;
  color: #bbb;
}

.card-title.quality-common,
.card-subtitle.quality-common {
  color: #c4cad3;
}

.card-title.quality-uncommon,
.card-subtitle.quality-uncommon {
  color: #7be495;
  text-shadow: 0 0 10px rgba(123, 228, 149, 0.28);
}

.card-title.quality-rare,
.card-subtitle.quality-rare {
  color: #62bbff;
  text-shadow: 0 0 10px rgba(98, 187, 255, 0.3);
}

.card-title.quality-epic,
.card-subtitle.quality-epic {
  color: #cf95ff;
  text-shadow: 0 0 10px rgba(207, 149, 255, 0.3);
}

.card-title.quality-legendary,
.card-subtitle.quality-legendary {
  color: #ffc46b;
  text-shadow: 0 0 10px rgba(255, 196, 107, 0.3);
}

.card-title.quality-mythic,
.card-subtitle.quality-mythic {
  color: #ff78c5;
  text-shadow: 0 0 10px rgba(255, 120, 197, 0.3);
}

.card-body p {
  margin: 5px 0;
  white-space: pre-line;
  line-height: 1.5;
}

.card-label {
  color: var(--race-color);
  font-weight: 700;
  margin-right: 4px;
}

.effect-list {
  margin: 4px 0 8px;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.effect-item {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  gap: 6px;
  padding: 6px 8px;
  border-radius: 6px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(255, 255, 255, 0.04);
}

.effect-name {
  display: inline-flex;
  align-items: center;
  border-radius: 999px;
  border: 1px solid rgba(var(--race-color-rgb), 0.5);
  background: rgba(var(--race-color-rgb), 0.12);
  color: var(--race-color);
  font-weight: 700;
  font-size: 0.78rem;
  line-height: 1;
  padding: 3px 8px;
}

.effect-text {
  flex: 1;
  min-width: 0;
  white-space: pre-line;
  line-height: 1.45;
}

.card-description {
  margin-top: 8px;
  border-top: 1px solid rgba(255, 255, 255, 0.12);
  padding-top: 8px;
  opacity: 0.9;
}

.card-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 8px;
}

.card-tag {
  display: inline-block;
  border-radius: 999px;
  padding: 4px 10px;
  font-size: 0.82rem;
  border: 1px solid rgba(255, 255, 255, 0.15);
  background: rgba(255, 255, 255, 0.05);
}

#import-action-btn {
  position: absolute;
  bottom: 15px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(30, 30, 30, 0.82);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: #fff;
  padding: 8px 12px;
  border-radius: 6px;
  cursor: pointer;
  z-index: 60;
  font-size: 1.2rem;
  transition: all 0.2s;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.5);
}

#import-action-btn:disabled {
  opacity: 0.7;
  cursor: wait;
}

#import-action-btn:hover:not(:disabled) {
  background: rgba(60, 60, 60, 0.92);
  box-shadow: 0 0 15px rgba(255, 255, 255, 0.2);
  border-color: #fff;
}

#import-action-menu {
  position: absolute;
  bottom: 55px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(20, 20, 20, 0.92);
  border: 1px solid rgba(255, 255, 255, 0.18);
  border-radius: 10px;
  padding: 6px;
  z-index: 70;
  min-width: 190px;
  box-shadow: 0 12px 30px rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  display: none;
}

#import-action-menu.show {
  display: block;
}

#import-action-menu button {
  width: 100%;
  background: transparent;
  border: 1px solid transparent;
  color: #eee;
  padding: 10px 10px;
  border-radius: 8px;
  cursor: pointer;
  text-align: left;
  font-size: 0.95rem;
}

#import-action-menu button:disabled {
  opacity: 0.6;
  cursor: wait;
}

#import-action-menu button:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.08);
  border-color: rgba(255, 255, 255, 0.12);
}

@media (min-width: 900px) {
  .attributes-grid {
    justify-content: center;
    gap: 12px;
    --flag-width: min(140px, calc((100% - 48px) / 5));
    --flag-min-height: calc(var(--flag-width) * 1.07);
    --flag-top-padding: clamp(16px, calc(var(--flag-width) * 0.14), 20px);
    --flag-bottom-padding: clamp(30px, calc(var(--flag-width) * 0.27), 38px);
    --flag-total-offset: clamp(2px, calc(var(--flag-width) * 0.07), 10px);
  }
}

@media (max-width: 820px) {
  .viewer-root {
    padding: 18px 10px 36px;
  }

  .card-wrapper {
    --edge-glow-expand: 0px;
    --edge-glow-radius-offset: 0px;
    --edge-glow-blur: 0px;
    --edge-glow-ring-alpha: 0;
    --edge-glow-outer-alpha: 0;
    --edge-glow-top-alpha: 0;
  }

  .card-wrapper::before {
    content: none;
  }

  .sheet-body {
    padding: 16px 18px 84px;
  }

  .portrait-mode .sheet-body {
    padding: 16px 14px 82px;
  }

  .portrait-body {
    grid-template-columns: 1fr;
    gap: 12px;
  }

  .portrait-body.is-detail-tab .portrait-main-panel {
    display: none;
  }

  .portrait-tab-nav {
    position: static;
    flex-direction: row;
    overflow-x: auto;
    scrollbar-width: none;
  }

  .portrait-tab-nav::-webkit-scrollbar {
    display: none;
  }

  .portrait-tab-nav .tab-button {
    width: auto;
    min-width: 82px;
  }

  .sheet-header {
    padding: 40px 16px 20px;
  }

  .char-name {
    font-size: 2.2rem;
    letter-spacing: 0.2px;
    text-shadow:
      0 1px 2px var(--name-shadow),
      0 0 3px rgba(var(--tier-color-rgb), 0.12);
  }

  .tab-button {
    flex: 0 0 auto;
    min-width: 82px;
    padding: 10px 12px;
  }
}

@media (max-width: 640px) {
  .card-wrapper {
    max-width: min(100%, 720px);
    --card-shell-radius: 16px;
    --edge-glow-expand: 0px;
    --edge-glow-radius-offset: 0px;
    --edge-glow-blur: 0px;
    --edge-glow-ring-alpha: 0;
    --edge-glow-outer-alpha: 0;
    --edge-glow-top-alpha: 0;
  }

  .card-wrapper::before {
    content: none;
  }

  .sheet-header {
    padding: 34px 12px 16px;
    margin-bottom: 6px;
  }

  .level-badge {
    margin-bottom: 10px;
    padding: 3px 12px;
    font-size: 0.9rem;
  }

  .char-name {
    font-size: 1.8rem;
    margin-bottom: 8px;
    letter-spacing: 0.1px;
    text-shadow:
      0 1px 2px var(--name-shadow),
      0 0 2px rgba(var(--tier-color-rgb), 0.1);
  }

  .char-meta-row {
    gap: 6px;
    font-size: 0.82rem;
  }

  .tier-name {
    padding: 1px 8px;
    border-width: 1px;
    box-shadow:
      inset 0 1px 0 rgba(255, 255, 255, 0.05),
      0 0 5px rgba(var(--tier-color-rgb), 0.16);
  }

  .sheet-body {
    padding: 12px 10px 80px;
  }

  .portrait-mode .sheet-body {
    padding: 10px 10px 78px;
  }

  .portrait-name {
    font-size: 1.65rem;
  }

  .portrait-info-panel {
    padding: 12px;
  }

  .attributes-grid {
    gap: 8px 10px;
    margin-bottom: 16px;
    --flag-width: calc((100% - 20px) / 3);
    --flag-min-height: calc(var(--flag-width) * 1.18);
    --flag-top-padding: 12px;
    --flag-bottom-padding: 26px;
    --flag-name-size: clamp(0.98rem, calc(var(--flag-width) * 0.16), 1.08rem);
    --flag-total-size: clamp(2.05rem, calc(var(--flag-width) * 0.34), 2.45rem);
    --flag-formula-size: clamp(0.72rem, calc(var(--flag-width) * 0.105), 0.82rem);
  }

  .attribute-item {
    flex: 0 0 var(--flag-width);
    width: var(--flag-width);
    max-width: var(--flag-width);
    min-width: 0;
    min-height: var(--flag-min-height);
    padding: var(--flag-top-padding) 5px var(--flag-bottom-padding);
  }

  .profile-row {
    grid-template-columns: 1fr;
    gap: 0;
  }

  .subsection-title {
    font-size: 1rem;
  }

  .story,
  .card,
  .tags-box {
    padding: 10px;
  }

  #import-action-btn {
    bottom: 10px;
    font-size: 1.05rem;
    padding: 7px 10px;
  }

  #import-action-menu {
    bottom: 46px;
    min-width: 170px;
  }

  #import-action-menu button {
    padding: 8px;
    font-size: 0.9rem;
  }
}
</style>
