<template>
  <article class="special-npc-list-item" :class="qualityClass(item)">
    <div class="special-npc-list-item-header">
      <h3>{{ itemName(item) }}</h3>
      <span v-if="subtitle" class="special-npc-list-item-type">{{ subtitle }}</span>
    </div>

    <div v-if="tags.length > 0" class="special-npc-tags">
      <span v-for="tag in tags" :key="tag" class="special-npc-tag">{{ tag }}</span>
    </div>

    <p v-if="cost" class="special-npc-line"><span>消耗</span>{{ cost }}</p>

    <ul v-if="effects.length > 0" class="special-npc-effect-list">
      <li v-for="entry in effects" :key="`${entry.name}-${entry.content}`" class="special-npc-effect-item">
        <span v-if="!entry.fallback" class="special-npc-effect-name">{{ entry.name }}</span>
        <span class="special-npc-effect-text">{{ entry.content }}</span>
      </li>
    </ul>

    <div v-if="statusLines.length > 0" class="special-npc-status-lines">
      <p v-for="line in statusLines" :key="line.label" class="special-npc-line">
        <span>{{ line.label }}</span>{{ line.value }}
      </p>
    </div>

    <p v-if="description" class="special-npc-description">{{ description }}</p>
  </article>
</template>

<script setup lang="ts">
import { computed } from 'vue';

import {
  itemCost,
  itemDescription,
  itemEffectEntriesOrDescription,
  itemName,
  itemQuality,
  itemTags,
  itemType,
  qualityClass,
  statusEffectDuration,
  statusEffectLayers,
  statusEffectSource,
  type ItemObject,
} from '../../services/characterViewModel';

const props = withDefaults(
  defineProps<{
    item: ItemObject;
    showCost?: boolean;
    variant?: 'item' | 'status';
  }>(),
  {
    showCost: false,
    variant: 'item',
  },
);

const tags = computed(() => itemTags(props.item));
const quality = computed(() => itemQuality(props.item));
const typeText = computed(() => itemType(props.item));
const subtitle = computed(() => [quality.value, typeText.value].filter(Boolean).join(' / '));
const effects = computed(() => itemEffectEntriesOrDescription(props.item));
const description = computed(() => {
  const text = itemDescription(props.item);
  if (!text) return '';

  const isDescriptionFallback =
    effects.value.length === 1 && effects.value[0].fallback && effects.value[0].content === text;
  return isDescriptionFallback ? '' : text;
});
const cost = computed(() => (props.showCost ? itemCost(props.item) : ''));
const statusLines = computed(() => {
  if (props.variant !== 'status') return [];
  return [
    { label: '层数', value: statusEffectLayers(props.item) },
    { label: '剩余时间', value: statusEffectDuration(props.item) },
    { label: '来源', value: statusEffectSource(props.item) },
  ].filter(line => line.value);
});
</script>

<style scoped>
.special-npc-list-item {
  position: relative;
  margin-bottom: 24px;
  padding: 24px 32px;
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 2px;
  background: rgba(12, 14, 18, 0.85);
  box-shadow:
    inset 0 0 40px rgba(0, 0, 0, 0.8),
    0 10px 20px rgba(0, 0, 0, 0.5);
  --item-color: var(--special-npc-race-accent);
}

.special-npc-list-item.quality-mythic {
  --item-color: #f21455;
}

.special-npc-list-item.quality-legendary {
  --item-color: #d4af37;
}

.special-npc-list-item.quality-epic {
  --item-color: #cf95ff;
}

.special-npc-list-item.quality-rare {
  --item-color: #62bbff;
}

.special-npc-list-item.quality-uncommon {
  --item-color: #7be495;
}

.special-npc-list-item-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}

.special-npc-list-item h3 {
  display: flex;
  align-items: center;
  margin: 0;
  color: #ffffff;
  font-size: 20px;
  font-weight: 700;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.8);
}

.special-npc-list-item h3::before {
  content: '✦';
  margin-right: 12px;
  color: var(--item-color);
  font-size: 20px;
  font-weight: 400;
  text-shadow: 0 0 12px var(--item-color);
}

.special-npc-list-item-type {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 4px 20px;
  color: var(--item-color);
  font-family: 'Noto Serif SC', 'Source Han Serif SC', serif;
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.08em;
  white-space: nowrap;
}

.special-npc-list-item-type::before {
  content: '';
  position: absolute;
  inset: 0;
  z-index: -1;
  background: linear-gradient(90deg, transparent, currentColor, transparent);
  opacity: 0.15;
}

.special-npc-list-item-type::after {
  content: '';
  position: absolute;
  inset: 0;
  border-top: 1px solid currentColor;
  border-bottom: 1px solid currentColor;
  opacity: 0.4;
  mask-image: linear-gradient(90deg, transparent, black 20%, black 80%, transparent);
  -webkit-mask-image: linear-gradient(90deg, transparent, black 20%, black 80%, transparent);
}

.special-npc-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 16px;
}

.special-npc-tag {
  padding: 4px 12px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 2px;
  background: rgba(0, 0, 0, 0.4);
  color: #a0a5b5;
  font-size: 12px;
}

.special-npc-effect-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.special-npc-effect-item {
  color: #e2e8f0;
  line-height: 1.7;
}

.special-npc-effect-name,
.special-npc-line span {
  display: inline-block;
  margin-right: 8px;
  color: var(--item-color);
  font-weight: 700;
}

.special-npc-effect-text,
.special-npc-description,
.special-npc-line {
  color: #e2e8f0;
  white-space: pre-line;
}

.special-npc-description,
.special-npc-line {
  margin: 8px 0 0;
  line-height: 1.7;
}

.special-npc-status-lines {
  margin-top: 10px;
}

@media (max-width: 640px) {
  .special-npc-list-item {
    padding: 20px;
  }

  .special-npc-list-item-header {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
