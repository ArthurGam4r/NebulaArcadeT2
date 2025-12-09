export enum GameType {
  NONE = 'NONE',
  ALCHEMY = 'ALCHEMY',
  EMOJI = 'EMOJI',
  DILEMMA = 'DILEMMA'
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

export interface LoaderState {
  loading: boolean;
  message?: string;
}