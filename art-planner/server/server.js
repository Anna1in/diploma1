require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');

const { User, Art } = require('./models/Schemas');

const app = express();
app.use(express.json());
app.use(cors());

// Налаштування Multer для завантаження малюнків
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

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/results', express.static(path.join(__dirname, 'results')));

mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log("БД підключено успішно!"))
    .catch(err => console.error("Помилка підключення БД:", err.message));

// --- AUTH LOGIC ---
app.post('/api/register', async (req, res) => {
    try {
        const { username, email, password } = req.body;
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({ username, email, password: hashedPassword });
        await newUser.save();
        res.status(201).json({ message: "User created" });
    } catch (err) {
        console.error("Registration error:", err.message);
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
        console.error("Login error:", err.message);
        res.status(500).json({ error: "Login failed" });
    }
});

// --- ARTS LOGIC ---
app.get('/api/arts/:userId', async (req, res) => {
    try {
        const arts = await Art.find({ userId: req.params.userId }).sort({ createdAt: -1 });
        res.json(arts);
    } catch (err) {
        console.error("Error fetching arts:", err.message);
        res.status(500).json({ message: "Помилка отримання малюнків", error: err.message });
    }
});

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
        console.error("Upload error:", err.message);
        res.status(500).json({ error: "Помилка сервера при завантаженні" });
    }
});

// --- ПІДКЛЮЧЕННЯ РОУТЕРІВ ---
app.use('/api/tasks', require('./routes/taskRoutes'));
app.use('/api/ai', require('./routes/aiRoutes'));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));