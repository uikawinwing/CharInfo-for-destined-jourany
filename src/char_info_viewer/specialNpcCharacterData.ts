import { parseCharacterYaml } from './services/yamlParser';
import type { CharacterData } from './types';

const specialNpcRegistryEntryName = 'char_info_special_profiles';
const specialNpcReferencePattern = /^__char_info_ref\s*:\s*([a-z0-9][a-z0-9_-]*)\s*$/i;
const charInfoWrapperPattern = /^<char_info>\s*([\s\S]*?)\s*<\/char_info>$/i;

export type SpecialNpcReference = { kind: 'not_reference' } | { kind: 'reference'; reference: string };

export type SpecialNpcCharacterReferenceResolution = {
  reference: string;
  data: CharacterData;
  injectData: CharacterData;
  appearVariableName: string;
};

type RegistryEntryLocation = {
  worldbookName: string;
  content: string;
};

export function parseSpecialNpcCharacterReference(source: string): SpecialNpcReference {
  const trimmedSource = source.trim();
  const wrappedMatch = trimmedSource.match(charInfoWrapperPattern);
  const referenceSource = wrappedMatch ? wrappedMatch[1].trim() : trimmedSource;
  const match = referenceSource.match(specialNpcReferencePattern);
  return match ? { kind: 'reference', reference: match[1] } : { kind: 'not_reference' };
}

export async function loadSpecialNpcCharacterReference(
  reference: string,
): Promise<SpecialNpcCharacterReferenceResolution> {
  const registry = await findSpecialNpcRegistry();
  const npcBlock = findSpecialNpcBlock(registry.content, reference);
  const appearVariableName = readAttribute(npcBlock.attributes, 'appear_variable');
  if (!appearVariableName) {
    throw new Error(`专属资料 ${reference} 缺少 appear_variable。`);
  }

  const injectData = parseRegistryYaml(reference, 'inject_var', readTagContent(npcBlock.content, 'inject_var', true)!);
  const displaySource = readTagContent(npcBlock.content, 'display_only', false);
  const displayData = displaySource
    ? { ...injectData, ...parseRegistryYaml(reference, 'display_only', displaySource) }
    : injectData;

  return {
    reference,
    data: displayData,
    injectData,
    appearVariableName,
  };
}

async function findSpecialNpcRegistry(): Promise<RegistryEntryLocation> {
  const worldbookNames = getActiveWorldbookNames();
  const matches = (
    await Promise.all(
      worldbookNames.map(async worldbookName => {
        try {
          const entries = await getWorldbook(worldbookName);
          return entries
            .filter(entry => entry.name === specialNpcRegistryEntryName)
            .map(entry => ({ worldbookName, content: entry.content }));
        } catch (error) {
          console.warn(`[CharInfo Viewer] Failed to read worldbook ${worldbookName}:`, error);
          return [];
        }
      }),
    )
  ).flat();

  if (matches.length === 0) {
    throw new Error(`未找到禁用资料库条目 ${specialNpcRegistryEntryName}。`);
  }
  if (matches.length > 1) {
    throw new Error(`找到 ${matches.length} 个同名资料库条目 ${specialNpcRegistryEntryName}，请只保留一个。`);
  }

  return matches[0];
}

function getActiveWorldbookNames(): string[] {
  const characterWorldbooks = getCharWorldbookNames('current');
  const names = [
    getChatWorldbookName('current'),
    characterWorldbooks.primary,
    ...characterWorldbooks.additional,
    ...getGlobalWorldbookNames(),
  ].filter((name): name is string => typeof name === 'string' && name.trim().length > 0);

  return [...new Set(names)];
}

function findSpecialNpcBlock(content: string, reference: string): { attributes: string; content: string } {
  const registryRoot = /<special_npc_registry\b[^>]*>/i;
  if (!registryRoot.test(content)) {
    throw new Error(`资料库 ${specialNpcRegistryEntryName} 缺少 <special_npc_registry> 根标签。`);
  }

  const pattern = /<special_npc\b([^>]*)>([\s\S]*?)<\/special_npc>/gi;
  const matches = [...content.matchAll(pattern)].filter(match => readAttribute(match[1], 'id') === reference);
  if (matches.length === 0) {
    throw new Error(`资料库中未找到 ${reference}。`);
  }
  if (matches.length > 1) {
    throw new Error(`资料库中存在重复的 ${reference}。`);
  }

  return { attributes: matches[0][1], content: matches[0][2] };
}

function readAttribute(attributes: string, name: string): string | null {
  const match = attributes.match(new RegExp(`\\b${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)')`, 'i'));
  return match?.[1] ?? match?.[2] ?? null;
}

function readTagContent(source: string, tag: 'inject_var' | 'display_only', required: boolean): string | null {
  const matches = [...source.matchAll(new RegExp(`<${tag}>\\s*([\\s\\S]*?)\\s*</${tag}>`, 'gi'))];
  if (matches.length === 1) return matches[0][1];
  if (matches.length === 0 && !required) return null;
  throw new Error(matches.length === 0 ? `专属资料缺少 <${tag}>。` : `专属资料包含重复的 <${tag}>。`);
}

function parseRegistryYaml(reference: string, blockName: string, source: string): CharacterData {
  const parsed = parseCharacterYaml(source);
  if (parsed.success) return parsed.data;

  const detail = parsed.error.message || '未知 YAML 错误';
  throw new Error(`${reference} 的 <${blockName}> 无法解析：${detail}`);
}
