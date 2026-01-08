const fs = require('fs');
const path = require('path');
const { Art } = require('../models/Schemas');

// Функція для обробки відповіді від ШІ
async function processAIResponse(userId, artId, aiJsonResponse) {
    const { annotated_image_base64, analysis_text } = aiJsonResponse;

    // 1. Зберігаємо текст як .txt
    const txtName = `feedback_${artId}.txt`;
    const txtPath = path.join(__dirname, '../results', txtName);
    fs.writeFileSync(txtPath, analysis_text);

    // 2. Декодуємо base64 зображення
    const imgName = `processed_${artId}.png`;
    const imgPath = path.join(__dirname, '../results', imgName);
    const buffer = Buffer.from(annotated_image_base64, 'base64');
    fs.writeFileSync(imgPath, buffer);

    // 3. Оновлюємо БД
    await Art.findByIdAndUpdate(artId, {
        processedPath: imgName,
        feedbackText: analysis_text,
        status: 'completed'
    });
}