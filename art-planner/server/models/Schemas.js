const mongoose = require('mongoose');

const TaskSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true, trim: true }, // Використовуємо title всюди
    day: { type: String, required: true }, // Додаємо day у схему
    category: { type: String, enum: ['day', 'week', 'month', 'year', 'anytime'], default: 'day' },
    isCompleted: { type: Boolean, default: false },
    date: { type: Date, default: Date.now }
});

// Решта моделей (User, Art) залишаються без змін
module.exports = {
    User: mongoose.model('User', UserSchema),
    Task: mongoose.model('Task', TaskSchema),
    Art: mongoose.model('Art', ArtSchema)
};