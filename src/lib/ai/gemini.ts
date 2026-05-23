import { GoogleGenerativeAI } from "@google/generative-ai";
import { GEMINI_SYSTEM_PROMPT } from "./prompts";

export function getGeminiModelName() {
  return process.env.GEMINI_MODEL || "gemini-1.5-flash";
}

export function createGeminiModel() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured.");
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  return genAI.getGenerativeModel({
    model: getGeminiModelName(),
    systemInstruction: GEMINI_SYSTEM_PROMPT
  });
}

export async function generateGeminiJson(prompt: string) {
  const model = createGeminiModel();
  const result = await model.generateContent({
    contents: [
      {
        role: "user",
        parts: [{ text: prompt }]
      }
    ],
    generationConfig: {
      temperature: 0.2,
      topP: 0.9,
      responseMimeType: "application/json"
    }
  });

  const text = result.response.text();
  if (!text?.trim()) {
    throw new Error("Gemini returned an empty response.");
  }

  return text;
}
