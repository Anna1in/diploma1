require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const { User, Art } = require('./models/Schemas');

const app = express();

// Збільшуємо ліміти для Base64 рядків
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));
app.use(cors());

// Створення необхідних папок (для результатів ШІ)
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

app.post('/api/upload', async (req, res) => {
    try {
        const { userId, image } = req.body;

        const count = await Art.countDocuments({ userId });
        const customName = `Image_${count + 1}.png`;

        const newArt = new Art({
            userId,
            originalPath: image, // Зберігаємо Base64
            customName: customName,
            status: 'pending'
        });

        await newArt.save();
        res.status(201).json(newArt);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.use('/api/tasks', require('./routes/taskRoutes'));
app.use('/api/ai', require('./routes/aiRoutes'));
// --- DELETE ART LOGIC ---
app.delete('/api/arts/:artId', async (req, res) => {
    try {
        const art = await Art.findById(req.params.artId);
        if (!art) {
            return res.status(404).json({ message: "Малюнок не знайдено" });
        }

        await Art.findByIdAndDelete(req.params.artId);
        res.json({ message: "Малюнок успішно видалено" });
    } catch (err) {
        console.error("Delete error:", err.message);
        res.status(500).json({ error: "Не вдалося видалити малюнок" });
    }
});
const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
});