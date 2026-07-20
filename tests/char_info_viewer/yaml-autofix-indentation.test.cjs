const assert = require('node:assert/strict');
const test = require('node:test');

const {
  parseCharacterYaml,
  parseCharacterYamlLoose,
  repairBlockScalarIndentation,
} = require('../../src/char_info_viewer/services/yamlParser.ts');

const AOXUE_SAMPLE = `<char_info>
姓名: 傲雪
登场台词: "霜雪会记住每一道剑痕。"
生命层级: 第四层级
等级: 15
种族: 龙裔
身份: 异乡游子, 『寒潭剑姬』
职业: 剑客
性格: |
极为纯粹的剑痴，对剑术有着追求。外表清冷肃穆，不苟言笑。
喜爱: |
  雪夜与海潮的空旷，清茶散发的淡香。
外貌特质: |
  外表如十九岁少女，肤色冷白如玉。
背景故事: |
  诞生于远东的古老冰龙血脉。
属性:
  力量: 5 + 3 + 4 = 12
  敏捷: 5 + 3 + 4 = 12
资源:
  HP: 11054
  MP: 14250
  SP: 18000
技能:
  - 名称: 碎雪七势
    品质: 史诗
    类型: 主动
    标签: [力量][单体][伤害][威力: 1200][连击]
    效果: |
      物理伤害: 100%
      命中提升: 命中判定+4
    描述: 师门核心剑路。
装备:
  - 名称: 碎雪
    品质: 史诗
    类型: 单手剑
    标签: [攻击: 380]
    效果: |
      伤害提升: 物理伤害+15%
    描述: 师父遗留的名刀。
    位置: 主手
道具:
  - 名称: 樱花干
    品质: 普通
    类型: 消耗品
    标签: [非战斗]
    描述: 来自故乡的美食。
登神长阶:
  要素:
    - 名称: 极寒真意
      效果: |
        被动常驻。自身免疫一切常规严寒影响。
</char_info>`;

test('块标量内容缺缩进时严格解析失败', () => {
  const strict = parseCharacterYaml(AOXUE_SAMPLE);
  assert.equal(strict.success, false);
});

test('自动修复能补上顶格块标量缩进并保留完整结构', () => {
  const loose = parseCharacterYamlLoose(AOXUE_SAMPLE);
  assert.equal(loose.success, true);
  assert.equal(loose.mode, 'loose');
  assert.equal(loose.data.姓名, '傲雪');
  assert.match(String(loose.data.性格), /极为纯粹的剑痴/);
  assert.equal(Array.isArray(loose.data.技能), true);
  assert.equal(loose.data.技能.length, 1);
  assert.equal(Array.isArray(loose.data.装备), true);
  assert.equal(loose.data.装备.length, 1);
  assert.equal(Array.isArray(loose.data.道具), true);
  assert.equal(loose.data.登神长阶.要素.length, 1);
  assert.equal(loose.data.资源.HP, 11054);
});

test('修补只改动缺缩进的块内容行', () => {
  const repaired = repairBlockScalarIndentation(AOXUE_SAMPLE);
  assert.equal(repaired.changed, true);
  const source = AOXUE_SAMPLE.replace(/^<char_info>\s*/i, '').replace(/\s*<\/char_info>$/i, '');
  const before = source.split('\n');
  const after = repaired.text.split('\n');
  const diffs = before.filter((line, index) => line !== after[index]);
  assert.equal(diffs.length, 1);
  assert.match(diffs[0], /极为纯粹的剑痴/);
});

test('缩进正常的资料不会被修补改动', () => {
  const good = AOXUE_SAMPLE.replace('性格: |\n极为纯粹的剑痴', '性格: |\n  极为纯粹的剑痴');
  assert.equal(parseCharacterYaml(good).success, true);
  assert.equal(repairBlockScalarIndentation(good).changed, false);
});

test('多行顶格块内容整段归入块标量而不吞掉后续键', () => {
  const multi = [
    '姓名: 测试',
    '等级: 3',
    '种族: 人类',
    '性格: |',
    '第一行顶格内容。',
    '第二行顶格内容。',
    '喜爱: |',
    '  正常内容',
    '背景故事: |',
    '  正常故事',
  ].join('\n');
  const loose = parseCharacterYamlLoose(multi);
  assert.equal(loose.success, true);
  assert.equal(loose.data.性格, '第一行顶格内容。\n第二行顶格内容。\n');
  assert.equal(loose.data.喜爱, '正常内容\n');
});

test('列表项内块标量缺缩进同样可修复', () => {
  const listCase = [
    '姓名: 列表测试',
    '等级: 5',
    '种族: 精灵',
    '性格: |',
    '  正常',
    '背景故事: |',
    '  正常',
    '技能:',
    '  - 名称: 技能A',
    '    效果: |',
    '    未多缩进的效果行',
    '    描述: 之后的描述',
  ].join('\n');
  assert.equal(parseCharacterYaml(listCase).success, false);
  const loose = parseCharacterYamlLoose(listCase);
  assert.equal(loose.success, true);
  assert.equal(loose.data.技能[0].效果, '未多缩进的效果行\n');
  assert.equal(loose.data.技能[0].描述, '之后的描述');
});

test('同一资料列表内漂移的命名条目会对齐并完整保留', () => {
  const broken = [
    '姓名: 列表漂移',
    '等级: 8',
    '种族: 人类',
    '性格: |',
    '  冷静。',
    '背景故事: |',
    '  测试。',
    '技能:',
    '- 名称: 技能A',
    '  品质: 史诗',
    '    - 名称: 技能B',
    '      品质: 稀有',
  ].join('\n');

  assert.equal(parseCharacterYaml(broken).success, false);
  const loose = parseCharacterYamlLoose(broken);
  assert.equal(loose.success, true);
  assert.equal(loose.data.技能.length, 2);
  assert.equal(loose.data.技能[0].名称, '技能A');
  assert.equal(loose.data.技能[1].名称, '技能B');
});

test('命名列表项的兄弟字段缩进漂移时会统一到字段层级', () => {
  const broken = [
    '姓名: 字段漂移',
    '等级: 8',
    '种族: 人类',
    '性格: |',
    '  冷静。',
    '背景故事: |',
    '  测试。',
    '技能:',
    '  - 名称: 技能A',
    '   品质: 史诗',
    '     类型: 主动',
    '    描述: 完整保留。',
  ].join('\n');

  assert.equal(parseCharacterYaml(broken).success, false);
  const loose = parseCharacterYamlLoose(broken);
  assert.equal(loose.success, true);
  assert.equal(loose.data.技能.length, 1);
  assert.equal(loose.data.技能[0].品质, '史诗');
  assert.equal(loose.data.技能[0].类型, '主动');
  assert.equal(loose.data.技能[0].描述, '完整保留。');
});

test('内联多行文本溢出时升级为块标量并保留后续复杂结构', () => {
  const broken = [
    '姓名: 文本溢出',
    '等级: 8',
    '种族: 人类',
    '性格: 第一行。',
    '第二行顶格继续。',
    '第三行顶格继续。',
    '背景故事: |',
    '  测试。',
    '技能:',
    '  - 名称: 技能A',
    '    品质: 史诗',
  ].join('\n');

  assert.equal(parseCharacterYaml(broken).success, false);
  const loose = parseCharacterYamlLoose(broken);
  assert.equal(loose.success, true);
  assert.equal(String(loose.data.性格).trimEnd(), '第一行。\n第二行顶格继续。\n第三行顶格继续。');
  assert.equal(loose.data.技能.length, 1);
});

test('普通字段值含第二个映射冒号时加引号且不误伤 URL', () => {
  const broken = [
    '姓名: 双冒号',
    '等级: 8',
    '种族: 人类',
    '性格: |',
    '  冷静。',
    '背景故事: |',
    '  测试。',
    '自定义说明: 动作: 1200 SP',
    '资料地址: https://example.com/a:b',
    '技能:',
    '  - 名称: 技能A',
    '    品质: 史诗',
  ].join('\n');

  assert.equal(parseCharacterYaml(broken).success, false);
  const loose = parseCharacterYamlLoose(broken);
  assert.equal(loose.success, true);
  assert.equal(loose.data.自定义说明, '动作: 1200 SP');
  assert.equal(loose.data.资料地址, 'https://example.com/a:b');
  assert.equal(loose.data.技能.length, 1);
});

test('双冒号修补不会改写块标量内的正文', () => {
  const broken = [
    '姓名: 正文冒号',
    '等级: 8',
    '种族: 人类',
    '性格: |',
    '  她提醒: 动作: 1200 SP',
    '背景故事: |',
    '  测试。',
    '技能:',
    '- 名称: 技能A',
    '  品质: 史诗',
  ].join('\n');

  const loose = parseCharacterYamlLoose(broken);
  assert.equal(loose.success, true);
  assert.equal(String(loose.data.性格).trimEnd(), '她提醒: 动作: 1200 SP');
});

test('列表字段内已有嵌套对象时不会被拉平成兄弟字段', () => {
  const broken = [
    '姓名: 嵌套字段',
    '等级: 8',
    '种族: 人类',
    '性格: |',
    '  冷静。',
    '背景故事: |',
    '  测试。',
    '技能:',
    '- 名称: 技能A',
    '  效果:',
    '    描述: 嵌套说明。',
  ].join('\n');

  const loose = parseCharacterYamlLoose(broken);
  assert.equal(loose.success, true);
  assert.equal(loose.data.技能[0].效果.描述, '嵌套说明。');
});

test('无法修补的资料仍回退到宽松提取', () => {
  const broken = ['姓名: 破损', '等级: 2', '种族: 人类', '性格', '完全没有冒号的行', '背景故事: |', '  有一段故事'].join(
    '\n',
  );
  const loose = parseCharacterYamlLoose(broken);
  assert.equal(loose.success, true);
  assert.equal(loose.mode, 'loose');
});
