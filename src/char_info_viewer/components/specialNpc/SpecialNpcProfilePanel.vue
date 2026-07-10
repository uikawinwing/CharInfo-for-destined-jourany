<template>
  <section class="special-npc-info-grid">
    <SpecialNpcOverviewPanel
      class="special-npc-mobile-profile-stats"
      :attributes="attributes"
      :resource-boxes="resourceBoxes"
      @toggle-attribute-formula="$emit('toggleAttributeFormula', $event)"
    />

    <article v-for="block in blocks" :key="block.title" class="special-npc-text-block">
      <h3>{{ block.title }}</h3>
      <p>{{ block.text }}</p>
    </article>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue';

import type { CharacterViewModel, ResourceBox } from '../../services/characterViewModel';
import SpecialNpcOverviewPanel from './SpecialNpcOverviewPanel.vue';
import type { AttributeView } from './types';

const props = defineProps<{
  vm: CharacterViewModel;
  attributes: AttributeView[];
  resourceBoxes: ResourceBox[];
}>();

defineEmits<{
  toggleAttributeFormula: [key: string];
}>();

const blocks = computed(() =>
  [
    { title: '性格', text: props.vm.personalityText },
    { title: '外貌特质', text: props.vm.appearanceText },
    { title: '喜爱', text: props.vm.likesText },
    { title: '衣物装饰', text: props.vm.attireText },
  ].filter(block => block.text),
);
</script>

<style scoped>
.special-npc-info-grid {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.special-npc-mobile-profile-stats {
  display: none;
}

.special-npc-text-block {
  --corner: rgba(var(--special-npc-race-accent-rgb), 0.6);
  position: relative;
  padding: 28px 36px;
  border: 1px solid rgba(255, 255, 255, 0.03);
  background:
    linear-gradient(var(--corner), var(--corner)),
    linear-gradient(var(--corner), var(--corner)),
    linear-gradient(var(--corner), var(--corner)),
    linear-gradient(var(--corner), var(--corner)),
    linear-gradient(var(--corner), var(--corner)),
    linear-gradient(var(--corner), var(--corner)),
    linear-gradient(var(--corner), var(--corner)),
    linear-gradient(var(--corner), var(--corner)),
    radial-gradient(ellipse at center, rgba(30, 34, 42, 0.4) 0%, rgba(10, 12, 16, 0.8) 100%);
  background-repeat: no-repeat;
  background-position:
    0 0,
    0 0,
    100% 0,
    100% 0,
    100% 100%,
    100% 100%,
    0 100%,
    0 100%,
    0 0;
  background-size:
    12px 1px,
    1px 12px,
    12px 1px,
    1px 12px,
    12px 1px,
    1px 12px,
    12px 1px,
    1px 12px,
    auto;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
}

.special-npc-text-block::before,
.special-npc-text-block::after {
  content: '';
  position: absolute;
  right: 15%;
  left: 15%;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(var(--special-npc-race-accent-rgb), 0.4), transparent);
}

.special-npc-text-block::before {
  top: 0;
}

.special-npc-text-block::after {
  bottom: 0;
}

.special-npc-text-block h3 {
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 0 18px;
  color: var(--special-npc-race-accent);
  font-family: 'Noto Serif SC', 'Source Han Serif SC', serif;
  font-size: 18px;
  font-weight: 700;
  letter-spacing: 0.15em;
  text-align: center;
  text-shadow: 0 2px 8px rgba(var(--special-npc-race-accent-rgb), 0.3);
}

.special-npc-text-block h3::before,
.special-npc-text-block h3::after {
  content: '◆';
  margin: 0 16px;
  color: rgba(var(--special-npc-race-accent-rgb), 0.45);
  font-size: 10px;
}

.special-npc-text-block p {
  margin: 0;
  color: #e2e8f0;
  font-size: 15px;
  line-height: 1.8;
  white-space: pre-line;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.8);
}

@media (max-width: 900px) {
  .special-npc-mobile-profile-stats {
    display: flex;
  }
}

@media (max-width: 640px) {
  .special-npc-text-block {
    padding: 22px 20px;
  }
}
</style>
