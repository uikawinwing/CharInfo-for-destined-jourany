import { characterImageMap } from './characterImageMap';
import {
  normalizeImageUrlForBrowser,
  normalizePortraitMediaUrlForBrowser,
  type PortraitMediaKind,
} from './services/imageUrl';

export type SpecialNpcDivinityVariant = 'default' | 'venusCurtain';
export type SpecialNpcVisualTheme = 'default' | 'venus' | 'anastasia' | 'ailisi';

export type SpecialNpcProfile = {
  name: string;
  imageUrl: string;
  portraitKind: PortraitMediaKind;
  visualTheme: SpecialNpcVisualTheme;
  divinityVariant: SpecialNpcDivinityVariant;
  divinityStageBackgroundUrl?: string;
};

const specialNpcProfileOverrides: Partial<Record<string, Partial<SpecialNpcProfile>>> = {
  '维纳丝·珀菈·索伦蒂斯': {
    visualTheme: 'venus',
    divinityVariant: 'venusCurtain',
    divinityStageBackgroundUrl: 'https://files.catbox.moe/3by4cx.png',
  },
  '安娜斯塔西娅·佛罗伦丝·瓦雷利乌斯': {
    visualTheme: 'anastasia',
  },
  '艾璃丝·赛瑞利亚': {
    visualTheme: 'ailisi',
  },
};

export function resolveSpecialNpcProfile(name: string): SpecialNpcProfile | null {
  const rawImageUrl = characterImageMap[name];
  if (!rawImageUrl) return null;

  const override = specialNpcProfileOverrides[name] ?? {};
  const portraitMedia = normalizePortraitMediaUrlForBrowser(override.imageUrl ?? rawImageUrl);
  if (!portraitMedia) return null;
  const divinityStageBackgroundUrl = override.divinityStageBackgroundUrl
    ? normalizeImageUrlForBrowser(override.divinityStageBackgroundUrl)
    : undefined;
  return {
    name,
    imageUrl: portraitMedia.url,
    portraitKind: portraitMedia.kind,
    visualTheme: override.visualTheme ?? 'default',
    divinityVariant: override.divinityVariant ?? 'default',
    divinityStageBackgroundUrl,
  };
}

export function resolveSpecialPortraitProfile(name: string, rawImageUrl: string): SpecialNpcProfile | null {
  const portraitMedia = normalizePortraitMediaUrlForBrowser(rawImageUrl);
  if (!portraitMedia) return null;

  return {
    name,
    imageUrl: portraitMedia.url,
    portraitKind: portraitMedia.kind,
    visualTheme: 'default',
    divinityVariant: 'default',
  };
}
