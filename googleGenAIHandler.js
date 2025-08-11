import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
dotenv.config();

const language = process.env.LANGUAGE;

export const getGoogleGenAIResponse = async (contents) => {
  const ai = new GoogleGenAI({});
  const { text } = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents,
  });

  return text;
}

export const getStartingResponse = async () => {
    return await getGoogleGenAIResponse(`Write a creative and engaging first line for a collaborative story in the ${language} Language. The response must be a single, complete sentence with no more than 20 words.`);
}

export const getTwistResponse = async (story) => {
    return await getGoogleGenAIResponse(`Based on this story, provide a plot twist in a single sentence in ${language}: "${story}"`);
}