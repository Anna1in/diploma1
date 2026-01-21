require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Імпортуємо тільки те, що реально використовується в цьому файлі (Auth)
const { User } = require('./models/Schemas');

const app = express();
app.use(express.json());
app.use(cors());

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
    .then(() => console.log("БД підключено!"))
    .catch(err => console.log("DB Error:", err));

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

// --- ПІДКЛЮЧЕННЯ РОУТЕРІВ ---
// Використовуємо лише зовнішні файли для логіки тасок та AI
app.use('/api/tasks', require('./routes/taskRoutes'));
app.use('/api/ai', require('./routes/aiRoutes'));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));