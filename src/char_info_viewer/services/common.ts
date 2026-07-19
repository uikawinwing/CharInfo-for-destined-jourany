export function hasText(val: unknown): boolean {
  if (!val) return false;
  const s = normalizeDisplayText(val).toLowerCase();
  return s !== '' && s !== 'null' && s !== 'none' && s !== '[]';
}

export function hasArrayContent(arr: unknown): arr is unknown[] {
  return Array.isArray(arr) && arr.length > 0;
}

export function parseAttributeValue(val: unknown): number {
  if (val === undefined || val === null) return 0;
  const str = normalizeDisplayText(val);
  if (str.includes('=')) {
    const parts = str.split('=');
    const lastPart = parts[parts.length - 1].trim();
    return parseInt(lastPart, 10) || 0;
  }
  return parseInt(str, 10) || 0;
}

export function normalizeDisplayText(input: unknown): string {
  let text = String(input ?? '').trim();

  while (text.length >= 2) {
    const first = text[0];
    const last = text[text.length - 1];
    const wrappedByDouble = first === '"' && last === '"';
    const wrappedBySingle = first === "'" && last === "'";
    if (!wrappedByDouble && !wrappedBySingle) break;

    const inner = text.slice(1, -1).trim();
    if (!inner) {
      text = '';
      break;
    }

    text = inner;
  }

  return text;
}

function splitSmartList(input: string): string[] {
  const items: string[] = [];
  let current = '';
  let inSingleQuote = false;
  let inDoubleQuote = false;

  const normalizeListItem = (value: string) =>
    normalizeDisplayText(
      normalizeDisplayText(value)
        .replace(/^(?:\[|\()+|(?:\]|\))+$/g, '')
        .trim(),
    );

  for (let index = 0; index < input.length; index += 1) {
    const char = input[index];
    const prev = index > 0 ? input[index - 1] : '';

    if (char === '"' && prev !== '\\' && !inSingleQuote) {
      inDoubleQuote = !inDoubleQuote;
      current += char;
      continue;
    }

    if (char === "'" && prev !== '\\' && !inDoubleQuote) {
      inSingleQuote = !inSingleQuote;
      current += char;
      continue;
    }

    const isDelimiter = /[,;|，；、]/.test(char);
    if (isDelimiter && !inSingleQuote && !inDoubleQuote) {
      const normalized = normalizeListItem(current);
      if (normalized && normalized.toLowerCase() !== 'null' && normalized.toLowerCase() !== 'none') {
        items.push(normalized);
      }
      current = '';
      continue;
    }

    current += char;
  }

  const normalized = normalizeListItem(current);
  if (normalized && normalized.toLowerCase() !== 'null' && normalized.toLowerCase() !== 'none') {
    items.push(normalized);
  }

  return items;
}

export function getSmartArray(input: unknown): string[] {
  if (input === undefined || input === null) return [];
  if (Array.isArray(input)) {
    return input.map(item => normalizeDisplayText(item)).filter(Boolean);
  }

  const str = String(input).trim();
  if (!str || str.toLowerCase() === 'null' || str.toLowerCase() === 'none') return [];

  const processed = str.replace(/\]\s*\[/g, '],[').trim();
  const content = processed.startsWith('[') && processed.endsWith(']') ? processed.slice(1, -1) : processed;
  return splitSmartList(content);
}

export function escapeHtml(str: unknown): string {
  const div = document.createElement('div');
  div.textContent = String(str ?? '');
  return div.innerHTML;
}
