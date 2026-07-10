<template>
  <SpecialNpcDefaultDivinityPanel v-if="variant === 'default'" :vm="vm" />

  <section
    v-else
    class="special-npc-divinity-stage"
    :class="{ 'is-open': curtainOpen, 'show-skill-popup': skillPopupOpen }"
    :style="stageStyle"
  >
    <div class="special-npc-divinity-frame" aria-hidden="true"></div>

    <div class="special-npc-divinity-curtain" aria-hidden="true">
      <span class="curtain-panel left"></span>
      <span class="curtain-panel right"></span>
      <span class="curtain-valance"></span>
    </div>

    <div class="special-npc-divinity-title">
      <span class="special-npc-divinity-foreign">Le Théâtre des Rêves</span>
      <h3>{{ title || '煌海梦幻大剧场' }}</h3>
      <span class="special-npc-divinity-title-ornament" aria-hidden="true"></span>
    </div>

    <button
      v-if="!curtainOpen"
      class="special-npc-divinity-open-button"
      type="button"
      aria-label="打开煌海梦幻大剧场"
      @click="openCurtain"
    >
      点击开幕
    </button>

    <button
      v-else
      class="special-npc-divinity-spell-quote"
      type="button"
      aria-controls="special-npc-divinity-content"
      :aria-expanded="skillPopupOpen"
      @click="skillPopupOpen = !skillPopupOpen"
    >
      <span class="spell-quote-label">{{ skillPopupOpen ? '收起共演守则' : '查看共演守则' }}</span>
      <span class="spell-quote-text">此乃共演守则，别说吾没有事前告知唷！</span>
      <span class="spell-quote-icon" aria-hidden="true">⌄</span>
    </button>

    <div id="special-npc-divinity-content" class="special-npc-divinity-content" :aria-hidden="!skillPopupOpen">
      <article v-for="(section, index) in sections" :key="`${section.kind}-${section.title}-${index}`" class="stage-skill">
        <div class="stage-skill-header">
          <span class="special-npc-divinity-keyword">{{ section.kind }}</span>
          <div class="stage-skill-title-group">
            <span class="stage-skill-type">{{ section.typeLabel }}</span>
            <strong class="stage-skill-title">{{ section.title }}</strong>
          </div>
        </div>
        <p class="stage-skill-body">{{ section.body || '无' }}</p>
      </article>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';

import type { CharacterViewModel } from '../../services/characterViewModel';
import type { SpecialNpcProfile } from '../../specialNpcProfiles';
import { buildDivinitySections } from './divinitySections';
import SpecialNpcDefaultDivinityPanel from './SpecialNpcDefaultDivinityPanel.vue';
import { venusNameFrameCssVars } from './venusAssets';

const props = defineProps<{ vm: CharacterViewModel; profile: SpecialNpcProfile | null }>();

const curtainOpen = ref(false);
const skillPopupOpen = ref(false);
const title = computed(() => props.vm.divinityGodTitle || '煌海梦幻大剧场');
const variant = computed(() => props.profile?.divinityVariant ?? 'default');
const sections = computed(() => buildDivinitySections(props.vm));
const stageStyle = computed<Record<string, string>>(() => {
  const bgUrl = props.profile?.divinityStageBackgroundUrl;
  return {
    '--stage-frame-url': venusNameFrameCssVars['--venus-name-bottom-crest-url'],
    ...(bgUrl ? { '--stage-bg-url': `url("${bgUrl}")` } : {}),
  };
});

function openCurtain(): void {
  curtainOpen.value = true;
}

watch(
  () => props.vm.nameText,
  () => {
    curtainOpen.value = false;
    skillPopupOpen.value = false;
  },
);
</script>

<style scoped>
.special-npc-divinity-stage {
  --stage-gold: #f6d982;
  --stage-gold-rgb: 246, 217, 130;
  --stage-blue: #0a2853;
  --stage-deep: #041226;
  --stage-jade: #70e5bd;
  --stage-frame-url: none;
  --stage-bg-url: url('https://wsrv.nl/?url=files.catbox.moe%2F3by4cx.png');
  position: relative;
  container-type: inline-size;
  display: grid;
  overflow: hidden;
  width: min(100%, 560px);
  aspect-ratio: 1.23 / 1;
  min-height: 0;
  margin: 0 auto;
  border-radius: 8px;
  background:
    linear-gradient(180deg, rgba(3, 9, 22, 0.08), rgba(4, 16, 34, 0.22) 52%, rgba(2, 8, 20, 0.76) 100%),
    radial-gradient(ellipse at 50% 18%, rgba(255, 252, 230, 0.22), transparent 34%),
    radial-gradient(ellipse at 50% 74%, rgba(112, 229, 189, 0.12), transparent 48%),
    var(--stage-bg-url) center / cover no-repeat,
    linear-gradient(180deg, rgba(2, 8, 20, 0.26), rgba(10, 40, 83, 0.78) 34%, rgba(4, 18, 38, 0.92)),
    var(--stage-deep);
  box-shadow:
    inset 0 0 0 1px rgba(var(--stage-gold-rgb), 0.2),
    inset 0 18px 44px rgba(var(--stage-gold-rgb), 0.07),
    inset 0 -24px 48px rgba(2, 10, 24, 0.54),
    0 18px 42px rgba(0, 0, 0, 0.42);
  isolation: isolate;
}

.special-npc-divinity-frame {
  position: absolute;
  inset: clamp(22px, 6cqw, 34px) clamp(28px, 8cqw, 52px);
  z-index: 4;
  border-top: 1px solid rgba(var(--stage-gold-rgb), 0.64);
  border-bottom: 1px solid rgba(var(--stage-gold-rgb), 0.34);
  opacity: 0.78;
  pointer-events: none;
  transition: opacity 0.42s ease;
}

.special-npc-divinity-frame::before,
.special-npc-divinity-frame::after {
  content: '';
  position: absolute;
  top: 0;
  width: clamp(88px, 24cqw, 132px);
  height: clamp(26px, 7cqw, 36px);
  background: var(--stage-frame-url) center / contain no-repeat;
  filter:
    brightness(0) saturate(100%) invert(87%) sepia(34%) saturate(595%) hue-rotate(354deg) brightness(104%) contrast(94%)
    drop-shadow(0 0 8px rgba(var(--stage-gold-rgb), 0.22));
}

.special-npc-divinity-frame::before {
  left: 0;
  transform: translateY(-50%);
}

.special-npc-divinity-frame::after {
  right: 0;
  transform: translateY(-50%) scaleX(-1);
}

.special-npc-divinity-curtain {
  position: absolute;
  inset: 0;
  z-index: 2;
  overflow: hidden;
  pointer-events: none;
}

.curtain-panel,
.curtain-valance {
  position: absolute;
  background:
    linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.08), transparent 12% 18%, rgba(0, 0, 0, 0.22) 24%, transparent 34%),
    repeating-linear-gradient(90deg, rgba(89, 10, 34, 0.95) 0 18px, rgba(138, 18, 52, 0.96) 18px 36px, rgba(55, 7, 27, 0.98) 36px 54px),
    linear-gradient(180deg, rgba(var(--stage-gold-rgb), 0.18), rgba(93, 8, 36, 0.98) 34%, rgba(24, 3, 15, 0.98));
  box-shadow:
    inset 0 0 28px rgba(0, 0, 0, 0.42),
    inset 0 1px 0 rgba(255, 238, 172, 0.18);
}

.curtain-panel {
  top: 0;
  bottom: 0;
  width: 50%;
  transition:
    width 1.25s cubic-bezier(0.2, 0.75, 0.22, 1),
    transform 1.25s cubic-bezier(0.2, 0.75, 0.22, 1),
    clip-path 1.25s cubic-bezier(0.2, 0.75, 0.22, 1),
    filter 1.25s ease;
}

.curtain-panel.left {
  left: 0;
  transform-origin: top left;
}

.curtain-panel.right {
  right: 0;
  transform-origin: top right;
}

.curtain-valance {
  top: 0;
  right: 0;
  left: 0;
  height: 18%;
  border-bottom: 1px solid rgba(var(--stage-gold-rgb), 0.34);
  background:
    radial-gradient(ellipse at 50% 100%, rgba(255, 238, 172, 0.18), transparent 56%),
    repeating-linear-gradient(90deg, rgba(63, 8, 30, 0.98) 0 28px, rgba(129, 16, 50, 0.98) 28px 56px, rgba(46, 5, 23, 0.98) 56px 84px);
  transition:
    height 0.8s cubic-bezier(0.2, 0.75, 0.22, 1),
    opacity 0.8s ease;
}

.special-npc-divinity-title {
  position: absolute;
  top: 50%;
  right: clamp(34px, 9cqw, 64px);
  left: clamp(34px, 9cqw, 64px);
  z-index: 5;
  display: grid;
  justify-items: center;
  gap: clamp(8px, 2.4cqw, 12px);
  text-align: center;
  transform: translateY(-52%);
  transition:
    opacity 0.42s ease,
    transform 0.7s cubic-bezier(0.2, 0.72, 0.22, 1),
    filter 0.7s ease;
}

.special-npc-divinity-foreign {
  color: rgba(255, 255, 246, 0.94);
  font-family: Cinzel, Georgia, serif;
  font-size: clamp(11px, 2.7cqw, 14px);
  font-weight: 700;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  text-shadow:
    0 0 12px rgba(var(--stage-gold-rgb), 0.38),
    0 2px 8px rgba(0, 0, 0, 0.7);
}

.special-npc-divinity-title h3 {
  margin: 0;
  color: #fffdf5;
  font-family: 'Noto Serif SC', 'Source Han Serif SC', serif;
  font-size: clamp(25px, 7.2cqw, 36px);
  font-weight: 700;
  letter-spacing: 0.08em;
  text-shadow:
    0 0 10px rgba(var(--stage-gold-rgb), 0.52),
    0 0 24px rgba(152, 204, 234, 0.24),
    0 3px 12px rgba(0, 0, 0, 0.82);
}

.special-npc-divinity-title-ornament {
  width: min(74%, 360px);
  height: clamp(22px, 5cqw, 32px);
  background: var(--stage-frame-url) center / contain no-repeat;
  opacity: 0.72;
  filter:
    brightness(0) saturate(100%) invert(87%) sepia(34%) saturate(595%) hue-rotate(354deg) brightness(104%) contrast(94%)
    drop-shadow(0 0 7px rgba(var(--stage-gold-rgb), 0.22));
}

.special-npc-divinity-open-button,
.special-npc-divinity-spell-quote {
  position: absolute;
  z-index: 6;
  border: none;
  background: none;
  cursor: pointer;
  color: rgba(255, 244, 210, 0.9);
  font-family: 'Noto Serif SC', 'Source Han Serif SC', serif;
  font-weight: 800;
  text-shadow:
    0 0 12px rgba(var(--stage-gold-rgb), 0.36),
    0 2px 8px rgba(0, 0, 0, 0.72);
}

.special-npc-divinity-open-button {
  right: 0;
  bottom: clamp(72px, 18cqw, 108px);
  left: 0;
  letter-spacing: 0.18em;
}

.special-npc-divinity-spell-quote {
  right: clamp(82px, 20cqw, 230px);
  bottom: clamp(26px, 7cqw, 42px);
  left: clamp(82px, 20cqw, 230px);
  display: grid;
  grid-template-columns: 1fr auto;
  grid-template-areas:
    'label icon'
    'text icon';
  align-items: center;
  justify-items: center;
  gap: 4px 12px;
  min-height: 54px;
  padding: 9px 18px;
  border: 1px solid rgba(var(--stage-gold-rgb), 0.42);
  border-radius: 999px;
  background:
    radial-gradient(ellipse at 50% 0, rgba(255, 244, 210, 0.16), transparent 68%),
    linear-gradient(180deg, rgba(8, 22, 45, 0.76), rgba(3, 12, 29, 0.92));
  font-size: clamp(12px, 2.4cqw, 14px);
  letter-spacing: 0.06em;
  opacity: 0;
  pointer-events: none;
  box-shadow:
    0 0 0 1px rgba(255, 255, 246, 0.04),
    0 0 20px rgba(var(--stage-gold-rgb), 0.18),
    inset 0 1px 0 rgba(255, 255, 246, 0.16);
  transform: translateY(10px);
  transition:
    opacity 0.42s ease 0.56s,
    transform 0.42s ease 0.56s,
    border-color 0.2s ease,
    box-shadow 0.2s ease;
}

.special-npc-divinity-spell-quote:hover {
  border-color: rgba(var(--stage-gold-rgb), 0.76);
  box-shadow:
    0 0 0 1px rgba(255, 255, 246, 0.06),
    0 0 26px rgba(var(--stage-gold-rgb), 0.28),
    inset 0 1px 0 rgba(255, 255, 246, 0.18);
}

.spell-quote-label {
  grid-area: label;
  color: var(--stage-gold);
  font-size: 12px;
  letter-spacing: 0.14em;
}

.spell-quote-text {
  grid-area: text;
  color: rgba(255, 252, 242, 0.94);
}

.spell-quote-icon {
  grid-area: icon;
  color: var(--stage-gold);
  font-family: Inter, sans-serif;
  font-size: 18px;
  line-height: 1;
  transition: transform 0.2s ease;
}

.special-npc-divinity-content {
  position: absolute;
  top: clamp(96px, 21cqw, 128px);
  right: clamp(82px, 20cqw, 230px);
  bottom: clamp(96px, 20cqw, 126px);
  left: clamp(82px, 20cqw, 230px);
  z-index: 5;
  display: grid;
  align-content: center;
  gap: 8px;
  overflow-y: auto;
  opacity: 0;
  scrollbar-width: thin;
  scrollbar-color: rgba(var(--stage-gold-rgb), 0.34) transparent;
  transform: translateY(16px);
  transition:
    opacity 0.45s ease,
    transform 0.55s cubic-bezier(0.2, 0.72, 0.22, 1);
  pointer-events: none;
}

.stage-skill {
  position: relative;
  display: grid;
  grid-template-columns: minmax(58px, auto) 1fr;
  gap: 10px;
  align-items: start;
  margin: 0;
  padding: 12px 14px;
  border-top: 1px solid rgba(var(--stage-gold-rgb), 0.3);
  border-bottom: 1px solid rgba(var(--stage-gold-rgb), 0.16);
  background:
    radial-gradient(ellipse at 14% 50%, rgba(var(--stage-gold-rgb), 0.14), transparent 42%),
    linear-gradient(90deg, rgba(255, 244, 210, 0.075), rgba(152, 204, 234, 0.035) 48%, rgba(3, 12, 30, 0.18)),
    linear-gradient(180deg, rgba(255, 255, 246, 0.025), rgba(5, 17, 39, 0.32));
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.04);
}

.stage-skill-header {
  display: contents;
}

.special-npc-divinity-keyword {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 58px;
  padding: 4px 8px;
  border: 1px solid rgba(var(--stage-gold-rgb), 0.58);
  background: rgba(var(--stage-gold-rgb), 0.14);
  color: var(--stage-gold);
  font-family: 'Noto Serif SC', 'Source Han Serif SC', serif;
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.08em;
}

.stage-skill-title-group {
  display: grid;
  gap: 3px;
}

.stage-skill-type {
  color: rgba(216, 228, 236, 0.76);
  font-family: Cinzel, Georgia, serif;
  font-size: 10px;
  letter-spacing: 0.16em;
  text-transform: uppercase;
}

.stage-skill-title {
  color: #fffdf5;
  font-family: 'Noto Serif SC', 'Source Han Serif SC', serif;
  font-size: 15px;
  letter-spacing: 0.04em;
}

.stage-skill-body {
  grid-column: 2;
  margin: 0;
  color: rgba(255, 252, 242, 0.96);
  font-size: 12px;
  font-weight: 600;
  line-height: 1.58;
  white-space: pre-line;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.6);
}

.special-npc-divinity-stage.is-open .curtain-panel.left {
  width: 18%;
  clip-path: polygon(0 0, 100% 0, 68% 100%, 0 100%);
  filter: brightness(0.78);
  transform: matrix(1, 0, -0.14, 1, 0, 0);
}

.special-npc-divinity-stage.is-open .curtain-panel.right {
  width: 18%;
  clip-path: polygon(0 0, 100% 0, 100% 100%, 32% 100%);
  filter: brightness(0.78);
  transform: matrix(1, 0, 0.14, 1, 0, 0);
}

.special-npc-divinity-stage.is-open .curtain-valance {
  height: 5%;
  opacity: 0.72;
}

.special-npc-divinity-stage.is-open .special-npc-divinity-title,
.special-npc-divinity-stage.is-open .special-npc-divinity-frame {
  opacity: 0;
  pointer-events: none;
}

.special-npc-divinity-stage.is-open .special-npc-divinity-title {
  transform: translateY(-68%) scale(0.96);
}

.special-npc-divinity-stage.is-open .special-npc-divinity-spell-quote {
  opacity: 1;
  pointer-events: auto;
  transform: translateY(0);
}

.special-npc-divinity-stage.show-skill-popup .special-npc-divinity-content {
  opacity: 1;
  pointer-events: auto;
  transform: translateY(0);
}

.special-npc-divinity-stage.show-skill-popup .special-npc-divinity-spell-quote {
  opacity: 0.84;
}

.special-npc-divinity-stage.show-skill-popup .spell-quote-icon {
  transform: rotate(180deg);
}

@media (prefers-reduced-motion: reduce) {
  .special-npc-divinity-title,
  .curtain-panel,
  .curtain-valance,
  .special-npc-divinity-spell-quote,
  .special-npc-divinity-content {
    transition: none;
  }
}

@media (max-width: 640px) {
  .special-npc-divinity-stage {
    width: 100%;
    aspect-ratio: 0.86 / 1;
  }

  .stage-skill {
    grid-template-columns: 1fr;
    gap: 7px;
    padding: 11px 12px;
  }

  .stage-skill-body {
    grid-column: auto;
  }

  .special-npc-divinity-spell-quote,
  .special-npc-divinity-content {
    right: clamp(34px, 10cqw, 48px);
    left: clamp(34px, 10cqw, 48px);
  }
}
</style>
