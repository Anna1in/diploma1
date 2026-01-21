import React, { useState, useEffect, useCallback } from 'react';
import API from '../api/axiosConfig';

const PlannerPage = () => {
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true); // Тепер використовується для відображення статусу
    const [activeInput, setActiveInput] = useState(null);
    const userId = localStorage.getItem('userId');
    const userName = localStorage.getItem('username') || 'Artist';

    // 1. Виправлення: Обгортаємо fetchTasks у useCallback та додаємо обробку помилок
    const fetchTasks = useCallback(async () => {
        try {
            setLoading(true);
            const res = await API.get(`/tasks/${userId}`);
            setTasks(res.data);
        } catch (err) {
            console.error("Помилка завантаження тасок:", err);
        } finally {
            setLoading(false); // Завантаження завершено (успішно чи ні)
        }
    }, [userId]);

    // 2. Виправлення: Обробляємо проміс у useEffect
    useEffect(() => {
        if (userId) {
            fetchTasks();
        } else {
            setLoading(false);
        }
    }, [userId, fetchTasks]);

    const addTask = async (day, title) => {
        if (!title) return;
        try {
            const res = await API.post('/tasks', {
                userId,
                title,
                day,
                category: day === 'Anytime' ? 'anytime' : 'weekly',
                date: new Date()
            });
            setTasks(prev => [...prev, res.data]);
            setActiveInput(null);
        } catch (err) {
            alert("Не вдалося зберегти завдання");
        }
    };

    const toggleTask = async (taskId, isCompleted) => {
        try {
            await API.patch(`/tasks/${taskId}`, { isCompleted: !isCompleted });
            setTasks(tasks.map(t => t._id === taskId ? { ...t, isCompleted: !isCompleted } : t));
        } catch (err) {
            console.error("Помилка оновлення статусу");
        }
    };

    const calculateProgress = (period) => {
        const now = new Date();
        let filtered = [];

        if (period === 'Year') {
            // Річний прогрес за 2026 рік
            filtered = tasks.filter(task => new Date(task.date).getFullYear() === 2026);
        } else if (period === 'Month') {
            filtered = tasks.filter(task => new Date(task.date).getMonth() === now.getMonth());
        } else if (period === 'Week') {
            filtered = tasks.filter(task => task.category === 'weekly');
        } else {
            filtered = tasks.filter(task => new Date(task.date).toDateString() === now.toDateString());
        }

        if (filtered.length === 0) return 0;
        const completed = filtered.filter(task => task.isCompleted).length;
        return Math.round((completed / filtered.length) * 100);
    };

    // 3. Візуалізація завантаження
    if (loading) {
        return (
            <div className="min-h-screen bg-secondary flex items-center justify-center font-hand">
                <div className="text-4xl text-deep animate-bounce italic font-bold">
                    Loading your plans...
                </div>
            </div>
        );
    }

    const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday', 'Anytime'];

    return (
        <div className="min-h-screen bg-secondary font-hand text-dark pb-10">
            <header className="bg-primary pt-8 relative border-b-3 border-dark text-center">
                <h1 className="text-5xl mb-2 italic font-bold text-deep">Welcome, {userName}</h1>
                <div className="w-full overflow-hidden leading-none mt-2">
                    <svg viewBox="0 0 1200 120" preserveAspectRatio="none" className="relative block w-full h-10 text-secondary fill-current">
                        <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V0H0V46.35c0,0,10.13,10.61,46,14.73C158,74.15,221,68.05,321.39,56.44Z"></path>
                    </svg>
                </div>
            </header>

            <main className="max-w-7xl mx-auto p-6 space-y-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Прогрес-бари */}
                    <section className="bg-accent rounded-3xl p-8 border-3 border-dark shadow-md">
                        <div className="space-y-5">
                            {['Year', 'Month', 'Week', 'Day'].map((label) => {
                                const val = calculateProgress(label);
                                return (
                                    <div key={label} className="flex items-center gap-4">
                                        <div className="flex-1 bg-primary h-7 rounded-lg overflow-hidden border-2 border-dark relative">
                                            <div className="bg-dark h-full transition-all duration-1000" style={{ width: `${val}%` }}></div>
                                        </div>
                                        <span className="w-28 text-right italic font-bold text-xl">{label} : {val}%</span>
                                    </div>
                                );
                            })}
                        </div>
                    </section>

                    <section className="bg-accent rounded-3xl p-6 border-2 border-dark shadow-sm">
                        <h2 className="text-center text-2xl border-b border-dark mb-4 pb-1 italic font-bold">Daily Focus</h2>
                        <div className="grid grid-cols-1 text-lg italic gap-2">
                            {tasks.filter(t => new Date(t.date).toDateString() === new Date().toDateString()).slice(0, 6).map(t => (
                                <div key={t._id}>• {t.title}</div>
                            ))}
                        </div>
                    </section>
                </div>

                {/* Weekly Grid */}
                <section>
                    <h2 className="text-center text-4xl mb-6 font-bold italic">Weekly Schedule</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {daysOfWeek.map((day) => (
                            <div key={day} className="hand-drawn-card bg-primary/80 flex flex-col min-h-[200px]">
                                <div className="bg-secondary text-center py-2 font-bold text-2xl border-b-2 border-dark">
                                    {day}
                                </div>
                                <div className="p-3 flex-1 space-y-2">
                                    {tasks.filter(t => t.day === day).map((task) => (
                                        <div key={task._id} className="flex items-center gap-2">
                                            <input
                                                type="checkbox"
                                                checked={task.isCompleted}
                                                onChange={() => toggleTask(task._id, task.isCompleted)}
                                                className="w-5 h-5 accent-dark cursor-pointer"
                                            />
                                            <span className={`text-sm italic ${task.isCompleted ? 'line-through opacity-50' : ''}`}>
                                                {task.title}
                                            </span>
                                        </div>
                                    ))}
                                    {activeInput === day ? (
                                        <input
                                            autoFocus
                                            className="w-full bg-white border-2 border-dark rounded-lg px-2 py-1 text-sm outline-none"
                                            onKeyDown={(e) => e.key === 'Enter' && addTask(day, e.target.value)}
                                            onBlur={() => setActiveInput(null)}
                                        />
                                    ) : (
                                        <button onClick={() => setActiveInput(day)} className="text-dark hover:scale-125 text-2xl font-bold transition-all">+</button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            </main>
        </div>
    );
};

export default PlannerPage;