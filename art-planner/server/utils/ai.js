const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function analyzeArtWithGemini(base64Image, userPrompt) {
    // Використовуємо 1.5-flash, бо вона стабільніша з квотами
    const model = genAI.getGenerativeModel({
        model: "gemini-flash-latest"
    });

    const base64Data = base64Image.includes(",") ? base64Image.split(",")[1] : base64Image;

    const imagePart = {
        inlineData: {
            data: base64Data,
            mimeType: "image/jpeg" // або image/png
        },
    };

    const systemPrompt = `
    **ROLE:**
    Ви — професійний викладач образотворчого мистецтва, експерт з анатомії, перспективи, композиції та теорії кольору. Ви також є передовим штучним інтелектом, здатним аналізувати зображення та надавати точну розмітку.

    **TASK:**
    Ваше завдання — проаналізувати наданий користувачем малюнок на основі його запиту: "${userPrompt}". 
    Надайте детальну, конструктивну критику, діючи як терплячий наставник.

    **PROCESS & GUIDELINES:**
    1. Фокусуйтеся виключно на тому, що попросив користувач.
    2. Використовуйте професійну термінологію, але пояснюйте її просто.
    3. Структура тексту (analysis_text) має містити: Загальне враження, Детальний аналіз та Поради щодо покращення.

    **OUTPUT FORMAT (CRITICAL):**
   л Ви ПОВИННІ повернути відповідь ВИКЛЮЧНО у форматі JSON без маркерів Markdown. Не маюйте зображення! Замість цього поверніть координати для ліній та точок, які фронтенд намалює поверх оригінального фото.
    Усі координати (x, y) - це відсотки від розміру зображення (від 0 до 100).

    СТРУКТУРА JSON ОБОВ'ЯЗКОВО ТАКА:
    {
      "analysis_text": "string (ваш детальний текстовий аналіз у форматі Markdown)",
      "lines": [
        {
          "x1": 50, "y1": 10, "x2": 50, "y2": 90, 
          "color": "red"
        }
      ],
      "annotations": [
        {
          "text": "Короткий текст помилки (наприклад, 'Очі зависоко')",
          "text_x": 80, "text_y": 40,
          "pointer_x": 50, "pointer_y": 35
        }
      ]
    }
    `;

    try {
        const result = await model.generateContent([systemPrompt, imagePart]);
        const responseText = await result.response.text();

        // Очищаємо відповідь від випадкових маркерів Markdown, які іноді додає ШІ
        const cleanJsonString = responseText.replace(/```json/g, "").replace(/```/g, "").trim();
        return JSON.parse(cleanJsonString);
    } catch (error) {
        console.error("Gemini Node.js Error:", error.message);
        throw error;
    }
}

module.exports = { analyzeArtWithGemini };