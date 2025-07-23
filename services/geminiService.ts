import { GoogleGenAI, GenerateContentResponse, Part, Content } from "@google/genai";
import { GroundingChunk } from '../types';

// --- API Key Retrieval ---
// For local development, it reads from `window.APP_CONFIG` (set in config.js).
// For deployed environments, it falls back to `process.env`.
const getApiKey = (): string => {
  // @ts-ignore
  if (typeof window !== 'undefined' && window.APP_CONFIG && window.APP_CONFIG.API_KEY && window.APP_CONFIG.API_KEY !== 'YOUR_API_KEY_HERE') {
      // @ts-ignore
      return window.APP_CONFIG.API_KEY;
  }
  // This part is for deployment environments (e.g., Node.js server)
  // In a pure browser environment without a build step, process.env will not be defined.
  if (typeof process !== 'undefined' && process.env && process.env.API_KEY) {
      return process.env.API_KEY;
  }
  // If no key is found, throw a clear error guiding the user.
  throw new Error(
      "API key not found. Please add your Google Gemini API key to the 'config.js' file for local development."
  );
};


const apiKey = getApiKey();
const ai = new GoogleGenAI({ apiKey });

const fileToGenerativePart = async (file: File) => {
  const base64EncodedData = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve((reader.result as string).split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

  return {
    inlineData: {
      data: base64EncodedData,
      mimeType: file.type,
    },
  };
};


export const generateTextStream = async (prompt: string, file?: File) => {
  try {
    if (!prompt.trim() && !file) {
      throw new Error("Prompt and file cannot both be empty.");
    }
    
    if (file) {
      // Multipart request (text and file)
      const filePart = await fileToGenerativePart(file);
      const textPart = { text: prompt };
      const parts: Part[] = [textPart, filePart];
      
      // Corrected payload for streaming multipart content
      const contents: Content[] = [{ role: 'user', parts }];
      
      const response = await ai.models.generateContentStream({
        model: 'gemini-2.5-flash',
        contents: contents,
      });
      return response;
    } else {
      // Text-only request
      const response = await ai.models.generateContentStream({
        model: 'gemini-2.5-flash',
        contents: prompt,
      });
      return response;
    }
  } catch (error) {
    console.error("Error generating text:", error);
    throw new Error("Failed to generate text from API.");
  }
};

export const generateTextWithSearchStream = async (prompt: string) => {
  try {
    const response = await ai.models.generateContentStream({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
      },
    });
    return response;
  } catch (error) {
    console.error("Error generating text with search:", error);
    throw new Error("Failed to generate text with search from API.");
  }
};

export const generateImagePromptWithSearch = async (prompt: string): Promise<{ imagePrompt: string; sources: GroundingChunk[] }> => {
  try {
    const fullPrompt = `Based on the user's request '${prompt}', first, find relevant information using Google Search. Second, based on the search results, create a highly detailed, descriptive prompt suitable for an AI image generation model. Output ONLY the generated prompt and nothing else. Do not add any conversational text or formatting.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: fullPrompt,
      config: {
        tools: [{ googleSearch: {} }],
      },
    });

    const imagePrompt = response.text.trim();
    if (!imagePrompt) {
        throw new Error("The model did not return an image prompt from the search query.");
    }
    
    const sources = (response.candidates?.[0]?.groundingMetadata?.groundingChunks || []) as GroundingChunk[];

    return { imagePrompt, sources };
  } catch (error) {
    console.error("Error generating image prompt with search:", error);
    throw new Error("Failed to create an image prompt from the web search.");
  }
};

export const generateImage = async (prompt: string): Promise<string> => {
  if (!prompt) {
    throw new Error("Image prompt cannot be empty.");
  }
  try {
    const response = await ai.models.generateImages({
      model: 'imagen-3.0-generate-002',
      prompt: prompt,
      config: {
        numberOfImages: 1,
        outputMimeType: 'image/jpeg',
        aspectRatio: '1:1',
      },
    });

    if (response.generatedImages && response.generatedImages.length > 0) {
      const base64ImageBytes = response.generatedImages[0].image.imageBytes;
      return `data:image/jpeg;base64,${base64ImageBytes}`;
    } else {
      const reason = "No image was generated. This can happen for safety reasons or if the prompt is empty.";
      throw new Error(reason);
    }
  } catch (error) {
    console.error("Error generating image:", error);
    const message = error instanceof Error ? error.message : "Failed to generate image from API.";
    throw new Error(message);
  }
};