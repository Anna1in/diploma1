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

    // Строгий системний промпт для отримання координат
    const systemPrompt = `
    ROLE: Професійний викладач образотворчого мистецтва.
    TASK: Проаналізуй малюнок користувача за запитом: "${userPrompt}". 
    Зверни особливу увагу на анатомію, пропорції та перспективу. Надай професійну критику українською мовою.
    OUTPUT FORMAT: ПОВИНЕН бути ВИКЛЮЧНО валідний JSON без маркерів Markdown (\`\`\`json).
    
    СТРУКТУРА JSON ОБОВ'ЯЗКОВО ТАКА:
    {
      "analysis_text": "Тут твій загальний детальний коментар та поради щодо виправлення.",
      "problem_areas": [
        {
          "issue": "Короткий опис помилки (наприклад, 'Праве око занадто високо')",
          "box": {
            "x": 45, 
            "y": 30, 
            "width": 15, 
            "height": 10
          }
        }
      ]
    }
    
    ПОЯСНЕННЯ ДО box: Це координати зони з помилкою у відсотках (від 0 до 100) відносно розмірів зображення. 
    x - відступ зліва, y - відступ зверху, width - ширина проблемної зони, height - висота.
    Якщо проблем немає, залиш масив problem_areas порожнім.
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