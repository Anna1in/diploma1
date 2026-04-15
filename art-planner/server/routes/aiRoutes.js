// server/routes/aiRoutes.js
router.post('/analyze', async (req, res) => {
    try {
        const { artId, prompt } = req.body;
        const art = await Art.findById(artId);

        if (!art) return res.status(404).json({ error: "Малюнок не знайдено" });

        // Передаємо Base64 з бази в Gemini
        const aiResponse = await analyzeArtWithGemini(art.originalPath, prompt);

        // Створюємо новий запис для папки "Processed"
        const processedArt = new Art({
            userId: art.userId,
            originalPath: aiResponse.annotated_image_base64, // Зберігаємо нове фото з розміткою
            customName: `Result_${art.customName}`,
            processedPath: aiResponse.analysis_text, // Зберігаємо текст поради прямо тут
            status: 'processed'
        });

        await processedArt.save();
        res.status(200).json(processedArt);

    } catch (err) {
        if (err.message === "AI_OVERLOADED") return res.status(503).json({ error: "AI_OVERLOADED" });
        res.status(500).json({ error: err.message });
    }
});