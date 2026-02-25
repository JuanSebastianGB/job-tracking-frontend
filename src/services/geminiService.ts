import { GoogleGenAI, Type } from "@google/genai";

export interface ParsedJob {
  title: string;
  company: string;
  work_model?: string;
  salary_range?: string;
  salary_frequency?: string;
  tech_stack?: string[];
  notes?: string;
}

export async function parseJobWithAI(input: {
  text?: string;
  file?: File;
}): Promise<ParsedJob> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error(
      "Gemini API Key is missing. Please ensure it is set in your environment.",
    );
  }

  const ai = new GoogleGenAI({ apiKey });
  const parts: any[] = [];

  if (input.file) {
    const base64 = await fileToBase64(input.file);
    parts.push({
      inlineData: {
        data: base64.split(",")[1],
        mimeType: input.file.type,
      },
    });
    parts.push({ text: "EXTRACT JOB DETAILS FROM THIS SCREENSHOT." });
  } else if (input.text) {
    parts.push({
      text: `EXTRACT JOB DETAILS FROM THIS TEXT:\n\n${input.text}`,
    });
  } else {
    throw new Error("No input provided for parsing");
  }

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: { parts },
    config: {
      systemInstruction: `You are a world-class recruitment assistant. Your task is to extract job details from the provided text or screenshot.
Be extremely thorough and extract as much information as possible.

FIELDS TO EXTRACT:
1. title: The exact job title.
2. company: The company name.
3. work_model: MUST be "Remote", "Hybrid", or "On-site". Look for keywords like "Remote", "WFH", "Office", "In-person".
4. salary_range: Include base salary, equity, and any other financial benefits mentioned (e.g., "$65k - $120k + $20k Equity").
5. salary_frequency: MUST be one of "Hourly", "Monthly", or "Yearly". If not specified, default to "Yearly".
6. tech_stack: Extract EVERY technology, programming language, framework, and tool mentioned (e.g., React, Next.js, TypeScript, Postgres, Node.js, Postman, etc.).
7. notes: Summarize the company's mission, the team's culture, and the key impact of this role.

Return the data as a clean JSON object.`,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          company: { type: Type.STRING },
          work_model: { type: Type.STRING },
          salary_range: { type: Type.STRING },
          salary_frequency: {
            type: Type.STRING,
            description: "Hourly, Monthly, or Yearly",
          },
          tech_stack: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
          },
          notes: { type: Type.STRING },
        },
        required: ["title", "company"],
      },
    },
  });

  if (!response || !response.text) {
    throw new Error("AI returned an empty response");
  }

  let resultText = response.text;
  const jsonMatch =
    resultText.match(/```json\s*([\s\S]*?)\s*```/) ||
    resultText.match(/```\s*([\s\S]*?)\s*```/);
  if (jsonMatch) {
    resultText = jsonMatch[1];
  }

  try {
    return JSON.parse(resultText.trim());
  } catch (e) {
    console.error("Failed to parse AI response:", resultText);
    throw new Error("AI returned invalid JSON format");
  }
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
}
