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

export const extractDataFromImage = async (file: File): Promise<DataRow[]> => {
  const base64Data = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });

  const prompt = `
    You are an expert data extraction assistant. 
    Analyze the provided image. It likely contains a data table, a chart, or a spreadsheet screenshot.
    
    Your task:
    1. Identify the tabular data.
    2. Extract it into a clean JSON array of objects.
    3. Use the first row (or chart labels) as keys (headers).
    4. Ensure all numeric values are parsed as numbers (remove currency symbols like '$', commas, or percentage signs if needed, but keep the logic consistent).
    5. If the image is a chart, estimate the values for each data point.
    
    Return ONLY the JSON array.
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: [
      {
        inlineData: {
          mimeType: file.type,
          data: base64Data
        }
      },
      { text: prompt }
    ],
    config: {
      responseMimeType: "application/json"
    }
  });

  const text = response.text;
  if (!text) {
    throw new Error("AI could not extract text from the image.");
  }

  try {
    const result = JSON.parse(text);
    if (!Array.isArray(result)) {
      throw new Error("Extracted data is not an array");
    }
    return result as DataRow[];
  } catch (e) {
    console.error("Failed to parse image data JSON", e);
    throw new Error("Failed to parse data from image. Please ensure the image contains a clear table or chart.");
  }
};

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
       - **Chart Selection Guide**:
         - **BAR/LINE/AREA**: Standard trends and comparisons.
         - **SCATTER**: For correlations between two numerical variables.
         - **PIE**: For part-to-whole composition (use sparingly).
         - **BOXPLOT**: Use this when you want to show the **distribution** of a numerical variable across categories (e.g., "Salary distribution by Dept").
         - **RADAR**: Use this for comparing multiple variables across a few entities (e.g., "Product scoring on 5 metrics").
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
                type: { type: Type.STRING, enum: ['BAR', 'LINE', 'AREA', 'PIE', 'SCATTER', 'BOXPLOT', 'RADAR'] },
                xAxisKey: { type: Type.STRING, description: "Key from data to use for X axis (Category for Box/Radar)" },
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