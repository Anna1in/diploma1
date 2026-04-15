// server/utils/ai.js
const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function analyzeArtWithGemini(base64Image, userPrompt) {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // Очищаємо рядок Base64 від префікса (data:image/jpeg;base64,), якщо він є
    const base64Data = base64Image.split(",")[1] || base64Image;

    const imagePart = {
        inlineData: {
            data: base64Data,
            mimeType: "image/jpeg"
        },
    };

    const systemPrompt = `
    ROLE: Професійний викладач образотворчого мистецтва.
    TASK: Проаналізуй малюнок за запитом: "${userPrompt}". 
    Надай професійну критику українською мовою.
    OUTPUT: ВИКЛЮЧНО JSON {"annotated_image_base64": "...", "analysis_text": "..."}
    РОЗМІТКА: Наклади червоні лінії поверх помилок анатомії чи перспективи.
    `;

    try {
        const result = await model.generateContent([systemPrompt, imagePart]);
        const responseText = result.response.text();
        const cleanJsonString = responseText.replace(/```json/g, "").replace(/```/g, "").trim();
        return JSON.parse(cleanJsonString);
    } catch (error) {
        if (error.message.includes("429") || error.message.includes("503")) throw new Error("AI_OVERLOADED");
        throw new Error("Не вдалося обробити запит через ШІ.");
    }
}

module.exports = { analyzeArtWithGemini };