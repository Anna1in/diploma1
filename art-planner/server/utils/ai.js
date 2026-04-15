const { GoogleGenerativeAI } = require("@google/generative-ai");

// Ініціалізація клієнта
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function analyzeArtWithGemini(base64Image, userPrompt) {
    // ВАЖЛИВО: Використовуй саме цю назву без -latest
    const model = genAI.getGenerativeModel({
        model: "gemini-1.5-flash"
    });

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
        console.error("Gemini API Error Detail:", error);

        // Додаткова перевірка на помилку квоти
        if (error.status === 429 || error.message.includes("429")) {
            throw new Error("AI_OVERLOADED");
        }

        throw new Error("Не вдалося обробити запит через ШІ.");
    }
}
const result = await genAI.listModels();
console.log(result);
module.exports = { analyzeArtWithGemini };