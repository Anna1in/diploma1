require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const multer = require('multer'); // Додано
const logger = require('./utils/logger');
const { User, Art } = require('./models/Schemas');

const app = express();
app.use(express.json());
app.use(cors());

// Налаштування збереження файлів Multer
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'uploads/'),
    filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage });

// Створення папок
const directories = ['uploads', 'results'];
directories.forEach(dir => {
    const dirPath = path.join(__dirname, dir);
    if (!fs.existsSync(dirPath)) fs.mkdirSync(dirPath, { recursive: true });
});

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

mongoose.connect(process.env.MONGODB_URI)
    .then(() => logger.info("БД підключено!"))
    .catch(err => logger.error(err.message));

// РОУТ ДЛЯ ЗАВАНТАЖЕННЯ МАЛЮНКІВ
app.post('/api/upload', upload.single('image'), async (req, res) => {
    try {
        const { userId } = req.body;
        if (!req.file) return res.status(400).json({ message: "Файл не обрано" });

        const newArt = new Art({
            userId,
            originalPath: req.file.filename,
            status: 'pending'
        });

        await newArt.save();
        res.status(201).json(newArt);
    } catch (err) {
        logger.error(`Upload error: ${err.message}`);
        res.status(500).json({ error: "Помилка сервера при завантаженні" });
    }
});

// Отримати малюнки
app.get('/api/arts/:userId', async (req, res) => {
    try {
        const arts = await Art.find({ userId: req.params.userId }).sort({ createdAt: -1 });
        res.json(arts);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.use('/api/tasks', require('./routes/taskRoutes'));
app.use('/api/ai', require('./routes/aiRoutes'));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));