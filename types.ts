export enum GameType {
  NONE = 'NONE',
  ALCHEMY = 'ALCHEMY',
  EMOJI = 'EMOJI',
  DILEMMA = 'DILEMMA',
  LADDER = 'LADDER',
  CIPHER = 'CIPHER'
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
  consequenceA: string; // What AI thinks happens if you choose A
  consequenceB: string; // What AI thinks happens if you choose B
}

export interface LadderChallenge {
  startWord: string;
  endWord: string;
  startEmoji: string;
  endEmoji: string;
}

export interface LadderValidation {
  isValid: boolean;
  message: string; // Why it is valid or invalid
  emoji?: string; // Emoji for the valid step
  proximity?: number; // 0 to 100 score of how close/good the word is even if invalid
}

export interface LadderHint {
  word: string;
  reason: string;
}

export interface CipherChallenge {
  original: string;
  encrypted: string;
  rule: string; // e.g., "Vowels are numbers", "Reverse words"
  category: string; // e.g., "Proverb", "Movie Quote"
}

export interface LoaderState {
  loading: boolean;
  message?: string;
}