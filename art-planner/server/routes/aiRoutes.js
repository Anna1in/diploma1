const express = require('express');
const router = express.Router(); // ЦЬОГО РЯДКА НЕ ВИСТАЧАЛО
const { Art } = require('../models/Schemas');
const { analyzeArtWithGemini } = require('../utils/ai');

router.post('/analyze', async (req, res) => {
    try {
        const { artId, prompt } = req.body;

        const art = await Art.findById(artId);
        if (!art) return res.status(404).json({ error: "Малюнок не знайдено" });

        // 1. Відправляємо Base64 з бази в Gemini
        const aiResponse = await analyzeArtWithGemini(art.originalPath, prompt);

        // 2. Створюємо новий запис для папки "Processed"

        const processedArt = new Art({
            userId: art.userId,
            originalPath: art.originalPath, // Залишаємо оригінальне фото, воно не змінюється
            customName: `Result_${art.customName}`,
            // Зберігаємо текст аналізу. Щоб зберегти ще й координати помилок,
            // можна перетворити весь об'єкт відповіді у рядок:
            processedPath: JSON.stringify(aiResponse),
            status: 'processed'
        });

        await processedArt.save();
        res.status(200).json(processedArt);

    } catch (err) {
        console.error("AI Route Error:", err.message);
        if (err.message === "AI_OVERLOADED") {
            return res.status(503).json({ error: "AI_OVERLOADED" });
        }
        res.status(500).json({ error: "Помилка сервера при аналізі ШІ" });
    }
});

module.exports = router;