export type CharacterStoryBookLink = {
  bookId: string;
  title: string;
  festivalName?: string;
};

export const characterStoryBookMap: Record<string, CharacterStoryBookLink> = {
  '维纳丝·珀菈·索伦蒂斯': {
    bookId: '阿芙罗黛蒂之冠',
    title: '阿芙罗黛蒂之冠',
    festivalName: '倾国倾城祭',
  },
};
