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

    <blockquote v-if="entranceQuoteText" class="special-npc-entrance-quote">
      <span class="special-npc-entrance-quote-ornament" aria-hidden="true">
        <span class="special-npc-entrance-quote-diamond"></span>
      </span>
      <span class="special-npc-entrance-quote-text">{{ entranceQuoteText }}</span>
      <span class="special-npc-entrance-quote-tail" aria-hidden="true"></span>
    </blockquote>
  </section>
</template>

<script setup lang="ts">
import type { ResourceBox } from '../../services/characterViewModel';
import type { AttributeView } from './types';

withDefaults(
  defineProps<{
    attributes: AttributeView[];
    resourceBoxes: ResourceBox[];
    entranceQuoteText?: string;
  }>(),
  {
    entranceQuoteText: '',
  },
);

const emit = defineEmits<{
  toggleAttributeFormula: [key: string];
}>();
</script>

<style scoped>
@import url("https://fontsapi.zeoseven.com/293/main/result.css");

.special-npc-overview {
  display: flex;
  flex-direction: column;
  height: 100%;
  gap: 20px;
}

.special-npc-attributes {
  --flag-width: var(--special-npc-flag-width);
  --flag-min-height: var(--special-npc-flag-height);
  --flag-gap: var(--special-npc-flag-gap);
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: var(--flag-gap);
  width: min(100%, var(--special-npc-overview-width));
  margin: 8px auto 0;
  max-width: calc((var(--flag-width) * 3) + (var(--flag-gap) * 2));
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

:global(.special-npc-theme-anastasia .special-npc-attribute) {
  justify-content: center;
  padding: 12px 6px 32px;
  border: 1px solid rgba(10, 45, 78, 0.2);
  border-top-color: rgba(10, 45, 78, 0.54);
  background:
    linear-gradient(
      180deg,
      transparent 0 11px,
      rgba(21, 63, 101, 0.9) 11px 13px,
      transparent 13px 16px,
      rgba(21, 63, 101, 0.72) 16px 18px,
      transparent 18px
    ),
    radial-gradient(ellipse at 50% 0, rgba(255, 255, 255, 0.96), transparent 58%),
    linear-gradient(180deg, rgba(255, 255, 255, 0.96) 0%, rgba(232, 241, 248, 0.94) 52%, rgba(126, 171, 194, 0.82) 100%);
  color: #0a2d4e;
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.96),
    0 10px 22px rgba(30, 67, 91, 0.13);
}

:global(.special-npc-theme-anastasia .special-npc-attribute:hover) {
  border-color: rgba(10, 45, 78, 0.45);
  border-top-color: rgba(10, 45, 78, 0.72);
  background:
    linear-gradient(
      180deg,
      transparent 0 11px,
      rgba(21, 63, 101, 0.96) 11px 13px,
      transparent 13px 16px,
      rgba(21, 63, 101, 0.78) 16px 18px,
      transparent 18px
    ),
    radial-gradient(ellipse at 50% 0, rgba(255, 255, 255, 0.98), transparent 58%),
    linear-gradient(180deg, #ffffff 0%, #f4f9fb 52%, #8eb8cb 100%);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.96),
    0 12px 26px rgba(30, 67, 91, 0.2);
}

:global(.special-npc-theme-anastasia .special-npc-attribute-total) {
  color: #bd3b4b;
  text-shadow: 0 1px 0 rgba(255, 255, 255, 0.9);
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
  display: grid;
  width: min(100%, var(--special-npc-overview-width));
  align-items: center;
  justify-content: center;
  grid-template-columns: repeat(3, minmax(0, var(--special-npc-resource-width)));
  gap: var(--special-npc-resource-gap);
  margin: 0 auto;
  padding: 12px 0;
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
  min-width: 0;
  min-height: var(--special-npc-resource-height);
  padding: 8px 12px;
}

.special-npc-resource:not(:last-child)::after {
  content: '';
  position: absolute;
  top: 15%;
  right: calc(var(--special-npc-resource-gap) / -2);
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

:global(.special-npc-theme-anastasia .special-npc-resources::before),
:global(.special-npc-theme-anastasia .special-npc-resources::after) {
  background: linear-gradient(
    90deg,
    transparent,
    rgba(10, 45, 78, 0.36),
    rgba(208, 166, 83, 0.68),
    rgba(10, 45, 78, 0.36),
    transparent
  );
}

:global(.special-npc-theme-anastasia .special-npc-resource) {
  min-width: 0;
  padding: 0;
  border: 0;
  background: transparent;
  box-shadow: none;
}

:global(.special-npc-theme-anastasia .special-npc-resource:not(:last-child)::after) {
  content: none;
}

:global(.special-npc-theme-anastasia .special-npc-resource-name) {
  color: #a87a27;
  text-shadow: none;
}

:global(.special-npc-theme-anastasia .special-npc-resource-value) {
  color: #0a2d4e;
  text-shadow: 0 1px 0 rgba(255, 255, 255, 0.86);
}

.special-npc-entrance-quote {
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0;
  width: min(88%, 520px);
  margin: auto auto 10px;
  padding: 4px 16px 10px;
  border: 0;
  background: none;
  box-shadow: none;
  color: rgba(255, 255, 255, 0.96);
  font-family: 'LXGW WenKai Mono', 'Kaiti SC', STKaiti, serif;
  font-size: clamp(17px, 1.7cqw, 20px);
  font-style: normal;
  font-weight: normal;
  letter-spacing: 0.06em;
  line-height: 1.6;
  text-align: center;
  white-space: pre-line;
  overflow-wrap: anywhere;
}

.special-npc-entrance-quote-ornament {
  display: flex;
  width: min(46%, 180px);
  align-items: center;
  gap: 10px;
  margin-bottom: 11px;
}

.special-npc-entrance-quote-ornament::before,
.special-npc-entrance-quote-ornament::after {
  content: '';
  flex: 1;
  height: 1px;
}

.special-npc-entrance-quote-ornament::before {
  background: linear-gradient(90deg, transparent, rgba(var(--special-npc-race-accent-rgb), 0.58));
}

.special-npc-entrance-quote-ornament::after {
  background: linear-gradient(90deg, rgba(var(--special-npc-race-accent-rgb), 0.58), transparent);
}

.special-npc-entrance-quote-diamond {
  width: 6px;
  height: 6px;
  border: 1px solid rgba(var(--special-npc-race-accent-rgb), 0.78);
  background: rgba(var(--special-npc-race-accent-rgb), 0.16);
  box-shadow: 0 0 8px rgba(var(--special-npc-race-accent-rgb), 0.26);
  transform: rotate(45deg);
}

.special-npc-entrance-quote-text {
  display: block;
  text-shadow: 0 2px 10px rgba(0, 0, 0, 0.64);
}

.special-npc-entrance-quote-text::before,
.special-npc-entrance-quote-text::after {
  color: currentColor;
  font-size: 0.94em;
  opacity: 0.58;
}

.special-npc-entrance-quote-text::before {
  margin-right: 0.24em;
  content: '“';
}

.special-npc-entrance-quote-text::after {
  margin-left: 0.24em;
  content: '”';
}

.special-npc-entrance-quote-tail {
  width: min(36%, 132px);
  height: 1px;
  margin-top: 11px;
  background: linear-gradient(90deg, transparent, rgba(var(--special-npc-race-accent-rgb), 0.34), transparent);
}

:global(.special-npc-theme-anastasia .special-npc-entrance-quote),
:global(.special-npc-theme-ailisi .special-npc-entrance-quote) {
  color: #31536d;
}

:global(.special-npc-theme-anastasia .special-npc-entrance-quote-text),
:global(.special-npc-theme-ailisi .special-npc-entrance-quote-text) {
  text-shadow: none;
}

@media (max-width: 900px) {
  .special-npc-attributes {
    --flag-width: calc((100% - 16px) / 3);
    --flag-min-height: 104px;
    --flag-gap: 8px;
  }

  :global(.special-npc-theme-anastasia .special-npc-attribute) {
    padding: 12px 4px 32px;
    border-top-width: 1px;
  }

  :global(.special-npc-theme-anastasia .special-npc-resources) {
    flex-wrap: nowrap;
    gap: clamp(12px, 5cqw, 24px);
    margin: 8px 0 20px;
    padding: 13px 0;
  }

  :global(.special-npc-theme-anastasia .special-npc-resource) {
    flex: 0 1 auto;
    min-width: 0;
    padding: 0;
  }

  .special-npc-attribute {
    min-width: 0;
  }

  .special-npc-resources {
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 8px;
  }

  .special-npc-resource {
    padding: 8px;
  }

  .special-npc-resource:not(:last-child)::after {
    content: none;
  }

  .special-npc-entrance-quote {
    width: 100%;
    margin-bottom: 6px;
    padding: 2px 12px 8px;
    font-size: 16px;
    letter-spacing: 0.04em;
  }

  .special-npc-entrance-quote-ornament {
    width: min(42%, 140px);
    gap: 8px;
    margin-bottom: 9px;
  }

  .special-npc-entrance-quote-tail {
    width: min(34%, 112px);
    margin-top: 9px;
  }
}
</style>
