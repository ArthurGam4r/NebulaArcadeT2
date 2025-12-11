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
    return navigator.language.startsWith('pt') ? 'Portuguese (Brazil)' : 'English';
  }
  return 'Portuguese (Brazil)';
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
      // Check for hard quota limits (Resource Exhausted) - DO NOT RETRY
      const errorMessage = error.message?.toLowerCase() || '';
      const status = error.status || error.response?.status;
      
      if (
        status === 'RESOURCE_EXHAUSTED' || 
        status === 429 && errorMessage.includes('quota') ||
        errorMessage.includes('resource exhausted')
      ) {
        throw new QuotaExceededError();
      }

      // Check for retryable rate limits
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

// --- Games ---

// Cache for Alchemy to save tokens
const ALCHEMY_CACHE_KEY = 'alchemy_recipes_cache';
const getAlchemyCache = (): Record<string, any> => {
    if (typeof localStorage === 'undefined') return {};
    return JSON.parse(localStorage.getItem(ALCHEMY_CACHE_KEY) || '{}');
}
const saveToAlchemyCache = (key: string, result: any) => {
    if (typeof localStorage === 'undefined') return;
    const cache = getAlchemyCache();
    cache[key] = result;
    localStorage.setItem(ALCHEMY_CACHE_KEY, JSON.stringify(cache));
}

export const combineAlchemyElements = async (elem1: string, elem2: string): Promise<AlchemyElement | null> => {
  // Check Cache first
  const cacheKey = [elem1, elem2].sort().join('+').toLowerCase();
  const cached = getAlchemyCache()[cacheKey];
  if (cached) {
      console.log("Alchemy: Loaded from cache to save API quota");
      return { ...cached, id: Date.now().toString(), isNew: false };
  }

  try {
    const ai = getAI();
    const model = 'gemini-2.5-flash';
    const lang = getLanguage();
    
    const prompt = `Act as an 'Infinite Craft' game engine.
    Combine: "${elem1}" + "${elem2}".
    
    Rules:
    1. Output a SINGLE noun or standard compound (e.g., "Steam", "Mud", "Super Mario").
    2. Keep it simple and grounded in reality or pop culture.
    3. Language: ${lang}.
    
    Return JSON: { name: string, emoji: string }`;

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
      // Save to cache
      saveToAlchemyCache(cacheKey, { name: data.name, emoji: data.emoji });
      return result;
    }
    return null;

  } catch (error) {
    console.error("Alchemy Error:", error);
    throw error;
  }
};

export const generateEmojiChallenge = async (exclude: string[] = []): Promise<EmojiChallenge | null> => {
  try {
    const ai = getAI();
    const model = 'gemini-2.5-flash';
    const lang = getLanguage();
    
    const excludeList = exclude.slice(-50).join(', '); // Send last 50
    const prompt = `Generate a GLOBAL BLOCKBUSTER Movie/Game title.
    Exclude: [${excludeList}].
    
    Rules:
    1. Use COMMERCIAL NAME in ${lang} (e.g. "Jurassic Park" not "Parque Jurássico", "Avengers" not "Vingadores" if common).
    2. No subtitles (e.g. "Star Wars", not "Star Wars: Episode IV").
    3. Output Language: ${lang}.
    
    Return JSON: 
    - answer (string)
    - emojis (string)
    - hints (array of 5 strings, easy to hard)`;

    const operation = () => ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            answer: { type: Type.STRING },
            emojis: { type: Type.STRING },
            hints: { type: Type.ARRAY, items: { type: Type.STRING } },
          },
          required: ['answer', 'emojis', 'hints']
        }
      }
    });

    const response = await retryWithBackoff<GenerateContentResponse>(operation);

    if (response.text) {
      return JSON.parse(cleanJson(response.text)) as EmojiChallenge;
    }
    return null;

  } catch (error) {
    console.error("Emoji Error:", error);
    throw error;
  }
};

export const generateDilemma = async (): Promise<DilemmaScenario | null> => {
  try {
    const ai = getAI();
    const model = 'gemini-2.5-flash';
    const lang = getLanguage();
    const prompt = `Create a funny "Would You Rather" scenario.
    Language: ${lang}.
    Return JSON: title, description, optionA, optionB, consequenceA, consequenceB.`;

    const operation = () => ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
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
    });

    const response = await retryWithBackoff<GenerateContentResponse>(operation);
    if (response.text) return JSON.parse(cleanJson(response.text));
    return null;
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
    const prompt = `Generate 2 distinct nouns (Start/End) connectable by 5 semantic steps.
    Language: ${lang}.
    Return JSON: startWord, endWord, startEmoji, endEmoji.`;

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
    try {
        const ai = getAI();
        const model = 'gemini-2.5-flash';
        const lang = getLanguage();
        const prompt = `Word Ladder Game.
        Current: "${current}", Target: "${target}", User Guess: "${guess}".
        Lang: ${lang}.
        1. Is guess a valid semantic step from current? (isValid)
        2. How close is the guess to bridging the gap to the target? (proximity 0-100).
           0 = Irrelevant/Wrong direction. 100 = Perfect bridge.
        Return JSON: isValid, message, emoji, proximity.`;
    
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
        if (response.text) return JSON.parse(cleanJson(response.text));
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
      const prompt = `Word Ladder Helper.
      Current Word: "${current}". Target Word: "${target}".
      Provide ONE single word that acts as a good next semantic step.
      Lang: ${lang}.
      Return JSON: word, reason (short explanation).`;
  
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

export const generateCipherChallenge = async (exclude: string[] = []): Promise<CipherChallenge | null> => {
  try {
      const ai = getAI();
      const model = 'gemini-2.5-flash';
      const lang = getLanguage();
      
      const excludeList = exclude.slice(-50).join(', '); // Exclude last 50 items

      const prompt = `Generate a Text Cipher Game.
      Language: ${lang}.
      Exclude these answers: [${excludeList}].
      
      1. RANDOMLY select a category from: 
         [Blockbuster Movies, Popular Video Games, Cartoons/Anime, Superheroes, Famous Technology Brands].
         IMPORTANT: Translate the category name to ${lang} in the output.
      
      2. Choose a **SHORT** name or phrase (Max 1-3 words).
         - Must be VERY famous global culture pop.
         - Examples: "Iron Man", "Super Mario", "Lion King", "Google", "Naruto".
      
      3. Apply a VISUAL or LOGICAL transformation rule (e.g. Leet Speak, Reversal).
         
         CRITICAL RULES:
         - DO NOT use "Caesar Cipher" or "Alphabet Shifting" (e.g. A->B, +1 shift).
         - DO NOT introduce letters that don't look like the original (e.g. don't swap 'A' for 'X').
         - The encrypted text MUST contain the original letters or visual lookalikes (numbers).
         
         ALLOWED RULES:
         - "Vowels are numbers" (A=4, E=3, I=1, O=0).
         - "Reverse the entire string".
         - "Reverse each word individually".
         - "Remove all vowels".
         - "Anagram (Scramble letters but keep first/last fixed)".
      
      Return JSON:
      - original (string): The correct name.
      - encrypted (string): The name with rule applied (make it look cryptic!).
      - rule (string): Name of the rule used (translated to ${lang}).
      - category (string): The category chosen (translated to ${lang}).`;

      const operation = () => ai.models.generateContent({
        model,
        contents: prompt,
        config: {
            responseMimeType: 'application/json',
            responseSchema: {
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
      });

      const response = await retryWithBackoff<GenerateContentResponse>(operation);
      if (response.text) return JSON.parse(cleanJson(response.text));
      return null;
  } catch (error) {
      console.error("Cipher Error:", error);
      throw error;
  }
}