import { GoogleGenAI, Type } from "@google/genai";
import { AlchemyElement, EmojiChallenge, DilemmaScenario } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

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
    const model = 'gemini-2.5-flash';
    const lang = getLanguage();
    
    // Prompt ajustado para estilo "Infinite Craft": Criativo, infinito, mas com nomes simples (Substantivos).
    const prompt = `Act as the logic engine for an 'Infinite Craft' style game.
    Combine these two elements into a new single element: "${elem1}" + "${elem2}".
    
    Guidelines:
    1. Output a SINGLE noun or a standard compound noun (e.g., "Steam", "Mud", "Super Mario", "Black Hole").
    2. Keep it simple! If A + B = C, and C is a common word, use C. Do not invent overly specific or descriptive names (e.g., avoid "Hot Boiling Water", just use "Steam").
    3. Be grounded! Prioritize real-world objects, nature, science, or very famous pop culture.
    4. Allow repeats: It is perfectly fine to output a word that is very common. Don't force uniqueness.
    5. Language: ${lang}.
    
    Examples:
    Fire + Water = Steam
    Wind + Earth = Dust
    Human + Robot = Cyborg
    Anime + Ninja = Naruto
    Ocean + Ice = Iceberg
    Tree + Fire = Ash
    
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
    const model = 'gemini-2.5-flash';
    const excludeStr = exclude.length > 0 ? `Do NOT generate any of these specifically: ${exclude.join(', ')}.` : '';
    const lang = getLanguage();

    const prompt = `Generate a WORLD FAMOUS, GLOBAL BLOCKBUSTER Movie, Video Game, or Book title. 
    Strict Rule: Only choose titles that are extremely recognizable globally (e.g., Marvel, Disney, Star Wars, Harry Potter, Titanic, GTA, Mario). Avoid obscure indie films.
    ${excludeStr}
    Represent it using 2 to 5 emojis. 
    
    Return JSON with keys: 
    - "answer" (The title in ${lang})
    - "emojis"
    - "hints": An array of 5 strings in ${lang}. 
      Hint 1 must be vague (Genre/Year). 
      Hint 2 slightly specific (Plot theme). 
      Hint 3 specific (Main character name or actor). 
      Hint 4 very specific (Famous scene or director). 
      Hint 5 give-away (A famous quote or alternate title).
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