require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const { User, Task, Art } = require('./models/Schemas');

const app = express();
app.use(express.json());
app.use(cors());

// Статичні папки для зображень
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/results', express.static(path.join(__dirname, 'results')));
const uri = process.env.MONGODB_URI;
// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log("Connected to MongoDB Atlas"))
    .catch(err => console.error("DB Connection Error:", err));

// --- AUTH LOGIC ---

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
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (user && await bcrypt.compare(password, user.password)) {
        const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET);
        res.json({ token, userId: user._id, username: user.username });
    } else {
        res.status(401).json({ message: "Invalid credentials" });
    }
});

// --- TASK LOGIC ---

app.get('/api/tasks/:userId', async (req, res) => {
    const tasks = await Task.find({ userId: req.params.userId });
    res.json(tasks);
});

app.post('/api/tasks', async (req, res) => {
    const { userId, text, category, day } = req.body;
    const newTask = new Task({ userId, text, category, day });
    await newTask.save();
    res.json(newTask);
});

app.patch('/api/tasks/:id', async (req, res) => {
    const { isCompleted, userId } = req.body;
    // Перевірка userId гарантує, що користувач редагує тільки свої таски
    const task = await Task.findOneAndUpdate(
        { _id: req.params.id, userId: userId },
        { isCompleted },
        { new: true }
    );
    res.json(task);
});

// --- MULTER SETUP (AI Instructor) ---

const storage = multer.diskStorage({
    destination: './uploads/',
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`);
    }
});
const upload = multer({ storage });

app.post('/api/upload', upload.single('image'), async (req, res) => {
    const { userId } = req.body;
    const newArt = new Art({
        userId,
        originalPath: req.file.filename,
        status: 'pending'
    });
    await newArt.save();
    res.json(newArt);
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));