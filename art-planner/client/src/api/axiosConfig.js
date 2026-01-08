import axios from 'axios';

const API = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
});

// Додаємо інтерцептор для кожного запиту
API.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    const userId = localStorage.getItem('userId');

    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }

    // Якщо це POST/PATCH запит, автоматично додаємо userId в тіло (якщо це об'єкт)
    if (userId && config.data instanceof Object && !(config.data instanceof FormData)) {
        config.data.userId = userId;
    }

    // Якщо це FormData (завантаження фото), додаємо userId туди
    if (userId && config.data instanceof FormData) {
        config.data.append('userId', userId);
    }

    return config;
});

export default API;