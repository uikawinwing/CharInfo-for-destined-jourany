import {
  itemDescription,
  itemEffectOrDescription,
  itemName,
  lawActive,
  lawPassive,
  type CharacterViewModel,
  type ItemObject,
} from '../../services/characterViewModel';

export type DivinityStageSection = {
  kind: string;
  typeLabel: string;
  title: string;
  body: string;
};

function createSection(kind: string, typeLabel: string, titleText: string, body: string): DivinityStageSection | null {
  const safeTitle = titleText.trim();
  const safeBody = body.trim();
  if (!safeTitle && !safeBody) return null;
  return {
    kind,
    typeLabel,
    title: safeTitle || kind,
    body: safeBody,
  };
}

function objectSections(items: ItemObject[], kind: string, typeLabel: string): DivinityStageSection[] {
  return items
    .map(item => createSection(kind, typeLabel, itemName(item), itemEffectOrDescription(item)))
    .filter((section): section is DivinityStageSection => !!section);
}

export function buildDivinitySections(vm: CharacterViewModel): DivinityStageSection[] {
  const entries: Array<DivinityStageSection | null> = [
    vm.divinityKingdom
      ? createSection('神国', 'Divine Realm', vm.divinityKingdom.name, vm.divinityKingdom.description)
      : null,
    ...objectSections(vm.divinityElements, '要素', 'Divine Element'),
    ...objectSections(vm.divinityPowers, '权能', 'Authority'),
    ...vm.divinityLaws.flatMap(item => [
      createSection('被动', 'Passive Skill', itemName(item), lawPassive(item) || itemDescription(item)),
      createSection('主动', 'Active Skill', itemName(item), lawActive(item)),
    ]),
  ];

  return entries.filter((section): section is DivinityStageSection => !!section);
}
