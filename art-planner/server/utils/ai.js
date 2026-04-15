const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function analyzeArtWithGemini(base64Image, userPrompt) {
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
    Зверни особливу увагу на анатомію, пропорції та перспективу. Надай професійну критику українською мовою.
    OUTPUT FORMAT: ПОВИНЕН бути ВИКЛЮЧНО валідний JSON без маркерів Markdown.
    
    СТРУКТУРА JSON:
    {
      "analysis_text": "Тут твій загальний детальний коментар та поради щодо виправлення.",
      "problem_areas": [
        {
          "issue": "Короткий опис помилки",
          "box_percentage": {
            "x": 45, 
            "y": 30, 
            "width": 15, 
            "height": 10
          }
        }
      ]
    }
    
    ПОЯСНЕННЯ ДО box_percentage: Це приблизні координати зони з помилкою у відсотках (від 0 до 100) відносно розмірів зображення. 
    x - відступ зліва, y - відступ зверху, width - ширина проблемної зони, height - висота.
    Якщо проблем немає, залиш масив problem_areas порожнім.
    `;

    try {
        const result = await model.generateContent([systemPrompt, imagePart]);
        const responseText = result.response.text();

        const cleanJsonString = responseText.replace(/```json/g, "").replace(/```/g, "").trim();
        return JSON.parse(cleanJsonString);
    } catch (error) {
        console.error("Gemini API Error Detail:", error);

        if (error.status === 429 || error.message?.includes("429")) {
            throw new Error("AI_OVERLOADED");
        }

        throw new Error("Не вдалося обробити запит через ШІ.");
    }
}

module.exports = { analyzeArtWithGemini };