
import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import { AlchemyElement, EmojiChallenge, DilemmaScenario, LadderChallenge, LadderValidation, LadderHint, CipherChallenge, ArenaChallenge, ArenaResult } from '../types';

// --- API Key Management ---
const getAI = () => {
  const key = process.env.API_KEY;
  // If not in process.env, the connection might still work if selected via window.aistudio
  // and injected by the platform.
  return new GoogleGenAI({ apiKey: key as string });
};

// --- Helpers ---

const cleanJson = (text: string): string => {
  return text.replace(/```json/g, '').replace(/```/g, '').trim();
};

const getLanguage = (): string => {
  if (typeof navigator !== 'undefined') {
    return navigator.language.startsWith('pt') ? 'pt-BR' : 'en-US';
  }
  return 'pt-BR';
};

export class QuotaExceededError extends Error {
  constructor() {
    super("Quota Exceeded");
    this.name = "QuotaExceededError";
  }
}

const retryWithBackoff = async <T>(
  operation: () => Promise<T>,
  retries: number = 3,
  initialDelay: number = 2000
): Promise<T> => {
  let currentDelay = initialDelay;
  
  for (let i = 0; i < retries; i++) {
    try {
      return await operation();
    } catch (error: any) {
      const errorMessage = error.message?.toLowerCase() || '';
      const status = error.status || error.response?.status;
      
      if (
        status === 'RESOURCE_EXHAUSTED' || 
        status === 429 && errorMessage.includes('quota') ||
        errorMessage.includes('resource exhausted')
      ) {
        throw new QuotaExceededError();
      }

      const isRetryable = 
        status === 429 || 
        status === 503 ||
        errorMessage.includes('429') || 
        errorMessage.includes('overloaded') ||
        errorMessage.includes('not found'); // Handle race conditions in key selection

      if (isRetryable && i < retries - 1) {
        await new Promise(resolve => setTimeout(resolve, currentDelay));
        currentDelay *= 2;
        continue;
      }
      throw error;
    }
  }
  throw new Error("Max retries exceeded");
};

// --- Local Storage Caches ---

const ALCHEMY_CACHE_KEY = 'alchemy_v2_cache';
const LADDER_CACHE_KEY = 'ladder_val_cache_v3';

const getCache = (key: string): Record<string, any> => {
    if (typeof localStorage === 'undefined') return {};
    try {
        return JSON.parse(localStorage.getItem(key) || '{}');
    } catch { return {}; }
}

const saveCache = (key: string, id: string, data: any) => {
    if (typeof localStorage === 'undefined') return;
    const cache = getCache(key);
    cache[id] = data;
    const keys = Object.keys(cache);
    if (keys.length > 500) delete cache[keys[0]]; 
    localStorage.setItem(key, JSON.stringify(cache));
}

// --- Games ---

export const combineAlchemyElements = async (elem1: string, elem2: string): Promise<AlchemyElement | null> => {
  const cacheKey = [elem1, elem2].sort().join('+').toLowerCase();
  const cached = getCache(ALCHEMY_CACHE_KEY)[cacheKey];
  if (cached) return { ...cached, id: Date.now().toString(), isNew: false };

  try {
    const ai = getAI();
    const lang = getLanguage();
    const prompt = `InfiniteCraft. Combine "${elem1}"+"${elem2}". Lang:${lang}. Out:1 noun(Real/PopCulture). JSON:{name,emoji}`;
    const response = await retryWithBackoff<GenerateContentResponse>(() => ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: { responseMimeType: 'application/json' }
    }));
    if (response.text) {
      const data = JSON.parse(cleanJson(response.text));
      saveCache(ALCHEMY_CACHE_KEY, cacheKey, { name: data.name, emoji: data.emoji });
      return { id: Date.now().toString(), name: data.name, emoji: data.emoji, isNew: true };
    }
    return null;
  } catch (error) { throw error; }
};

export const generateEmojiChallengeBatch = async (exclude: string[] = []): Promise<EmojiChallenge[]> => {
  try {
    const ai = getAI();
    const lang = getLanguage();
    const excludeList = exclude.slice(-15).join(','); 
    const prompt = `List 5 distinct Blockbusters(Movie/Game). No:[${excludeList}]. Lang:${lang}. JSON Array:{answer,emojis,hints[5](hard->easy)}`;
    const response = await retryWithBackoff<GenerateContentResponse>(() => ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: { responseMimeType: 'application/json' }
    }));
    return response.text ? JSON.parse(cleanJson(response.text)) : [];
  } catch (error) { throw error; }
};

export const generateDilemmaBatch = async (): Promise<DilemmaScenario[]> => {
  try {
    const ai = getAI();
    const lang = getLanguage();
    const prompt = `5 funny "Would You Rather". Lang:${lang}. JSON Array:{title,description,optionA,optionB,consequenceA,consequenceB}`;
    const response = await retryWithBackoff<GenerateContentResponse>(() => ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: { responseMimeType: 'application/json' }
    }));
    return response.text ? JSON.parse(cleanJson(response.text)) : [];
  } catch (error) { throw error; }
};

export const generateLadderChallenge = async (): Promise<LadderChallenge | null> => {
  try {
    const ai = getAI();
    const lang = getLanguage();
    const prompt = `2 nouns(Start/End) for WordLadder(5 steps). Lang:${lang}. JSON:{startWord,endWord,startEmoji,endEmoji}`;
    const response = await retryWithBackoff<GenerateContentResponse>(() => ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: { responseMimeType: 'application/json' }
    }));
    return response.text ? JSON.parse(cleanJson(response.text)) : null;
  } catch (error) { throw error; }
};

export const validateLadderStep = async (current: string, target: string, guess: string): Promise<LadderValidation> => {
    const cacheKey = `${current.toLowerCase()}_${target.toLowerCase()}_${guess.toLowerCase()}`;
    const cached = getCache(LADDER_CACHE_KEY)[cacheKey];
    if (cached) return cached;
    try {
        const ai = getAI();
        const lang = getLanguage();
        const prompt = `Game: Word Ladder. Connect "${current}" to "${target}". Input: "${guess}". Lang:${lang}. JSON:{isValid,message,emoji,proximity(0-100)}`;
        const response = await retryWithBackoff<GenerateContentResponse>(() => ai.models.generateContent({
          model: 'gemini-3-pro-preview',
          contents: prompt,
          config: { responseMimeType: 'application/json' }
        }));
        if (response.text) {
            const data = JSON.parse(cleanJson(response.text));
            saveCache(LADDER_CACHE_KEY, cacheKey, data);
            return data;
        }
        return { isValid: false, message: "Error" };
    } catch (error) { throw error; }
};

export const getLadderHint = async (current: string, target: string): Promise<LadderHint | null> => {
  try {
      const ai = getAI();
      const lang = getLanguage();
      const prompt = `WordLadder Hint: "${current}"->"${target}". One bridge word. Lang:${lang}. JSON:{word,reason}`;
      const response = await retryWithBackoff<GenerateContentResponse>(() => ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: { responseMimeType: 'application/json' }
      }));
      return response.text ? JSON.parse(cleanJson(response.text)) : null;
  } catch (error) { throw error; }
};

export const generateCipherChallengeBatch = async (exclude: string[] = []): Promise<CipherChallenge[]> => {
  try {
      const ai = getAI();
      const lang = getLanguage();
      const excludeList = exclude.slice(-15).join(',');
      const prompt = `Gen 5 Cipher Games (Difficulty: Hard). Lang:${lang}. No:[${excludeList}]. JSON Array:{original,encrypted,rule,category}`;
      const response = await retryWithBackoff<GenerateContentResponse>(() => ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: { responseMimeType: 'application/json' }
      }));
      return response.text ? JSON.parse(cleanJson(response.text)) : [];
  } catch (error) { throw error; }
}

// --- ARENA GAME (PLAYER-FRIENDLY & REALISTIC) ---

export const generateArenaChallenge = async (): Promise<ArenaChallenge | null> => {
  try {
    const ai = getAI();
    const lang = getLanguage();
    const prompt = `Generate a creature for a survival game. 
    REALISM FOCUS: 85% chance for a REAL ANIMAL (Jaguar, Hippo, Bull Shark, Black Mamba, Siberian Tiger, Moose, Elephant). 15% chance for a Mythological beast.
    Lang:${lang}. JSON:{creature,emoji,description,difficulty}`;

    const response = await retryWithBackoff<GenerateContentResponse>(() => ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: { responseMimeType: 'application/json' }
    }));
    return response.text ? JSON.parse(cleanJson(response.text)) : null;
  } catch (error) { throw error; }
};

export const evaluateCombatStrategy = async (creature: string, strategy: string): Promise<ArenaResult | null> => {
  try {
    const ai = getAI();
    const lang = getLanguage();
    const prompt = `ARENA MASTER ANALYST (SURVIVAL GENIUS MODE).
    Adversary: "${creature}".
    Player Plan: "${strategy}".
    
    FAIRNESS & DIFFICULTY RULES:
    1. If the player uses tools, environment (climbing, water), fire, distractions, or logic, they MUST survive (success: true).
    2. Real animals are biological: they flee from pain, fire, and loud noises.
    3. Humans win through BRAINS. If the player's description is creative, reward them with victory.
    4. Only fail the player if they do something intentionally suicidal (e.g., "I wait for it to eat me").
    5. The goal is CINEMATIC SURVIVAL.
    
    Lang: ${lang}.
    JSON:{success,commentary,survivalChance,damageDealt}`;

    const response = await retryWithBackoff<GenerateContentResponse>(() => ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
      config: { responseMimeType: 'application/json' }
    }));
    return response.text ? JSON.parse(cleanJson(response.text)) : null;
  } catch (error) { throw error; }
};
