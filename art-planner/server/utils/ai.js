const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function analyzeArtWithGemini(base64Image, userPrompt) {
    // ЗМІНА ТУТ: Додано -latest для вирішення помилки 404 v1beta
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });

    // Очищаємо рядок Base64 від префікса, якщо він є
    const base64Data = base64Image.includes(",") ? base64Image.split(",")[1] : base64Image;

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
    OUTPUT FORMAT: ПОВИНЕН бути ВИКЛЮЧНО JSON {"annotated_image_base64": "...", "analysis_text": "..."}
    РОЗМІТКА: Наклади червоні лінії поверх помилок анатомії, пропорцій або перспективи.
    `;

    try {
        const result = await model.generateContent([systemPrompt, imagePart]);
        const responseText = result.response.text();

        // Очищення JSON від маркерів Markdown
        const cleanJsonString = responseText.replace(/```json/g, "").replace(/```/g, "").trim();
        return JSON.parse(cleanJsonString);
    } catch (error) {
        console.error("Gemini API Error:", error);
        if (error.message.includes("429") || error.message.includes("503")) {
            throw new Error("AI_OVERLOADED");
        }
        throw new Error("Не вдалося обробити запит через ШІ.");
    }
}

module.exports = { analyzeArtWithGemini };