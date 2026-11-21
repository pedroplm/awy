export interface GalleryPhoto {
  id: string;
  characterId: string;
  title: string;
  description: string;
  hint: string;
  imageSource: any;
  barrierRequired?: number;
  category: 'barrier' | 'situational' | 'special';
  badge?: string;
}
