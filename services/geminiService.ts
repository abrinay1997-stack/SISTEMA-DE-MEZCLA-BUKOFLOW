
import { GoogleGenAI } from "@google/genai";

export const getMixingTip = async (prompt: string): Promise<string> => {
  if (!process.env.API_KEY) {
    return "Error: API key no encontrada. Asegúrate de que la variable de entorno API_KEY esté configurada.";
  }
  
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    return response.text;
  } catch (error) {
    console.error("Error al contactar la API de Gemini:", error);
    if (error instanceof Error) {
      return `Error al generar el consejo: ${error.message}`;
    }
    return "Ocurrió un error desconocido al generar el consejo.";
  }
};
