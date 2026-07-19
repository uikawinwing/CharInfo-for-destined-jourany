const assert = require('node:assert/strict');
const test = require('node:test');

const { buildCharacterViewModel } = require('../../src/char_info_viewer/services/characterViewModel.ts');

test('a character without an image uses the normal layout', () => {
  const vm = buildCharacterViewModel({ 姓名: '普通角色' });

  assert.equal(vm.layoutKind, 'default');
  assert.equal(vm.specialNpcProfile, null);
});

test('角色图片 routes an ordinary character to the generic special NPC layout', () => {
  const vm = buildCharacterViewModel({
    姓名: '傲雪',
    角色图片: 'https://example.com/aoxue.png',
  });

  assert.equal(vm.layoutKind, 'special_npc');
  assert.equal(vm.imageUrl, 'https://example.com/aoxue.png');
  assert.equal(vm.specialNpcProfile?.visualTheme, 'default');
});

test('a dedicated special NPC profile keeps its DX visual theme', () => {
  const vm = buildCharacterViewModel({ 姓名: '安娜斯塔西娅·佛罗伦丝·瓦雷利乌斯' });

  assert.equal(vm.layoutKind, 'special_npc');
  assert.equal(vm.specialNpcProfile?.visualTheme, 'anastasia');
});

test('登场台词 is exposed as optional display text for the special NPC overview', () => {
  const withQuote = buildCharacterViewModel({
    姓名: '傲雪',
    角色图片: 'https://example.com/aoxue.png',
    登场台词: '  霜雪会记住每一道剑痕。  ',
  });
  const withoutQuote = buildCharacterViewModel({
    姓名: '傲雪',
    角色图片: 'https://example.com/aoxue.png',
  });

  assert.equal(withQuote.entranceQuoteText, '霜雪会记住每一道剑痕。');
  assert.equal(withoutQuote.entranceQuoteText, '');
});
