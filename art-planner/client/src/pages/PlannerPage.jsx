import React, { useState, useEffect } from 'react';
import API from '../api/axiosConfig'; // Використовуємо наш конфіг з інтерцепторами

const PlannerPage = () => {
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const userId = localStorage.getItem('userId');

    useEffect(() => {
        if (userId) fetchTasks();
    }, [userId]);

    const fetchTasks = async () => {
        try {
            // Завдяки інтерцептору, userId додасться або буде використано для фільтрації на бекенді
            const res = await API.get(`/tasks/${userId}`);
            setTasks(res.data);
            setLoading(false);
        } catch (err) {
            console.error("Помилка завантаження завдань:", err);
            setLoading(false);
        }
    };

    const toggleTask = async (id, currentStatus) => {
        try {
            // Інтерцептор автоматично додасть userId у запит
            await API.patch(`/tasks/${id}`, {
                isCompleted: !currentStatus
            });
            fetchTasks(); // Оновлюємо дані після зміни
        } catch (err) {
            console.error("Помилка оновлення завдання:", err);
        }
    };

    // --- ЛОГІКА ОБЧИСЛЕННЯ ПРОГРЕСУ ---

    const getProgress = (category) => {
        let filteredTasks;

        if (category === 'year') {
            // Річний прогрес: сума ВСІХ завдань за поточний календарний рік
            const currentYear = new Date().getFullYear();
            filteredTasks = tasks.filter(task => {
                const taskDate = new Date(task.date);
                return taskDate.getFullYear() === currentYear;
            });
        } else {
            // Для day, week, month фільтруємо за конкретною категорією
            filteredTasks = tasks.filter(t => t.category === category);
        }

        if (filteredTasks.length === 0) return 0;

        const completed = filteredTasks.filter(t => t.isCompleted).length;
        // Формула: (completed / total) * 100
        return Math.round((completed / filteredTasks.length) * 100);
    };

    const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday', 'Anytime'];

    if (loading) return <div className="p-6 text-center">Завантаження планера...</div>;

    return (
        <div className="p-6 max-w-6xl mx-auto">
            {/* Секція прогрес-барів */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10 hand-drawn-card p-6">
                <div>
                    {['year', 'month', 'week', 'day'].map(cat => {
                        const progressValue = getProgress(cat);
                        return (
                            <div key={cat} className="mb-4">
                                <div className="flex justify-between font-bold capitalize mb-1">
                                    <span>{cat}: {progressValue}%</span>
                                </div>
                                <div className="progress-bar-container">
                                    <div
                                        className="progress-bar-fill"
                                        style={{ width: `${progressValue}%` }}
                                    ></div>
                                </div>
                            </div>
                        );
                    })}
                </div>
                <div className="flex flex-col justify-center items-center italic text-lg text-center p-4">
                    <p>"Мистецтво — це не те, що ви бачите, а те, що ви змушуєте бачити інших."</p>
                    <p className="mt-4 font-bold text-[--color-deep] border-b-2 border-[--color-dark]">
                        Art Journey Tracker 2026
                    </p>
                </div>
            </div>

            {/* Тижнева сітка */}
            <h2 className="text-center text-2xl font-bold mb-6 underline decoration-wavy">Weekly Plan</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-10">
                {daysOfWeek.map(day => (
                    <div key={day} className="hand-drawn-card p-4 min-h-[180px] flex flex-col">
                        <h3 className="text-center font-bold border-b-2 border-[--color-dark] mb-2">{day}</h3>
                        <ul className="text-sm flex-grow">
                            {tasks.filter(t => t.day === day).map(task => (
                                <li key={task._id} className="flex items-start gap-2 mb-2">
                                    <input
                                        type="checkbox"
                                        checked={task.isCompleted}
                                        onChange={() => toggleTask(task._id, task.isCompleted)}
                                        className="mt-1 accent-[--color-dark] cursor-pointer"
                                    />
                                    <span className={`leading-tight ${task.isCompleted ? "line-through opacity-50" : ""}`}>
                                        {task.text}
                                    </span>
                                </li>
                            ))}
                        </ul>
                        <button className="text-xs mt-3 p-1 border border-dashed border-[--color-dark] hover:bg-[--color-accent]/30 transition-colors">
                            + Додати завдання
                        </button>
                    </div>
                ))}
            </div>

            {/* Місячний календар */}
            <h2 className="text-center text-2xl font-bold mb-6 underline decoration-wavy">Monthly Calendar</h2>
            <div className="hand-drawn-card p-6 overflow-x-auto">
                <div className="grid grid-cols-7 gap-2 min-w-[600px]">
                    {Array.from({ length: 31 }, (_, i) => {
                        // Логіка для відображення виконаних завдань у календарі (крапки)
                        const hasCompletedTask = tasks.some(t =>
                            new Date(t.date).getDate() === (i + 1) && t.isCompleted
                        );

                        return (
                            <div key={i} className="aspect-square border border-[--color-dark] bg-[--color-accent]/10 p-1 text-xs font-bold relative hover:bg-[--color-secondary] transition-colors cursor-pointer group">
                                {i + 1}
                                {hasCompletedTask && (
                                    <div className="absolute bottom-1 right-1 w-2 h-2 bg-[--color-deep] rounded-full"></div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default PlannerPage;