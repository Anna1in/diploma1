require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const logger = require('./utils/logger');

const { User, Art } = require('./models/Schemas');

const app = express();

// 1. Парсери
app.use(express.json());

// 2. Налаштування CORS (важливо для Vercel)
app.use(cors({
    origin: ['https://ai-planner-ashen.vercel.app', 'http://localhost:5173'],
    credentials: true
}));

// Налаштування збереження файлів Multer
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'uploads/'),
    filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage });

// Створення необхідних папок
const directories = ['uploads', 'results'];
directories.forEach(dir => {
    const dirPath = path.join(__dirname, dir);
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
    }
});

// Роздача статичних файлів
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/results', express.static(path.join(__dirname, 'results')));

// Підключення до БД
mongoose.connect(process.env.MONGODB_URI)
    .then(() => logger.info("БД підключено успішно!"))
    .catch(err => logger.error(err.message));

// --- AUTH LOGIC (залишаємо тут або виносимо в auth.js) ---
app.post('/api/register', async (req, res) => {
    try {
        const { username, email, password } = req.body;
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({ username, email, password: hashedPassword });
        await newUser.save();
        res.status(201).json({ message: "User created" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });
        if (user && await bcrypt.compare(password, user.password)) {
            const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET);
            res.json({ token, userId: user._id, username: user.username });
        } else {
            res.status(401).json({ message: "Invalid credentials" });
        }
    } catch (err) {
        res.status(500).json({ error: "Login failed" });
    }
});


// --- UPLOAD LOGIC ---
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

// --- ARTS LOGIC ---
app.get('/api/arts/:userId', async (req, res) => {
    try {
        const arts = await Art.find({ userId: req.params.userId }).sort({ createdAt: -1 });
        res.json(arts);
    } catch (err) {
        logger.error(`Помилка отримання малюнків для юзера ${req.params.userId}: ${err.message}`);
        res.status(500).json({ message: "Помилка отримання малюнків", error: err.message });
    }
});

// --- ПІДКЛЮЧЕННЯ ДОДАТКОВИХ РОУТЕРІВ ---
app.use('/api/tasks', require('./routes/taskRoutes'));
app.use('/api/ai', require('./routes/aiRoutes'));

// Запуск сервера (з '0.0.0.0' для коректної роботи на Render)
const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
});