const { GoogleGenAI } = require("@google/genai");

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

const askGemini = async (prompt) => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",

      contents: prompt,
    });

    return response.text;
  } catch (error) {
    console.error("Gemini Error:", error);

    throw new Error("Failed to generate AI response");
  }
};

module.exports = askGemini;
