const CATBOX_FILE_HOST = 'files.catbox.moe';
const CATBOX_IMAGE_PROXY_ORIGIN = 'https://wsrv.nl/';

function parseAbsoluteImageUrl(url: string): URL | null {
  try {
    if (url.startsWith('//')) return new URL(`https:${url}`);
    return new URL(url);
  } catch (_) {
    return null;
  }
}

export function normalizeImageUrlForBrowser(url: string): string {
  const trimmed = url.trim();
  if (!trimmed) return '';

  const parsed = parseAbsoluteImageUrl(trimmed);
  if (!parsed || parsed.hostname !== CATBOX_FILE_HOST) return trimmed;

  const proxiedUrl = `${parsed.hostname}${parsed.pathname}${parsed.search}`;
  return `${CATBOX_IMAGE_PROXY_ORIGIN}?url=${encodeURIComponent(proxiedUrl)}`;
}
