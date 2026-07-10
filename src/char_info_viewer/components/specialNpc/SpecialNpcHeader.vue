<template>
  <header class="special-npc-header" :class="{ compact, ornate }" :style="ornate ? venusNameFrameCssVars : undefined">
    <div v-if="ornate" class="special-npc-name-rail top" aria-hidden="true">
      <span class="rail-flourish left"></span>
      <span class="rail-line"></span>
      <span class="rail-center"></span>
      <span class="rail-line"></span>
      <span class="rail-flourish right"></span>
    </div>

    <div class="special-npc-level-tier">
      <span class="special-npc-level">LV. {{ vm.levelText }}</span>
      <span class="special-npc-badge-separator">✦</span>
      <span class="special-npc-tier">{{ vm.tierText }}</span>
    </div>

    <h1 class="special-npc-name">{{ vm.nameText }}</h1>

    <div v-if="metaItems.length > 0" class="special-npc-subtitle">
      <template v-for="(item, index) in metaItems" :key="`${index}-${item}`">
        <span v-if="index > 0" class="special-npc-meta-sep">◆</span>
        <span>{{ item }}</span>
      </template>
    </div>

    <div v-if="ornate" class="special-npc-name-rail bottom" aria-hidden="true">
      <span class="rail-line"></span>
      <span class="rail-center"></span>
      <span class="rail-line"></span>
    </div>
  </header>
</template>

<script setup lang="ts">
import { computed } from 'vue';

import type { CharacterViewModel } from '../../services/characterViewModel';
import { venusNameFrameCssVars } from './venusAssets';

const props = withDefaults(
  defineProps<{
    vm: CharacterViewModel;
    compact?: boolean;
    ornate?: boolean;
  }>(),
  {
    compact: false,
    ornate: false,
  },
);

const metaItems = computed(() =>
  [props.vm.raceText, props.vm.identityText, props.vm.classText].filter(item => item && item !== '-'),
);
</script>

<style scoped>
.special-npc-header {
  container-type: inline-size;
  display: flex;
  flex-shrink: 0;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  margin-bottom: 28px;
  text-align: center;
}

.special-npc-name-rail {
  display: grid;
  width: min(100%, 560px);
  align-items: center;
  pointer-events: none;
}

.special-npc-name-rail.top {
  height: 26px;
  grid-template-columns: minmax(42px, 0.28fr) minmax(34px, 1fr) auto minmax(34px, 1fr) minmax(42px, 0.28fr);
  column-gap: 8px;
  margin-bottom: -4px;
}

.special-npc-name-rail.bottom {
  width: min(86%, 520px);
  height: 24px;
  grid-template-columns: minmax(42px, 1fr) auto minmax(42px, 1fr);
  column-gap: 8px;
  margin-top: -4px;
}

.rail-line {
  height: 1px;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(var(--special-npc-tier-accent-rgb), 0.88),
    rgba(255, 255, 240, 0.44),
    rgba(var(--special-npc-tier-accent-rgb), 0.72),
    transparent
  );
  filter:
    drop-shadow(0 0 6px rgba(var(--special-npc-tier-accent-rgb), 0.2))
    drop-shadow(0 2px 8px rgba(0, 0, 0, 0.3));
  opacity: 0.78;
}

.rail-flourish,
.rail-center {
  background-position: center;
  background-repeat: no-repeat;
  background-size: contain;
  filter:
    drop-shadow(0 0 7px rgba(var(--special-npc-tier-accent-rgb), 0.24))
    drop-shadow(0 2px 8px rgba(0, 0, 0, 0.3));
  opacity: 0.78;
}

.rail-flourish {
  height: 18px;
}

.rail-flourish.left {
  background-image: var(--venus-name-left-flourish-url);
}

.rail-flourish.right {
  background-image: var(--venus-name-right-flourish-url);
}

.special-npc-name-rail.top .rail-center {
  width: clamp(118px, 26cqw, 164px);
  height: 26px;
  background-image: var(--venus-name-center-crest-url);
}

.special-npc-name-rail.bottom .rail-center {
  width: clamp(108px, 24cqw, 152px);
  height: 22px;
  background-image: var(--venus-name-bottom-crest-url);
  opacity: 0.66;
}

.special-npc-level-tier {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 12px;
  padding: 4px 0;
}

.special-npc-level-tier::before,
.special-npc-level-tier::after {
  content: '';
  position: absolute;
  top: 50%;
  width: 40px;
  height: 1px;
  background: linear-gradient(90deg, transparent, var(--special-npc-tier-accent), transparent);
  transform: translateY(-50%);
}

.special-npc-level-tier::before {
  right: 100%;
  margin-right: 16px;
}

.special-npc-level-tier::after {
  left: 100%;
  margin-left: 16px;
}

.special-npc-level,
.special-npc-tier {
  font-family: 'Noto Serif SC', 'Source Han Serif SC', 'Noto Sans SC', serif;
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-shadow: 0 0 8px rgba(var(--special-npc-tier-accent-rgb), 0.4);
}

.special-npc-level {
  color: var(--special-npc-tier-accent);
}

.special-npc-tier {
  color: var(--special-npc-tier-accent);
}

.special-npc-badge-separator {
  margin: 0 16px;
  color: rgba(var(--special-npc-tier-accent-rgb), 0.5);
  font-size: 10px;
}

.special-npc-name {
  max-width: 100%;
  margin: 0 0 4px;
  overflow-wrap: anywhere;
  color: #ffffff;
  font-family: 'Noto Serif SC', 'Source Han Serif SC', 'Noto Sans SC', serif;
  font-size: 42px;
  font-weight: 700;
  line-height: 1.12;
  text-shadow: 0 2px 12px rgba(0, 0, 0, 0.5);
}

.special-npc-header.ornate {
  gap: 5px;
  margin-bottom: 38px;
}

.special-npc-header.ornate .special-npc-level-tier {
  margin-bottom: -2px;
}

.special-npc-header.ornate .special-npc-level-tier::before,
.special-npc-header.ornate .special-npc-level-tier::after {
  content: none;
}

.special-npc-header.ornate .special-npc-name {
  max-width: 100%;
  overflow: visible;
  white-space: nowrap;
  color: #fffdf5;
  font-size: clamp(30px, 5.3cqw, 42px);
  letter-spacing: 0;
  text-shadow:
    0 2px 0 rgba(12, 22, 34, 0.45),
    0 3px 12px rgba(0, 0, 0, 0.68),
    0 0 18px rgba(var(--special-npc-tier-accent-rgb), 0.22);
}

.special-npc-header.ornate .special-npc-subtitle {
  max-width: 100%;
  color: rgba(255, 255, 246, 0.95);
  font-weight: 700;
  white-space: nowrap;
}

.special-npc-subtitle {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: #e2e8f0;
  font-size: 14px;
  line-height: 1.5;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.8);
}

.special-npc-meta-sep {
  display: inline-block;
  color: rgba(var(--special-npc-race-accent-rgb), 0.7);
  font-size: 10px;
  transform: scale(0.8) rotate(45deg);
}

@media (max-width: 640px) {
  .special-npc-header {
    margin-bottom: 20px;
  }

  .special-npc-name {
    font-size: 30px;
  }
}

.special-npc-header.compact {
  gap: 8px;
  margin-bottom: 0;
}

.special-npc-header.compact .special-npc-level-tier {
  margin-bottom: 4px;
}

.special-npc-header.compact .special-npc-name {
  font-size: 30px;
}

.special-npc-header.compact .special-npc-subtitle {
  font-size: 12px;
}

.special-npc-header.compact.ornate .special-npc-name {
  font-size: clamp(23px, 7cqw, 30px);
}

.special-npc-header.compact.ornate .special-npc-name-rail {
  width: min(100%, 360px);
}

@media (max-width: 420px) {
  .special-npc-header.compact .special-npc-name {
    font-size: 26px;
  }

  .special-npc-header.compact .special-npc-level,
  .special-npc-header.compact .special-npc-tier {
    font-size: 12px;
  }
}
</style>
