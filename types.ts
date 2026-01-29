export enum GameType {
  NONE = 'NONE',
  ALCHEMY = 'ALCHEMY',
  EMOJI = 'EMOJI',
  DILEMMA = 'DILEMMA',
  LADDER = 'LADDER',
  CIPHER = 'CIPHER',
  ARENA = 'ARENA'
}

export interface AlchemyElement {
  id: string;
  name: string;
  emoji: string;
  isNew?: boolean;
}

export interface EmojiChallenge {
  emojis: string;
  answer: string;
  hints: string[];
}

export interface DilemmaScenario {
  title: string;
  description: string;
  optionA: string;
  optionB: string;
  consequenceA: string;
  consequenceB: string;
}

export interface LadderChallenge {
  startWord: string;
  endWord: string;
  startEmoji: string;
  endEmoji: string;
}

export interface LadderValidation {
  isValid: boolean;
  message: string;
  emoji?: string;
  proximity?: number;
}

export interface LadderHint {
  word: string;
  reason: string;
}

export interface CipherChallenge {
  original: string;
  encrypted: string;
  rule: string;
  category: string;
}

export interface ArenaChallenge {
  creature: string;
  emoji: string;
  description: string;
  difficulty: 'Easy' | 'Medium' | 'Hard' | 'Legendary';
}

export interface ArenaResult {
  success: boolean;
  commentary: string;
  survivalChance: number; // 0-100
  damageDealt: number; // 0-100
}

export interface LoaderState {
  loading: boolean;
  message?: string;
}