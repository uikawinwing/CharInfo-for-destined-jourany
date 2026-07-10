<template>
  <nav class="special-npc-tabs" aria-label="角色资料分页">
    <button
      v-for="tab in tabs"
      :key="tab.key"
      class="special-npc-tab-button"
      :class="{ active: activeTab === tab.key }"
      type="button"
      @click="$emit('setTab', tab.key)"
    >
      {{ tab.label }}
    </button>
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
import type { SpecialNpcTab, SpecialNpcTabKey } from './types';

defineProps<{
  tabs: SpecialNpcTab[];
  activeTab: SpecialNpcTabKey;
  importing: boolean;
  importButtonText: string;
}>();

defineEmits<{
  setTab: [tab: SpecialNpcTabKey];
  toggleImportMenu: [];
}>();
</script>

<style scoped>
.special-npc-tabs {
  position: relative;
  z-index: 5;
  display: flex;
  flex-shrink: 0;
  justify-content: center;
  gap: 28px;
  margin-top: 0;
  margin-bottom: 0;
  padding-top: 12px;
  overflow-x: auto;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  background: linear-gradient(180deg, rgba(20, 22, 30, 0.2) 0%, rgba(20, 22, 30, 0.96) 35%);
  scrollbar-width: none;
}

.special-npc-tabs::-webkit-scrollbar {
  display: none;
}

.special-npc-tab-button {
  position: relative;
  min-height: 40px;
  padding: 0 0 12px;
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

.special-npc-nav-save-button {
  position: relative;
  min-height: 40px;
  padding: 0 0 12px;
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

@media (max-width: 640px) {
  .special-npc-tabs {
    justify-content: flex-start;
    gap: 18px;
  }

  .special-npc-nav-save-button {
    position: sticky;
    right: 0;
    flex: 0 0 auto;
    margin-left: auto;
  }
}
</style>
