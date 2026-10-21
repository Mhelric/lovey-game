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

export interface CoupleRoomRow {
  room_code: string;
  p1_avatar: CatAvatarConfig;
  p2_avatar: CatAvatarConfig;
  p1_dama_wins: number;
  p2_dama_wins: number;
  p1_snakes_wins: number;
  p2_snakes_wins: number;
  current_mode: GameMode;
  updated_at: string;
}

export interface ActiveMatchRow<TState = Record<string, unknown>> {
  room_code: string;
  game_mode: GameMode;
  turn: PlayerSlot;
  board_seed: number;
  state_json: TState;
  winner: PlayerSlot | 'draw' | null;
  updated_at: string;
}

export interface MatchHistoryRow {
  id: string;
  room_code: string;
  game_mode: GameMode;
  winner: PlayerSlot | 'draw';
  p1_name: string;
  p2_name: string;
  summary: string;
  played_at: string;
}

export interface FloatingReaction {
  id: string;
  sender: PlayerSlot;
  content: string;
  kind: 'emoji' | 'chat';
  createdAt: number;
}

export const QUICK_EMOJIS = ['😻', '😹', '😿', '🐾', '🐟', '❤️'] as const;

export const QUICK_CHAT_PRESETS = [
  'Good luck lovey! 💕',
  'Your turn! 🐾',
  'Nooo my cat! 😿',
  'Hehe gotcha! 😹',
  'One more game! 🔥',
  'I love you! ❤️',
] as const;

export const DEFAULT_P1_AVATAR: CatAvatarConfig = {
  name: 'Lovey 1',
  breed: 'strawberry-cat',
  accessory: 'crown',
};

export const DEFAULT_P2_AVATAR: CatAvatarConfig = {
  name: 'Lovey 2',
  breed: 'orange-tabby',
  accessory: 'ribbon',
};
