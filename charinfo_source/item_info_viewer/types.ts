export type ItemEntityKind = '技能' | '装备' | '道具';

export type ItemImportOwnerType = 'mc' | 'npc';

export interface ItemCardData {
  entityKind: ItemEntityKind;
  name: string;
  quality: string;
  type: string;
  cost: string;
  tags: string[];
  effects: Record<string, string>;
  description: string;
  rawHtml: string;
  commentLabel: string;
}

export interface ItemCardBlock {
  id: string;
  rawBlock: string;
  rawHtml: string;
  data: ItemCardData | null;
  error: string | null;
}

export interface TextSegment {
  id: string;
  kind: 'text';
  content: string;
}

export interface ItemSegment {
  id: string;
  kind: 'item';
  block: ItemCardBlock;
}

export type ContentSegment = TextSegment | ItemSegment;

export interface ItemImportTarget {
  ownerType: ItemImportOwnerType;
  ownerName?: string;
}

export interface NpcOption {
  key: string;
  label: string;
}
