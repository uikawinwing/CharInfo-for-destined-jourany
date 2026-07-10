<template>
  <div class="special-npc-wrapper" :class="themeClass" :style="themeStyle">
    <main
      class="special-npc-shell"
      :class="{ 'is-overview-tab': isOverviewTab, 'is-detail-tab': !isOverviewTab, 'is-divinity-tab': isDivinityTab }"
    >
      <aside class="special-npc-portrait-pane">
        <img class="special-npc-portrait-image" :src="vm.imageUrl" :alt="vm.nameText" />
        <div v-if="isVenusTheme" class="special-npc-portrait-deco" aria-hidden="true">
          <span class="special-npc-portrait-deco-corner top-left"></span>
          <span class="special-npc-portrait-deco-corner top-right"></span>
          <span class="special-npc-portrait-deco-corner bottom-left"></span>
          <span class="special-npc-portrait-deco-corner bottom-right"></span>
        </div>
        <div v-if="isOverviewTab" class="special-npc-mobile-header-overlay">
          <SpecialNpcHeader :vm="vm" :ornate="isVenusTheme" compact />
        </div>
      </aside>

      <section class="special-npc-data-pane">
        <SpecialNpcHeader v-if="isOverviewTab" class="special-npc-desktop-header" :vm="vm" :ornate="isVenusTheme" />

        <div class="special-npc-panels">
          <SpecialNpcPageTitle v-if="!isOverviewTab" :title="activeSpecialTabTitle" />

          <SpecialNpcOverviewPanel
            v-if="activeSpecialTab === 'overview'"
            :attributes="attributes"
            :resource-boxes="vm.resourceBoxes"
            @toggle-attribute-formula="$emit('toggleAttributeFormula', $event)"
          />

          <SpecialNpcProfilePanel
            v-else-if="activeSpecialTab === 'profile'"
            :vm="vm"
            :attributes="attributes"
            :resource-boxes="vm.resourceBoxes"
            @toggle-attribute-formula="$emit('toggleAttributeFormula', $event)"
          />

          <template v-else-if="activeSpecialTab === 'skills'">
            <SpecialNpcItemCard v-for="(item, index) in vm.skills" :key="`skill-${index}`" :item="item" show-cost />
          </template>

          <template v-else-if="activeSpecialTab === 'equipment'">
            <SpecialNpcItemCard v-for="(item, index) in vm.equipments" :key="`equipment-${index}`" :item="item" />
          </template>

          <template v-else-if="activeSpecialTab === 'inventory'">
            <section v-for="section in vm.inventorySections" :key="section.key" class="special-npc-section">
              <h3 class="special-npc-section-title">{{ section.title }}</h3>
              <SpecialNpcItemCard
                v-for="(item, index) in section.items"
                :key="`${section.key}-${index}`"
                :item="item"
              />
            </section>
          </template>

          <SpecialNpcDivinityPanel v-else-if="activeSpecialTab === 'divinity'" :vm="vm" :profile="vm.specialNpcProfile" />

          <template v-else-if="activeSpecialTab === 'statusEffects'">
            <SpecialNpcItemCard
              v-for="(item, index) in vm.statusEffects"
              :key="`status-${index}`"
              :item="item"
              variant="status"
            />
          </template>

          <article v-else-if="activeSpecialTab === 'characterStory'" class="special-npc-story-combined-block">
            <section v-if="vm.backstoryText" class="special-npc-story-block">
              <h3>背景故事</h3>
              <p>{{ vm.backstoryText }}</p>
            </section>

            <section v-if="vm.storyBookLink" class="special-npc-story-link-block">
              <div class="special-npc-story-link-copy">
                <span v-if="vm.storyBookLink.festivalName" class="special-npc-story-kicker">
                  {{ vm.storyBookLink.festivalName }}
                </span>
                <h3>《{{ vm.storyBookLink.title }}》</h3>
                <p>打开月历悬浮球里的节庆故事读本，阅读与她相关的角色故事。</p>
              </div>
              <button class="special-npc-story-link-button" type="button" @click="openCharacterStory">
                前往读本
              </button>
            </section>
          </article>

          <article v-else class="special-npc-story-block">
            <p>{{ vm.backstoryText || '暂无故事' }}</p>
          </article>
        </div>

        <SpecialNpcTabNav
          :tabs="tabs"
          :active-tab="activeSpecialTab"
          :importing="importing"
          :import-button-text="importButtonText"
          @set-tab="activeSpecialTab = $event"
          @toggle-import-menu="$emit('toggleImportMenu')"
        />
      </section>

      <div id="import-action-menu" :class="{ show: showImportMenu }">
        <button type="button" :disabled="importing" @click="$emit('importMvu')">导入到 MVU 变量</button>
        <button type="button" :disabled="importing" @click="$emit('importWorldbook')">导入到 聊天世界书</button>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watchEffect } from 'vue';

import type { CharacterViewModel } from '../../services/characterViewModel';
import type { AttributeView, SpecialNpcTab, SpecialNpcTabKey } from './types';
import SpecialNpcDivinityPanel from './SpecialNpcDivinityPanel.vue';
import SpecialNpcHeader from './SpecialNpcHeader.vue';
import SpecialNpcItemCard from './SpecialNpcItemCard.vue';
import SpecialNpcOverviewPanel from './SpecialNpcOverviewPanel.vue';
import SpecialNpcPageTitle from './SpecialNpcPageTitle.vue';
import SpecialNpcProfilePanel from './SpecialNpcProfilePanel.vue';
import SpecialNpcTabNav from './SpecialNpcTabNav.vue';
import { venusPortraitCssVars } from './venusAssets';

const props = defineProps<{
  vm: CharacterViewModel;
  attributes: AttributeView[];
  importing: boolean;
  importButtonText: string;
  showImportMenu: boolean;
}>();

defineEmits<{
  toggleAttributeFormula: [key: string];
  toggleImportMenu: [];
  importMvu: [];
  importWorldbook: [];
}>();

const activeSpecialTab = ref<SpecialNpcTabKey>('overview');
const tabs = computed<SpecialNpcTab[]>(() => {
  const mergedTabs: SpecialNpcTab[] = [{ key: 'overview', label: '首页' }];
  let hasStoryTab = false;

  props.vm.visibleTabs.forEach(tab => {
    if (tab.key === 'characterStory' || tab.key === 'backstory') {
      if (!hasStoryTab) {
        mergedTabs.push({ key: 'characterStory', label: '角色故事' });
        hasStoryTab = true;
      }
      return;
    }

    mergedTabs.push(tab);
  });

  return mergedTabs;
});
const isOverviewTab = computed(() => activeSpecialTab.value === 'overview');
const isDivinityTab = computed(() => activeSpecialTab.value === 'divinity');
const activeSpecialTabTitle = computed(() => tabs.value.find(tab => tab.key === activeSpecialTab.value)?.label ?? '');
const isVenusTheme = computed(() => props.vm.specialNpcProfile?.visualTheme === 'venus');
const themeClass = computed(() => ({
  'special-npc-theme-venus': isVenusTheme.value,
}));
const themeStyle = computed(() => (isVenusTheme.value ? venusPortraitCssVars : undefined));

type CalendarFloatWidgetApi = {
  open?: () => void;
  openBook?: (bookId: string) => boolean | void;
};

type CalendarWidgetWindow = Window &
  typeof globalThis & {
    CalendarFloatWidget?: CalendarFloatWidgetApi;
  };

function getCalendarFloatWidget(): CalendarFloatWidgetApi | null {
  const candidates = [window.parent, window].filter((candidate, index, list) => candidate && list.indexOf(candidate) === index);
  for (const candidate of candidates) {
    try {
      const widget = (candidate as CalendarWidgetWindow).CalendarFloatWidget;
      if (widget) return widget;
    } catch (_) {
      // parent window may be inaccessible in some host contexts.
    }
  }
  return null;
}

function showCharacterStoryWarning(message: string): void {
  if (typeof toastr !== 'undefined') {
    toastr.warning(message);
    return;
  }
  console.warn(message);
}

function openCharacterStory(): void {
  const storyBookLink = props.vm.storyBookLink;
  if (!storyBookLink) return;

  const widget = getCalendarFloatWidget();
  if (!widget) {
    showCharacterStoryWarning('未检测到月历悬浮球，请先启用 calendar_float 脚本。');
    return;
  }

  if (typeof widget.openBook === 'function') {
    const opened = widget.openBook(storyBookLink.bookId);
    if (opened === false) {
      showCharacterStoryWarning(`月历悬浮球未找到《${storyBookLink.title}》，请确认读本已加载。`);
    }
    return;
  }

  widget.open?.();
  showCharacterStoryWarning('月历悬浮球版本未提供读本跳转接口，请更新 calendar_float。');
}

watchEffect(() => {
  if (!tabs.value.some(tab => tab.key === activeSpecialTab.value)) {
    activeSpecialTab.value = 'overview';
  }
});
</script>

<style scoped>
.special-npc-wrapper {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  color: #f8f9fa;
  font-family: 'Noto Sans SC', 'Microsoft YaHei', 'PingFang SC', sans-serif;
  --special-npc-bg: #14161e;
  --special-npc-panel: rgba(20, 22, 30, 0.78);
  --special-npc-race-accent: var(--race-color, #d4af37);
  --special-npc-race-accent-rgb: var(--race-color-rgb, 212, 175, 55);
  --special-npc-tier-accent: var(--tier-color, #d4af37);
  --special-npc-tier-accent-rgb: var(--tier-color-rgb, 212, 175, 55);
}

.special-npc-wrapper.special-npc-theme-venus {
  --special-npc-bg: #061731;
  --special-npc-panel: rgba(7, 21, 45, 0.72);
  --special-npc-race-accent: #70e5bd;
  --special-npc-race-accent-rgb: 112, 229, 189;
  --special-npc-tier-accent: #f6d982;
  --special-npc-tier-accent-rgb: 246, 217, 130;
  --special-npc-soft-accent: #b9d7e8;
  --special-npc-soft-accent-rgb: 185, 215, 232;
  --special-npc-shell-deep: #051226;
}

.special-npc-shell {
  position: relative;
  display: flex;
  min-height: 680px;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 16px;
  background: var(--special-npc-bg);
  box-shadow:
    0 0 0 1px rgba(var(--special-npc-tier-accent-rgb), 0.35),
    0 0 26px rgba(var(--special-npc-tier-accent-rgb), 0.32),
    0 0 54px rgba(var(--special-npc-tier-accent-rgb), 0.18),
    0 24px 64px rgba(0, 0, 0, 0.4),
    inset 0 1px 0 rgba(255, 255, 255, 0.05);
}

.special-npc-theme-venus .special-npc-shell {
  border: 1px solid transparent;
  background:
    radial-gradient(circle at 52% -10%, rgba(var(--special-npc-tier-accent-rgb), 0.32), transparent 30rem),
    radial-gradient(circle at 78% 22%, rgba(86, 171, 220, 0.16), transparent 30rem),
    radial-gradient(circle at 86% 46%, rgba(var(--special-npc-race-accent-rgb), 0.055), transparent 17rem),
    linear-gradient(180deg, rgba(246, 217, 130, 0.18) 0%, rgba(19, 55, 98, 0.78) 34%, rgba(5, 18, 43, 0.97) 100%),
    var(--special-npc-shell-deep);
  box-shadow:
    0 0 28px rgba(86, 171, 220, 0.14),
    0 0 64px rgba(var(--special-npc-tier-accent-rgb), 0.16),
    0 24px 64px rgba(0, 0, 0, 0.38),
    inset 0 1px 0 rgba(255, 255, 255, 0.08);
}

.special-npc-theme-venus .special-npc-shell::before {
  content: '';
  position: absolute;
  inset: 0;
  z-index: 6;
  padding: 2px;
  border-radius: inherit;
  background:
    linear-gradient(180deg, rgba(255, 238, 172, 0.98) 0%, rgba(86, 171, 220, 0.64) 48%, rgba(22, 75, 143, 0.86) 100%),
    linear-gradient(90deg, rgba(var(--special-npc-race-accent-rgb), 0.16), rgba(255, 252, 235, 0.58), rgba(var(--special-npc-race-accent-rgb), 0.16));
  filter:
    drop-shadow(0 0 7px rgba(var(--special-npc-tier-accent-rgb), 0.18))
    drop-shadow(0 0 12px rgba(86, 171, 220, 0.1));
  pointer-events: none;
  -webkit-mask:
    linear-gradient(#000 0 0) content-box,
    linear-gradient(#000 0 0);
  -webkit-mask-composite: xor;
  mask:
    linear-gradient(#000 0 0) content-box,
    linear-gradient(#000 0 0);
  mask-composite: exclude;
}

.special-npc-theme-venus .special-npc-shell::after {
  content: '';
  position: absolute;
  inset: 9px;
  z-index: 6;
  border: 1px solid rgba(var(--special-npc-soft-accent-rgb), 0.18);
  border-radius: 10px;
  background:
    linear-gradient(135deg, rgba(var(--special-npc-tier-accent-rgb), 0.92) 0 18px, transparent 18px) top left / 74px 74px no-repeat,
    linear-gradient(225deg, rgba(var(--special-npc-tier-accent-rgb), 0.92) 0 18px, transparent 18px) top right / 74px 74px no-repeat,
    linear-gradient(45deg, rgba(86, 171, 220, 0.62) 0 16px, transparent 16px) bottom left / 66px 66px no-repeat,
    linear-gradient(315deg, rgba(86, 171, 220, 0.62) 0 16px, transparent 16px) bottom right / 66px 66px no-repeat;
  box-shadow:
    inset 0 0 0 1px rgba(var(--special-npc-tier-accent-rgb), 0.08),
    inset 0 0 26px rgba(86, 171, 220, 0.05);
  pointer-events: none;
}

.special-npc-portrait-pane {
  position: relative;
  flex: 0 0 45%;
  min-width: 0;
}

.special-npc-theme-venus .special-npc-portrait-pane {
  padding: 14px 10px 14px 14px;
}

.special-npc-theme-venus .special-npc-portrait-pane::before,
.special-npc-theme-venus .special-npc-portrait-pane::after {
  content: '';
  position: absolute;
  inset: 14px 10px 14px 14px;
  z-index: 3;
  pointer-events: none;
}

.special-npc-theme-venus .special-npc-portrait-pane::before {
  border: 2px solid rgba(var(--special-npc-tier-accent-rgb), 0.95);
  border-radius: 8px;
  background:
    linear-gradient(135deg, rgba(255, 255, 246, 0.96) 0 12px, transparent 12px) top left / 56px 56px no-repeat,
    linear-gradient(225deg, rgba(255, 255, 246, 0.96) 0 12px, transparent 12px) top right / 56px 56px no-repeat,
    linear-gradient(45deg, rgba(86, 171, 220, 0.86) 0 12px, transparent 12px) bottom left / 56px 56px no-repeat,
    linear-gradient(315deg, rgba(86, 171, 220, 0.86) 0 12px, transparent 12px) bottom right / 56px 56px no-repeat;
  clip-path: polygon(18px 0, calc(100% - 18px) 0, 100% 18px, 100% calc(100% - 18px), calc(100% - 18px) 100%, 18px 100%, 0 calc(100% - 18px), 0 18px);
  box-shadow:
    inset 0 0 0 1px rgba(var(--special-npc-soft-accent-rgb), 0.34),
    0 0 14px rgba(var(--special-npc-tier-accent-rgb), 0.18);
}

.special-npc-theme-venus .special-npc-portrait-pane::after {
  border-radius: 8px;
  background:
    linear-gradient(90deg, rgba(var(--special-npc-tier-accent-rgb), 0.98) 0 68px, transparent 68px calc(100% - 68px), rgba(var(--special-npc-tier-accent-rgb), 0.98) calc(100% - 68px)) top / 100% 2px no-repeat,
    linear-gradient(90deg, rgba(86, 171, 220, 0.7) 0 68px, transparent 68px calc(100% - 68px), rgba(86, 171, 220, 0.7) calc(100% - 68px)) bottom / 100% 2px no-repeat,
    linear-gradient(180deg, rgba(var(--special-npc-tier-accent-rgb), 0.98) 0 68px, transparent 68px calc(100% - 68px), rgba(86, 171, 220, 0.7) calc(100% - 68px)) left / 2px 100% no-repeat,
    linear-gradient(180deg, rgba(var(--special-npc-tier-accent-rgb), 0.98) 0 68px, transparent 68px calc(100% - 68px), rgba(86, 171, 220, 0.7) calc(100% - 68px)) right / 2px 100% no-repeat;
}

.special-npc-portrait-pane::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(to right, transparent 60%, var(--special-npc-bg) 100%);
  pointer-events: none;
}

.special-npc-portrait-image {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: top center;
}

.special-npc-theme-venus .special-npc-portrait-image {
  border-radius: 8px;
  clip-path: polygon(16px 0, calc(100% - 16px) 0, 100% 16px, 100% calc(100% - 16px), calc(100% - 16px) 100%, 16px 100%, 0 calc(100% - 16px), 0 16px);
  box-shadow:
    0 0 0 1px rgba(var(--special-npc-soft-accent-rgb), 0.2),
    0 16px 36px rgba(0, 0, 0, 0.28);
}

.special-npc-portrait-deco {
  position: absolute;
  inset: 22px 18px 22px 22px;
  z-index: 4;
  overflow: hidden;
  border-radius: 8px;
  clip-path: polygon(16px 0, calc(100% - 16px) 0, 100% 16px, 100% calc(100% - 16px), calc(100% - 16px) 100%, 16px 100%, 0 calc(100% - 16px), 0 16px);
  pointer-events: none;
}

.special-npc-portrait-deco-corner {
  position: absolute;
  width: min(25%, 128px);
  aspect-ratio: 1;
  background: var(--venus-portrait-corner-url) center / contain no-repeat;
  opacity: 0.72;
  filter:
    brightness(0) saturate(100%) invert(89%) sepia(33%) saturate(618%) hue-rotate(348deg) brightness(108%) contrast(96%)
    drop-shadow(0 0 7px rgba(var(--special-npc-tier-accent-rgb), 0.28))
    drop-shadow(0 0 14px rgba(86, 171, 220, 0.1));
}

.special-npc-portrait-deco-corner.top-left {
  top: 0;
  left: 0;
}

.special-npc-portrait-deco-corner.top-right {
  top: 0;
  right: 0;
  transform: scaleX(-1);
}

.special-npc-portrait-deco-corner.bottom-left {
  bottom: 0;
  left: 0;
  transform: scaleY(-1);
}

.special-npc-portrait-deco-corner.bottom-right {
  right: 0;
  bottom: 0;
  transform: scale(-1);
}

.special-npc-mobile-header-overlay {
  display: none;
}

.special-npc-data-pane {
  position: relative;
  z-index: 2;
  display: flex;
  flex: 1;
  flex-direction: column;
  min-width: 0;
  max-height: 800px;
  padding: 56px 50px 34px;
  overflow: hidden;
}

.special-npc-theme-venus .special-npc-data-pane::before,
.special-npc-theme-venus .special-npc-data-pane::after {
  content: '';
  position: absolute;
  inset: 0;
  z-index: 0;
  pointer-events: none;
}

.special-npc-theme-venus .special-npc-data-pane::after {
  background:
    linear-gradient(180deg, rgba(var(--special-npc-tier-accent-rgb), 0.14) 0%, rgba(27, 69, 111, 0.18) 34%, rgba(4, 15, 36, 0.36) 100%),
    radial-gradient(ellipse at 50% 12%, rgba(255, 248, 221, 0.16), transparent 22rem),
    radial-gradient(ellipse at 50% 62%, rgba(86, 171, 220, 0.1), transparent 24rem);
  opacity: 0.9;
}

.special-npc-theme-venus .special-npc-data-pane > * {
  position: relative;
  z-index: 1;
}

.special-npc-panels::-webkit-scrollbar {
  width: 6px;
}

.special-npc-panels::-webkit-scrollbar-track {
  background: transparent;
}

.special-npc-panels::-webkit-scrollbar-thumb {
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.12);
}

.special-npc-panels {
  flex: 1;
  min-width: 0;
  min-height: 0;
  overflow-y: auto;
  padding-bottom: 22px;
  scrollbar-color: rgba(255, 255, 255, 0.12) transparent;
  scrollbar-width: thin;
}

.special-npc-shell.is-divinity-tab .special-npc-panels {
  display: flex;
  flex-direction: column;
  overflow: hidden;
  padding-bottom: 12px;
}

.special-npc-shell.is-divinity-tab .special-npc-portrait-pane,
.special-npc-shell.is-divinity-tab .special-npc-desktop-header {
  display: none;
}

.special-npc-shell.is-divinity-tab .special-npc-data-pane {
  flex: 1 1 100%;
  max-height: none;
  padding: 14px;
}

.special-npc-shell.is-divinity-tab :deep(.special-npc-page-title) {
  flex-shrink: 0;
  margin-bottom: 8px;
}

.special-npc-shell.is-divinity-tab :deep(.special-npc-divinity-stage) {
  flex: 1 1 auto;
  width: 100%;
  max-width: none;
  min-height: 620px;
  aspect-ratio: auto;
}

.special-npc-section + .special-npc-section {
  margin-top: 28px;
}

.special-npc-section-title {
  margin: 0 0 16px;
  color: var(--special-npc-race-accent);
  font-size: 18px;
  font-weight: 700;
}

.special-npc-story-combined-block {
  display: grid;
  gap: 18px;
}

.special-npc-story-block {
  padding: 28px 36px;
  border: 1px solid rgba(255, 255, 255, 0.05);
  background: radial-gradient(ellipse at center, rgba(30, 34, 42, 0.4) 0%, rgba(10, 12, 16, 0.8) 100%);
}

.special-npc-story-block h3 {
  margin: 0 0 16px;
  color: var(--special-npc-tier-accent);
  font-family: 'Noto Serif SC', 'SimSun', serif;
  font-size: 22px;
  font-weight: 700;
  text-align: center;
  text-shadow: 0 0 12px rgba(var(--special-npc-tier-accent-rgb), 0.26);
}

.special-npc-story-block p {
  margin: 0;
  color: #e2e8f0;
  line-height: 1.8;
  white-space: pre-line;
}

.special-npc-story-link-block {
  display: grid;
  gap: 22px;
  justify-items: center;
  width: min(100%, 520px);
  margin: 0 auto;
  padding: 38px 40px;
  border: 1px solid rgba(var(--special-npc-tier-accent-rgb), 0.28);
  background:
    radial-gradient(ellipse at 50% 0%, rgba(var(--special-npc-tier-accent-rgb), 0.14), transparent 64%),
    linear-gradient(180deg, rgba(255, 255, 255, 0.035), rgba(255, 255, 255, 0.012));
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.06);
  text-align: center;
}

.special-npc-story-link-copy {
  display: grid;
  gap: 10px;
}

.special-npc-story-kicker {
  color: var(--special-npc-race-accent);
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.08em;
}

.special-npc-story-link-copy h3 {
  margin: 0;
  color: #fff8da;
  font-family: 'Noto Serif SC', 'SimSun', serif;
  font-size: 28px;
  font-weight: 700;
  text-shadow: 0 0 14px rgba(var(--special-npc-tier-accent-rgb), 0.36);
}

.special-npc-story-link-copy p {
  margin: 0;
  color: #d9e5f2;
  line-height: 1.75;
}

.special-npc-story-link-button {
  min-width: 150px;
  padding: 10px 22px;
  border: 1px solid rgba(var(--special-npc-tier-accent-rgb), 0.6);
  border-radius: 999px;
  background: linear-gradient(180deg, rgba(var(--special-npc-tier-accent-rgb), 0.2), rgba(var(--special-npc-tier-accent-rgb), 0.08));
  color: #fff6d5;
  cursor: pointer;
  font-weight: 700;
  transition:
    border-color 0.2s ease,
    box-shadow 0.2s ease,
    transform 0.2s ease;
}

.special-npc-story-link-button:hover {
  border-color: rgba(var(--special-npc-tier-accent-rgb), 0.9);
  box-shadow: 0 0 18px rgba(var(--special-npc-tier-accent-rgb), 0.24);
  transform: translateY(-1px);
}

#import-action-menu {
  position: absolute;
  right: 14px;
  bottom: 62px;
  z-index: 21;
  display: none;
  min-width: 190px;
  padding: 6px;
  border: 1px solid rgba(255, 255, 255, 0.18);
  border-radius: 10px;
  background: rgba(20, 20, 20, 0.92);
  box-shadow: 0 12px 30px rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
}

#import-action-menu.show {
  display: block;
}

#import-action-menu button {
  width: 100%;
  padding: 10px;
  border: 1px solid transparent;
  border-radius: 8px;
  background: transparent;
  color: #eee;
  cursor: pointer;
  font-size: 0.95rem;
  text-align: left;
}

#import-action-menu button:disabled {
  opacity: 0.6;
  cursor: wait;
}

#import-action-menu button:hover:not(:disabled) {
  border-color: rgba(255, 255, 255, 0.12);
  background: rgba(255, 255, 255, 0.08);
}

@media (max-width: 900px) {
  .special-npc-wrapper {
    max-width: min(100%, 480px);
  }

  .special-npc-shell {
    flex-direction: column;
    aspect-ratio: 414 / 896;
    min-height: 0;
  }

  .special-npc-portrait-pane {
    flex: 1 1 auto;
    min-height: 0;
  }

  .special-npc-shell.is-detail-tab .special-npc-portrait-pane {
    display: none;
  }

  .special-npc-portrait-pane::after {
    background: linear-gradient(to bottom, transparent 65%, var(--special-npc-bg) 100%);
  }

  .special-npc-data-pane {
    flex: 1;
    max-height: none;
    min-height: 0;
    padding: 18px 24px 20px;
    overflow: hidden;
  }

  .special-npc-shell.is-overview-tab .special-npc-data-pane {
    flex: 0 0 auto;
    padding: 0 18px 8px;
    overflow: visible;
  }

  .special-npc-shell.is-detail-tab .special-npc-data-pane {
    padding: 18px 24px 14px;
  }

  .special-npc-desktop-header {
    display: none;
  }

  .special-npc-mobile-header-overlay {
    position: absolute;
    right: 18px;
    bottom: 22px;
    left: 18px;
    z-index: 2;
    display: block;
    padding: 16px 14px;
    border: 1px solid rgba(var(--special-npc-race-accent-rgb), 0.62);
    border-radius: 8px;
    background: rgba(12, 14, 20, 0.66);
    box-shadow:
      0 10px 32px rgba(0, 0, 0, 0.42),
      inset 0 1px 0 rgba(255, 255, 255, 0.08);
    backdrop-filter: blur(5px);
    -webkit-backdrop-filter: blur(5px);
  }

  .special-npc-shell.is-overview-tab .special-npc-panels {
    display: none;
  }

  .special-npc-panels {
    flex: 1;
    min-height: 0;
    overflow-y: auto;
    padding-bottom: 18px;
    scrollbar-width: none;
  }

  .special-npc-shell.is-divinity-tab .special-npc-panels {
    overflow: hidden;
    padding-bottom: 14px;
  }

  .special-npc-shell.is-divinity-tab .special-npc-data-pane {
    padding: 12px;
  }

  .special-npc-shell.is-divinity-tab :deep(.special-npc-page-title) {
    margin-bottom: 8px;
  }

  .special-npc-shell.is-divinity-tab :deep(.special-npc-divinity-stage) {
    min-height: 0;
    height: 100%;
  }

  .special-npc-panels::-webkit-scrollbar {
    display: none;
  }

  .special-npc-panels > :deep(.special-npc-overview) {
    display: none;
  }

  .special-npc-shell :deep(.special-npc-tabs) {
    padding-right: 12px;
  }
}

@media (max-width: 640px) {
  .special-npc-shell {
    border-radius: 12px;
  }

  .special-npc-data-pane {
    padding: 22px 16px 18px;
  }

  .special-npc-shell.is-overview-tab .special-npc-data-pane {
    padding: 0 14px 8px;
  }

  .special-npc-shell.is-detail-tab .special-npc-data-pane {
    padding: 16px 14px 12px;
  }

  .special-npc-mobile-header-overlay {
    right: 14px;
    bottom: 18px;
    left: 14px;
    padding: 14px 12px;
  }

  #import-action-menu {
    right: 10px;
    bottom: 56px;
    min-width: 170px;
  }
}
</style>
