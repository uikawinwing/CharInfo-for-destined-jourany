<template>
  <nav class="special-npc-tabs" aria-label="角色资料分页">
    <button
      v-if="homeTab"
      class="special-npc-tab-button special-npc-home-button"
      :class="{ active: activeTab === homeTab.key }"
      :aria-current="activeTab === homeTab.key ? 'page' : undefined"
      type="button"
      @click="$emit('setTab', homeTab.key)"
    >
      {{ homeTab.label }}
    </button>

    <div class="special-npc-tab-scroll">
      <button
        v-for="tab in detailTabs"
        :key="tab.key"
        class="special-npc-tab-button"
        :class="{ active: activeTab === tab.key }"
        :aria-current="activeTab === tab.key ? 'page' : undefined"
        type="button"
        @click="$emit('setTab', tab.key)"
      >
        {{ tab.label }}
      </button>
    </div>

    <button
      class="special-npc-nav-save-button"
      :disabled="importing"
      type="button"
      aria-label="保存或导入"
      @click.stop="$emit('toggleImportMenu')"
    >
      {{ importing ? '保存中' : '保存' }}
    </button>
  </nav>
</template>

<script setup lang="ts">
import { computed } from 'vue';

import type { SpecialNpcTab, SpecialNpcTabKey } from './types';

const props = defineProps<{
  tabs: SpecialNpcTab[];
  activeTab: SpecialNpcTabKey;
  importing: boolean;
  importButtonText: string;
}>();

defineEmits<{
  setTab: [tab: SpecialNpcTabKey];
  toggleImportMenu: [];
}>();

const homeTab = computed(() => props.tabs.find(tab => tab.key === 'overview') ?? null);
const detailTabs = computed(() => props.tabs.filter(tab => tab.key !== 'overview'));
</script>

<style scoped>
.special-npc-tabs {
  position: relative;
  z-index: 5;
  display: flex;
  flex-shrink: 0;
  align-items: stretch;
  min-height: var(--special-npc-tabs-height);
  margin-top: 0;
  margin-bottom: 0;
  overflow: hidden;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  background: linear-gradient(180deg, rgba(20, 22, 30, 0.2) 0%, rgba(20, 22, 30, 0.96) 35%);
}

.special-npc-tab-scroll {
  display: flex;
  flex: 1 1 auto;
  min-width: 0;
  justify-content: center;
  gap: 20px;
  overflow-x: auto;
  scrollbar-width: none;
}

.special-npc-tab-scroll::-webkit-scrollbar {
  display: none;
}

.special-npc-tab-button {
  position: relative;
  flex: 0 0 auto;
  min-height: 44px;
  padding: 6px 8px;
  border: none;
  background: none;
  color: #a0a5b5;
  cursor: pointer;
  font-family: 'Noto Sans SC', 'Microsoft YaHei', sans-serif;
  font-size: 15px;
  font-weight: 500;
  white-space: nowrap;
  transition: color 0.2s ease;
}

.special-npc-tab-button:hover,
.special-npc-tab-button.active {
  color: var(--special-npc-race-accent);
}

.special-npc-tab-button.active::after {
  content: '';
  position: absolute;
  right: 0;
  bottom: -1px;
  left: 0;
  height: 2px;
  background: var(--special-npc-race-accent);
}

.special-npc-home-button {
  z-index: 2;
  padding-right: 12px;
  padding-left: 12px;
}

.special-npc-nav-save-button {
  position: relative;
  flex: 0 0 auto;
  min-height: 44px;
  padding: 6px 12px;
  border: none;
  background: none;
  color: #a0a5b5;
  cursor: pointer;
  font-family: 'Noto Sans SC', 'Microsoft YaHei', sans-serif;
  font-size: 15px;
  font-weight: 500;
  white-space: nowrap;
  transition:
    color 0.2s ease,
    opacity 0.2s ease;
}

.special-npc-nav-save-button:disabled {
  opacity: 0.7;
  cursor: wait;
}

.special-npc-nav-save-button:hover:not(:disabled) {
  color: var(--special-npc-race-accent);
}

.special-npc-tab-button:focus-visible,
.special-npc-nav-save-button:focus-visible {
  z-index: 3;
  outline: 2px solid var(--special-npc-race-accent);
  outline-offset: -3px;
}

.special-npc-nav-save-button::after {
  content: '';
  position: absolute;
  right: 0;
  bottom: -1px;
  left: 0;
  height: 2px;
  background: color-mix(in srgb, var(--special-npc-race-accent) 62%, transparent);
  opacity: 0.42;
}

:global(.special-npc-theme-anastasia .special-npc-tabs) {
  border-top-color: rgba(10, 45, 78, 0.3);
  background: linear-gradient(180deg, rgba(228, 237, 242, 0.94), rgba(190, 210, 221, 0.96));
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.82);
}

:global(.special-npc-theme-anastasia .special-npc-tab-button),
:global(.special-npc-theme-anastasia .special-npc-nav-save-button) {
  color: #315873;
  font-weight: 700;
  text-shadow: none;
}

:global(.special-npc-theme-anastasia .special-npc-tab-button:hover),
:global(.special-npc-theme-anastasia .special-npc-tab-button.active),
:global(.special-npc-theme-anastasia .special-npc-nav-save-button:hover:not(:disabled)) {
  color: #0a2d4e;
}

:global(.special-npc-theme-anastasia .special-npc-tab-button.active::after),
:global(.special-npc-theme-anastasia .special-npc-nav-save-button::after) {
  background: #bd3b4b;
  opacity: 0.82;
}

@media (max-width: 640px) {
  .special-npc-tabs {
    min-height: 48px;
  }

  .special-npc-tab-scroll {
    justify-content: flex-start;
    gap: 4px;
    padding: 0 6px;
    overflow-x: auto;
    mask-image: linear-gradient(90deg, transparent, #000 8px, #000 calc(100% - 8px), transparent);
  }

  .special-npc-tab-button,
  .special-npc-nav-save-button {
    min-height: 48px;
    padding: 0 10px;
  }

  .special-npc-home-button,
  .special-npc-nav-save-button {
    z-index: 2;
    flex: 0 0 auto;
    min-width: 58px;
    background: color-mix(in srgb, var(--special-npc-bg) 94%, transparent);
  }

  .special-npc-home-button {
    border-right: 1px solid rgba(var(--special-npc-race-accent-rgb), 0.16);
  }

  .special-npc-nav-save-button {
    border-left: 1px solid rgba(var(--special-npc-race-accent-rgb), 0.16);
  }
}
</style>
