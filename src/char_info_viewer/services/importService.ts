import type { CharacterData } from '../types';
import { getSmartArray, normalizeDisplayText, parseAttributeValue } from './common';
import { normalizeCharacterDataKeys } from './yamlParser';

type VariableScope = { type: 'message'; message_id: 'latest' };

type TavernApiLike = {
  getVariables?: (scope: VariableScope) => Promise<Record<string, any>>;
  insertOrAssignVariables?: (payload: Record<string, any>, scope: VariableScope) => Promise<void>;
  getOrCreateChatWorldbook?: (chat: 'current', desiredName: string) => Promise<string>;
  createWorldbookEntries?: (bookName: string, entries: Array<Record<string, any>>) => Promise<void>;
  getChatWorldbookName?: (chat: 'current') => Promise<string | null>;
};

function getApi(): TavernApiLike {
  return ((window as any).TavernHelper || (window.parent as any)?.TavernHelper || window) as TavernApiLike;
}

function ensureString(val: unknown): string {
  if (Array.isArray(val)) return val.join(', ');
  return val ? normalizeDisplayText(val) : '';
}

function ensureArray(val: unknown): string[] {
  return getSmartArray(val);
}

function parseNamedEffectLine(line: string): readonly [string, string] | null {
  const normalized = normalizeDisplayText(line);
  if (!normalized) return null;

  const bracketMatch = normalized.match(/^\[([^\]]+)\]\s*[：:]\s*(.*)$/);
  if (bracketMatch) {
    const key = normalizeDisplayText(bracketMatch[1]);
    const value = normalizeDisplayText(bracketMatch[2]);
    if (key && value) return [key, value] as const;
    return null;
  }

  const splitIndex = normalized.search(/[：:]/);
  if (splitIndex <= 0) return null;

  const key = normalizeDisplayText(normalized.slice(0, splitIndex));
  const value = normalizeDisplayText(normalized.slice(splitIndex + 1));
  if (!key || !value) return null;

  return [key, value] as const;
}

function parseEffectMap(effectVal: unknown): Record<string, string> {
  if (effectVal && typeof effectVal === 'object' && !Array.isArray(effectVal)) {
    const effectObj = effectVal as Record<string, unknown>;
    return Object.fromEntries(
      Object.entries(effectObj)
        .map(([key, value]) => [normalizeDisplayText(key), ensureString(value).trim()] as const)
        .filter(([key, value]) => key.length > 0 && value.length > 0),
    );
  }

  const text = ensureString(effectVal).replace(/\r\n/g, '\n').trim();
  if (!text) return {};

  const lines = text
    .split('\n')
    .map(line => line.trim())
    .filter(Boolean);

  const effectMap: Record<string, string> = {};
  const remains: string[] = [];

  lines.forEach(line => {
    const named = parseNamedEffectLine(line);
    if (named) {
      const [key, value] = named;
      effectMap[key] = value;
      return;
    }

    remains.push(line);
  });

  if (Object.keys(effectMap).length > 0) {
    if (remains.length > 0) effectMap.描述 = remains.join('\n');
    return effectMap;
  }

  return { 描述: text };
}

function arrayToMap(
  arr: unknown,
  type: 'skill' | 'equip' | 'divinity' | 'backpack',
): Record<string, Record<string, any>> {
  const map: Record<string, Record<string, any>> = {};
  if (!Array.isArray(arr)) return map;

  arr.forEach(item => {
    if (!item || typeof item !== 'object') return;
    const anyItem = item as Record<string, any>;

    const itemName = ensureString(anyItem.名称 || anyItem.名稱).trim();
    if (!itemName) return;

    const { 名称, 名稱, ...rest } = anyItem;
    const processed: Record<string, any> = { ...rest };

    const tags = processed.标签 ?? processed.標籤;
    if (tags) processed.标签 = ensureArray(tags);
    else if (type === 'skill' || type === 'equip' || type === 'backpack') processed.标签 = [];
    delete processed.標籤;

    if (type !== 'divinity') {
      processed.效果 = parseEffectMap(processed.效果);
    }

    if (type === 'equip') {
      processed.品质 = processed.品质 || processed.品質 || '未知';
      processed.类型 = processed.分类 || processed.分類 || processed.类型 || processed.類型 || '未知';
      processed.描述 = processed.描述 || '';
      processed.位置 = processed.位置 || '';
    } else if (type === 'skill') {
      processed.品质 = processed.品质 || processed.品質 || '未知';
      processed.类型 = processed.类型 || processed.類型 || '未知';
      processed.消耗 = processed.消耗 ? ensureString(processed.消耗) : '';
      processed.描述 = processed.描述 || '';
    } else if (type === 'backpack') {
      const quantityRaw = processed.数量 ?? processed.數量 ?? processed.持有数量 ?? processed.持有數量 ?? 1;
      const quantityValue = Number(quantityRaw);
      processed.品质 = processed.品质 || processed.品質 || '未知';
      processed.类型 = processed.分类 || processed.分類 || processed.类型 || processed.類型 || '未知';
      processed.数量 = Number.isFinite(quantityValue) && quantityValue > 0 ? quantityValue : 1;
      processed.描述 = processed.描述 || '';
    }

    map[itemName] = processed;
  });

  return map;
}

function mergeNamedMaps(...maps: Array<Record<string, Record<string, any>>>): Record<string, Record<string, any>> {
  const merged: Record<string, Record<string, any>> = {};

  maps.forEach(map => {
    Object.entries(map).forEach(([name, value]) => {
      const existing = merged[name];
      if (!existing) {
        merged[name] = { ...value };
        return;
      }

      const existingQty = Number(existing.数量);
      const nextQty = Number(value.数量);
      const mergedQty = (Number.isFinite(existingQty) ? existingQty : 0) + (Number.isFinite(nextQty) ? nextQty : 0);

      merged[name] = {
        ...existing,
        ...value,
        标签: Array.from(new Set([...ensureArray(existing.标签), ...ensureArray(value.标签)])),
        效果: {
          ...(existing.效果 && typeof existing.效果 === 'object' ? existing.效果 : {}),
          ...(value.效果 && typeof value.效果 === 'object' ? value.效果 : {}),
        },
        数量: mergedQty > 0 ? mergedQty : (value.数量 ?? existing.数量 ?? 1),
      };
    });
  });

  return merged;
}

function statusEffectsToMap(input: unknown): Record<string, Record<string, any>> {
  const map: Record<string, Record<string, any>> = {};

  const normalizeEffect = (effectName: string, raw: unknown) => {
    if (!effectName.trim() || !raw || typeof raw !== 'object') return;
    const effect = raw as Record<string, unknown>;
    const layerValue = Number(effect.层数 ?? 1);
    map[effectName] = {
      类型: ensureString(effect.类型).trim() || '特殊',
      效果: ensureString(effect.效果).trim(),
      层数: Number.isFinite(layerValue) && layerValue > 0 ? layerValue : 1,
      剩余时间: ensureString(effect.剩余时间).trim(),
      来源: ensureString(effect.来源).trim(),
    };
  };

  if (Array.isArray(input)) {
    input.forEach(item => {
      if (!item || typeof item !== 'object') return;
      const anyItem = item as Record<string, unknown>;
      const effectName = ensureString(anyItem.名称 || anyItem.效果名称 || anyItem.name).trim();
      normalizeEffect(effectName, anyItem);
    });
    return map;
  }

  if (input && typeof input === 'object') {
    Object.entries(input as Record<string, unknown>).forEach(([effectName, effectValue]) => {
      normalizeEffect(effectName, effectValue);
    });
  }

  return map;
}

export async function importToMvuVariables(data: CharacterData): Promise<void> {
  const api = getApi();
  if (typeof api.getVariables !== 'function' || typeof api.insertOrAssignVariables !== 'function') {
    throw new Error('未检测到 TavernHelper API (getVariables / insertOrAssignVariables)。');
  }

  const normalizedData = normalizeCharacterDataKeys(data);
  const charName = normalizedData.姓名 || 'Unknown';
  const targetScope: VariableScope = { type: 'message', message_id: 'latest' };

  const backpack = mergeNamedMaps(
    arrayToMap(normalizedData.背包, 'backpack'),
    arrayToMap(normalizedData.道具, 'backpack'),
    arrayToMap(normalizedData.物品, 'backpack'),
    arrayToMap(normalizedData.特殊物品, 'backpack'),
  );

  const mvuData = {
    在场: true,
    生命层级: normalizedData.生命层级 || '第一层级/普通层级',
    等级: parseInt(String(normalizedData.等级 ?? '1'), 10) || 1,
    种族: normalizedData.种族 || '未知',
    身份: ensureArray(normalizedData.身份),
    职业: ensureArray(normalizedData.职业),
    性格: ensureString(normalizedData.性格).trim(),
    喜爱: ensureString(normalizedData.喜爱).trim(),
    外貌: ensureString(normalizedData.外貌特质).trim(),
    着装: ensureString(normalizedData.衣物装饰).trim(),
    属性: {
      力量: parseAttributeValue(normalizedData.属性?.力量),
      敏捷: parseAttributeValue(normalizedData.属性?.敏捷),
      体质: parseAttributeValue(normalizedData.属性?.体质),
      智力: parseAttributeValue(normalizedData.属性?.智力),
      精神: parseAttributeValue(normalizedData.属性?.精神),
    },
    状态效果: statusEffectsToMap(normalizedData.状态效果),
    背包: backpack,
    技能: arrayToMap(normalizedData.技能, 'skill'),
    装备: arrayToMap(normalizedData.装备, 'equip'),
    登神长阶: {
      是否开启: !!(
        normalizedData.登神长阶 ||
        (normalizedData.生命层级 && String(normalizedData.生命层级).includes('神'))
      ),
      神位: normalizedData.登神长阶?.神位 || normalizedData.神位 || '',
      神国: {
        名称: normalizedData.登神长阶?.神国?.名称 || normalizedData.神国?.名称 || '',
        描述: normalizedData.登神长阶?.神国?.描述 || normalizedData.神国?.描述 || '',
      },
      要素: arrayToMap(normalizedData.登神长阶?.要素 || normalizedData.要素, 'divinity'),
      权能: arrayToMap(normalizedData.登神长阶?.权能 || normalizedData.权能, 'divinity'),
      法则: arrayToMap(normalizedData.登神长阶?.法则 || normalizedData.法则, 'divinity'),
    },
    命定契约: false,
    好感度: 0,
    心里话: '',
    背景故事: normalizedData.背景故事 || '',
  };

  let currentVars: Record<string, any> | null = null;

  try {
    currentVars = await api.getVariables(targetScope);
  } catch {
    currentVars = null;
  }

  const keepIfPresent = (val: unknown) => (val === undefined || val === null ? undefined : val);
  const currentCharacter = currentVars?.stat_data?.关系列表?.[charName];

  const preservedFavor = keepIfPresent(currentCharacter?.好感度);
  const preservedHeart = keepIfPresent(currentCharacter?.心里话);

  if (preservedFavor !== undefined) (mvuData as any).好感度 = preservedFavor;
  if (preservedHeart !== undefined) (mvuData as any).心里话 = preservedHeart;

  const updatePayload: Record<string, any> = {
    stat_data: { 关系列表: { [charName]: mvuData } },
  };

  await api.insertOrAssignVariables(updatePayload, targetScope);
}

export async function saveToChatWorldbook(data: CharacterData, originalYaml: string): Promise<void> {
  const api = getApi();
  if (typeof api.getOrCreateChatWorldbook !== 'function' || typeof api.createWorldbookEntries !== 'function') {
    throw new Error('未检测到 Worldbook API。');
  }

  const normalizedData = normalizeCharacterDataKeys(data);
  const characterName = normalizedData.姓名 || 'Unknown';
  const shortName = characterName.split(/[·\s]/)[0];
  const lorebookKey = shortName && shortName.trim().length > 0 ? shortName : characterName;

  let bookName: string | null = null;
  if (typeof api.getChatWorldbookName === 'function') {
    bookName = await api.getChatWorldbookName('current');
  }

  if (!bookName) {
    const now = new Date();
    const timeStr = `${now.getFullYear()}_${String(now.getMonth() + 1).padStart(2, '0')}_${String(now.getDate()).padStart(2, '0')}_${now.getHours()}h_${now.getMinutes()}m_${now.getSeconds()}s`;
    const desiredName = `命定之诗-charinfo-Chat_Book_${timeStr}`;
    bookName = await api.getOrCreateChatWorldbook('current', desiredName);
  }

  const newEntry = {
    name: characterName,
    enabled: true,
    strategy: { type: 'selective', keys: [lorebookKey] },
    position: { type: 'after_character_definition', order: 152 },
    content: originalYaml,
  };

  await api.createWorldbookEntries(bookName, [newEntry]);
}
