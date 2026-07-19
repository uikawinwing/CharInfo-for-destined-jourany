import anchorSvg from '../../../../assets/char_info_viewer/materials/anchor.svg?raw';

function svgToCssUrl(svg: string): string {
  const encoded = encodeURIComponent(svg)
    .replace(/'/g, '%27')
    .replace(/"/g, '%22')
    .replace(/\(/g, '%28')
    .replace(/\)/g, '%29');
  return `url("data:image/svg+xml,${encoded}")`;
}

export const anastasiaPortraitCssVars = {
  '--anastasia-anchor-pattern-url': svgToCssUrl(anchorSvg),
} as Record<string, string>;
