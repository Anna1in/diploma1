// server/utils/ai.js
const { GoogleGenerativeAI } = require("@google/generative-ai");

// Використовуємо ключ з .env
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function analyzeArtWithGemini(base64Image, userPrompt) {
    // ВАЖЛИВО: Використовуємо модель саме через цей метод
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // Очищаємо Base64 від метаданих (якщо вони є)
    const base64Data = base64Image.includes(",") ? base64Image.split(",")[1] : base64Image;

    const parts = [
        {
            inlineData: {
                mimeType: "image/jpeg", // Переконайся, що тут саме jpeg або png
                data: base64Data
            }
        },
        { text: `
            ROLE: Професійний викладач образотворчого мистецтва.
            TASK: Проаналізуй малюнок за запитом: "${userPrompt}". 
            Надай критику українською мовою.
            OUTPUT FORMAT: Тільки JSON {"annotated_image_base64": "...", "analysis_text": "..."}
            `
        }
    ];

    try {
        // Використовуємо стабільний метод generateContent
        const result = await model.generateContent(parts);
        const response = await result.response;
        const text = response.text();

        // Очищення JSON
        const cleanJson = text.replace(/```json/g, "").replace(/```/g, "").trim();
        return JSON.parse(cleanJson);
    } catch (error) {
        console.error("Помилка Gemini API детально:", error);
        // Якщо помилка 404 (модель не знайдено), спробуй змінити модель на "gemini-pro-vision" (якщо стара бібліотека)
        throw error;
    }
}

module.exports = { analyzeArtWithGemini };