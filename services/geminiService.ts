import { GoogleGenAI } from "@google/genai";

// Initialize the client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Generates a creative, short note based on coordinates.
 */
export const generateLocationNote = async (lat: number, lng: number): Promise<string> => {
  try {
    const prompt = `I am placing a digital memory pin at latitude ${lat} and longitude ${lng}. 
    Write a short, cryptic, poetic, or interesting note (maximum 15 words) that captures the vibe of leaving a mark at a specific location on Earth. 
    Do not mention the coordinates explicitly in the text.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        thinkingConfig: { thinkingBudget: 0 }, // Disable thinking for speed
        maxOutputTokens: 50,
      }
    });

    return response.text?.trim() || "A memory was left here.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "A quiet spot in the world.";
  }
};
