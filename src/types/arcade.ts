export type GameMode = 'dama' | 'snakes';

export type PlayerSlot = 'p1' | 'p2';

export type CatBreedId =
  | 'orange-tabby'
  | 'calico'
  | 'tuxedo'
  | 'siamese'
  | 'void-black'
  | 'scottish-fold'
  | 'white-persian'
  | 'strawberry-cat';

export type CatAccessoryId = 'none' | 'crown' | 'ribbon' | 'sakura' | 'sunglasses';

export interface CatAvatarConfig {
  name: string;
  breed: CatBreedId;
  accessory: CatAccessoryId;
}

export interface CoupleScoreboard {
  p1DamaWins: number;
  p2DamaWins: number;
  p1SnakesWins: number;
  p2SnakesWins: number;
}

export interface FloatingReaction {
  id: string;
  sender: PlayerSlot;
  content: string;
  kind: 'emoji' | 'chat';
  createdAt: number;
}

export const QUICK_EMOJIS = ['😻', '😹', '😿', '🐾', '🐟', '❤️'] as const;
