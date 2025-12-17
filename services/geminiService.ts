import { GoogleGenAI } from "@google/genai";

const getClient = () => {
  // Safety check for browser environments where process might not be defined
  const apiKey = (typeof process !== 'undefined' && process.env) ? process.env.API_KEY : null;
  
  if (!apiKey) {
    console.warn("API_KEY not found in environment variables.");
    return null;
  }
  return new GoogleGenAI({ apiKey });
};

export const askLabAssistant = async (
  prompt: string,
  context: string
): Promise<string> => {
  const ai = getClient();
  if (!ai) return "AI Assistant Unavailable: Please ensure API_KEY is set in your environment variables.";

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