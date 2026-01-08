const express = require('express');
const router = express.Router();
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const { Art } = require('../models/Schemas');

// Налаштування Multer для завантаження оригіналів
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'uploads/'),
    filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`)
});
const upload = multer({ storage });

router.post('/process-art', upload.single('image'), async (req, res) => {
    try {
        const { userId, userPrompt } = req.body;
        const originalFile = req.file;

        // 1. Створення запису в БД зі статусом "pending"
        const artEntry = new Art({
            userId,
            originalPath: originalFile.filename,
            status: 'pending'
        });
        await artEntry.save();

        // 2. Читання зображення для відправки в AI (base64)
        const imageBase64 = fs.readFileSync(originalFile.path, { encoding: 'base64' });

        // 3. Запит до AI API (наприклад, OpenAI або Gemini)
        const aiResponse = await axios.post('https://api.your-ai-provider.com/v1/analyze', {
            system_prompt: "Ти професійний викладач академічного малюнку...", // Текст із вашого .txt
            image: imageBase64,
            user_prompt: userPrompt
        });

        const { annotated_image_base64, analysis_text } = aiResponse.data;

        // 4. Постобробка: Збереження тексту та зображення
        const resultImageName = `processed-${artEntry._id}.png`;
        const resultTextName = `feedback-${artEntry._id}.txt`;

        // Декодування та збереження зображення
        fs.writeFileSync(
            path.join(__dirname, '../results', resultImageName),
            Buffer.from(annotated_image_base64, 'base64')
        );

        // Збереження тексту аналізу
        fs.writeFileSync(
            path.join(__dirname, '../results', resultTextName),
            analysis_text
        );

        // 5. Оновлення запису в БД
        artEntry.processedPath = resultImageName;
        artEntry.feedbackText = analysis_text;
        artEntry.status = 'completed';
        await artEntry.save();

        res.json(artEntry);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "AI processing failed" });
    }
});

module.exports = router;