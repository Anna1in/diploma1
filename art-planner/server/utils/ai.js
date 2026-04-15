const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function analyzeArtWithGemini(base64Image, userPrompt) {
    // ВАЖЛИВО: Спробуйте саме модель 2.0-flash
    const model = genAI.getGenerativeModel({
        model: "gemini-flash-latest"
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
    Надай професійну критику українською мовою у форматі JSON.
    `;

    try {
        // Якщо помилка 404 не зникне, спробуйте замінити модель нижче на "models/gemini-1.5-flash"
        const result = await model.generateContent([systemPrompt, imagePart]);
        const response = await result.response;
        const responseText = response.text();

        const cleanJsonString = responseText.replace(/```json/g, "").replace(/```/g, "").trim();
        return JSON.parse(cleanJsonString);
    } catch (error) {
        console.error("Gemini Node.js Error:", error.message);
        throw error;
    }
}

module.exports = { analyzeArtWithGemini };