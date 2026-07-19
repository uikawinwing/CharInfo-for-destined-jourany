import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const repoRoot = new URL('../../', import.meta.url);
const appSource = await readFile(new URL('src/char_info_viewer/App.vue', repoRoot), 'utf8');

test('查看器在建立视图和主题前解析聊天变量视觉配置', () => {
  assert.match(
    appSource,
    /import \{[^}]*resolveCharacterVisualConfig[^}]*resolveTheme[^}]*\} from '\.\/services\/themeService';/s,
  );
  assert.match(appSource, /getVariables\(\{\s*type:\s*'chat'\s*\}\)/);
  assert.match(
    appSource,
    /const resolvedData = resolveCharacterVisualConfig\([\s\S]*?sheetData\.value = resolvedData;[\s\S]*?resolveTheme\(resolvedData\)/,
  );
});
