import { load } from 'js-yaml';
import type { CharacterData, FriendlyYamlError, ParseResult } from '../types';

const KEY_ALIAS_TO_SIMPLIFIED: Record<string, string> = {
  名字: '姓名',
  名稱: '名称',
  等級: '等级',
  種族: '种族',
  生命層級: '生命层级',
  身分: '身份',
  職業: '职业',
  喜愛: '喜爱',
  外貌特質: '外貌特质',
  外貌特徵: '外貌特质',
  外貌特征: '外貌特质',
  衣物裝飾: '衣物装饰',
  特殊立繪: '特殊立绘',
  屬性: '属性',
  資源: '资源',
  體質: '体质',
  裝備: '装备',
  登神長階: '登神长阶',
  神國: '神国',
  權能: '权能',
  法則: '法则',
  標籤: '标签',
  品質: '品质',
  類型: '类型',
  分類: '分类',
  被動效果: '被动效果',
  主動效果: '主动效果',
};

function visualizeForDisplay(str: unknown): string {
  return String(str ?? '')
    .replace(/\t/g, '⇥')
    .replace(/\u00A0/g, '⍽');
}

function normalizeKey(key: string): string {
  return KEY_ALIAS_TO_SIMPLIFIED[key] || key;
}

function normalizeObjectKeysDeep(input: unknown): unknown {
  if (Array.isArray(input)) {
    return input.map(item => normalizeObjectKeysDeep(item));
  }

  if (!input || typeof input !== 'object') {
    return input;
  }

  const source = input as Record<string, unknown>;
  const output: Record<string, unknown> = {};

  Object.entries(source).forEach(([rawKey, rawValue]) => {
    const normalizedKey = normalizeKey(String(rawKey));
    const normalizedValue = normalizeObjectKeysDeep(rawValue);

    if (!(normalizedKey in output) || rawKey === normalizedKey) {
      output[normalizedKey] = normalizedValue;
    }
  });

  return output;
}

export function normalizeCharacterDataKeys(data: CharacterData): CharacterData {
  return normalizeObjectKeysDeep(data) as CharacterData;
}

type PreparedYaml = {
  cleaned: string;
  source: string;
  lineOffset: number;
};

function unwrapCharacterInfoWrapper(yamlStr: string): { source: string; lineOffset: number } {
  const text = String(yamlStr ?? '').trim();
  const openMatch = text.match(/^<char_info>\s*/i);
  const closeMatch = text.match(/\s*<\/char_info>$/i);

  if (!openMatch || !closeMatch || openMatch[0].length >= text.length - closeMatch[0].length) {
    return { source: text, lineOffset: 0 };
  }

  const source = text.slice(openMatch[0].length, text.length - closeMatch[0].length);
  const lineOffset = openMatch[0].split('\n').length - 1;
  return { source, lineOffset };
}

function prepareYaml(yamlStr: string): PreparedYaml {
  if (!yamlStr) return { cleaned: '', source: '', lineOffset: 0 };

  const unwrapped = unwrapCharacterInfoWrapper(yamlStr);
  const normalized = unwrapped.source
    .replace(/\u00A0/g, ' ')
    .replace(/\t/g, '  ')
    .replace(/】/g, ']')
    .replace(/【/g, '[');

  const lines = normalized.split('\n');
  const sensitiveKeys = [
    '身份',
    '身分',
    '职业',
    '職業',
    '性格',
    '喜爱',
    '喜愛',
    '外貌特质',
    '外貌特質',
    '外貌特征',
    '外貌特徵',
    '衣物装饰',
    '衣物裝飾',
    '背景故事',
    '描述',
    '效果',
    '标签',
    '標籤',
    '消耗',
    '类型',
    '類型',
    '品质',
    '品質',
    '神位',
    '名称',
    '名稱',
    '姓名',
    '名字',
    '种族',
    '種族',
    '等级',
    '等級',
    '生命层级',
    '生命層級',
  ];
  const attrKeys = ['力量', '敏捷', '体质', '體質', '智力', '精神'];

  const cleanedLines = lines.map(line => {
    line = line.replace(/^(\s*)(-\s*)?([-\w\u4e00-\u9fa5]+)\s*：/, (_m, indent, dash, key) => {
      return `${indent}${dash || ''}${key}:`;
    });

    const match = line.match(/^(\s*)(-\s*)?([-\w\u4e00-\u9fa5]+)\s*:\s*(.*)$/);
    if (!match) return line;

    const indent = match[1];
    const dash = match[2] || '';
    const key = match[3];
    let val = match[4].trim();

    if (!val) return line;
    if (val.startsWith('|') || val.startsWith('>')) return line;

    if (attrKeys.some(k => key.includes(k))) {
      if ((/[+=]/.test(val) || val.includes('{')) && !/^["'].*["']$/.test(val)) {
        val = val.replace(/"/g, '\\"');
        return `${indent}${dash}${key}: "${val}"`;
      }
    }

    const isSensitive = sensitiveKeys.some(k => key.includes(k));
    const hasDangerousChars = /[{}[\]]/.test(val);
    const hasQuoteInside = val.includes('"');
    const isFullyQuoted = /^["'].*["']$/.test(val);

    if ((isSensitive || hasDangerousChars || hasQuoteInside) && !isFullyQuoted) {
      val = val.replace(/"/g, '\\"');
      return `${indent}${dash}${key}: "${val}"`;
    }

    return line;
  });

  return {
    cleaned: cleanedLines.join('\n'),
    source: unwrapped.source,
    lineOffset: unwrapped.lineOffset,
  };
}

export function cleanYaml(yamlStr: string): string {
  return prepareYaml(yamlStr).cleaned;
}

function buildYamlErrorTips(message: string, cleanedLine: string, originalLine: string): string[] {
  const lowerMessage = message.toLowerCase();
  const lineText = `${cleanedLine}\n${originalLine}`;

  if (lowerMessage.includes('bad indentation') || lowerMessage.includes('bad indendation')) {
    return [
      '这是缩进问题：同一层级必须使用一样多的空格。',
      '如果这一行属于列表项内容，通常要比 "- 名称: xxx" 多缩进两个空格。',
      '不要混用 Tab；把行首空白删掉后重新用空格对齐。',
    ];
  }

  if (lowerMessage.includes('sequence entry')) {
    return [
      '检查这一行附近的 "- " 列表符号，列表项必须在同一列对齐。',
      '列表项下面的字段要缩进到同一层，例如 "名称/品质/类型/效果" 的行首空格要一致。',
      '如果这一行不是新列表项，不要在行首写 "- "。',
    ];
  }

  if (
    lowerMessage.includes('document separator') ||
    lowerMessage.includes('end of the stream') ||
    lowerMessage.includes('block mapping')
  ) {
    return [
      '通常是上一行或本行缺少冒号，确认格式是 "键: 值"。',
      '如果值里有半角冒号、方括号或引号，把整段值用英文双引号包住。',
      '如果这是多行文本，键后面写 "|"，下一行开始统一多缩进两个空格。',
    ];
  }

  if (lowerMessage.includes('duplicated mapping key')) {
    return [
      '这一层里出现了重复键名，YAML 不允许同一对象内有两个一样的键。',
      '如果需要多个技能/装备/道具，请写成列表项，每个条目前面用 "- 名称: xxx"。',
      '如果只是同名效果，建议在效果名前加区分词。',
    ];
  }

  if (lowerMessage.includes('unknown escape') || lowerMessage.includes('bad escaped')) {
    return [
      '双引号里的反斜杠会被当成转义符；不需要转义时改用单引号。',
      '如果文本里必须写反斜杠，请写成两个反斜杠。',
      '也可以把这段改成 "|" 多行文本，减少引号转义问题。',
    ];
  }

  if (lineText.includes('[') || lineText.includes(']')) {
    return [
      '这一行包含方括号；如果解析失败，先把整段值用英文双引号包住。',
      '标签可以写成 "[精神][治疗]"，不要拆成没有逗号的 YAML 数组。',
      '效果名可以保留方括号，例如 "微弱要素[圣吻之诺]: 效果内容"。',
    ];
  }

  return [
    '先看箭头指向的位置，再检查这一行和上一行。',
    '确认格式是 "键: 值"，冒号后面最好留一个空格。',
    '检查行首空格；同一层级对齐，子内容多缩进两个空格。',
    '如果内容很长或包含特殊符号，可以改成 "|" 多行文本。',
  ];
}

function buildFriendlyYamlError(
  err: unknown,
  originalYaml: string,
  cleanedYaml: string,
  lineOffset: number,
): FriendlyYamlError {
  const e = err as { reason?: string; message?: string; mark?: { line?: number; column?: number } };
  const mark = e?.mark;
  const message = String(e?.reason || e?.message || String(err));

  if (!mark || typeof mark.line !== 'number') {
    return { message, tips: buildYamlErrorTips(message, '', '') };
  }

  const line = mark.line;
  const column = typeof mark.column === 'number' ? mark.column : 0;
  const originalLineIndex = line + lineOffset;

  const originalLines = String(originalYaml ?? '').split('\n');
  const cleanedLines = String(cleanedYaml ?? '').split('\n');

  const originalLine = originalLines[originalLineIndex] ?? '';
  const cleanedLine = cleanedLines[line] ?? '';

  const cleanedVisual = visualizeForDisplay(cleanedLine);
  const originalVisual = visualizeForDisplay(originalLine);

  const caretPad = ' '.repeat(Math.max(0, Math.min(column, cleanedVisual.length)));
  const caretLine = `${caretPad}^`;

  return {
    message,
    line: originalLineIndex,
    column,
    cleanedLine: cleanedVisual,
    originalLine: originalVisual,
    caretLine,
    tips: buildYamlErrorTips(message, cleanedVisual, originalVisual),
  };
}

const LOOSE_TOP_KEYS = [
  '姓名',
  '等级',
  '种族',
  '生命层级',
  '身份',
  '职业',
  '性格',
  '喜爱',
  '外貌特质',
  '衣物装饰',
  '背景故事',
  '角色图片',
  '立绘',
  '图片',
  '属性',
  '资源',
] as const;

const LOOSE_SCALAR_KEYS = new Set(['姓名', '等级', '种族', '生命层级', '角色图片', '立绘', '图片']);
const LOOSE_ARRAY_KEYS = new Set(['身份', '职业', '喜爱']);
const LOOSE_TEXT_KEYS = new Set(['性格', '外貌特质', '衣物装饰', '背景故事']);
const LOOSE_ATTRIBUTE_KEYS = ['力量', '敏捷', '体质', '智力', '精神'] as const;
const LOOSE_RESOURCE_KEYS = ['HP', 'SP', 'MP'] as const;

function stripLooseQuote(value: string): string {
  return value
    .trim()
    .replace(/^['"`]|['"`]$/g, '')
    .trim();
}

function normalizeLooseBlock(lines: string[]): string {
  return lines
    .filter(line => !/^[>|][+-]?$/.test(line.trim()))
    .map(line => line.replace(/^\s*[-*]\s?/, '').trim())
    .filter(Boolean)
    .join('\n')
    .trim();
}

function splitLooseArray(value: string): string[] {
  return value
    .split(/[/、，,；;\n]/g)
    .map(part => stripLooseQuote(part))
    .filter(Boolean);
}

function looseKeyMatch(line: string): { key: string; value: string } | null {
  const trimmed = line.trim();
  const match = trimmed.match(/^[-*]?\s*([^：:\s][^：:]{0,24})\s*[：:]\s*(.*)$/);
  if (!match) return null;

  const key = normalizeKey(match[1].trim());
  if (!LOOSE_TOP_KEYS.includes(key as (typeof LOOSE_TOP_KEYS)[number])) return null;

  return { key, value: match[2] ?? '' };
}

function extractLooseSections(source: string): Partial<Record<(typeof LOOSE_TOP_KEYS)[number], string[]>> {
  const lines = source.replace(/\r\n/g, '\n').split('\n');
  const sections: Partial<Record<(typeof LOOSE_TOP_KEYS)[number], string[]>> = {};
  let currentKey: (typeof LOOSE_TOP_KEYS)[number] | null = null;

  for (const line of lines) {
    const matched = looseKeyMatch(line);
    if (matched) {
      currentKey = matched.key as (typeof LOOSE_TOP_KEYS)[number];
      sections[currentKey] = [];
      if (matched.value.trim()) sections[currentKey]?.push(matched.value);
      continue;
    }

    if (currentKey) {
      sections[currentKey]?.push(line);
    }
  }

  return sections;
}

function parseLooseNumberLike(value: string): string | number {
  const clean = stripLooseQuote(value);
  const numberMatch = clean.match(/^-?\d+(?:\.\d+)?$/);
  return numberMatch ? Number(clean) : clean;
}

function parseLooseKVBlock(lines: string[], keys: readonly string[]): Record<string, string | number> {
  const text = lines.join('\n');
  const output: Record<string, string | number> = {};

  for (const key of keys) {
    const keyPattern = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const match = text.match(new RegExp(`${keyPattern}\\s*[：:]?\\s*([^\\s，,、；;|]+)`));
    if (match) output[key] = parseLooseNumberLike(match[1]);
  }

  lines.forEach(line => {
    const match = line.trim().match(/^[-*]?\s*([^：:\s]+)\s*[：:]\s*(.+)$/);
    if (!match) return;
    const key = normalizeKey(match[1].trim());
    if (!keys.includes(key)) return;
    output[key] = parseLooseNumberLike(match[2]);
  });

  return output;
}

export function parseCharacterYamlLoose(yamlText: string): ParseResult {
  const prepared = prepareYaml(yamlText);
  const sections = extractLooseSections(prepared.source);
  const data: CharacterData = {};

  for (const [key, lines] of Object.entries(sections)) {
    const block = normalizeLooseBlock(lines ?? []);
    if (!block) continue;

    if (LOOSE_SCALAR_KEYS.has(key)) {
      data[key] = stripLooseQuote(block.split('\n')[0] ?? '');
      continue;
    }

    if (LOOSE_ARRAY_KEYS.has(key)) {
      data[key] = splitLooseArray(block);
      continue;
    }

    if (LOOSE_TEXT_KEYS.has(key)) {
      data[key] = block;
      continue;
    }

    if (key === '属性') {
      data.属性 = parseLooseKVBlock(lines ?? [], LOOSE_ATTRIBUTE_KEYS);
      continue;
    }

    if (key === '资源') {
      data.资源 = parseLooseKVBlock(lines ?? [], LOOSE_RESOURCE_KEYS) as CharacterData['资源'];
    }
  }

  const normalizedData = normalizeCharacterDataKeys(data);
  const hasName = typeof normalizedData.姓名 === 'string' && normalizedData.姓名.trim().length > 0;
  const hasBasicInfo = !!(normalizedData.等级 || normalizedData.种族 || normalizedData.生命层级);
  const hasProfileText = !!(normalizedData.性格 || normalizedData.外貌特质 || normalizedData.背景故事);

  if (!hasName || !hasBasicInfo || !hasProfileText) {
    return {
      success: false,
      error: {
        message: '三角老师这次没能修好，原始资料可能缺少关键内容。',
        tips: [
          '宽松读取至少需要识别到姓名、一个基础字段（等级/种族/生命层级）和一段档案文本。',
          '请确认关键字仍写成类似 "姓名:"、"性格:"、"外貌特质:" 的格式。',
          '如果内容被其他脚本改到完全没有键名，仍然需要手动修正原文。',
        ],
      },
    };
  }

  return {
    success: true,
    data: normalizedData,
    mode: 'loose',
    warnings: ['宝宝，你看看我修好了沒？部分列表、装备、技能或登神长阶结构可能无法完整恢复，导入前记得先检查内容～'],
  };
}

export function parseCharacterYaml(yamlText: string): ParseResult {
  const prepared = prepareYaml(yamlText);
  try {
    const parsedData = load(prepared.cleaned) as CharacterData | null;
    if (!parsedData) throw new Error('解析结果为空');

    const normalizedData = normalizeCharacterDataKeys(parsedData);
    return { success: true, data: normalizedData, mode: 'strict' };
  } catch (err) {
    return {
      success: false,
      error: buildFriendlyYamlError(err, yamlText, prepared.cleaned, prepared.lineOffset),
    };
  }
}
