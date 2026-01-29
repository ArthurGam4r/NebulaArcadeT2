
import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import { AlchemyElement, EmojiChallenge, DilemmaScenario, LadderChallenge, LadderValidation, LadderHint, CipherChallenge, ArenaChallenge, ArenaResult } from '../types';

// --- API Key Management ---
const getAI = () => {
  return new GoogleGenAI({ apiKey: process.env.API_KEY as string });
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
        errorMessage.includes('overloaded');

      if (isRetryable && i < retries - 1) {
        console.warn(`API Rate limit hit. Retrying in ${currentDelay}ms...`);
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
    const model = 'gemini-3-flash-preview';
    const lang = getLanguage();
    const prompt = `InfiniteCraft. Combine "${elem1}"+"${elem2}". Lang:${lang}. Out:1 noun(Real/PopCulture). JSON:{name,emoji}`;

    const operation = () => ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            emoji: { type: Type.STRING },
          },
          required: ['name', 'emoji']
        }
      }
    });

    const response = await retryWithBackoff<GenerateContentResponse>(operation);

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
    const model = 'gemini-3-flash-preview';
    const lang = getLanguage();
    const excludeList = exclude.slice(-15).join(','); 
    const prompt = `List 5 distinct Blockbusters(Movie/Game). No:[${excludeList}]. Lang:${lang}. JSON Array:{answer,emojis,hints[5](hard->easy)}`;

    const operation = () => ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
                answer: { type: Type.STRING },
                emojis: { type: Type.STRING },
                hints: { type: Type.ARRAY, items: { type: Type.STRING } },
            },
            required: ['answer', 'emojis', 'hints']
          }
        }
      }
    });

    const response = await retryWithBackoff<GenerateContentResponse>(operation);
    if (response.text) return JSON.parse(cleanJson(response.text));
    return [];
  } catch (error) { throw error; }
};

export const generateDilemmaBatch = async (): Promise<DilemmaScenario[]> => {
  try {
    const ai = getAI();
    const model = 'gemini-3-flash-preview';
    const lang = getLanguage();
    const prompt = `5 funny "Would You Rather". Lang:${lang}. JSON Array:{title,description,optionA,optionB,consequenceA,consequenceB}`;

    const operation = () => ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    title: { type: Type.STRING },
                    description: { type: Type.STRING },
                    optionA: { type: Type.STRING },
                    optionB: { type: Type.STRING },
                    consequenceA: { type: Type.STRING },
                    consequenceB: { type: Type.STRING },
                },
                required: ['title', 'description', 'optionA', 'optionB', 'consequenceA', 'consequenceB']
            }
        }
      }
    });

    const response = await retryWithBackoff<GenerateContentResponse>(operation);
    if (response.text) return JSON.parse(cleanJson(response.text));
    return [];
  } catch (error) { throw error; }
};

export const generateLadderChallenge = async (): Promise<LadderChallenge | null> => {
  try {
    const ai = getAI();
    const model = 'gemini-3-flash-preview';
    const lang = getLanguage();
    const prompt = `2 nouns(Start/End) for WordLadder(5 steps). Lang:${lang}. JSON:{startWord,endWord,startEmoji,endEmoji}`;

    const operation = () => ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            startWord: { type: Type.STRING },
            endWord: { type: Type.STRING },
            startEmoji: { type: Type.STRING },
            endEmoji: { type: Type.STRING },
          },
          required: ['startWord', 'endWord', 'startEmoji', 'endEmoji']
        }
      }
    });

    const response = await retryWithBackoff<GenerateContentResponse>(operation);
    if (response.text) return JSON.parse(cleanJson(response.text));
    return null;
  } catch (error) { throw error; }
};

export const validateLadderStep = async (current: string, target: string, guess: string): Promise<LadderValidation> => {
    const cacheKey = `${current.toLowerCase()}_${target.toLowerCase()}_${guess.toLowerCase()}`;
    const cached = getCache(LADDER_CACHE_KEY)[cacheKey];
    if (cached) return cached;

    try {
        const ai = getAI();
        const model = 'gemini-3-pro-preview';
        const lang = getLanguage();
        const prompt = `Game: Semantic Bridge (Word Ladder). Connect "${current}" to "${target}". Input: "${guess}".
        RULES:
        1. MEANING ONLY: Semantic associations ONLY. NO Rhymes/Spelling.
        2. ANTI-SHORTCUT (CRITICAL): If user types target "${target}", reject if not an immediate semantic neighbor. Lang:${lang}.
        JSON:{isValid,message,emoji,proximity(0-100)}`;
    
        const operation = () => ai.models.generateContent({
          model,
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                isValid: { type: Type.BOOLEAN },
                message: { type: Type.STRING },
                emoji: { type: Type.STRING },
                proximity: { type: Type.NUMBER },
              },
              required: ['isValid', 'message']
            }
          }
        });
    
        const response = await retryWithBackoff<GenerateContentResponse>(operation);
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
      const model = 'gemini-3-flash-preview';
      const lang = getLanguage();
      const prompt = `WordLadder Hint: "${current}"->"${target}". One bridge word. Lang:${lang}. JSON:{word,reason}`;
      const operation = () => ai.models.generateContent({
        model,
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              word: { type: Type.STRING },
              reason: { type: Type.STRING },
            },
            required: ['word', 'reason']
          }
        }
      });
      const response = await retryWithBackoff<GenerateContentResponse>(operation);
      if (response.text) return JSON.parse(cleanJson(response.text));
      return null;
  } catch (error) { throw error; }
};

export const generateCipherChallengeBatch = async (exclude: string[] = []): Promise<CipherChallenge[]> => {
  try {
      const ai = getAI();
      const model = 'gemini-3-flash-preview';
      const lang = getLanguage();
      const excludeList = exclude.slice(-15).join(',');
      const prompt = `Gen 5 Cipher Games (Difficulty: Hard). Lang:${lang}. No:[${excludeList}]. JSON Array:{original,encrypted,rule,category}`;
      const operation = () => ai.models.generateContent({
        model,
        contents: prompt,
        config: {
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.ARRAY,
              items: {
                  type: Type.OBJECT,
                  properties: {
                    original: { type: Type.STRING },
                    encrypted: { type: Type.STRING },
                    rule: { type: Type.STRING },
                    category: { type: Type.STRING },
                  },
                  required: ['original', 'encrypted', 'rule', 'category']
              }
            }
          }
      });
      const response = await retryWithBackoff<GenerateContentResponse>(operation);
      if (response.text) return JSON.parse(cleanJson(response.text));
      return [];
  } catch (error) { throw error; }
}

// --- ARENA GAME ---

export const generateArenaChallenge = async (): Promise<ArenaChallenge | null> => {
  try {
    const ai = getAI();
    const model = 'gemini-3-flash-preview';
    const lang = getLanguage();
    const prompt = `Generate a creature for a survival game. Can be a real animal, dinosaur, or mythological/fictional beast. Keep it diverse but avoid impossible gods. Lang:${lang}. JSON:{creature,emoji,description,difficulty}`;

    const operation = () => ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            creature: { type: Type.STRING },
            emoji: { type: Type.STRING },
            description: { type: Type.STRING },
            difficulty: { type: Type.STRING, enum: ['Easy', 'Medium', 'Hard', 'Legendary'] },
          },
          required: ['creature', 'emoji', 'description', 'difficulty']
        }
      }
    });

    const response = await retryWithBackoff<GenerateContentResponse>(operation);
    if (response.text) return JSON.parse(cleanJson(response.text));
    return null;
  } catch (error) { throw error; }
};

export const evaluateCombatStrategy = async (creature: string, strategy: string): Promise<ArenaResult | null> => {
  try {
    const ai = getAI();
    const model = 'gemini-3-pro-preview';
    const lang = getLanguage();
    const prompt = `SURVIVAL ARENA ANALYST (FAIR MODE).
    Creature: "${creature}".
    Player Strategy: "${strategy}".
    
    Balance Guidelines:
    1. Reward Creativity: If the player uses tools, environment, or biological weaknesses (e.g., tickling, bright lights, high pitch), increase survival chances significantly.
    2. Be Fair: Human logic vs Beast instinct. Even legendary beasts have weaknesses. Avoid "insta-death" unless the strategy is truly suicidal.
    3. Ironic Humor: If the strategy is funny but plausible in a cartoonish way, allow a high survival chance with a humorous comment.
    
    Lang: ${lang}.
    JSON:{success,commentary,survivalChance,damageDealt}`;

    const operation = () => ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            success: { type: Type.BOOLEAN, description: "True if survivalChance > 50" },
            commentary: { type: Type.STRING, description: "Detailed explanation of what happens" },
            survivalChance: { type: Type.NUMBER, description: "0-100 percentage" },
            damageDealt: { type: Type.NUMBER, description: "0-100 percentage" },
          },
          required: ['success', 'commentary', 'survivalChance', 'damageDealt']
        }
      }
    });

    const response = await retryWithBackoff<GenerateContentResponse>(operation);
    if (response.text) return JSON.parse(cleanJson(response.text));
    return null;
  } catch (error) { throw error; }
};
