const express = require('express');
const router = express.Router();
const { Art } = require('../models/Schemas');
const { analyzeArtWithGemini } = require('../utils/ai');
const { Semaphore } = require('async-mutex');

// Максимум 2 запити до Gemini одночасно
const semaphore = new Semaphore(2);

// Захист від спаму — один юзер не може мати більше 1 активного запиту
const activeRequests = new Set();

router.post('/analyze', async (req, res) => {
    try {
        const { artId, prompt } = req.body;

        // Перевірка вхідних даних
        if (!artId || !prompt) {
            return res.status(400).json({ error: "artId та prompt обов'язкові" });
        }

        const art = await Art.findById(artId);
        if (!art) {
            return res.status(404).json({ error: "Малюнок не знайдено" });
        }

        const userId = art.userId.toString();

        // Захист від дублікатів від одного юзера
        if (activeRequests.has(userId)) {
            return res.status(429).json({
                error: "Ваш попередній запит ще обробляється. Зачекайте."
            });
        }

        // Позначаємо юзера як зайнятого
        activeRequests.add(userId);

        // Очікуємо слот у семафорі
        const [, release] = await semaphore.acquire();

        try {
            const aiResponse = await analyzeArtWithGemini(
                art.originalPath,
                prompt
            );

            const processedArt = new Art({
                userId: art.userId,
                originalPath: art.originalPath,
                customName: `Result_${art.customName}`,
                processedPath: JSON.stringify(aiResponse),
                status: 'processed'
            });

            await processedArt.save();
            res.status(200).json(processedArt);

        } finally {
            // Завжди звільняємо слот і знімаємо блок з юзера
            release();
            activeRequests.delete(userId);
        }

    } catch (err) {
        console.error("AI Route Error:", err.message);

        if (err.message === "AI_OVERLOADED") {
            return res.status(503).json({ error: "AI_OVERLOADED" });
        }
        if (err.status === 429 || err.message?.includes('429')) {
            return res.status(503).json({ error: "AI_OVERLOADED" });
        }

        res.status(500).json({ error: "Помилка сервера при аналізі ШІ" });
    }
});

module.exports = router;