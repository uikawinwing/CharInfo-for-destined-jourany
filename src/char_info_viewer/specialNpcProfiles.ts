import { characterImageMap } from './characterImageMap';
import { normalizeImageUrlForBrowser } from './services/imageUrl';

export type SpecialNpcDivinityVariant = 'default' | 'venusCurtain';
export type SpecialNpcVisualTheme = 'default' | 'venus';

export type SpecialNpcProfile = {
  name: string;
  imageUrl: string;
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
};

export function resolveSpecialNpcProfile(name: string): SpecialNpcProfile | null {
  const rawImageUrl = characterImageMap[name];
  if (!rawImageUrl) return null;

  const override = specialNpcProfileOverrides[name] ?? {};
  const divinityStageBackgroundUrl = override.divinityStageBackgroundUrl
    ? normalizeImageUrlForBrowser(override.divinityStageBackgroundUrl)
    : undefined;
  return {
    name,
    imageUrl: normalizeImageUrlForBrowser(override.imageUrl ?? rawImageUrl),
    visualTheme: override.visualTheme ?? 'default',
    divinityVariant: override.divinityVariant ?? 'default',
    divinityStageBackgroundUrl,
  };
}
