<template>
  <header class="special-npc-page-title">
    <span class="special-npc-page-title-line" aria-hidden="true"></span>
    <h2>
      <span aria-hidden="true">◆</span>
      {{ title }}
      <span aria-hidden="true">◆</span>
    </h2>
    <span class="special-npc-page-title-line" aria-hidden="true"></span>
  </header>
</template>

<script setup lang="ts">
defineProps<{
  title: string;
}>();
</script>

<style scoped>
.special-npc-page-title {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 14px;
  margin: 0 0 22px;
  padding: 6px 0 2px;
  color: var(--special-npc-race-accent);
}

.special-npc-page-title-line {
  width: 72px;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(var(--special-npc-race-accent-rgb), 0.62), transparent);
}

.special-npc-page-title h2 {
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 0;
  font-family: 'Noto Serif SC', 'Source Han Serif SC', serif;
  font-size: 18px;
  font-weight: 700;
  letter-spacing: 0.16em;
  text-align: center;
  text-shadow:
    0 0 8px rgba(var(--special-npc-race-accent-rgb), 0.55),
    0 2px 10px rgba(0, 0, 0, 0.8);
}

.special-npc-page-title h2 span {
  color: rgba(var(--special-npc-race-accent-rgb), 0.52);
  font-size: 9px;
  line-height: 1;
}

@media (max-width: 640px) {
  .special-npc-page-title {
    gap: 10px;
    margin-bottom: 18px;
    padding-top: 4px;
  }

  .special-npc-page-title-line {
    width: 52px;
  }

  .special-npc-page-title h2 {
    gap: 10px;
    font-size: 16px;
  }
}
</style>
