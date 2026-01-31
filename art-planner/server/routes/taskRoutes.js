const express = require('express');
const router = express.Router();
const { Task } = require('../models/Schemas'); // Шлях до моделі

// Отримати всі таски користувача
router.get('/:userId', async (req, res) => {
    try {
        const tasks = await Task.find({ userId: req.params.userId });
        res.json(tasks);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Додати нову таску
router.post('/', async (req, res) => {
    const { userId, title, day, category, date } = req.body; // Отримуємо всі поля
    const task = new Task({
        userId,
        title,
        day,
        category, // Тепер категорія зберігається
        date // Тепер зберігається саме та дата, яку ви обрали в календарі!
    });
    try {
        const newTask = await task.save();
        res.status(201).json(newTask);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Оновити статус (виконано/не виконано)
router.patch('/:id', async (req, res) => {
    try {
        const updatedTask = await Task.findByIdAndUpdate(req.params.id, { isCompleted: req.body.isCompleted }, { new: true });
        res.json(updatedTask);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

module.exports = router;