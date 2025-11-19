import { GoogleGenAI, Type } from "@google/genai";
import { AnalysisResult, DataRow } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Nature Publishing Group (NPG) inspired palette
const NPG_PALETTE = [
  "#E64B35", // Red
  "#4DBBD5", // Blue
  "#00A087", // Green
  "#3C5488", // Dark Blue
  "#F39B7F", // Peach
  "#8491B4", // Light Blue
  "#91D1C2", // Light Green
  "#DC0000", // Dark Red
];

export const analyzeData = async (data: DataRow[], fileName: string): Promise<AnalysisResult> => {
  // prevent token overflow by sending a representative sample and schema
  const headers = Object.keys(data[0] || {});
  const sampleSize = Math.min(data.length, 30);
  const sampleData = data.slice(0, sampleSize);
  
  const prompt = `
    You are a Chief Data Scientist and Editor for a top-tier scientific journal (like Nature or Science).
    I have a dataset named "${fileName}".
    The columns are: ${headers.join(', ')}.
    Here is a sample of the data (first ${sampleSize} rows):
    ${JSON.stringify(sampleData)}

    Your task is to analyze this data and generate a publication-ready report.
    
    1. **Headline**: A single, punchy, attention-grabbing sentence that captures the most surprising or important finding. **Format: English sentence // Chinese translation**. (Max 15 words).
    
    2. **Summary**: An abstract-style executive summary. **Format: English paragraph followed by Chinese translation.** Use academic, objective tone.
    
    3. **Key Insights**: 3-5 key observations. **Format: English first, then Chinese.**
    
    4. **Visualizations**: Suggest 4-6 distinctive visualizations (Charts) for "Figure 1", "Figure 2", etc.
       - **Important**: Keep chart titles and descriptions in **English only** (for the chart labels).
       - Chart Titles should be concise (e.g., "Correlation between Speed and Cost").
       - **Scatter Plots**: Prefer SCATTER for numerical correlations.
       - **Colors**: Use the following NPG-inspired hex codes for palettes: ${JSON.stringify(NPG_PALETTE)}.
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
    config: {
      systemInstruction: "You are a rigorous scientific assistant. Your output must be clean JSON. Your tone is academic, precise, and insightful.",
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          headline: { type: Type.STRING, description: "A single punchy bilingual headline (English // Chinese)" },
          summary: { type: Type.STRING, description: "Bilingual abstract summary." },
          keyInsights: { 
            type: Type.ARRAY, 
            items: { type: Type.STRING },
            description: "List of bilingual key insights." 
          },
          charts: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING, description: "Chart title in English" },
                description: { type: Type.STRING, description: "Chart description in English" },
                type: { type: Type.STRING, enum: ['BAR', 'LINE', 'AREA', 'PIE', 'SCATTER'] },
                xAxisKey: { type: Type.STRING, description: "Key from data to use for X axis" },
                yAxisKeys: { 
                  type: Type.ARRAY, 
                  items: { type: Type.STRING },
                  description: "Keys from data to use for Y axis (values)"
                },
                colorPalette: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                  description: "Array of hex color codes"
                }
              },
              required: ["title", "type", "xAxisKey", "yAxisKeys", "colorPalette"]
            }
          }
        },
        required: ["headline", "summary", "keyInsights", "charts"]
      }
    }
  });

  const text = response.text;
  if (!text) {
    throw new Error("No response from AI");
  }

  try {
    return JSON.parse(text) as AnalysisResult;
  } catch (e) {
    console.error("Failed to parse AI response", e);
    throw new Error("AI analysis failed to produce valid JSON");
  }
};