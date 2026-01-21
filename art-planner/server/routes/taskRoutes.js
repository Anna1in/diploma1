const express = require('express');
const router = express.Router();
const Task = require('../models/Schemas'); // Шлях до моделі

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
    const task = new Task({
        userId: req.body.userId,
        title: req.body.title,
        day: req.body.day
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