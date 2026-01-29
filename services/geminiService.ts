
import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import { AlchemyElement, EmojiChallenge, DilemmaScenario, LadderChallenge, LadderValidation, LadderHint, CipherChallenge, ArenaChallenge, ArenaResult } from '../types';

// Rule: Always recreate the AI instance to use the most current API key from the execution context.
const getAI = () => {
  const key = process.env.API_KEY;
  if (!key || key === "") {
    throw new Error("API_KEY_MISSING");
  }
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
      if (error.message === 'API_KEY_MISSING') throw error;

      const errorMessage = error.message?.toLowerCase() || '';
      const status = error.status || error.response?.status;
      
      if (errorMessage.includes("entity was not found") || errorMessage.includes("not found")) {
          throw new Error("API_KEY_INVALID");
      }

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

export const combineAlchemyElements = async (elem1: string, elem2: string): Promise<AlchemyElement | null> => {
  try {
    const ai = getAI();
    const lang = getLanguage();
    const prompt = `InfiniteCraft. Combine "${elem1}"+"${elem2}". Lang:${lang}. Out:1 noun(Real/PopCulture). JSON:{name,emoji}`;
    const response = await retryWithBackoff<GenerateContentResponse>(() => ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: { responseMimeType: 'application/json' }
    }));
    return response.text ? JSON.parse(cleanJson(response.text)) : null;
  } catch (error) { throw error; }
};

export const generateEmojiChallengeBatch = async (exclude: string[] = []): Promise<EmojiChallenge[]> => {
  try {
    const ai = getAI();
    const lang = getLanguage();
    const excludeList = exclude.join(','); 
    const prompt = `List 5 distinct Movies/Games. No:[${excludeList}]. Lang:${lang}. JSON Array:{answer,emojis,hints[5]}`;
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
    const prompt = `2 nouns for WordLadder. Lang:${lang}. JSON:{startWord,endWord,startEmoji,endEmoji}`;
    const response = await retryWithBackoff<GenerateContentResponse>(() => ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: { responseMimeType: 'application/json' }
    }));
    return response.text ? JSON.parse(cleanJson(response.text)) : null;
  } catch (error) { throw error; }
};

export const validateLadderStep = async (current: string, target: string, guess: string): Promise<LadderValidation> => {
    try {
        const ai = getAI();
        const lang = getLanguage();
        const prompt = `Word Ladder. Connect "${current}" to "${target}". Input: "${guess}". Lang:${lang}. JSON:{isValid,message,emoji,proximity(0-100)}`;
        const response = await retryWithBackoff<GenerateContentResponse>(() => ai.models.generateContent({
          model: 'gemini-3-pro-preview',
          contents: prompt,
          config: { responseMimeType: 'application/json' }
        }));
        return response.text ? JSON.parse(cleanJson(response.text)) : { isValid: false, message: "Error" };
    } catch (error) { throw error; }
};

export const getLadderHint = async (current: string, target: string): Promise<LadderHint | null> => {
  try {
      const ai = getAI();
      const lang = getLanguage();
      const prompt = `WordLadder Hint: "${current}"->"${target}". JSON:{word,reason}`;
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
      const prompt = `5 Cipher Games. Lang:${lang}. JSON Array:{original,encrypted,rule,category}`;
      const response = await retryWithBackoff<GenerateContentResponse>(() => ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: { responseMimeType: 'application/json' }
      }));
      return response.text ? JSON.parse(cleanJson(response.text)) : [];
  } catch (error) { throw error; }
}

export const generateArenaChallenge = async (): Promise<ArenaChallenge | null> => {
  try {
    const ai = getAI();
    const lang = getLanguage();
    const prompt = `Gen survival creature. 85% real animal, 15% myth. Lang:${lang}. JSON:{creature,emoji,description,difficulty}`;
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
    const prompt = `SURVIVAL ANALYST. Adversary: "${creature}". Strategy: "${strategy}". 
    MANDATORY RULE: If player uses TOOLS, ENVIRONMENT, FIRE, or any LOGIC (height, distance, stealth), SUCCESS IS TRUE. Humans are smarter than beasts.
    Lang: ${lang}. JSON:{success,commentary,survivalChance,damageDealt}`;

    const response = await retryWithBackoff<GenerateContentResponse>(() => ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
      config: { responseMimeType: 'application/json' }
    }));
    return response.text ? JSON.parse(cleanJson(response.text)) : null;
  } catch (error) { throw error; }
};
