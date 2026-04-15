const { GoogleGenerativeAI } = require("@google/generative-ai");
const fs = require("fs");
const path = require("path");

// Ініціалізуємо Gemini з твоїм ключем
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Функція для конвертації файлу в об'єкт для Gemini
function fileToGenerativePart(filePath, mimeType) {
    return {
        inlineData: {
            data: Buffer.from(fs.readFileSync(filePath)).toString("base64"),
            mimeType
        },
    };
}

async function analyzeArtWithGemini(fileName, userPrompt) {
    // Використовуємо модель flash, бо вона швидка і підтримує зображення
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const filePath = path.join(__dirname, '..', 'uploads', fileName);

    // Визначаємо тип файлу
    const ext = path.extname(fileName).toLowerCase();
    const mimeType = ext === '.png' ? 'image/png' : 'image/jpeg';

    const imagePart = fileToGenerativePart(filePath, mimeType);

    // Основний системний промпт (ховаємо від користувача)
    const systemPrompt = `
    Ти — професійний арт-інструктор у застосунку Art Planner. Твоя мета - допомогти художнику покращити його малюнок.
    Користувач надіслав свій малюнок та наступний коментар/запит: "${userPrompt}".
    
    Надай розгорнуту, дружню, але професійну критику українською мовою. 
    Зверни увагу на те, що просить користувач (анатомія, кольори, композиція тощо). 
    Структуруй відповідь:
    1. Що вийшло добре.
    2. Головні помилки або неточності.
    3. Поради щодо покращення.
    `;

    try {
        const result = await model.generateContent([systemPrompt, imagePart]);
        return result.response.text();
    } catch (error) {
        console.error("Помилка Gemini API:", error);
        throw new Error("Не вдалося обробити запит через ШІ.");
    }
}

module.exports = { analyzeArtWithGemini };