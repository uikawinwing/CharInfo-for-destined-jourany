<template>
  <section class="special-npc-overview">
    <div class="special-npc-attributes">
      <button
        v-for="attr in attributes"
        :key="attr.key"
        class="special-npc-attribute"
        :class="{
          'show-formula': attr.showFormula,
          'has-formula': !!attr.formula,
          'has-warning': attr.isTotalAbnormal || attr.hasFormulaWarning,
        }"
        type="button"
        @click="emit('toggleAttributeFormula', attr.key)"
      >
        <span class="special-npc-attribute-name">{{ attr.short }}</span>
        <span class="special-npc-attribute-total" :class="{ warning: attr.isTotalAbnormal }">{{ attr.total }}</span>
        <span v-if="attr.formula" class="special-npc-attribute-formula">
          <template v-for="part in attr.formulaParts" :key="`${attr.key}-${part.index}-${part.text}`">
            <span v-if="part.index > 0">+</span>
            <span :class="{ warning: part.isWarning }">{{ part.text }}</span>
          </template>
        </span>
      </button>
    </div>

    <div v-if="resourceBoxes.length > 0" class="special-npc-resources">
      <div v-for="resource in resourceBoxes" :key="resource.key" class="special-npc-resource">
        <span class="special-npc-resource-name">{{ resource.label }}</span>
        <span class="special-npc-resource-value">{{ resource.value }}</span>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import type { ResourceBox } from '../../services/characterViewModel';
import type { AttributeView } from './types';

defineProps<{
  attributes: AttributeView[];
  resourceBoxes: ResourceBox[];
}>();

const emit = defineEmits<{
  toggleAttributeFormula: [key: string];
}>();
</script>

<style scoped>
.special-npc-overview {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.special-npc-attributes {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 10px;
  margin-top: 8px;
  --flag-width: 96px;
  --flag-min-height: 128px;
}

.special-npc-attribute {
  position: relative;
  display: flex;
  flex: 0 0 var(--flag-width);
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  width: var(--flag-width);
  min-width: var(--flag-width);
  max-width: var(--flag-width);
  min-height: var(--flag-min-height);
  padding: 15px 5px 36px;
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-top: 2px solid var(--special-npc-race-accent);
  background: rgba(0, 0, 0, 0.3);
  clip-path: polygon(0% 0%, 100% 0%, 100% 85%, 50% 100%, 0% 85%);
  color: #ffffff;
  cursor: default;
  text-align: center;
  transition:
    transform 0.2s ease,
    background 0.2s ease,
    border-color 0.2s ease,
    box-shadow 0.2s ease;
}

.special-npc-attribute.has-formula {
  cursor: pointer;
}

.special-npc-attribute.has-warning {
  border-top-color: #ff7875;
  box-shadow: 0 0 0 1px rgba(255, 120, 117, 0.16);
}

.special-npc-attribute:hover {
  background: rgba(var(--special-npc-race-accent-rgb), 0.1);
  border-color: rgba(var(--special-npc-race-accent-rgb), 0.4);
  box-shadow: 0 5px 20px rgba(var(--special-npc-race-accent-rgb), 0.15);
  transform: translateY(-3px);
}

.special-npc-attribute-name {
  margin-bottom: 6px;
  font-size: 1rem;
  font-weight: 700;
  line-height: 1.05;
}

.special-npc-attribute-total {
  color: var(--special-npc-race-accent);
  font-family: 'Noto Serif SC', 'Source Han Serif SC', serif;
  font-size: 2rem;
  font-weight: 700;
  line-height: 1;
  text-shadow: 0 2px 15px rgba(var(--special-npc-race-accent-rgb), 0.45);
}

:global(.special-npc-theme-venus) .special-npc-attributes {
  gap: 12px;
  margin: 10px auto 26px;
  --flag-width: 152px;
  --flag-min-height: 154px;
  max-width: calc((var(--flag-width) * 3) + 24px);
}

:global(.special-npc-theme-venus) .special-npc-attribute {
  justify-content: center;
  padding: 14px 8px 42px;
  border: 1px solid rgba(185, 215, 232, 0.13);
  border-top: 2px solid rgba(246, 217, 130, 0.9);
  background:
    radial-gradient(ellipse at 50% 0, rgba(246, 217, 130, 0.2), transparent 58%),
    linear-gradient(180deg, rgba(42, 78, 123, 0.88), rgba(8, 27, 60, 0.92) 58%, rgba(5, 15, 38, 0.94));
  box-shadow:
    inset 0 1px 0 rgba(255, 250, 232, 0.08),
    0 12px 28px rgba(0, 0, 0, 0.24),
    0 0 18px rgba(246, 217, 130, 0.08);
}

:global(.special-npc-theme-venus) .special-npc-attribute:hover {
  border-color: rgba(246, 217, 130, 0.38);
  background:
    radial-gradient(ellipse at 50% 0, rgba(246, 217, 130, 0.24), transparent 58%),
    linear-gradient(180deg, rgba(52, 92, 139, 0.9), rgba(9, 31, 69, 0.94) 58%, rgba(5, 15, 38, 0.96));
  box-shadow:
    inset 0 1px 0 rgba(255, 250, 232, 0.1),
    0 14px 30px rgba(0, 0, 0, 0.26),
    0 0 22px rgba(246, 217, 130, 0.12);
}

:global(.special-npc-theme-venus) .special-npc-attribute-total {
  color: #fff;
  text-shadow:
    0 2px 8px rgba(0, 0, 0, 0.72),
    0 0 14px rgba(246, 217, 130, 0.28);
}

.special-npc-attribute-total.warning,
.special-npc-attribute-formula .warning {
  color: #ff9b9b;
  text-shadow: 0 0 10px rgba(255, 77, 77, 0.42);
}

.special-npc-attribute-formula {
  display: none;
  flex-wrap: wrap;
  justify-content: center;
  gap: 2px;
  margin-top: 6px;
  color: var(--special-npc-race-accent);
  font-size: 0.78rem;
  font-weight: 700;
  line-height: 1.2;
}

.special-npc-attribute.show-formula .special-npc-attribute-total {
  display: none;
}

.special-npc-attribute.show-formula .special-npc-attribute-formula {
  display: inline-flex;
}

.special-npc-resources {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 40px;
  padding: 16px 0;
}

.special-npc-resources::before,
.special-npc-resources::after {
  content: '';
  position: absolute;
  right: 15%;
  left: 15%;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(var(--special-npc-race-accent-rgb), 0.18), transparent);
}

.special-npc-resources::before {
  top: 0;
}

.special-npc-resources::after {
  bottom: 0;
}

.special-npc-resource {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 0 20px;
}

.special-npc-resource:not(:last-child)::after {
  content: '';
  position: absolute;
  top: 15%;
  right: -20px;
  bottom: 15%;
  width: 1px;
  background: linear-gradient(180deg, transparent, rgba(var(--special-npc-race-accent-rgb), 0.32), transparent);
}

.special-npc-resource-name {
  color: var(--special-npc-race-accent);
  font-family: 'Noto Serif SC', 'Source Han Serif SC', serif;
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.15em;
  text-shadow: 0 0 10px currentColor;
}

.special-npc-resource-value {
  color: #ffffff;
  font-family: 'Noto Serif SC', 'Source Han Serif SC', serif;
  font-size: 22px;
  font-weight: 700;
  text-shadow: 0 2px 6px rgba(0, 0, 0, 0.8);
}

:global(.special-npc-theme-venus) .special-npc-resources::before,
:global(.special-npc-theme-venus) .special-npc-resources::after {
  background: linear-gradient(90deg, transparent, rgba(185, 215, 232, 0.18), rgba(246, 217, 130, 0.2), transparent);
}

:global(.special-npc-theme-venus) .special-npc-resource-name {
  color: #70e5bd;
  text-shadow: 0 0 10px rgba(112, 229, 189, 0.42);
}

:global(.special-npc-theme-venus) .special-npc-resource-value {
  color: #fff;
  text-shadow:
    0 2px 6px rgba(0, 0, 0, 0.85),
    0 0 12px rgba(246, 217, 130, 0.18);
}

@media (max-width: 900px) {
  .special-npc-attributes {
    --flag-width: calc((100% - 20px) / 3);
    --flag-min-height: calc(var(--flag-width) * 1.2);
  }

  :global(.special-npc-theme-venus) .special-npc-attributes {
    --flag-width: calc((100% - 20px) / 3);
    --flag-min-height: calc(var(--flag-width) * 1.2);
  }

  .special-npc-attribute {
    min-width: 0;
  }

  .special-npc-resources {
    flex-wrap: wrap;
    gap: 18px;
  }

  .special-npc-resource {
    padding: 0 12px;
  }

  .special-npc-resource:not(:last-child)::after {
    content: none;
  }
}
</style>
