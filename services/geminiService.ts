import { GoogleGenAI } from "@google/genai";
import { SpriteSheetConfig } from "../types";

export const generateSpriteSheet = async (config: SpriteSheetConfig): Promise<string> => {
  // Initialize inside the function to ensure we use the latest available API Key
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const { characterDescription, rows, style, facing } = config;

  const rowPrompts = rows.map((row, index) => `Row ${index + 1}: ${row.name}`).join('\n');

  const prompt = `
    Generate a high-quality 2D character sprite sheet.
    
    Layout Requirements:
    - STRICTLY 8 rows and 8 columns grid layout.
    - Total 64 sprite frames.
    - Each cell in the grid must contain one frame of the animation.
    - The character should be centered in each cell.
    - Background must be a solid, contrasting color (like bright green or magenta) to easily remove it later.
    
    Character Description:
    ${characterDescription}
    
    Art Style:
    ${style}

    Perspective/Facing:
    ${facing}
    
    Animation Sequence (Top to Bottom):
    ${rowPrompts}
    
    Ensure the character consistency (colors, size, proportions) is perfect across all frames. 
    The sequence in each row should loop smoothly.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image', // Switched to Flash Image (Free Tier supported)
      contents: {
        parts: [
          { text: prompt }
        ]
      },
      config: {
        imageConfig: {
            aspectRatio: "1:1",
            // imageSize is not supported in gemini-2.5-flash-image, removed.
        },
      }
    });

    // Check for image part in response
    const candidates = response.candidates;
    if (!candidates || candidates.length === 0) {
      throw new Error("No candidates returned from Gemini.");
    }

    const parts = candidates[0].content.parts;
    const imagePart = parts.find(p => p.inlineData);

    if (!imagePart || !imagePart.inlineData) {
        // Fallback or error check if text was returned explaining a refusal
        const textPart = parts.find(p => p.text);
        if (textPart) {
            console.error("Model refused or returned text:", textPart.text);
            throw new Error(`Model returned text instead of image: ${textPart.text.substring(0, 100)}...`);
        }
        throw new Error("No image data found in response.");
    }

    return `data:${imagePart.inlineData.mimeType};base64,${imagePart.inlineData.data}`;

  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};