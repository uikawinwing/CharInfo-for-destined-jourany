import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const sheetPath = new URL(
  '../../src/char_info_viewer/components/specialNpc/SpecialNpcCharacterSheet.vue',
  import.meta.url,
);
const sheetSource = await readFile(sheetPath, 'utf8');
const overviewPath = new URL(
  '../../src/char_info_viewer/components/specialNpc/SpecialNpcOverviewPanel.vue',
  import.meta.url,
);
const overviewSource = await readFile(overviewPath, 'utf8');

test('Anastasia desktop overview uses the shared flag geometry', () => {
  assert.match(
    sheetSource,
    /\.special-npc-wrapper\s*\{[^}]*--special-npc-flag-width:\s*128px;[^}]*--special-npc-flag-height:\s*128px;/,
  );
  assert.doesNotMatch(overviewSource, /special-npc-theme-anastasia[^\n]*special-npc-attributes/);
});

test('Anastasia desktop overview fits without an internal scrollbar', () => {
  assert.match(
    sheetSource,
    /@media \(min-width: 901px\)[\s\S]*?\.special-npc-theme-anastasia \.special-npc-shell\.is-overview-tab \.special-npc-panels\s*\{[\s\S]*?overflow-y:\s*hidden;[\s\S]*?padding-bottom:\s*0;/,
  );
});

test('Anastasia theme targets the rendered special NPC list item class', () => {
  assert.match(
    sheetSource,
    /\.special-npc-theme-anastasia\s+:deep\(\.special-npc-list-item\)\s*\{[\s\S]*?border-radius:\s*10px;[\s\S]*?background:[\s\S]*?rgba\(255, 255, 255/,
  );
  assert.doesNotMatch(sheetSource, /\.special-npc-theme-anastasia\s+:deep\(\.special-npc-item-card\)/);
});

test('Anastasia mobile item cards use compact readable spacing and type', () => {
  assert.match(
    sheetSource,
    /@media \(max-width: 640px\)[\s\S]*?\.special-npc-theme-anastasia\s+:deep\(\.special-npc-list-item\)\s*\{[\s\S]*?margin-bottom:\s*12px;[\s\S]*?padding:\s*15px;/,
  );
  assert.match(
    sheetSource,
    /@media \(max-width: 640px\)[\s\S]*?\.special-npc-theme-anastasia\s+:deep\(\.special-npc-effect-item\)[\s\S]*?font-size:\s*14px;[\s\S]*?line-height:\s*1\.55;/,
  );
});
