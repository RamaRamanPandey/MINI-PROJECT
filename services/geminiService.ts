import { GoogleGenAI } from "@google/genai";

export const askLabAssistant = async (
  prompt: string,
  context: string
): Promise<string> => {
  // Initialize the client with the API key from the environment variable.
  // The 'define' in vite.config.ts ensures process.env.API_KEY is replaced with the actual key value.
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        {
          role: "user",
          parts: [
            {
              text: `You are a helpful, encouraging Physics Laboratory Instructor for undergraduate students. 
              The student is performing the 'Measurement of High Resistance by Leakage of Condenser' experiment.
              
              Current Experiment Context:
              ${context}
              
              Student Question: ${prompt}
              
              Provide a clear, concise (under 100 words if possible), and educational answer. 
              If they ask for the answer to the calculation, guide them through the formula: R = t / (C * ln(theta0/thetat)) instead of just giving the number.
              Format math clearly.`
            }
          ]
        }
      ],
    });

    return response.text || "I couldn't generate a response at the moment.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "I'm having trouble connecting to the lab server right now. Please try again.";
  }
};