// server/utils/ai.js
const { GoogleGenerativeAI } = require("@google/generative-ai");
const fs = require("fs");
const path = require("path");

// Ініціалізуємо Gemini з ключем з .env
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

function fileToGenerativePart(filePath) {
    // Читаємо файл і перетворюємо в base64 для відправки в API
    return {
        inlineData: {
            data: Buffer.from(fs.readFileSync(filePath)).toString("base64"),
            mimeType: "image/jpeg" // Або image/png, Gemini обробить обидва
        },
    };
}

async function analyzeArtWithGemini(fileName, userPrompt) {
    // Використовуємо найновішу модель, яка підтримує зображення
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // Шлях до оригіналу малюнка користувача
    const filePath = path.join(__dirname, '..', 'uploads', fileName);
    const imagePart = fileToGenerativePart(filePath);

    // СИСТЕМНИЙ ПРОМПТ (Твоя інструкція для ШІ)
    const systemPrompt = `
    ROLE:
    Ти — професійний викладач образотворчого мистецтва, експерт з анатомії та композиції. Ти також є ШІ, здатним аналізувати зображення та накладати візуальну розмітку.

    TASK:
    Твоє завдання — проаналізувати наданий користувачем малюнок на основі його запиту: "${userPrompt}". 
    Надай професійну критику українською мовою.

    OUTPUT FORMAT (CRITICAL):
    Ти ПОВИНЕН повернути відповідь ВИКЛЮЧНО у форматі JSON з двома ключами. Не додавай жодного вступного чи заключного тексту поза межами JSON об'єкта.

    {
      "annotated_image_base64": "string (base64 encoded JPEG image data of the original drawing with your visual overlay red marks)",
      "analysis_text": "string (markdown formatted text containing the detailed explanation and tips)"
    }

    GUIDELINES ДЛЯ РОЗМІТКИ (Annotated Image):
    1. Створи нову версію зображення, наклавши на нього чіткі візуальні анотації (червоні лінії).
    2. Якщо запит про ПРОПОРЦІЇ/АНАТОМІЮ: Використовуй червоні лінії, щоб показати неправильні осі симетрії, сітку Ломіса або відхилення (наприклад, "очі занадто високо", "ніс закороткий").
    `;

    try {
        const result = await model.generateContent([systemPrompt, imagePart]);
        const responseText = result.response.text();

        // Очищаємо відповідь від можливих маркерів ```json ... ```
        const cleanJsonString = responseText.replace(/```json/g, "").replace(/```/g, "").trim();

        // Перетворюємо рядок у JSON об'єкт
        return JSON.parse(cleanJsonString);

    } catch (error) {
        console.error("Gemini API Error:", error);

        // Обробка помилки перевантаження сервера (Quota Exceeded / Service Unavailable)
        if (error.message.includes("429") || error.message.includes("503")) {
            throw new Error("AI_OVERLOADED"); // Спеціальний код для фронтенду
        }

        throw new Error("Не вдалося обробити запит через ШІ.");
    }
}

module.exports = { analyzeArtWithGemini };