import React, { useState, useEffect, useCallback, useMemo } from 'react';
import API from '../api/axiosConfig';

const PlannerPage = () => {
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeInput, setActiveInput] = useState(null);

    // Стан для календаря (за замовчуванням 2026 рік)
    const [viewDate, setViewDate] = useState(new Date(2026, 0, 1));
    const [selectedDate, setSelectedDate] = useState(new Date());

    const userId = localStorage.getItem('userId');
    const userName = localStorage.getItem('username') || 'Artist';

    const fetchTasks = useCallback(async () => {
        if (!userId) {
            setLoading(false);
            return;
        }
        try {
            setLoading(true);
            const res = await API.get(`/tasks/${userId}`);
            setTasks(res.data);
        } catch (err) {
            console.error("Помилка завантаження тасок:", err);
        } finally {
            setLoading(false);
        }
    }, [userId]);

    useEffect(() => {
        fetchTasks();
    }, [fetchTasks]);

    const addTask = async (day, title) => {
        if (!title || !userId) {
            alert("Please login to save tasks.");
            return;
        }
        try {
            const res = await API.post('/tasks', {
                userId,
                title,
                day,
                category: day === 'Anytime' ? 'anytime' : 'weekly',
                // Прив'язуємо таску до обраної дати в календарі або поточної
                date: new Date(viewDate.getFullYear(), viewDate.getMonth(), selectedDate.getDate())
            });
            setTasks(prev => [...prev, res.data]);
            setActiveInput(null);
        } catch (err) {
            alert("Не вдалося зберегти завдання. Перевірте базу даних.");
        }
    };

    const toggleTask = async (taskId, isCompleted) => {
        try {
            await API.patch(`/tasks/${taskId}`, { isCompleted: !isCompleted });
            setTasks(prev => prev.map(t => t._id === taskId ? { ...t, isCompleted: !isCompleted } : t));
        } catch (err) {
            console.error("Помилка оновлення статусу");
        }
    };

    // --- ЛОГІКА КАЛЕНДАРЯ ---
    const calendarDays = useMemo(() => {
        const year = viewDate.getFullYear();
        const month = viewDate.getMonth();
        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const offset = firstDay === 0 ? 6 : firstDay - 1; // Понеділок - початок тижня

        const days = [];
        for (let i = 0; i < offset; i++) days.push(null);
        for (let i = 1; i <= daysInMonth; i++) days.push(new Date(year, month, i));
        return days;
    }, [viewDate]);

    const calculateProgress = (period) => {
        const now = new Date();
        const filtered = (() => {
            if (period === 'Year') return tasks.filter(t => new Date(t.date).getFullYear() === 2026);
            if (period === 'Month') return tasks.filter(t => new Date(t.date).getMonth() === now.getMonth());
            if (period === 'Week') return tasks.filter(t => t.category === 'weekly');
            return tasks.filter(t => new Date(t.date).toDateString() === now.toDateString());
        })();

        if (filtered.length === 0) return 0;
        return Math.round((filtered.filter(t => t.isCompleted).length / filtered.length) * 100);
    };

    if (loading) return (
        <div className="min-h-screen bg-secondary flex items-center justify-center font-hand text-4xl text-deep animate-pulse">
            Loading your plans...
        </div>
    );

    return (
        <div className="min-h-screen bg-secondary font-hand text-dark pb-20">
            {/* Header: Welcome ТІЛЬКИ зверху зліва */}
            <header className="bg-primary pt-8 pb-12 px-12 relative border-b-3 border-dark">
                <div className="flex justify-between items-start">
                    <h1 className="text-4xl italic font-bold text-deep leading-none">
                        Welcome, {userName}
                    </h1>
                    <nav className="flex gap-12 text-2xl font-bold italic">
                        <button className="hover:text-accent transition-colors">Login</button>
                        <button className="border-b-4 border-accent">Planer</button>
                        <button className="hover:text-accent transition-colors">AI instructor</button>
                    </nav>
                </div>
                {/* Хвиляста лінія знизу хедера */}
                <div className="absolute left-0 right-0 bottom-0 overflow-hidden leading-none h-10">
                    <svg viewBox="0 0 1200 120" preserveAspectRatio="none" className="relative block w-full h-full text-secondary fill-current">
                        <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V0H0V46.35c0,0,10.13,10.61,46,14.73C158,74.15,221,68.05,321.39,56.44Z"></path>
                    </svg>
                </div>
            </header>

            <main className="max-w-7xl mx-auto p-6 space-y-12">
                {/* Progress & Daily Focus */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                    <section className="bg-accent/40 rounded-3xl p-8 border-3 border-dark shadow-[6px_6px_0px_#2A0800]">
                        <div className="space-y-6">
                            {['Year', 'Month', 'Week', 'Day'].map((label) => (
                                <div key={label} className="flex items-center gap-6">
                                    <div className="flex-1 bg-primary h-8 rounded-xl overflow-hidden border-2 border-dark relative shadow-inner">
                                        <div className="bg-dark h-full transition-all duration-1000" style={{ width: `${calculateProgress(label)}%` }}></div>
                                    </div>
                                    <span className="w-32 text-right italic font-bold text-2xl">{label} : {calculateProgress(label)}%</span>
                                </div>
                            ))}
                        </div>
                    </section>

                    <section className="bg-accent/50 rounded-3xl p-6 border-2 border-dark shadow-md flex flex-col items-center">
                        <h2 className="text-2xl border-b-2 border-dark mb-4 px-10 italic font-bold">Daily</h2>
                        <div className="grid grid-cols-2 text-xl italic gap-x-12 w-full px-4">
                            <ul className="space-y-2">
                                {tasks.filter(t => new Date(t.date).toDateString() === new Date().toDateString()).slice(0, 3).map(t => <li key={t._id}>• {t.title}</li>)}
                            </ul>
                            <ul className="space-y-2">
                                {tasks.filter(t => new Date(t.date).toDateString() === new Date().toDateString()).slice(3, 6).map(t => <li key={t._id}>• {t.title}</li>)}
                            </ul>
                        </div>
                    </section>
                </div>

                {/* Weekly Grid */}
                <section>
                    <h2 className="text-center text-3xl mb-8 font-bold italic opacity-80 uppercase tracking-widest">Weekly</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday', 'Anytime'].map((day) => (
                            <div key={day} className="hand-drawn-card bg-primary/90 flex flex-col min-h-[180px] border-2 border-dark rounded-xl shadow-lg">
                                <div className="bg-secondary/40 text-center py-2 font-bold text-2xl italic border-b-2 border-dark">{day}</div>
                                <div className="p-3 flex-1 space-y-2">
                                    {tasks.filter(t => t.day === day).map((task) => (
                                        <div key={task._id} className="flex items-center gap-2">
                                            <input type="checkbox" checked={task.isCompleted} onChange={() => toggleTask(task._id, task.isCompleted)} className="w-5 h-5 accent-dark cursor-pointer" />
                                            <span className={`text-sm italic font-medium ${task.isCompleted ? 'line-through opacity-40' : ''}`}>{task.title}</span>
                                        </div>
                                    ))}
                                    {activeInput === day ? (
                                        <input autoFocus className="w-full bg-white border border-dark rounded px-2 py-1 text-sm outline-none" onKeyDown={(e) => e.key === 'Enter' && addTask(day, e.target.value)} onBlur={() => setActiveInput(null)} />
                                    ) : (
                                        <button onClick={() => setActiveInput(day)} className="text-dark font-bold text-2xl hover:scale-110 transition-transform">+</button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Month Calendar (image_c5ec39.png) */}
                <section className="bg-accent/30 rounded-[3rem] p-10 border-3 border-dark shadow-inner">
                    <h2 className="text-center text-4xl font-bold italic mb-8 opacity-90">Month</h2>
                    <div className="flex justify-between items-center mb-10 px-12">
                        <button onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1))} className="text-4xl hover:scale-125 transition-all cursor-pointer">«</button>
                        <div className="flex items-center gap-6">
                            <span className="bg-secondary/60 px-10 py-2 rounded-2xl font-bold text-3xl border-3 border-dark italic">
                                {viewDate.toLocaleString('en-US', { month: 'long' })}
                            </span>
                            <span className="text-5xl font-bold italic text-deep">{viewDate.getFullYear()}</span>
                        </div>
                        <button onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1))} className="text-4xl hover:scale-125 transition-all cursor-pointer">»</button>
                    </div>

                    <div className="grid grid-cols-7 gap-4">
                        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(d => (
                            <div key={d} className="text-center font-bold text-2xl italic mb-4">{d}</div>
                        ))}
                        {calendarDays.map((date, i) => {
                            if (!date) return <div key={`empty-${i}`} className="aspect-square opacity-20 bg-dark/5 rounded-2xl"></div>;
                            const isToday = date.toDateString() === new Date().toDateString();
                            const isSelected = date.toDateString() === selectedDate.toDateString();
                            return (
                                <div
                                    key={i}
                                    onClick={() => setSelectedDate(date)}
                                    className={`aspect-square p-4 rounded-2xl flex items-start justify-start cursor-pointer transition-all border-2 font-bold text-2xl relative shadow-sm
                                        ${isSelected ? 'bg-dark text-primary border-dark scale-105 z-10 shadow-2xl' : 'bg-primary border-dark/30 hover:border-dark hover:bg-primary/50'}
                                        ${isToday && !isSelected ? 'ring-4 ring-accent' : ''}
                                    `}
                                >
                                    {date.getDate()}
                                    {/* Індикатор наявності тасок на день */}
                                    {tasks.some(t => new Date(t.date).toDateString() === date.toDateString()) && (
                                        <div className={`absolute bottom-2 right-2 w-3 h-3 rounded-full ${isSelected ? 'bg-primary' : 'bg-dark/40'}`}></div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </section>
            </main>
        </div>
    );
};

export default PlannerPage;