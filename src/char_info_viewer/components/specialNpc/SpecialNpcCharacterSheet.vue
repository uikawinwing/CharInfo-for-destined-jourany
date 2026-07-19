<template>
  <div class="special-npc-wrapper" :class="themeClass" :style="themeStyle">
    <main
      class="special-npc-shell"
      :class="{ 'is-overview-tab': isOverviewTab, 'is-detail-tab': !isOverviewTab, 'is-divinity-tab': isDivinityTab }"
    >
      <aside class="special-npc-portrait-pane">
        <video
          v-if="isVideoPortrait && !portraitLoadFailed"
          :key="portraitMediaUrl"
          class="special-npc-portrait-video"
          :src="portraitMediaUrl"
          :aria-label="vm.nameText"
          autoplay
          loop
          muted
          playsinline
          preload="metadata"
          @error="portraitLoadFailed = true"
        ></video>
        <img
          v-else-if="!portraitLoadFailed"
          :key="portraitMediaUrl"
          class="special-npc-portrait-image"
          :src="portraitMediaUrl"
          :alt="vm.nameText"
          @error="portraitLoadFailed = true"
        />
        <section v-else class="special-npc-portrait-failure" role="status">
          <strong>立绘无法加载</strong>
          <p>可能是网络、代理或资源地址不可用。</p>
          <div class="special-npc-portrait-failure-actions">
            <button type="button" @click="retryPortraitLoad">重试</button>
            <button type="button" @click="$emit('fallbackToDefault')">使用普通版</button>
          </div>
        </section>
        <div v-if="isVenusTheme" class="special-npc-portrait-deco" aria-hidden="true">
          <span class="special-npc-portrait-deco-corner top-left"></span>
          <span class="special-npc-portrait-deco-corner top-right"></span>
          <span class="special-npc-portrait-deco-corner bottom-left"></span>
          <span class="special-npc-portrait-deco-corner bottom-right"></span>
        </div>
        <div v-if="isAilisiTheme" class="special-npc-ailisi-portrait-deco" aria-hidden="true">
          <span class="special-npc-ailisi-bubble bubble-one"></span>
          <span class="special-npc-ailisi-bubble bubble-two"></span>
          <span class="special-npc-ailisi-bubble bubble-three"></span>
          <span class="special-npc-ailisi-bubble bubble-four"></span>
          <span class="special-npc-ailisi-toy-node node-one"></span>
          <span class="special-npc-ailisi-toy-node node-two"></span>
        </div>
        <div v-if="isOverviewTab" class="special-npc-mobile-header-overlay">
          <SpecialNpcHeader :vm="vm" :ornate="hasOrnateHeader" compact />
        </div>
      </aside>

      <section class="special-npc-data-pane">
        <div v-if="isAilisiTheme && isOverviewTab" class="special-npc-ailisi-header-deco" aria-hidden="true">
          <span class="special-npc-ailisi-jellyfish">
            <i class="jellyfish-dome"></i>
            <i class="jellyfish-tentacle tentacle-one"></i>
            <i class="jellyfish-tentacle tentacle-two"></i>
            <i class="jellyfish-tentacle tentacle-three"></i>
          </span>
          <span class="special-npc-ailisi-toy-blocks"><i></i><i></i><i></i><i></i></span>
        </div>
        <SpecialNpcHeader v-if="isOverviewTab" class="special-npc-desktop-header" :vm="vm" :ornate="hasOrnateHeader" />

        <div class="special-npc-panels">
          <SpecialNpcPageTitle v-if="!isOverviewTab" :title="activeSpecialTabTitle" />

          <SpecialNpcOverviewPanel
            v-if="activeSpecialTab === 'overview'"
            :attributes="attributes"
            :resource-boxes="vm.resourceBoxes"
            :entrance-quote-text="vm.entranceQuoteText"
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

          <SpecialNpcDivinityPanel
            v-else-if="activeSpecialTab === 'divinity'"
            :vm="vm"
            :profile="vm.specialNpcProfile"
          />

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
              <button class="special-npc-story-link-button" type="button" @click="openCharacterStory">前往读本</button>
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
import { computed, ref, watch, watchEffect } from 'vue';

import type { CharacterViewModel } from '../../services/characterViewModel';
import type { AttributeView, SpecialNpcTab, SpecialNpcTabKey } from './types';
import SpecialNpcDivinityPanel from './SpecialNpcDivinityPanel.vue';
import SpecialNpcHeader from './SpecialNpcHeader.vue';
import SpecialNpcItemCard from './SpecialNpcItemCard.vue';
import SpecialNpcOverviewPanel from './SpecialNpcOverviewPanel.vue';
import SpecialNpcPageTitle from './SpecialNpcPageTitle.vue';
import SpecialNpcProfilePanel from './SpecialNpcProfilePanel.vue';
import SpecialNpcTabNav from './SpecialNpcTabNav.vue';
import { anastasiaPortraitCssVars } from './anastasiaAssets';
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
  fallbackToDefault: [];
}>();

const activeSpecialTab = ref<SpecialNpcTabKey>('overview');
const portraitLoadFailed = ref(false);
const portraitRetryAttempt = ref(0);
const isVideoPortrait = computed(() => props.vm.specialNpcProfile?.portraitKind === 'video');
const portraitMediaUrl = computed(() => {
  if (portraitRetryAttempt.value === 0) return props.vm.imageUrl;

  try {
    const url = new URL(props.vm.imageUrl, window.location.href);
    url.searchParams.set('_char_info_retry', String(portraitRetryAttempt.value));
    return url.href;
  } catch (_) {
    const separator = props.vm.imageUrl.includes('?') ? '&' : '?';
    return `${props.vm.imageUrl}${separator}_char_info_retry=${portraitRetryAttempt.value}`;
  }
});
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
const isAnastasiaTheme = computed(() => props.vm.specialNpcProfile?.visualTheme === 'anastasia');
const isAilisiTheme = computed(() => props.vm.specialNpcProfile?.visualTheme === 'ailisi');
const hasOrnateHeader = computed(() => isVenusTheme.value || isAnastasiaTheme.value);
const themeClass = computed(() => ({
  'special-npc-theme-venus': isVenusTheme.value,
  'special-npc-theme-anastasia': isAnastasiaTheme.value,
  'special-npc-theme-ailisi': isAilisiTheme.value,
}));
const themeStyle = computed(() => {
  if (isVenusTheme.value) return venusPortraitCssVars;
  if (isAnastasiaTheme.value) return anastasiaPortraitCssVars;
  return undefined;
});

type CalendarFloatWidgetApi = {
  open?: () => void;
  openBook?: (bookId: string) => boolean | void;
};

type CalendarWidgetWindow = Window &
  typeof globalThis & {
    CalendarFloatWidget?: CalendarFloatWidgetApi;
  };

function getCalendarFloatWidget(): CalendarFloatWidgetApi | null {
  const candidates = [window.parent, window].filter(
    (candidate, index, list) => candidate && list.indexOf(candidate) === index,
  );
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

function retryPortraitLoad(): void {
  portraitLoadFailed.value = false;
  portraitRetryAttempt.value += 1;
}

watch(
  () => props.vm.imageUrl,
  () => {
    portraitLoadFailed.value = false;
    portraitRetryAttempt.value = 0;
  },
);

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
  container-type: inline-size;
  color: #f8f9fa;
  font-family: 'Noto Sans SC', 'Microsoft YaHei', 'PingFang SC', sans-serif;
  --special-npc-bg: #14161e;
  --special-npc-panel: rgba(20, 22, 30, 0.78);
  --special-npc-race-accent: var(--race-color, #d4af37);
  --special-npc-race-accent-rgb: var(--race-color-rgb, 212, 175, 55);
  --special-npc-tier-accent: var(--tier-color, #d4af37);
  --special-npc-tier-accent-rgb: var(--tier-color-rgb, 212, 175, 55);
  --special-npc-overview-width: 520px;
  --special-npc-flag-width: 128px;
  --special-npc-flag-height: 128px;
  --special-npc-flag-gap: 12px;
  --special-npc-resource-width: 128px;
  --special-npc-resource-height: 72px;
  --special-npc-resource-gap: 16px;
  --special-npc-header-min-height: 148px;
  --special-npc-tabs-height: 52px;
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

.special-npc-wrapper.special-npc-theme-anastasia {
  color-scheme: light;
  isolation: isolate;
  color: #14304b;
  background-color: #e6edf1;
  --special-npc-bg: #e6edf1;
  --special-npc-panel: rgba(248, 251, 252, 0.88);
  --special-npc-race-accent: #0a2d4e;
  --special-npc-race-accent-rgb: 10, 45, 78;
  --special-npc-tier-accent: #d0a653;
  --special-npc-tier-accent-rgb: 208, 166, 83;
  --special-npc-soft-accent: #5f8fa8;
  --special-npc-soft-accent-rgb: 95, 143, 168;
}

.special-npc-wrapper.special-npc-theme-ailisi {
  color-scheme: light;
  isolation: isolate;
  color: #17324a;
  background-color: #dce9e7;
  --special-npc-bg: #dce9e7;
  --special-npc-panel: rgba(247, 251, 250, 0.94);
  --special-npc-race-accent: #42a996;
  --special-npc-race-accent-rgb: 66, 169, 150;
  --special-npc-tier-accent: #a98ce8;
  --special-npc-tier-accent-rgb: 169, 140, 232;
  --special-npc-soft-accent: #f078a6;
  --special-npc-soft-accent-rgb: 240, 120, 166;
}

.special-npc-shell {
  position: relative;
  display: flex;
  height: min(800px, 80cqw);
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

.special-npc-theme-anastasia .special-npc-shell {
  border-color: rgba(10, 45, 78, 0.24);
  background:
    radial-gradient(circle at 74% 8%, rgba(208, 166, 83, 0.12), transparent 24rem),
    radial-gradient(circle at 20% 90%, rgba(95, 143, 168, 0.12), transparent 28rem),
    linear-gradient(180deg, #f3f7f8 0%, #e4edf1 46%, #d5e0e6 100%);
  box-shadow:
    0 0 0 1px rgba(95, 143, 168, 0.26),
    0 0 28px rgba(95, 143, 168, 0.16),
    0 22px 54px rgba(16, 46, 73, 0.2),
    inset 0 1px 0 rgba(255, 255, 255, 0.9);
}

.special-npc-theme-ailisi .special-npc-shell {
  border-color: rgba(49, 83, 109, 0.58);
  border-radius: 14px;
  background:
    radial-gradient(circle at 76% 4%, rgba(169, 140, 232, 0.18), transparent 24rem),
    radial-gradient(circle at 18% 92%, rgba(240, 120, 166, 0.13), transparent 28rem),
    linear-gradient(145deg, #edf5f3 0%, #dcefeb 54%, #e9e1f7 100%);
  box-shadow:
    0 0 0 4px rgba(247, 251, 250, 0.78),
    0 0 0 5px rgba(66, 169, 150, 0.48),
    0 22px 52px rgba(23, 50, 74, 0.2),
    inset 0 1px 0 rgba(255, 255, 255, 0.92);
}

.special-npc-theme-anastasia .special-npc-shell::before {
  content: '';
  position: absolute;
  inset: 0;
  z-index: 6;
  padding: 2px;
  border-radius: inherit;
  background: linear-gradient(180deg, #eef5f7 0%, #5f8fa8 52%, #153f65 100%);
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

.special-npc-theme-anastasia .special-npc-shell::after {
  content: '';
  position: absolute;
  inset: 9px;
  z-index: 6;
  border: 1px solid rgba(10, 45, 78, 0.18);
  border-radius: 10px;
  background:
    linear-gradient(135deg, rgba(232, 238, 242, 0.96) 0 16px, transparent 16px) top left / 72px 72px no-repeat,
    linear-gradient(225deg, rgba(232, 238, 242, 0.96) 0 16px, transparent 16px) top right / 72px 72px no-repeat,
    linear-gradient(45deg, rgba(208, 166, 83, 0.58) 0 14px, transparent 14px) bottom left / 64px 64px no-repeat,
    linear-gradient(315deg, rgba(208, 166, 83, 0.58) 0 14px, transparent 14px) bottom right / 64px 64px no-repeat;
  box-shadow: inset 0 0 24px rgba(95, 143, 168, 0.06);
  pointer-events: none;
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
    linear-gradient(
      90deg,
      rgba(var(--special-npc-race-accent-rgb), 0.16),
      rgba(255, 252, 235, 0.58),
      rgba(var(--special-npc-race-accent-rgb), 0.16)
    );
  filter: drop-shadow(0 0 7px rgba(var(--special-npc-tier-accent-rgb), 0.18))
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
    linear-gradient(135deg, rgba(var(--special-npc-tier-accent-rgb), 0.92) 0 18px, transparent 18px) top left / 74px
      74px no-repeat,
    linear-gradient(225deg, rgba(var(--special-npc-tier-accent-rgb), 0.92) 0 18px, transparent 18px) top right / 74px
      74px no-repeat,
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
  padding: 14px;
}

.special-npc-theme-anastasia .special-npc-portrait-pane {
  padding: 14px;
}

.special-npc-theme-ailisi .special-npc-portrait-pane {
  padding: 12px;
  overflow: hidden;
  background: #a8c8c7;
}

.special-npc-theme-venus .special-npc-portrait-pane::before,
.special-npc-theme-venus .special-npc-portrait-pane::after {
  content: '';
  position: absolute;
  inset: 14px;
  z-index: 3;
  pointer-events: none;
}

.special-npc-theme-anastasia .special-npc-portrait-pane::before {
  content: '';
  position: absolute;
  inset: 14px;
  z-index: 3;
  border: 2px solid rgba(232, 238, 242, 0.98);
  border-radius: 8px;
  background:
    linear-gradient(135deg, rgba(232, 238, 242, 0.98) 0 12px, transparent 12px) top left / 56px 56px no-repeat,
    linear-gradient(225deg, rgba(232, 238, 242, 0.98) 0 12px, transparent 12px) top right / 56px 56px no-repeat,
    linear-gradient(45deg, rgba(208, 166, 83, 0.7) 0 12px, transparent 12px) bottom left / 56px 56px no-repeat,
    linear-gradient(315deg, rgba(208, 166, 83, 0.7) 0 12px, transparent 12px) bottom right / 56px 56px no-repeat;
  clip-path: polygon(
    18px 0,
    calc(100% - 18px) 0,
    100% 18px,
    100% calc(100% - 18px),
    calc(100% - 18px) 100%,
    18px 100%,
    0 calc(100% - 18px),
    0 18px
  );
  box-shadow: 0 0 16px rgba(95, 143, 168, 0.24);
  pointer-events: none;
}

.special-npc-theme-anastasia .special-npc-portrait-pane::after {
  background: linear-gradient(to right, transparent 58%, rgba(230, 237, 241, 0.92) 100%);
}

.special-npc-theme-venus .special-npc-portrait-pane::before {
  border: 2px solid rgba(var(--special-npc-tier-accent-rgb), 0.95);
  border-radius: 8px;
  background:
    linear-gradient(135deg, rgba(255, 255, 246, 0.96) 0 12px, transparent 12px) top left / 56px 56px no-repeat,
    linear-gradient(225deg, rgba(255, 255, 246, 0.96) 0 12px, transparent 12px) top right / 56px 56px no-repeat,
    linear-gradient(45deg, rgba(86, 171, 220, 0.86) 0 12px, transparent 12px) bottom left / 56px 56px no-repeat,
    linear-gradient(315deg, rgba(86, 171, 220, 0.86) 0 12px, transparent 12px) bottom right / 56px 56px no-repeat;
  clip-path: polygon(
    18px 0,
    calc(100% - 18px) 0,
    100% 18px,
    100% calc(100% - 18px),
    calc(100% - 18px) 100%,
    18px 100%,
    0 calc(100% - 18px),
    0 18px
  );
  box-shadow:
    inset 0 0 0 1px rgba(var(--special-npc-soft-accent-rgb), 0.34),
    0 0 14px rgba(var(--special-npc-tier-accent-rgb), 0.18);
}

.special-npc-theme-venus .special-npc-portrait-pane::after {
  border-radius: 8px;
  background:
    linear-gradient(
        90deg,
        rgba(var(--special-npc-tier-accent-rgb), 0.98) 0 68px,
        transparent 68px calc(100% - 68px),
        rgba(var(--special-npc-tier-accent-rgb), 0.98) calc(100% - 68px)
      )
      top / 100% 2px no-repeat,
    linear-gradient(
        90deg,
        rgba(86, 171, 220, 0.7) 0 68px,
        transparent 68px calc(100% - 68px),
        rgba(86, 171, 220, 0.7) calc(100% - 68px)
      )
      bottom / 100% 2px no-repeat,
    linear-gradient(
        180deg,
        rgba(var(--special-npc-tier-accent-rgb), 0.98) 0 68px,
        transparent 68px calc(100% - 68px),
        rgba(86, 171, 220, 0.7) calc(100% - 68px)
      )
      left / 2px 100% no-repeat,
    linear-gradient(
        180deg,
        rgba(var(--special-npc-tier-accent-rgb), 0.98) 0 68px,
        transparent 68px calc(100% - 68px),
        rgba(86, 171, 220, 0.7) calc(100% - 68px)
      )
      right / 2px 100% no-repeat;
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

.special-npc-portrait-video {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: top center;
}

.special-npc-theme-ailisi .special-npc-portrait-image,
.special-npc-theme-ailisi .special-npc-portrait-video {
  border: 1px solid rgba(237, 255, 251, 0.88);
  border-radius: 10px;
  object-position: 50% 48%;
  box-shadow: 0 12px 28px rgba(23, 50, 74, 0.2);
  filter: saturate(0.98) contrast(1.02);
}

.special-npc-theme-ailisi .special-npc-portrait-pane::after {
  z-index: 2;
  inset: 12px;
  border-radius: 10px;
  background:
    linear-gradient(180deg, rgba(23, 50, 74, 0.03) 0%, transparent 34%, transparent 66%, rgba(23, 50, 74, 0.2) 100%),
    linear-gradient(90deg, rgba(131, 220, 203, 0.1), transparent 26%, transparent 74%, rgba(169, 140, 232, 0.12));
}

.special-npc-ailisi-portrait-deco {
  position: absolute;
  inset: 12px;
  z-index: 4;
  overflow: hidden;
  border: 1px solid rgba(226, 255, 250, 0.74);
  border-radius: 10px;
  pointer-events: none;
}

.special-npc-ailisi-bubble {
  position: absolute;
  width: var(--bubble-size);
  aspect-ratio: 1;
  border: 1px solid rgba(237, 255, 251, 0.82);
  border-radius: 50%;
  background: rgba(247, 251, 250, 0.08);
  box-shadow: inset -3px -4px 9px rgba(131, 220, 203, 0.24);
}

.special-npc-ailisi-bubble::after {
  content: '';
  position: absolute;
  top: 20%;
  left: 22%;
  width: 22%;
  aspect-ratio: 1;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.78);
}

.special-npc-ailisi-bubble.bubble-one {
  top: 8%;
  left: 7%;
  --bubble-size: 42px;
}

.special-npc-ailisi-bubble.bubble-two {
  top: 16%;
  right: 8%;
  --bubble-size: 28px;
}

.special-npc-ailisi-bubble.bubble-three {
  bottom: 12%;
  left: 10%;
  --bubble-size: 24px;
}

.special-npc-ailisi-bubble.bubble-four {
  right: 10%;
  bottom: 19%;
  --bubble-size: 48px;
}

.special-npc-ailisi-toy-node {
  position: absolute;
  width: 14px;
  aspect-ratio: 1;
  border: 2px solid #f7fbfa;
  border-radius: 4px;
  background: #f078a6;
  box-shadow: 0 2px 6px rgba(23, 50, 74, 0.24);
}

.special-npc-ailisi-toy-node.node-one {
  top: 18px;
  left: 18px;
  transform: rotate(16deg);
}

.special-npc-ailisi-toy-node.node-two {
  right: 18px;
  bottom: 18px;
  background: #a98ce8;
  transform: rotate(34deg);
}

.special-npc-portrait-failure {
  position: relative;
  z-index: 5;
  display: grid;
  align-content: center;
  justify-items: center;
  width: 100%;
  height: 100%;
  min-height: 260px;
  padding: 28px;
  background:
    radial-gradient(circle at 50% 35%, rgba(var(--special-npc-tier-accent-rgb), 0.14), transparent 56%),
    var(--special-npc-bg);
  color: #f8f9fa;
  text-align: center;
}

.special-npc-portrait-failure strong {
  color: var(--special-npc-tier-accent);
  font-size: 20px;
}

.special-npc-portrait-failure p {
  max-width: 22em;
  margin: 10px 0 20px;
  color: rgba(248, 249, 250, 0.76);
  font-size: 14px;
  line-height: 1.6;
}

.special-npc-portrait-failure-actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 10px;
}

.special-npc-portrait-failure-actions button {
  min-height: 40px;
  padding: 0 16px;
  border: 1px solid rgba(var(--special-npc-race-accent-rgb), 0.72);
  border-radius: 6px;
  background: rgba(var(--special-npc-race-accent-rgb), 0.12);
  color: #f8f9fa;
  cursor: pointer;
  font: inherit;
  font-weight: 700;
}

.special-npc-portrait-failure-actions button:hover {
  border-color: var(--special-npc-tier-accent);
  background: rgba(var(--special-npc-tier-accent-rgb), 0.18);
}

.special-npc-theme-venus .special-npc-portrait-image,
.special-npc-theme-venus .special-npc-portrait-video {
  border-radius: 8px;
  clip-path: polygon(
    16px 0,
    calc(100% - 16px) 0,
    100% 16px,
    100% calc(100% - 16px),
    calc(100% - 16px) 100%,
    16px 100%,
    0 calc(100% - 16px),
    0 16px
  );
  box-shadow:
    0 0 0 1px rgba(var(--special-npc-soft-accent-rgb), 0.2),
    0 16px 36px rgba(0, 0, 0, 0.28);
}

.special-npc-portrait-deco {
  position: absolute;
  inset: 22px;
  z-index: 4;
  overflow: hidden;
  border-radius: 8px;
  clip-path: polygon(
    16px 0,
    calc(100% - 16px) 0,
    100% 16px,
    100% calc(100% - 16px),
    calc(100% - 16px) 100%,
    16px 100%,
    0 calc(100% - 16px),
    0 16px
  );
  pointer-events: none;
}

.special-npc-portrait-deco-corner {
  position: absolute;
  width: min(25%, 128px);
  aspect-ratio: 1;
  background: var(--venus-portrait-corner-url) center / contain no-repeat;
  opacity: 0.72;
  filter: brightness(0) saturate(100%) invert(89%) sepia(33%) saturate(618%) hue-rotate(348deg) brightness(108%)
    contrast(96%) drop-shadow(0 0 7px rgba(var(--special-npc-tier-accent-rgb), 0.28))
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

.special-npc-theme-anastasia .special-npc-data-pane::after {
  content: '';
  position: absolute;
  inset: 0;
  z-index: 0;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.42), rgba(216, 227, 235, 0.26)),
    var(--anastasia-anchor-pattern-url) center / 210px auto repeat;
  opacity: 0.16;
  pointer-events: none;
}

.special-npc-theme-anastasia .special-npc-data-pane > * {
  position: relative;
  z-index: 1;
}

.special-npc-theme-anastasia :deep(.special-npc-header .special-npc-name) {
  color: #0a2d4e;
  text-shadow:
    0 1px 0 rgba(255, 255, 255, 0.86),
    0 2px 10px rgba(95, 143, 168, 0.18);
}

.special-npc-theme-anastasia :deep(.special-npc-header .special-npc-subtitle) {
  color: #315873;
  text-shadow: none;
}

.special-npc-theme-anastasia :deep(.special-npc-header .rail-line) {
  background: linear-gradient(
    90deg,
    transparent,
    rgba(10, 45, 78, 0.7),
    rgba(208, 166, 83, 0.92),
    rgba(10, 45, 78, 0.7),
    transparent
  );
  filter: drop-shadow(0 1px 2px rgba(255, 255, 255, 0.86));
  opacity: 0.9;
}

.special-npc-theme-anastasia :deep(.special-npc-header .rail-flourish),
.special-npc-theme-anastasia :deep(.special-npc-header .rail-center) {
  filter: brightness(0) saturate(100%) invert(22%) sepia(35%) saturate(1262%) hue-rotate(164deg) brightness(90%)
    contrast(96%) drop-shadow(0 1px 1px rgba(255, 255, 255, 0.86));
  opacity: 0.76;
}

.special-npc-theme-anastasia :deep(.special-npc-attribute),
.special-npc-theme-anastasia :deep(.special-npc-profile-card),
.special-npc-theme-anastasia :deep(.special-npc-list-item),
.special-npc-theme-anastasia :deep(.special-npc-story-block) {
  border-color: rgba(10, 45, 78, 0.16);
  background-color: rgba(250, 252, 253, 0.84);
  box-shadow: 0 8px 18px rgba(30, 67, 91, 0.1);
}

.special-npc-theme-anastasia :deep(.special-npc-attribute),
.special-npc-theme-anastasia :deep(.special-npc-profile-card),
.special-npc-theme-anastasia :deep(.special-npc-list-item),
.special-npc-theme-anastasia :deep(.special-npc-story-block) {
  color: #14304b;
}

.special-npc-theme-anastasia :deep(.special-npc-list-item) {
  overflow: hidden;
  border: 1px solid rgba(10, 45, 78, 0.18);
  border-radius: 10px;
  background:
    radial-gradient(ellipse at 50% 0, rgba(255, 255, 255, 0.96), transparent 64%),
    linear-gradient(180deg, rgba(255, 255, 255, 0.92), rgba(229, 239, 245, 0.9));
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.96),
    0 8px 18px rgba(30, 67, 91, 0.12);
}

.special-npc-theme-anastasia :deep(.special-npc-list-item-header) {
  border-bottom-color: rgba(10, 45, 78, 0.14);
}

.special-npc-theme-anastasia :deep(.special-npc-list-item h3) {
  color: #0a2d4e;
  text-shadow: none;
}

.special-npc-theme-anastasia :deep(.special-npc-list-item h3::before) {
  text-shadow: none;
}

.special-npc-theme-anastasia :deep(.special-npc-tag) {
  border-color: rgba(10, 45, 78, 0.2);
  background: rgba(255, 255, 255, 0.62);
  color: #315873;
}

.special-npc-theme-anastasia :deep(.special-npc-effect-item),
.special-npc-theme-anastasia :deep(.special-npc-effect-text),
.special-npc-theme-anastasia :deep(.special-npc-description),
.special-npc-theme-anastasia :deep(.special-npc-line) {
  color: #1f405a;
  text-shadow: none;
}

.special-npc-theme-anastasia :deep(.special-npc-resources .special-npc-resource) {
  border: 0;
  background: transparent;
  box-shadow: none;
}

.special-npc-theme-anastasia :deep(.special-npc-resources .special-npc-resource-value) {
  color: #0a2d4e;
}

.special-npc-theme-anastasia :deep(.special-npc-text-block) {
  --corner: rgba(10, 45, 78, 0.54);
  border-color: rgba(10, 45, 78, 0.22);
  border-radius: 10px;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.94), rgba(228, 238, 244, 0.9)), rgba(232, 240, 245, 0.94);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.96),
    0 8px 18px rgba(30, 67, 91, 0.12);
}

.special-npc-theme-anastasia :deep(.special-npc-text-block h3) {
  color: #0a2d4e;
  text-shadow: none;
}

.special-npc-theme-anastasia :deep(.special-npc-text-block p) {
  color: #1f405a;
  text-shadow: none;
}

.special-npc-theme-ailisi .special-npc-data-pane {
  color: #17324a;
  background-color: #dcefeb;
  background-image:
    radial-gradient(circle at 15% 16%, rgba(240, 120, 166, 0.13) 0 3px, transparent 4px),
    radial-gradient(circle at 82% 23%, rgba(169, 140, 232, 0.14) 0 4px, transparent 5px),
    radial-gradient(circle at 62% 78%, rgba(66, 169, 150, 0.12) 0 5px, transparent 6px),
    radial-gradient(circle at 34% 55%, transparent 0 19px, rgba(114, 88, 186, 0.08) 20px 21px, transparent 22px),
    linear-gradient(135deg, rgba(247, 251, 250, 0.82), rgba(220, 239, 235, 0.58) 52%, rgba(235, 226, 250, 0.5));
  background-size:
    88px 88px,
    126px 126px,
    148px 148px,
    180px 180px,
    auto;
}

.special-npc-theme-ailisi .special-npc-data-pane > * {
  position: relative;
  z-index: 2;
}

.special-npc-ailisi-header-deco {
  position: absolute !important;
  top: 26px;
  right: 34px;
  left: 34px;
  z-index: 1 !important;
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 76px;
  pointer-events: none;
}

.special-npc-ailisi-jellyfish {
  position: relative;
  width: 58px;
  height: 68px;
  color: #7258ba;
}

.special-npc-ailisi-jellyfish .jellyfish-dome {
  position: absolute;
  top: 5px;
  left: 6px;
  width: 46px;
  height: 31px;
  border: 2px solid currentColor;
  border-bottom: 0;
  border-radius: 26px 26px 10px 10px;
  background: rgba(169, 140, 232, 0.18);
  box-shadow: inset 7px 5px 0 rgba(255, 255, 255, 0.42);
}

.special-npc-ailisi-jellyfish .jellyfish-dome::after {
  content: '';
  position: absolute;
  top: 8px;
  right: 9px;
  width: 8px;
  aspect-ratio: 1;
  border-radius: 50%;
  background: #f078a6;
}

.special-npc-ailisi-jellyfish .jellyfish-tentacle {
  position: absolute;
  top: 35px;
  width: 8px;
  height: 25px;
  border-left: 2px solid currentColor;
  border-radius: 50%;
}

.special-npc-ailisi-jellyfish .tentacle-one {
  left: 15px;
  transform: rotate(8deg);
}

.special-npc-ailisi-jellyfish .tentacle-two {
  left: 27px;
  transform: rotate(-9deg);
}

.special-npc-ailisi-jellyfish .tentacle-three {
  left: 39px;
  transform: rotate(11deg);
}

.special-npc-ailisi-toy-blocks {
  display: grid;
  grid-template-columns: repeat(2, 18px);
  gap: 6px;
  transform: rotate(8deg);
}

.special-npc-ailisi-toy-blocks i {
  width: 18px;
  aspect-ratio: 1;
  border: 2px solid #42a996;
  border-radius: 5px;
  background: #f7fbfa;
  box-shadow: 2px 2px 0 rgba(169, 140, 232, 0.28);
}

.special-npc-ailisi-toy-blocks i:nth-child(2),
.special-npc-ailisi-toy-blocks i:nth-child(3) {
  border-color: #be4f79;
  background: #fbe7ef;
}

.special-npc-theme-ailisi :deep(.special-npc-header .special-npc-name) {
  color: #17324a;
  text-shadow: 0 1px 0 rgba(255, 255, 255, 0.9);
}

.special-npc-theme-ailisi :deep(.special-npc-header .special-npc-level),
.special-npc-theme-ailisi :deep(.special-npc-header .special-npc-tier) {
  color: #7258ba;
  text-shadow: none;
}

.special-npc-theme-ailisi :deep(.special-npc-header .special-npc-subtitle) {
  color: #31536d;
  text-shadow: none;
}

.special-npc-theme-ailisi :deep(.special-npc-page-title) {
  color: #17324a;
}

.special-npc-theme-ailisi :deep(.special-npc-page-title-line) {
  background: linear-gradient(90deg, transparent, #42a996, #a98ce8, transparent);
}

.special-npc-theme-ailisi :deep(.special-npc-page-title h2) {
  color: #17324a;
  text-shadow: none;
}

.special-npc-theme-ailisi :deep(.special-npc-attribute) {
  border: 1px solid #85b7b0;
  border-radius: 18px 18px 42% 42% / 18px 18px 22% 22%;
  background: linear-gradient(180deg, #f9fcfb 0%, #e6f4f1 58%, #bfe8df 100%);
  clip-path: none;
  color: #17324a;
  box-shadow:
    0 8px 14px rgba(23, 50, 74, 0.1),
    inset 0 0 0 4px rgba(255, 255, 255, 0.5);
}

.special-npc-theme-ailisi :deep(.special-npc-attribute::before) {
  content: '';
  position: absolute;
  top: 0;
  right: 0;
  left: 0;
  height: 9px;
  border-bottom: 2px solid #7258ba;
  background: #83dccb;
}

.special-npc-theme-ailisi :deep(.special-npc-attribute-name) {
  color: #17324a;
}

.special-npc-theme-ailisi :deep(.special-npc-attribute-total) {
  color: #be4f79;
  text-shadow: none;
}

.special-npc-theme-ailisi :deep(.special-npc-resources::before) {
  top: 50%;
  right: 11%;
  bottom: auto;
  left: 11%;
  z-index: -1;
  height: 3px;
  background: #a98ce8;
}

.special-npc-theme-ailisi :deep(.special-npc-resources::after) {
  display: none;
}

.special-npc-theme-ailisi :deep(.special-npc-resource) {
  border: 1px solid #88b8b1;
  border-radius: 46% 54% 51% 49% / 51% 44% 56% 49%;
  background: rgba(247, 251, 250, 0.95);
  box-shadow:
    inset -8px -7px 0 rgba(131, 220, 203, 0.18),
    0 7px 12px rgba(23, 50, 74, 0.1);
}

.special-npc-theme-ailisi :deep(.special-npc-resource:not(:last-child)::after) {
  display: none;
}

.special-npc-theme-ailisi :deep(.special-npc-resource-name) {
  color: #7258ba;
}

.special-npc-theme-ailisi :deep(.special-npc-resource-value) {
  color: #17324a;
  text-shadow: none;
}

.special-npc-theme-ailisi :deep(.special-npc-profile-card),
.special-npc-theme-ailisi :deep(.special-npc-text-block),
.special-npc-theme-ailisi :deep(.special-npc-list-item) {
  border: 1px solid #a6c3c0;
  border-radius: 10px;
  background: rgba(247, 251, 250, 0.95);
  color: #17324a;
  box-shadow: 0 8px 18px rgba(23, 50, 74, 0.1);
}

.special-npc-theme-ailisi :deep(.special-npc-text-block h3),
.special-npc-theme-ailisi :deep(.special-npc-list-item h3) {
  color: #17324a;
  text-shadow: none;
}

.special-npc-theme-ailisi :deep(.special-npc-list-item-header) {
  border-bottom-color: rgba(66, 169, 150, 0.26);
}

.special-npc-theme-ailisi :deep(.special-npc-tag) {
  border-color: #a7c5c1;
  background: #fff;
  color: #31536d;
}

.special-npc-theme-ailisi :deep(.special-npc-effect-item),
.special-npc-theme-ailisi :deep(.special-npc-effect-text),
.special-npc-theme-ailisi :deep(.special-npc-description),
.special-npc-theme-ailisi :deep(.special-npc-line),
.special-npc-theme-ailisi :deep(.special-npc-text-block p) {
  color: #31536d;
  text-shadow: none;
}

.special-npc-theme-ailisi :deep(.special-npc-tabs) {
  border: 1px solid #9abbb7;
  border-radius: 8px;
  background: rgba(247, 251, 250, 0.96);
  box-shadow: 0 7px 16px rgba(23, 50, 74, 0.1);
}

.special-npc-theme-ailisi :deep(.special-npc-tab-button) {
  color: #31536d;
}

.special-npc-theme-ailisi :deep(.special-npc-tab-button:hover),
.special-npc-theme-ailisi :deep(.special-npc-tab-button.active) {
  background: #d9f0ea;
  color: #17324a;
}

.special-npc-theme-ailisi :deep(.special-npc-tab-button.active::after) {
  background: #f078a6;
}

.special-npc-theme-ailisi .special-npc-story-block,
.special-npc-theme-ailisi .special-npc-story-link-block {
  border-color: #a6c3c0;
  border-radius: 10px;
  background: rgba(247, 251, 250, 0.95);
  color: #17324a;
  box-shadow: 0 8px 18px rgba(23, 50, 74, 0.1);
}

.special-npc-theme-ailisi .special-npc-story-block h3,
.special-npc-theme-ailisi .special-npc-story-link-copy h3 {
  color: #17324a;
  text-shadow: none;
}

.special-npc-theme-ailisi .special-npc-story-block p,
.special-npc-theme-ailisi .special-npc-story-link-copy p {
  color: #31536d;
}

.special-npc-theme-ailisi #import-action-menu {
  border-color: #9abbb7;
  background: rgba(247, 251, 250, 0.98);
  box-shadow: 0 12px 30px rgba(23, 50, 74, 0.2);
}

.special-npc-theme-ailisi #import-action-menu button {
  color: #17324a;
}

.special-npc-theme-ailisi #import-action-menu button:hover:not(:disabled) {
  border-color: rgba(66, 169, 150, 0.34);
  background: #e4f3ef;
}

.special-npc-theme-venus .special-npc-data-pane::after {
  background:
    linear-gradient(
      180deg,
      rgba(var(--special-npc-tier-accent-rgb), 0.14) 0%,
      rgba(27, 69, 111, 0.18) 34%,
      rgba(4, 15, 36, 0.36) 100%
    ),
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
  background: linear-gradient(
    180deg,
    rgba(var(--special-npc-tier-accent-rgb), 0.2),
    rgba(var(--special-npc-tier-accent-rgb), 0.08)
  );
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

@media (min-width: 901px) {
  .special-npc-theme-anastasia .special-npc-shell.is-overview-tab .special-npc-panels {
    overflow-y: hidden;
    padding-bottom: 0;
  }
}

@media (max-width: 900px) {
  .special-npc-wrapper {
    max-width: min(100%, 480px);
  }

  .special-npc-shell {
    flex-direction: column;
    height: 216.4251cqw;
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
    padding: 10px 12px;
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

  .special-npc-shell :deep(.special-npc-tab-scroll) {
    padding-right: 12px;
  }

  .special-npc-mobile-header-overlay :deep(.special-npc-header.compact.ornate) {
    gap: 2px;
  }

  .special-npc-mobile-header-overlay :deep(.special-npc-header.compact.ornate .special-npc-name-rail.top) {
    height: 16px;
    margin-bottom: -2px;
  }

  .special-npc-mobile-header-overlay :deep(.special-npc-header.compact.ornate .special-npc-name-rail.bottom) {
    height: 14px;
    margin-top: -2px;
  }

  .special-npc-mobile-header-overlay :deep(.special-npc-header.compact.ornate .rail-flourish) {
    height: 12px;
  }

  .special-npc-mobile-header-overlay :deep(.special-npc-header.compact.ornate .rail-center) {
    height: 14px;
  }

  .special-npc-mobile-header-overlay :deep(.special-npc-header.compact.ornate .special-npc-name) {
    font-size: 20px;
    line-height: 1.08;
  }

  .special-npc-mobile-header-overlay :deep(.special-npc-header.compact.ornate .special-npc-level-tier) {
    margin-bottom: 0;
    padding: 0;
  }

  .special-npc-mobile-header-overlay :deep(.special-npc-header.compact.ornate .special-npc-level),
  .special-npc-mobile-header-overlay :deep(.special-npc-header.compact.ornate .special-npc-tier) {
    font-size: 10px;
  }

  .special-npc-mobile-header-overlay :deep(.special-npc-header.compact.ornate .special-npc-badge-separator) {
    margin: 0 8px;
  }

  .special-npc-mobile-header-overlay :deep(.special-npc-header.compact.ornate .special-npc-subtitle) {
    gap: 4px;
    font-size: 10px;
    line-height: 1.35;
  }

  .special-npc-theme-anastasia .special-npc-mobile-header-overlay {
    padding: 8px 10px 9px;
    border-color: rgba(10, 45, 78, 0.42);
    border-radius: 8px;
    background: linear-gradient(180deg, rgba(252, 254, 255, 0.94), rgba(211, 226, 234, 0.9));
    box-shadow:
      0 7px 18px rgba(16, 46, 73, 0.2),
      inset 0 1px 0 rgba(255, 255, 255, 0.94);
    backdrop-filter: none;
    -webkit-backdrop-filter: none;
  }

  .special-npc-theme-anastasia .special-npc-mobile-header-overlay :deep(.special-npc-header.compact.ornate) {
    gap: 3px;
  }

  .special-npc-theme-anastasia .special-npc-mobile-header-overlay :deep(.special-npc-name-rail) {
    display: none;
  }

  .special-npc-theme-anastasia
    .special-npc-mobile-header-overlay
    :deep(.special-npc-header.compact.ornate .special-npc-name) {
    max-width: 100%;
    color: #0a2d4e;
    font-size: clamp(15px, 5.4cqw, 20px);
    line-height: 1.16;
    text-shadow: 0 1px 0 rgba(255, 255, 255, 0.94);
    white-space: normal;
    overflow-wrap: anywhere;
  }

  .special-npc-theme-anastasia
    .special-npc-mobile-header-overlay
    :deep(.special-npc-header.compact.ornate .special-npc-level),
  .special-npc-theme-anastasia
    .special-npc-mobile-header-overlay
    :deep(.special-npc-header.compact.ornate .special-npc-tier) {
    color: #a87a27;
    font-size: 10px;
  }

  .special-npc-theme-anastasia
    .special-npc-mobile-header-overlay
    :deep(.special-npc-header.compact.ornate .special-npc-subtitle) {
    color: #315873;
    font-size: 9px;
    line-height: 1.28;
    text-shadow: none;
  }

  .special-npc-theme-ailisi .special-npc-mobile-header-overlay {
    max-height: 24%;
    padding: 10px 12px;
    overflow: hidden;
    border-color: rgba(66, 169, 150, 0.72);
    background: rgba(237, 245, 243, 0.94);
    box-shadow: 0 9px 22px rgba(23, 50, 74, 0.22);
    backdrop-filter: none;
    -webkit-backdrop-filter: none;
  }

  .special-npc-theme-ailisi .special-npc-mobile-header-overlay :deep(.special-npc-name) {
    max-width: 100%;
    color: #17324a;
    font-size: clamp(18px, 6cqw, 24px);
    line-height: 1.2;
    text-shadow: none;
    white-space: normal;
    overflow-wrap: anywhere;
  }

  .special-npc-theme-ailisi .special-npc-mobile-header-overlay :deep(.special-npc-level),
  .special-npc-theme-ailisi .special-npc-mobile-header-overlay :deep(.special-npc-tier) {
    color: #7258ba;
    font-size: 10px;
  }

  .special-npc-theme-ailisi .special-npc-mobile-header-overlay :deep(.special-npc-subtitle) {
    color: #31536d;
    font-size: 10px;
    line-height: 1.3;
    text-shadow: none;
  }

  .special-npc-theme-ailisi :deep(.special-npc-attribute) {
    border-radius: 12px 12px 42% 42% / 12px 12px 22% 22%;
  }

  .special-npc-theme-ailisi .special-npc-ailisi-header-deco {
    display: none;
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
    padding: 9px 10px;
  }

  .special-npc-theme-anastasia :deep(.special-npc-list-item) {
    margin-bottom: 12px;
    padding: 15px;
  }

  .special-npc-theme-anastasia :deep(.special-npc-list-item-header) {
    gap: 6px;
    margin-bottom: 10px;
    padding-bottom: 8px;
  }

  .special-npc-theme-anastasia :deep(.special-npc-list-item h3) {
    font-size: 17px;
    line-height: 1.3;
  }

  .special-npc-theme-anastasia :deep(.special-npc-list-item h3::before) {
    margin-right: 8px;
    font-size: 16px;
  }

  .special-npc-theme-anastasia :deep(.special-npc-list-item-type) {
    padding: 3px 12px;
    font-size: 12px;
  }

  .special-npc-theme-anastasia :deep(.special-npc-tags) {
    gap: 6px;
    margin-bottom: 10px;
  }

  .special-npc-theme-anastasia :deep(.special-npc-tag) {
    padding: 3px 8px;
    font-size: 11px;
  }

  .special-npc-theme-anastasia :deep(.special-npc-effect-list) {
    gap: 6px;
  }

  .special-npc-theme-anastasia :deep(.special-npc-effect-item),
  .special-npc-theme-anastasia :deep(.special-npc-effect-text),
  .special-npc-theme-anastasia :deep(.special-npc-description),
  .special-npc-theme-anastasia :deep(.special-npc-line) {
    font-size: 14px;
    line-height: 1.55;
  }

  .special-npc-theme-anastasia :deep(.special-npc-description),
  .special-npc-theme-anastasia :deep(.special-npc-line) {
    margin-top: 6px;
  }

  .special-npc-theme-ailisi :deep(.special-npc-list-item) {
    margin-bottom: 12px;
    padding: 15px;
  }

  .special-npc-theme-ailisi :deep(.special-npc-list-item-header) {
    gap: 6px;
    margin-bottom: 10px;
    padding-bottom: 8px;
  }

  .special-npc-theme-ailisi :deep(.special-npc-list-item h3) {
    font-size: 17px;
    line-height: 1.3;
  }

  .special-npc-theme-ailisi :deep(.special-npc-list-item-type) {
    padding: 3px 10px;
    font-size: 12px;
  }

  .special-npc-theme-ailisi :deep(.special-npc-tags) {
    gap: 6px;
    margin-bottom: 10px;
  }

  .special-npc-theme-ailisi :deep(.special-npc-tag) {
    padding: 3px 8px;
    font-size: 11px;
  }

  .special-npc-theme-ailisi :deep(.special-npc-effect-item),
  .special-npc-theme-ailisi :deep(.special-npc-effect-text),
  .special-npc-theme-ailisi :deep(.special-npc-description),
  .special-npc-theme-ailisi :deep(.special-npc-line),
  .special-npc-theme-ailisi :deep(.special-npc-text-block p) {
    font-size: 14px;
    line-height: 1.55;
  }

  #import-action-menu {
    right: 10px;
    bottom: 56px;
    min-width: 170px;
  }
}
</style>
