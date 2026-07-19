import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const navPath = new URL('../../src/char_info_viewer/components/specialNpc/SpecialNpcTabNav.vue', import.meta.url);
const navSource = await readFile(navPath, 'utf8');

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
