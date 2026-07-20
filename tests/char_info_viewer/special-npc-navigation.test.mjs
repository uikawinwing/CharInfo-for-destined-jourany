import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const navPath = new URL('../../src/char_info_viewer/components/specialNpc/SpecialNpcTabNav.vue', import.meta.url);
const sheetPath = new URL(
  '../../src/char_info_viewer/components/specialNpc/SpecialNpcCharacterSheet.vue',
  import.meta.url,
);
const [navSource, sheetSource] = await Promise.all([readFile(navPath, 'utf8'), readFile(sheetPath, 'utf8')]);

test('mobile special NPC navigation keeps the main page outside the scrolling detail tabs', () => {
  assert.match(navSource, /const homeTab = computed\(\(\) => props\.tabs\.find\(tab => tab\.key === 'overview'\)/);
  assert.match(navSource, /const detailTabs = computed\(\(\) => props\.tabs\.filter\(tab => tab\.key !== 'overview'\)/);
  assert.match(
    navSource,
    /<button[\s\S]*?v-if="homeTab"[\s\S]*?class="special-npc-tab-button special-npc-home-button"[\s\S]*?@click="\$emit\('setTab', homeTab\.key\)"[\s\S]*?>[\s\S]*?{{ homeTab\.label }}/,
  );
  assert.match(
    navSource,
    /<div class="special-npc-tab-scroll">[\s\S]*?v-for="tab in detailTabs"[\s\S]*?<\/div>[\s\S]*?special-npc-nav-save-button/,
  );
});

test('mobile special NPC navigation exposes active state and reliable touch targets', () => {
  assert.match(navSource, /:aria-current="activeTab === [^?]+ \? 'page' : undefined"/);
  assert.match(navSource, /\.special-npc-tab-button\s*\{[^}]*min-height:\s*44px;/);
  assert.match(navSource, /@media \(max-width: 640px\)[\s\S]*?\.special-npc-tab-scroll\s*\{[^}]*overflow-x:\s*auto;/);
  assert.match(
    navSource,
    /@media \(max-width: 640px\)[\s\S]*?\.special-npc-home-button,[\s\S]*?\.special-npc-nav-save-button\s*\{[^}]*flex:\s*0 0 auto;/,
  );
});

test('special NPC navigation renders only tabs that exist for the current NPC', () => {
  assert.match(sheetSource, /const mergedTabs: SpecialNpcTab\[\] = \[\{ key: 'overview', label: '首页' \}\];/);
  assert.match(sheetSource, /props\.vm\.visibleTabs\.forEach\(tab => \{/);
  assert.match(sheetSource, /mergedTabs\.push\(\{ key: 'characterStory', label: '角色故事' \}\)/);
  assert.match(sheetSource, /tabs\.value\.some\(tab => tab\.key === activeSpecialTab\.value\)/);
  assert.doesNotMatch(sheetSource, /specialNpcTabOrder|availableKeys|available:/);
  assert.doesNotMatch(navSource, /:disabled="!tab\.available"|暂无\$\{tab\.label\}资料/);
});

test('desktop special NPC navigation uses content-sized buttons in one centered row', () => {
  assert.match(
    navSource,
    /\.special-npc-tabs\s*\{[^}]*width:\s*fit-content;[^}]*max-width:\s*100%;[^}]*justify-content:\s*center;[^}]*margin:\s*0 auto;/,
  );
  assert.match(
    navSource,
    /\.special-npc-tab-scroll\s*\{[^}]*display:\s*flex;[^}]*flex:\s*0 1 auto;[^}]*flex-wrap:\s*nowrap;[^}]*gap:\s*4px;[^}]*overflow-x:\s*auto;/,
  );
  const detailButtonRule = navSource.match(/\.special-npc-tab-scroll \.special-npc-tab-button\s*\{[^}]*\}/)?.[0];
  assert.ok(detailButtonRule);
  assert.match(detailButtonRule, /flex:\s*0 0 auto;/);
  assert.match(detailButtonRule, /width:\s*auto;/);
  assert.match(detailButtonRule, /min-width:\s*56px;/);
  assert.match(detailButtonRule, /justify-content:\s*center;/);
  assert.match(
    navSource,
    /\.special-npc-tab-button\s*\{[^}]*display:\s*flex;[^}]*align-items:\s*center;[^}]*justify-content:\s*center;[^}]*text-align:\s*center;/,
  );
});
