// server/routes/aiRoutes.js
const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const { Art } = require('../models/Schemas');
const { analyzeArtWithGemini } = require('../utils/ai');

router.post('/analyze', async (req, res) => {
    try {
        const { artId, prompt } = req.body;

        const art = await Art.findById(artId);
        if (!art) return res.status(404).json({ error: "Малюнок не знайдено" });

        // 1. Відправляємо до Gemini та отримуємо структурований JSON
        const aiResponse = await analyzeArtWithGemini(art.originalPath, prompt);

        // 2. ПОСТОБРОБКА ЗОБРАЖЕННЯ З РОЗМІТКОЮ (Base64 -> File)
        const annotatedImageBase64 = aiResponse.annotated_image_base64;
        const annotatedImageName = `Annotated_${Date.now()}.jpg`;
        const annotatedImagePath = path.join(__dirname, '..', 'results', annotatedImageName);

        // Декодуємо base64 і зберігаємо як файл
        fs.writeFileSync(annotatedImagePath, annotatedImageBase64, 'base64');

        // 3. ПОСТОБРОБКА ТЕКСТУ (Зберігаємо як TXT)
        const feedbackFileName = `Feedback_${Date.now()}.txt`;
        const feedbackFilePath = path.join(__dirname, '..', 'results', feedbackFileName);
        fs.writeFileSync(feedbackFilePath, aiResponse.analysis_text);

        // 4. ОНОВЛЮЄМО БАЗУ ДАНИХ (Створюємо новий запис для Processed)
        const processedArt = new Art({
            userId: art.userId,
            originalPath: annotatedImageName, // ТЕПЕР ТУТ ФОТО З РОЗМІТКОЮ!
            processedPath: feedbackFileName,  // Посилання на текстовий файл
            status: 'processed'
        });

        await processedArt.save();

        res.status(200).json(processedArt);

    } catch (err) {
        console.error("AI Route Error:", err.message);

        // Відправляємо спеціальний статус, якщо ШІ перевантажено
        if (err.message === "AI_OVERLOADED") {
            return res.status(503).json({ error: "AI_OVERLOADED" });
        }

        res.status(500).json({ error: "Помилка сервера при аналізі ШІ" });
    }
});

module.exports = router;