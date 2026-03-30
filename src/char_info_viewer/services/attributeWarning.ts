/**
 * 从 `charinfo_source/attributeWarningSystem.js` 迁移而来的“属性警示系统”服务。
 *
 * 保留原始判定规则，但改造成 `src/3.0.2` 可直接引用的 TypeScript 模块。
 */

export const ATTRIBUTE_KEYS = ['力量', '敏捷', '体质', '智力', '精神'] as const;

export type AttributeKey = (typeof ATTRIBUTE_KEYS)[number];

export type AttributeFormulaPartWarning = {
  index: number;
  text: string;
  value: number | null;
  isWarning: boolean;
};

export type AttributeWarningState = {
  total: string;
  formula: string;
  isTotalAbnormal: boolean;
  formulaPartWarnings: AttributeFormulaPartWarning[];
  hasFormulaWarning: boolean;
};

export type AttributeWarningItem = AttributeWarningState & {
  key: AttributeKey;
  short: string;
  rawValue: unknown;
  totalThirdPartSum: number;
};

export const ATTRIBUTE_SHORT_NAMES: Record<AttributeKey, string> = {
  力量: '力',
  敏捷: '敏',
  体质: '体',
  智力: '智',
  精神: '精',
};

export const ATTRIBUTE_ALIASES: Record<AttributeKey, string[]> = {
  力量: ['力量'],
  敏捷: ['敏捷'],
  体质: ['体质', '體質'],
  智力: ['智力'],
  精神: ['精神'],
};

/**
 * 对应原 `c(e)`：
 * - 支持纯数字：`12`
 * - 支持公式结果：`6+2+1=9`
 */
export function parseAttributeTotal(value: unknown): number {
  if (value == null) return 0;

  const text = String(value).trim();

  if (text.includes('=')) {
    const parts = text.split('=');
    const lastPart = parts[parts.length - 1].trim();
    return parseInt(lastPart, 10) || 0;
  }

  return parseInt(text, 10) || 0;
}

/**
 * 对应原 `bt(e)`：拆分公式与最终总值。
 */
export function splitAttributeFormula(value: unknown): { total: string; formula: string } {
  if (value == null) return { total: '0', formula: '' };

  const text = String(value).trim();
  if (!text) return { total: '0', formula: '' };

  if (!text.includes('=')) {
    return { total: String(parseAttributeTotal(text)), formula: '' };
  }

  const parts = text.split('=');
  const formula = parts.slice(0, -1).join('=').trim();
  const total = parts[parts.length - 1]?.trim() || String(parseAttributeTotal(text));

  return { total, formula };
}

/**
 * 对应原 `St(e, t)`：兼容属性键别名读取。
 */
export function getAttributeRawValue(
  attributes: Record<string, unknown> | null | undefined,
  key: AttributeKey,
): unknown {
  const aliases = ATTRIBUTE_ALIASES[key] || [key];

  for (const alias of aliases) {
    const value = attributes?.[alias];
    if (value != null) return value;
  }

  return undefined;
}

/**
 * 对应原 `lp`：根据角色等级换算“公式第二段”的等级阶梯值。
 */
export function getLevelBracket(level: unknown): number {
  const numericLevel = parseInt(String(level ?? '1'), 10) || 1;

  if (numericLevel >= 25) return 7;
  if (numericLevel >= 21) return 6;
  if (numericLevel >= 17) return 5;
  if (numericLevel >= 13) return 4;
  if (numericLevel >= 9) return 3;
  if (numericLevel >= 5) return 2;
  return 1;
}

/**
 * 原模板中第二段公式的警示条件为：`part > lp.value - 1`
 */
export function getFormulaSecondPartLimit(level: unknown): number {
  return getLevelBracket(level) - 1;
}

/**
 * 原模板中第三段公式共用总上限：`zSum > 等级 - 1`
 */
export function getFormulaThirdPartLimit(level: unknown): number {
  const numericLevel = parseInt(String(level ?? '1'), 10) || 1;
  return numericLevel - 1;
}

/**
 * 对应原 `zSum`：统计所有属性公式第三段（索引 2）之和。
 */
export function getFormulaThirdPartSum(attributes: Record<string, unknown> | null | undefined): number {
  return Object.values(attributes || {}).reduce<number>((sum, value) => {
    const parts = String(value).split('=')[0].split('+');
    if (parts.length >= 3) {
      return sum + (parseInt(parts[2].trim(), 10) || 0);
    }
    return sum;
  }, 0);
}

/**
 * 拆分单个属性公式的各段，并给出逐段警示状态。
 *
 * 保持与原模板一致：
 * - 第 1 段（索引 0）> 6 时警示
 * - 第 2 段（索引 1）> `getLevelBracket(level) - 1` 时警示
 * - 第 3 段（索引 2）不看单项值，而看“所有属性第三段总和”是否超过 `等级 - 1`
 */
export function getFormulaPartWarnings(
  formula: string,
  level: unknown,
  totalThirdPartSum: number,
): AttributeFormulaPartWarning[] {
  if (!formula) return [];

  const secondPartLimit = getFormulaSecondPartLimit(level);
  const thirdPartLimit = getFormulaThirdPartLimit(level);

  return formula.split('+').map((part, index) => {
    const trimmed = part.trim();
    const numericValue = parseInt(trimmed, 10);

    let isWarning = false;

    if (index === 0) {
      isWarning = numericValue > 6;
    } else if (index === 1) {
      isWarning = numericValue > secondPartLimit;
    } else if (index === 2) {
      isWarning = totalThirdPartSum > thirdPartLimit;
    }

    return {
      index,
      text: trimmed,
      value: Number.isNaN(numericValue) ? null : numericValue,
      isWarning,
    };
  });
}

/**
 * 对单个属性生成完整警示结果。
 *
 * 总值规则来自原 `$t`：
 * - `< 0` 或 `> 20` 即为异常
 */
export function getAttributeWarningState(
  rawValue: unknown,
  level: unknown,
  totalThirdPartSum = 0,
): AttributeWarningState {
  const parsed = splitAttributeFormula(rawValue);
  const numericTotal = parseInt(parsed.total, 10);
  const isTotalAbnormal = Number.isNaN(numericTotal) || numericTotal < 0 || numericTotal > 20;
  const formulaPartWarnings = getFormulaPartWarnings(parsed.formula, level, totalThirdPartSum);

  return {
    total: parsed.total,
    formula: parsed.formula,
    isTotalAbnormal,
    formulaPartWarnings,
    hasFormulaWarning: formulaPartWarnings.some(part => part.isWarning),
  };
}

/**
 * 批量生成五维属性警示结果。
 */
export function buildAttributeWarningList(
  attributes: Record<string, unknown> | null | undefined,
  level: unknown,
): AttributeWarningItem[] {
  const totalThirdPartSum = getFormulaThirdPartSum(attributes);

  return ATTRIBUTE_KEYS.map(key => {
    const rawValue = getAttributeRawValue(attributes, key);
    const warningState = getAttributeWarningState(rawValue, level, totalThirdPartSum);

    return {
      key,
      short: ATTRIBUTE_SHORT_NAMES[key] || key,
      rawValue,
      totalThirdPartSum,
      ...warningState,
    };
  });
}

/**
 * 生成以属性名为键的警示结果，便于按 key 读取。
 */
export function buildAttributeWarningMap(
  attributes: Record<string, unknown> | null | undefined,
  level: unknown,
): Record<AttributeKey, AttributeWarningItem> {
  return Object.fromEntries(buildAttributeWarningList(attributes, level).map(item => [item.key, item])) as Record<
    AttributeKey,
    AttributeWarningItem
  >;
}
