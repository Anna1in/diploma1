const express = require('express');
const router = express.Router();
const { Task } = require('../models/Schemas');

// Отримати всі таски користувача
router.get('/:userId', async (req, res) => {
    try {
        const tasks = await Task.find({ userId: req.params.userId });
        res.json(tasks);
    } catch (err) {
        console.error("Get tasks error:", err.message);
        res.status(500).json({ message: err.message });
    }
});

// Додати нову таску
router.post('/', async (req, res) => {
    const { userId, title, day, category, date } = req.body;
    const task = new Task({
        userId,
        title,
        day,
        category,
        date
    });
    try {
        const newTask = await task.save();
        res.status(201).json(newTask);
    } catch (err) {
        console.error("Add task error:", err.message);
        res.status(400).json({ message: err.message });
    }
});

// Оновити статус
router.patch('/:id', async (req, res) => {
    try {
        const updatedTask = await Task.findByIdAndUpdate(
            req.params.id,
            { isCompleted: req.body.isCompleted },
            { new: true }
        );
        res.json(updatedTask);
    } catch (err) {
        console.error("Update task error:", err.message);
        res.status(400).json({ message: err.message });
    }
});

module.exports = router;