import portraitCornerSvg from '../../../../assets/char_info_viewer/materials/floral-corners-all-svg/corner-03.svg?raw';
import nameLeftFlourishSvg from '../../../../assets/char_info_viewer/materials/ornament-parts-all-svg/01-top-left-flourish.svg?raw';
import nameRightFlourishSvg from '../../../../assets/char_info_viewer/materials/ornament-parts-all-svg/03-top-right-flourish.svg?raw';
import nameCenterCrestSvg from '../../../../assets/char_info_viewer/materials/ornament-parts-all-svg/06-mid-center-wing.svg?raw';
import nameBottomCrestSvg from '../../../../assets/char_info_viewer/materials/ornament-parts-all-svg/10-lower-divider.svg?raw';

function svgToCssUrl(svg: string): string {
  const encoded = encodeURIComponent(svg)
    .replace(/'/g, '%27')
    .replace(/"/g, '%22')
    .replace(/\(/g, '%28')
    .replace(/\)/g, '%29');
  return `url("data:image/svg+xml,${encoded}")`;
}

export const venusPortraitCssVars = {
  '--venus-portrait-corner-url': svgToCssUrl(portraitCornerSvg),
} as Record<string, string>;

export const venusNameFrameCssVars = {
  '--venus-name-left-flourish-url': svgToCssUrl(nameLeftFlourishSvg),
  '--venus-name-right-flourish-url': svgToCssUrl(nameRightFlourishSvg),
  '--venus-name-center-crest-url': svgToCssUrl(nameCenterCrestSvg),
  '--venus-name-bottom-crest-url': svgToCssUrl(nameBottomCrestSvg),
} as Record<string, string>;
