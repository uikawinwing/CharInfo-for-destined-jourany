import { getSmartArray, normalizeDisplayText } from '../../char_info_viewer/services/common';
import type { ContentSegment, ItemCardBlock, ItemCardData, ItemEntityKind, ItemSegment, TextSegment } from '../types';

const ITEM_BLOCK_REGEX = /<item_info>[\s\S]*?<\/item_info>/gi;
const SUPPORTED_ENTITY_KINDS = new Set<ItemEntityKind>(['技能', '装备', '道具']);

function normalizeLineBreaks(input: string): string {
  return String(input || '').replace(/\r\n?/g, '\n');
}

function cleanEntityName(name: string): string {
  const normalized = normalizeDisplayText(name);
  return normalized.replace(/\s*[（(][^（）()]*[A-Za-z][^（）()]*[）)]\s*$/g, '').trim() || normalized;
}

function extractCommentEntity(raw: string): string {
  const tagMatch = raw.match(/<生成实体\s*[：:]\s*([^/>]+?)\s*\/>/i);
  const commentMatch = raw.match(/<!--\s*生成实体\s*[：:]\s*([^\n\r]+?)\s*-->/i);
  const matched = tagMatch?.[1] || commentMatch?.[1] || '';
  return normalizeDisplayText(matched)
    .replace(/^-+|-+$/g, '')
    .trim();
}

function extractLines(container: HTMLElement): string[] {
  const text = normalizeLineBreaks(container.innerText || container.textContent || '');
  return text
    .split('\n')
    .map(line => normalizeDisplayText(line))
    .filter(Boolean);
}

function extractHeading(container: HTMLElement): string {
  const heading = container.querySelector('h1, h2, h3, h4, h5, h6');
  return cleanEntityName(heading?.textContent || '');
}

function extractSingleField(text: string, key: string): string {
  const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = text.match(new RegExp(`${escapedKey}\\s*[：:]\\s*([^\\n|]+)`, 'i'));
  return normalizeDisplayText(match?.[1] || '');
}

function extractTags(text: string): string[] {
  const line = text.match(/标签\s*[：:]\s*([^\n]+)/i)?.[1] || '';
  const tags = Array.from(line.matchAll(/\[([^\]]+)\]/g)).map(match => normalizeDisplayText(match[1]));
  return tags.length > 0 ? tags.filter(Boolean) : getSmartArray(line);
}

function normalizeEffectName(name: string): string {
  return normalizeDisplayText(name)
    .replace(/^[【[]|[】\]]$/g, '')
    .trim();
}

function parseEffectLine(line: string): [string, string] | null {
  const normalized = normalizeDisplayText(line);
  if (!normalized) return null;

  const namedMatch = normalized.match(/^\s*[【[]?([^】\]：:]+)[】\]]?\s*[：:]\s*(.+)$/);
  if (!namedMatch) return null;

  const name = normalizeEffectName(namedMatch[1]);
  const content = normalizeDisplayText(namedMatch[2]);
  if (!name || !content) return null;
  return [name, content];
}

function extractEffects(container: HTMLElement, lines: string[]): Record<string, string> {
  const effectMap: Record<string, string> = {};
  const listItems = Array.from(container.querySelectorAll('li'))
    .map(node => normalizeDisplayText(node.textContent || ''))
    .filter(Boolean);

  const sourceLines =
    listItems.length > 0
      ? listItems
      : (() => {
          const effectIndex = lines.findIndex(line => /^效果\s*[：:]?$/i.test(line) || /^效果\s*[：:]/i.test(line));
          if (effectIndex < 0) return [] as string[];

          const sliced = lines.slice(effectIndex + 1);
          const stopIndex = sliced.findIndex(line => /^(描述|品质|类型|标签|消耗)\s*[：:]/i.test(line));
          return stopIndex >= 0 ? sliced.slice(0, stopIndex) : sliced;
        })();

  sourceLines.forEach(line => {
    const parsed = parseEffectLine(line);
    if (parsed) effectMap[parsed[0]] = parsed[1];
  });

  return effectMap;
}

function extractDescription(container: HTMLElement, lines: string[]): string {
  const descriptionNode = Array.from(container.querySelectorAll('p, div, span'))
    .map(node => normalizeDisplayText(node.textContent || ''))
    .find(text => /^描述\s*[：:]/i.test(text));

  if (descriptionNode) {
    return normalizeDisplayText(descriptionNode.replace(/^描述\s*[：:]\s*/i, ''));
  }

  const descriptionLine = lines.find(line => /^描述\s*[：:]/i.test(line));
  if (!descriptionLine) return '';
  return normalizeDisplayText(descriptionLine.replace(/^描述\s*[：:]\s*/i, ''));
}

function inferName(lines: string[]): string {
  const fallback = lines.find(
    line => !/^(品质|类型|消耗|标签|效果|描述)\s*[：:]/i.test(line) && !/^生成实体\s*[：:]/i.test(line),
  );
  return cleanEntityName(fallback || '');
}

function parseItemCard(rawBlock: string, index: number): ItemCardBlock {
  const rawHtml = normalizeLineBreaks(
    rawBlock
      .replace(/^<item_info>/i, '')
      .replace(/<\/item_info>$/i, '')
      .trim(),
  );
  const commentLabel = extractCommentEntity(rawHtml);

  if (!SUPPORTED_ENTITY_KINDS.has(commentLabel as ItemEntityKind)) {
    return {
      id: `item-card-${index}`,
      rawBlock,
      rawHtml,
      data: null,
      error: '缺少合法的“生成实体”注释，仅支持 技能 / 装备 / 道具。',
    };
  }

  const container = document.createElement('div');
  container.innerHTML = rawHtml;
  const lines = extractLines(container);
  const text = lines.join('\n');
  const name = extractHeading(container) || inferName(lines);

  if (!name) {
    return {
      id: `item-card-${index}`,
      rawBlock,
      rawHtml,
      data: null,
      error: '无法解析名称，请确保卡片中存在标题或可识别的名称行。',
    };
  }

  const data: ItemCardData = {
    entityKind: commentLabel as ItemEntityKind,
    name,
    quality: extractSingleField(text, '品质') || '未知',
    type: extractSingleField(text, '类型') || '未知',
    cost: extractSingleField(text, '消耗'),
    tags: extractTags(text),
    effects: extractEffects(container, lines),
    description: extractDescription(container, lines),
    rawHtml,
    commentLabel,
  };

  return {
    id: `item-card-${index}`,
    rawBlock,
    rawHtml,
    data,
    error: null,
  };
}

export function parseItemInfoBlocks(source: string): ItemCardBlock[] {
  const normalized = normalizeLineBreaks(source);
  return Array.from(normalized.matchAll(ITEM_BLOCK_REGEX)).map((match, index) => parseItemCard(match[0], index));
}

export function splitContentSegments(source: string): ContentSegment[] {
  const normalized = normalizeLineBreaks(source);
  const segments: ContentSegment[] = [];
  let cursor = 0;
  let itemIndex = 0;
  let textIndex = 0;

  Array.from(normalized.matchAll(ITEM_BLOCK_REGEX)).forEach(match => {
    const matchedText = match[0];
    const start = match.index ?? 0;
    const end = start + matchedText.length;

    if (start > cursor) {
      const textContent = normalized.slice(cursor, start);
      if (textContent.trim()) {
        const textSegment: TextSegment = {
          id: `text-segment-${textIndex++}`,
          kind: 'text',
          content: textContent,
        };
        segments.push(textSegment);
      }
    }

    const itemSegment: ItemSegment = {
      id: `item-segment-${itemIndex}`,
      kind: 'item',
      block: parseItemCard(matchedText, itemIndex),
    };
    segments.push(itemSegment);
    itemIndex += 1;
    cursor = end;
  });

  if (cursor < normalized.length) {
    const trailingText = normalized.slice(cursor);
    if (trailingText.trim()) {
      segments.push({
        id: `text-segment-${textIndex}`,
        kind: 'text',
        content: trailingText,
      });
    }
  }

  return segments;
}
