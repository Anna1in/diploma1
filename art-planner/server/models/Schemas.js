const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    username: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true }
});

const TaskSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true, trim: true }, // Використовуємо title всюди
    day: { type: String, required: true }, // Додаємо day у схему
    category: { type: String, enum: ['day', 'week', 'month', 'year', 'anytime'], default: 'day' },
    isCompleted: { type: Boolean, default: false },
    date: { type: Date, default: Date.now }
});

const ArtSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    originalPath: String,
    processedPath: String,
    feedbackText: String,
    status: { type: String, default: 'pending' },
    createdAt: { type: Date, default: Date.now }
});

module.exports = {
    User: mongoose.model('User', UserSchema),
    Task: mongoose.model('Task', TaskSchema),
    Art: mongoose.model('Art', ArtSchema)
};