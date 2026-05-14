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

/**
 * Text + one inline image (base64, no data: prefix). Uses same model as chat/squad.
 */
const askGeminiWithImage = async (textPrompt, { mimeType, base64Data }) => {
  const mime = String(mimeType || "image/png").trim() || "image/png";
  const data = String(base64Data || "").replace(/\s/g, "");
  if (!data) {
    throw new Error("Image data is required");
  }

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        { text: textPrompt },
        {
          inlineData: {
            mimeType: mime,
            data,
          },
        },
      ],
    });

    return response.text;
  } catch (error) {
    console.error("Gemini vision error:", error);
    throw new Error("Failed to analyze screenshot");
  }
};

module.exports = { askGemini, askGeminiWithImage };
