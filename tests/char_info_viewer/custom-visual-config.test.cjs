const assert = require('node:assert/strict');
const test = require('node:test');

const { resolveCharacterVisualConfig, resolveTheme } = require('../../src/char_info_viewer/services/themeService.ts');

test('主题服务提供聊天变量视觉配置解析入口', () => {
  assert.equal(typeof resolveCharacterVisualConfig, 'function');
});

test('一个角色图片占位符读取 URL 和两种自定义颜色', () => {
  const data = resolveCharacterVisualConfig(
    {
      姓名: '傲雪',
      角色图片: '[[char_info_visual_aoxue]]',
    },
    {
      char_info_visual_aoxue: {
        url: 'https://example.com/aoxue.png',
        custom_racecolor: '#78c8f0',
        custom_tiercolor: '#a855f7',
      },
    },
  );

  assert.equal(data.角色图片, 'https://example.com/aoxue.png');
  assert.equal(data.custom_racecolor, '#78C8F0');
  assert.equal(data.custom_tiercolor, '#A855F7');
});

test('旧版字符串图片变量仍可由同一种占位符读取', () => {
  const data = resolveCharacterVisualConfig(
    {
      姓名: '傲雪',
      角色图片: '[[char_info_image_aoxue]]',
    },
    {
      char_info_image_aoxue: 'https://example.com/aoxue.png',
    },
  );

  assert.equal(data.角色图片, 'https://example.com/aoxue.png');
  assert.equal(data.custom_racecolor, undefined);
  assert.equal(data.custom_tiercolor, undefined);
});

test('错误或缺失的占位符配置不会成为图片 URL 或 CSS 颜色', () => {
  const invalid = resolveCharacterVisualConfig(
    {
      姓名: '傲雪',
      角色图片: '[[char_info_visual_aoxue]]',
    },
    {
      char_info_visual_aoxue: {
        url: 'javascript:alert(1)',
        custom_racecolor: 'red',
        custom_tiercolor: '#12',
      },
    },
  );
  const missing = resolveCharacterVisualConfig(
    {
      姓名: '傲雪',
      角色图片: '[[not_found]]',
    },
    {},
  );

  assert.equal(invalid.角色图片, '');
  assert.equal(invalid.custom_racecolor, undefined);
  assert.equal(invalid.custom_tiercolor, undefined);
  assert.equal(missing.角色图片, '');
});

test('自定义种族色和层级色覆盖自动主题色', () => {
  const theme = resolveTheme({
    种族: '龙裔',
    生命层级: '第四层级',
    custom_racecolor: '#78C8F0',
    custom_tiercolor: '#A855F7',
  });

  assert.equal(theme.raceHex, '#78C8F0');
  assert.equal(theme.tierHex, '#A855F7');
  assert.equal(theme.raceRgb, '120, 200, 240');
  assert.equal(theme.tierRgb, '168, 85, 247');
});
