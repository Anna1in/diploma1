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
    TASK: Проаналізуй малюнок за запитом: "${userPrompt}". 
    OUTPUT FORMAT: ПОВИНЕН бути ВИКЛЮЧНО валідний JSON без маркерів Markdown.
    
    СТРУКТУРА JSON:
    {
      "analysis_text": "Загальний коментар",
      "lines": [
        {
          "type": "vertical", 
          "x1": 50, "y1": 10, "x2": 50, "y2": 90, 
          "color": "red"
        },
        {
          "type": "horizontal", 
          "x1": 20, "y1": 45, "x2": 80, "y2": 45, 
          "color": "red"
        }
      ],
      "annotations": [
        {
          "text": "Очі занадто великі",
          "text_x": 80, "text_y": 40,
          "pointer_x": 65, "pointer_y": 45
        }
      ]
    }
    
    ПРАВИЛА РОЗМІТКИ (всі координати у відсотках 0-100):
    1. У масив 'lines' додай вісь симетрії обличчя (вертикальну) та лінії пропорцій (горизонтальні осі очей, носа, губ), якщо вони порушені.
    2. У масив 'annotations' додай текст помилки. text_x/text_y - де розмістити сам текст (збоку). pointer_x/pointer_y - куди вказує лінія від тексту (на саму помилку).
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