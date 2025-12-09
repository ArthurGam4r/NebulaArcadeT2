import { GoogleGenAI, Type } from "@google/genai";
import { AlchemyElement, EmojiChallenge, DilemmaScenario } from '../types';

// Função para obter a chave API de várias fontes
const getApiKey = (): string | null => {
  // 1. Tenta pegar do armazenamento local (inserido pelo usuário na tela inicial)
  if (typeof localStorage !== 'undefined') {
    const localKey = localStorage.getItem('gemini_api_key');
    if (localKey) return localKey;
  }
  
  // 2. Tenta pegar do ambiente (build/env var)
  if (typeof process !== 'undefined' && process.env && process.env.API_KEY) {
    return process.env.API_KEY;
  }

  // 3. Fallback para window.process se existir (polyfill antigo)
  // @ts-ignore
  if (typeof window !== 'undefined' && window.process && window.process.env && window.process.env.API_KEY) {
    // @ts-ignore
    return window.process.env.API_KEY;
  }

  return null;
};

const getAI = () => {
  const apiKey = getApiKey();
  if (!apiKey) {
    console.error("API Key missing. Redirecionando para setup...");
    throw new Error("API Key missing");
  }
  return new GoogleGenAI({ apiKey });
};

// Helper to clean JSON string if markdown blocks are present
const cleanJson = (text: string): string => {
  return text.replace(/```json/g, '').replace(/```/g, '').trim();
};

const getLanguage = (): string => {
  if (typeof navigator !== 'undefined') {
    return navigator.language.startsWith('pt') ? 'Portuguese' : 'English';
  }
  return 'Portuguese';
};

export const combineAlchemyElements = async (elem1: string, elem2: string): Promise<AlchemyElement | null> => {
  try {
    const ai = getAI();
    const model = 'gemini-2.5-flash';
    const lang = getLanguage();
    
    const prompt = `Act as the logic engine for an 'Infinite Craft' style game.
    Combine these two elements into a new single element: "${elem1}" + "${elem2}".
    
    Guidelines:
    1. Output a SINGLE noun or a standard compound noun (e.g., "Steam", "Mud", "Super Mario", "Black Hole").
    2. Keep it simple! If A + B = C, and C is a common word, use C. Do not invent overly specific or descriptive names.
    3. Be grounded! Prioritize real-world objects, nature, science, or very famous pop culture.
    4. Allow repeats: It is perfectly fine to output a word that is very common.
    5. Language: ${lang}.
    
    Return a JSON object with:
    - name: The new element name.
    - emoji: A single representative emoji.
    `;

    const response = await ai.models.generateContent({
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

    if (response.text) {
      const data = JSON.parse(cleanJson(response.text));
      return {
        id: Date.now().toString(),
        name: data.name,
        emoji: data.emoji,
        isNew: true
      };
    }
    return null;

  } catch (error) {
    console.error("Alchemy Error:", error);
    return null;
  }
};

export const generateEmojiChallenge = async (exclude: string[] = []): Promise<EmojiChallenge | null> => {
  try {
    const ai = getAI();
    const model = 'gemini-2.5-flash';
    const lang = getLanguage();
    
    // Convert exclusion list to a string, limiting size to prevent token overflow if game goes on forever
    const excludeList = exclude.slice(-50).join(', '); 
    const excludePrompt = excludeList.length > 0 
        ? `CRITICAL RULE: DO NOT generate any of these titles: [${excludeList}]. Choose something different.` 
        : '';

    const prompt = `Generate a WORLD FAMOUS, GLOBAL BLOCKBUSTER Movie, Video Game, or Book title.
    
    ${excludePrompt}
    
    Guidelines:
    1. Scope: Only choose titles that are extremely recognizable globally (e.g., Marvel, Disney, Star Wars, Harry Potter, Titanic, GTA, Mario). Avoid obscure indie films.
    2. Naming: For franchises, output ONLY the main saga name. 
       - CORRECT: "Star Wars", "Harry Potter", "Lord of the Rings", "Mission Impossible".
       - INCORRECT: "Star Wars: Episode IV", "Harry Potter and the Goblet of Fire".
    3. Output Language: ${lang}.
    4. Emojis: Use 2 to 5 emojis to represent the plot or characters.
    
    Return JSON with keys: 
    - "answer" (The simplified title in ${lang})
    - "emojis"
    - "hints": An array of 5 strings in ${lang} (Progressive difficulty: 1=Vague, 5=Obvious).
      `;

    const response = await ai.models.generateContent({
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

    if (response.text) {
      return JSON.parse(cleanJson(response.text)) as EmojiChallenge;
    }
    return null;

  } catch (error) {
    console.error("Emoji Error:", error);
    return null;
  }
};

export const generateDilemma = async (): Promise<DilemmaScenario | null> => {
  try {
    const ai = getAI();
    const model = 'gemini-2.5-flash';
    const lang = getLanguage();
    const prompt = `Create a funny, absurd, or philosophical "Would You Rather" scenario.
    It should be a difficult or hilarious choice.
    Return JSON with: title, description, optionA, optionB, consequenceA (short funny prediction), consequenceB (short funny prediction).
    Language: ${lang}.`;

    const response = await ai.models.generateContent({
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

    if (response.text) {
      return JSON.parse(cleanJson(response.text)) as DilemmaScenario;
    }
    return null;
  } catch (error) {
    console.error("Dilemma Error:", error);
    return null;
  }
};