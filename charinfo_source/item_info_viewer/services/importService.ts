import type { ItemCardData, ItemEntityKind, ItemImportTarget, NpcOption } from '../types';

type VariableScope = { type: 'message'; message_id: number };

type EntityPathKey = '技能' | '装备' | '背包';

function getMessageScope(): VariableScope {
  return { type: 'message', message_id: getCurrentMessageId() };
}

async function ensureMvuReady(): Promise<void> {
  await waitGlobalInitialized('Mvu');
}

async function getCurrentMvuData(): Promise<Record<string, any>> {
  await ensureMvuReady();
  const data = Mvu.getMvuData(getMessageScope());
  return _.isPlainObject(data) ? data : { stat_data: {} };
}

function deepMergePreservingMissing<T extends Record<string, any>>(base: T, patch: Record<string, any>): T {
  const result = _.cloneDeep(base ?? {}) as Record<string, any>;

  Object.entries(patch).forEach(([key, value]) => {
    if (_.isPlainObject(value) && _.isPlainObject(result[key])) {
      result[key] = deepMergePreservingMissing(result[key], value as Record<string, any>);
      return;
    }

    if (value !== undefined) {
      result[key] = _.cloneDeep(value);
    }
  });

  return result as T;
}

function normalizeEntityPath(entityKind: ItemEntityKind): EntityPathKey {
  if (entityKind === '技能') return '技能';
  if (entityKind === '装备') return '装备';
  return '背包';
}

function getOwnerBasePath(target: ItemImportTarget): string {
  if (target.ownerType === 'mc') return 'stat_data.主角';
  if (!target.ownerName) throw new Error('NPC 导入缺少目标名称。');
  return `stat_data.关系列表.${target.ownerName}`;
}

function buildNewEntity(card: ItemCardData): Record<string, any> {
  if (card.entityKind === '技能') {
    return {
      品质: card.quality || '未知',
      类型: card.type || '未知',
      消耗: card.cost || '',
      标签: [...card.tags],
      效果: _.cloneDeep(card.effects || {}),
      描述: card.description || '',
    };
  }

  if (card.entityKind === '装备') {
    return {
      品质: card.quality || '未知',
      类型: card.type || '未知',
      标签: [...card.tags],
      效果: _.cloneDeep(card.effects || {}),
      描述: card.description || '',
      位置: '储物空间',
    };
  }

  return {
    品质: card.quality || '未知',
    类型: card.type || '未知',
    数量: 1,
    标签: [...card.tags],
    效果: _.cloneDeep(card.effects || {}),
    描述: card.description || '',
  };
}

function mergeEntity(existing: Record<string, any> | undefined, card: ItemCardData): Record<string, any> {
  const created = buildNewEntity(card);
  if (!existing || !_.isPlainObject(existing)) return created;

  const merged = deepMergePreservingMissing(existing, created);
  if (card.entityKind === '装备') {
    merged.位置 = '储物空间';
  }
  return merged;
}

export async function getNpcOptions(): Promise<NpcOption[]> {
  const mvuData = await getCurrentMvuData();
  const relationList = _.get(mvuData, 'stat_data.关系列表', {});
  if (!_.isPlainObject(relationList)) return [];

  return Object.keys(relationList)
    .filter(key => key.trim().length > 0)
    .map(key => ({ key, label: key }));
}

export async function importItemCardToMvu(card: ItemCardData, target: ItemImportTarget): Promise<void> {
  const mvuData = await getCurrentMvuData();
  const containerPath = `${getOwnerBasePath(target)}.${normalizeEntityPath(card.entityKind)}`;
  const currentContainer = _.get(mvuData, containerPath, {});

  if (!_.isPlainObject(currentContainer)) {
    _.set(mvuData, containerPath, {});
  }

  const entryPath = `${containerPath}.${card.name}`;
  const existing = _.get(mvuData, entryPath);
  const nextValue = mergeEntity(existing, card);
  _.set(mvuData, entryPath, nextValue);

  await Mvu.replaceMvuData(mvuData as Mvu.MvuData, getMessageScope());
}

export async function ensureVariableAccess(): Promise<void> {
  await ensureMvuReady();
  Mvu.getMvuData(getMessageScope());
}
