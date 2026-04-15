const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function analyzeArtWithGemini(base64Image, userPrompt) {
    const model = genAI.getGenerativeModel({
        model: "gemini-1.5-flash"
    });

    // Тимчасово створюємо промпт БЕЗ картинки
    const systemPrompt = `
    Ти - професійний викладач мистецтва. Дай коротку пораду щодо запиту: "${userPrompt}".
    Відповідь надай ВИКЛЮЧНО у форматі JSON:
    {
      "analysis_text": "Це тестова відповідь без аналізу фото. Твій запит: ${userPrompt}",
      "problem_areas": []
    }
    `;

    try {
        // Викликаємо тільки з текстом (без imagePart)
        const result = await model.generateContent(systemPrompt);
        const responseText = result.response.text();

        const cleanJsonString = responseText.replace(/```json/g, "").replace(/```/g, "").trim();
        return JSON.parse(cleanJsonString);
    } catch (error) {
        console.error("Gemini API Error Detail:", error.message);
        throw new Error("Не вдалося отримати текстову відповідь від ШІ.");
    }
}

module.exports = { analyzeArtWithGemini };