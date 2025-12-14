import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import { AlchemyElement, EmojiChallenge, DilemmaScenario, LadderChallenge, LadderValidation, LadderHint, CipherChallenge } from '../types';

// --- API Key Management for Static Hosting ---
const STORAGE_KEY = 'nebula_api_key';

export const hasApiKey = (): boolean => {
  if (typeof window !== 'undefined') {
    return !!localStorage.getItem(STORAGE_KEY) || !!process.env.API_KEY;
  }
  return !!process.env.API_KEY;
};

export const setApiKey = (key: string) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, key);
  }
};

export const removeApiKey = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(STORAGE_KEY);
  }
};

const getAI = () => {
  let key = process.env.API_KEY;
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) key = stored;
  }
  
  if (!key) throw new Error("API Key Missing");
  return new GoogleGenAI({ apiKey: key });
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

// Custom Error for Quota
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
const LADDER_CACHE_KEY = 'ladder_val_cache';

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
    // Limit cache size to avoid localStorage limits
    const keys = Object.keys(cache);
    if (keys.length > 500) delete cache[keys[0]]; 
    localStorage.setItem(key, JSON.stringify(cache));
}

// --- Games ---

export const combineAlchemyElements = async (elem1: string, elem2: string): Promise<AlchemyElement | null> => {
  const cacheKey = [elem1, elem2].sort().join('+').toLowerCase();
  const cached = getCache(ALCHEMY_CACHE_KEY)[cacheKey];
  
  if (cached) {
      console.log("Alchemy: Cached Hit");
      return { ...cached, id: Date.now().toString(), isNew: false };
  }

  try {
    const ai = getAI();
    const model = 'gemini-2.5-flash';
    const lang = getLanguage();
    
    // Hyper-compressed prompt
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
      const result = {
        id: Date.now().toString(),
        name: data.name,
        emoji: data.emoji,
        isNew: true
      };
      saveCache(ALCHEMY_CACHE_KEY, cacheKey, { name: data.name, emoji: data.emoji });
      return result;
    }
    return null;

  } catch (error) {
    console.error("Alchemy Error:", error);
    throw error;
  }
};

// Batch increased to 5
export const generateEmojiChallengeBatch = async (exclude: string[] = []): Promise<EmojiChallenge[]> => {
  try {
    const ai = getAI();
    const model = 'gemini-2.5-flash';
    const lang = getLanguage();
    
    // Limit exclusion to last 15 to save input tokens
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

    if (response.text) {
      return JSON.parse(cleanJson(response.text)) as EmojiChallenge[];
    }
    return [];

  } catch (error) {
    console.error("Emoji Error:", error);
    throw error;
  }
};

// Batch increased to 5
export const generateDilemmaBatch = async (): Promise<DilemmaScenario[]> => {
  try {
    const ai = getAI();
    const model = 'gemini-2.5-flash';
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
  } catch (error) {
    console.error("Dilemma Error:", error);
    throw error;
  }
};

export const generateLadderChallenge = async (): Promise<LadderChallenge | null> => {
  try {
    const ai = getAI();
    const model = 'gemini-2.5-flash';
    const lang = getLanguage();
    // Compressed prompt
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
  } catch (error) {
    console.error("Ladder Error:", error);
    throw error;
  }
};

export const validateLadderStep = async (current: string, target: string, guess: string): Promise<LadderValidation> => {
    // Cache Check
    const cacheKey = `${current.toLowerCase()}_${target.toLowerCase()}_${guess.toLowerCase()}`;
    const cached = getCache(LADDER_CACHE_KEY)[cacheKey];
    if (cached) {
        console.log("Ladder: Cached Validation Hit");
        return cached;
    }

    try {
        const ai = getAI();
        const model = 'gemini-2.5-flash';
        const lang = getLanguage();
        // Extremely compressed prompt
        const prompt = `Check association: "${current}"->"${guess}"->"${target}". Lang:${lang}. JSON:{isValid,message,emoji,proximity(0-100)}`;
    
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
            // Cache the result
            saveCache(LADDER_CACHE_KEY, cacheKey, data);
            return data;
        }
        return { isValid: false, message: "Error" };
    } catch (error) {
        console.error("Ladder Validation Error:", error);
        throw error;
    }
};

export const getLadderHint = async (current: string, target: string): Promise<LadderHint | null> => {
  try {
      const ai = getAI();
      const model = 'gemini-2.5-flash';
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
  } catch (error) {
      console.error("Ladder Hint Error:", error);
      throw error;
  }
};

// Batch increased to 5
export const generateCipherChallengeBatch = async (exclude: string[] = []): Promise<CipherChallenge[]> => {
  try {
      const ai = getAI();
      const model = 'gemini-2.5-flash';
      const lang = getLanguage();
      const excludeList = exclude.slice(-15).join(',');

      const prompt = `Gen 5 Cipher Games. Lang:${lang}. No:[${excludeList}]. 
      Item: 1.Category(Movies/Games/Tech). 2.Answer(Famous name). 3.Rule(Visual/Logic/Leet only, NO shift/caesar).
      JSON Array:{original,encrypted,rule,category}`;

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
  } catch (error) {
      console.error("Cipher Error:", error);
      throw error;
  }
}