import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const repoRoot = new URL('../../', import.meta.url);
const readSource = path => readFile(new URL(path, repoRoot), 'utf8');

const [profilesSource, sheetSource] = await Promise.all([
  readSource('src/char_info_viewer/specialNpcProfiles.ts'),
  readSource('src/char_info_viewer/components/specialNpc/SpecialNpcCharacterSheet.vue'),
]);

test('Ailisi is registered as a visual-only special NPC theme', () => {
  assert.match(profilesSource, /SpecialNpcVisualTheme\s*=\s*[^;]*'ailisi'/);
  assert.match(profilesSource, /'艾璃丝·赛瑞利亚'\s*:\s*\{[\s\S]*?visualTheme:\s*'ailisi'[\s\S]*?\}/);
  assert.doesNotMatch(profilesSource, /性格|技能|背景故事|injectData|displayData/);
});

test('Ailisi production sheet renders stable CSS-only jellyfish and toy decoration', () => {
  assert.match(sheetSource, /const isAilisiTheme = computed/);
  assert.match(sheetSource, /'special-npc-theme-ailisi':\s*isAilisiTheme\.value/);
  assert.match(sheetSource, /v-if="isAilisiTheme" class="special-npc-ailisi-portrait-deco"/);
  assert.match(sheetSource, /class="special-npc-ailisi-jellyfish"/);
  assert.match(sheetSource, /class="special-npc-ailisi-toy-blocks"/);
  assert.doesNotMatch(sheetSource, /ailisi[^\n]*(?:\.svg|\?raw)/i);
});

test('Ailisi light theme targets the rendered production DOM classes', () => {
  assert.match(
    sheetSource,
    /\.special-npc-wrapper\.special-npc-theme-ailisi\s*\{[\s\S]*?color-scheme:\s*light;[\s\S]*?isolation:\s*isolate;/,
  );
  for (const className of [
    'special-npc-list-item',
    'special-npc-text-block',
    'special-npc-page-title',
    'special-npc-resources',
    'special-npc-tabs',
  ]) {
    assert.match(sheetSource, new RegExp(`special-npc-theme-ailisi[^\\n]*${className}`));
  }
});

test('Ailisi mobile layout keeps a compact nameplate without overriding shared attribute geometry', () => {
  assert.match(
    sheetSource,
    /@media \(max-width: 900px\)[\s\S]*?\.special-npc-theme-ailisi \.special-npc-mobile-header-overlay\s*\{[\s\S]*?max-height:\s*24%;/,
  );
  assert.doesNotMatch(sheetSource, /special-npc-theme-ailisi[^\n]*special-npc-attributes/);
  assert.doesNotMatch(sheetSource, /special-npc-theme-ailisi[\s\S]{0,220}--flag-width:/);
  assert.doesNotMatch(sheetSource, /special-npc-theme-ailisi[\s\S]{0,180}position:\s*(?:fixed|sticky)/);
});
