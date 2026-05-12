<template>
  <div class="item-viewer-root">
    <div v-if="loading" class="status-card">正在加载 MVU 与物品卡片…</div>
    <div v-else-if="fatalError" class="status-card error">{{ fatalError }}</div>
    <div v-else-if="segments.length === 0" class="status-card">未检测到可显示内容。</div>
    <div v-else class="content-flow">
      <template v-for="segment in segments" :key="segment.id">
        <div v-if="segment.kind === 'text'" class="story-block">{{ segment.content }}</div>
        <section v-else class="item-card-shell">
          <div class="item-card-actions">
            <template v-if="segment.block.data">
              <button
                type="button"
                class="action-btn primary"
                :disabled="importingCardId === segment.block.id"
                @click="handleImportMc(segment.block.id)"
              >
                导入给主角
              </button>
              <div class="npc-action-group">
                <select
                  v-model="npcSelections[segment.block.id]"
                  class="npc-select"
                  :disabled="npcOptions.length === 0 || importingCardId === segment.block.id"
                >
                  <option value="">选择 NPC</option>
                  <option v-for="npc in npcOptions" :key="npc.key" :value="npc.key">
                    {{ npc.label }}
                  </option>
                </select>
                <button
                  type="button"
                  class="action-btn"
                  :disabled="!npcSelections[segment.block.id] || importingCardId === segment.block.id"
                  @click="handleImportNpc(segment.block.id)"
                >
                  导入给NPC
                </button>
              </div>
            </template>
            <div v-else class="item-error-text">{{ segment.block.error }}</div>
          </div>
          <div v-if="statusMap[segment.block.id]" class="item-status" :class="statusMap[segment.block.id].kind">
            {{ statusMap[segment.block.id].message }}
          </div>
        </section>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue';

import { ensureVariableAccess, getNpcOptions, importItemCardToMvu } from './services/importService';
import { splitContentSegments } from './services/parser';
import type { ContentSegment, ItemCardBlock, ItemImportTarget, NpcOption } from './types';

type ItemStatus = {
  kind: 'success' | 'error';
  message: string;
};

const segments = ref<ContentSegment[]>([]);
const loading = ref(true);
const fatalError = ref('');
const npcOptions = ref<NpcOption[]>([]);
const npcSelections = reactive<Record<string, string>>({});
const statusMap = reactive<Record<string, ItemStatus>>({});
const importingCardId = ref('');

function getSourceText(): string {
  const scriptElement = document.getElementById('data-source');
  return scriptElement?.textContent?.trim() || '';
}

function findBlock(blockId: string): ItemCardBlock | null {
  const segment = segments.value.find(entry => entry.kind === 'item' && entry.block.id === blockId);
  return segment?.kind === 'item' ? segment.block : null;
}

function setStatus(blockId: string, status: ItemStatus) {
  statusMap[blockId] = status;
}

async function runImport(blockId: string, target: ItemImportTarget) {
  const block = findBlock(blockId);
  if (!block?.data) {
    setStatus(blockId, { kind: 'error', message: block?.error || '该卡片无法导入。' });
    return;
  }

  importingCardId.value = blockId;
  try {
    await importItemCardToMvu(block.data, target);
    const ownerLabel = target.ownerType === 'mc' ? '主角' : target.ownerName || 'NPC';
    setStatus(blockId, { kind: 'success', message: `已导入到 ${ownerLabel}` });
  } catch (error: any) {
    console.error('Item import failed:', error);
    setStatus(blockId, { kind: 'error', message: error?.message || String(error) });
  } finally {
    importingCardId.value = '';
  }
}

async function handleImportMc(blockId: string) {
  await runImport(blockId, { ownerType: 'mc' });
}

async function handleImportNpc(blockId: string) {
  const ownerName = npcSelections[blockId];
  if (!ownerName) {
    setStatus(blockId, { kind: 'error', message: '请先选择一个 NPC。' });
    return;
  }

  await runImport(blockId, { ownerType: 'npc', ownerName });
}

async function initialize() {
  try {
    const source = getSourceText();
    if (!source) {
      fatalError.value = '未检测到原始文本内容（#data-source 为空）。';
      return;
    }

    await ensureVariableAccess();
    segments.value = splitContentSegments(source);
    npcOptions.value = await getNpcOptions();

    segments.value.forEach(segment => {
      if (segment.kind === 'item' && npcOptions.value.length > 0) {
        npcSelections[segment.block.id] = '';
      }
    });
  } catch (error: any) {
    console.error('Item viewer init failed:', error);
    fatalError.value = error?.message || String(error);
  } finally {
    loading.value = false;
  }
}

initialize();
</script>

<style scoped>
.item-viewer-root {
  width: 100%;
  color: #e8ecf6;
  font-family: 'Noto Sans SC', 'Microsoft YaHei', sans-serif;
}

.content-flow {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.story-block,
.status-card {
  white-space: pre-line;
  line-height: 1.7;
  padding: 10px 12px;
  border-radius: 10px;
  background: rgba(12, 16, 24, 0.72);
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.status-card.error {
  color: #ffb3b3;
  border-color: rgba(255, 120, 120, 0.35);
}

.item-card-shell {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.item-card-body :deep(*) {
  max-width: 100%;
  box-sizing: border-box;
}

.item-card-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
  padding: 0 4px;
}

.npc-action-group {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  align-items: center;
}

.action-btn,
.npc-select {
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.15);
  background: rgba(26, 32, 45, 0.88);
  color: #edf3ff;
  padding: 8px 12px;
  font-size: 0.92rem;
}

.action-btn {
  cursor: pointer;
  transition:
    background 0.2s ease,
    border-color 0.2s ease,
    transform 0.2s ease;
}

.action-btn.primary {
  border-color: rgba(112, 184, 255, 0.45);
  background: rgba(31, 66, 113, 0.9);
}

.action-btn:hover:not(:disabled) {
  transform: translateY(-1px);
  background: rgba(58, 72, 96, 0.95);
}

.action-btn:disabled,
.npc-select:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.npc-select {
  min-width: 148px;
}

.item-status,
.item-error-text {
  padding: 0 4px;
  font-size: 0.88rem;
}

.item-status.success {
  color: #8be28b;
}

.item-status.error,
.item-error-text {
  color: #ff9f9f;
}

@media (max-width: 640px) {
  .item-card-actions,
  .npc-action-group {
    flex-direction: column;
    align-items: stretch;
  }

  .action-btn,
  .npc-select {
    width: 100%;
  }
}
</style>
