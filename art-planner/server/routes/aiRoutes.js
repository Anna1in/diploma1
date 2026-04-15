const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const { Art } = require('../models/Schemas'); // Переконайся, що шлях правильний
const { analyzeArtWithGemini } = require('../utils/ai');

router.post('/analyze', async (req, res) => {
    try {
        const { artId, prompt } = req.body;

        // 1. Знаходимо малюнок у БД
        const art = await Art.findById(artId);
        if (!art) return res.status(404).json({ error: "Малюнок не знайдено" });

        // 2. Відправляємо до Gemini
        const aiResponseText = await analyzeArtWithGemini(art.originalPath, prompt);

        // 3. Зберігаємо результат ШІ у текстовий файл
        const resultFileName = `Feedback_${Date.now()}.txt`;
        const resultPath = path.join(__dirname, '..', 'results', resultFileName);
        fs.writeFileSync(resultPath, aiResponseText);

        // 4. Створюємо новий запис у БД для папки "Processed"
        const processedArt = new Art({
            userId: art.userId,
            originalPath: art.originalPath, // Зберігаємо посилання на оригінальне фото
            processedPath: resultFileName,  // Додаємо посилання на txt файл
            status: 'processed'
        });

        await processedArt.save();

        res.status(200).json(processedArt);
    } catch (err) {
        console.error("AI Route Error:", err.message);
        res.status(500).json({ error: "Помилка сервера при аналізі ШІ" });
    }
});

module.exports = router;