import React, { useState, useEffect, useCallback, useMemo } from 'react';
import API from '../api/axiosConfig';

const PlannerPage = () => {
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeInput, setActiveInput] = useState(null);

    // Стан для календаря (за замовчуванням січень 2026 згідно з ТЗ)
    const [viewDate, setViewDate] = useState(new Date(2026, 0, 1));
    const [selectedDate, setSelectedDate] = useState(new Date());

    const userId = localStorage.getItem('userId');
    const userName = localStorage.getItem('username') || 'Artist';

    const fetchTasks = useCallback(async () => {
        if (!userId) return;
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
        if (!title || !userId) return;
        try {
            const res = await API.post('/tasks', {
                userId,
                title,
                day,
                category: day === 'Anytime' ? 'anytime' : 'weekly',
                date: new Date(viewDate.getFullYear(), viewDate.getMonth(), selectedDate.getDate())
            });
            setTasks(prev => [...prev, res.data]);
            setActiveInput(null);
        } catch (err) {
            alert("Не вдалося зберегти завдання. Перевірте з'єднання з сервером.");
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

    // --- ЛОГІКА КАЛЕНДАРЯ ---
    const calendarDays = useMemo(() => {
        const year = viewDate.getFullYear();
        const month = viewDate.getMonth();
        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const offset = firstDay === 0 ? 6 : firstDay - 1; // Понеділок - перший день

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

    if (loading) return <div className="min-h-screen bg-secondary flex items-center justify-center font-hand text-4xl">Loading...</div>;

    return (
        <div className="min-h-screen bg-secondary font-hand text-dark pb-10">
            {/* Header: Welcome зліва, Nav справа */}
            <header className="bg-primary pt-6 px-10 relative border-b-3 border-dark flex justify-between items-start">
                <div>
                    <h1 className="text-4xl italic font-bold text-deep mb-4">Welcome, {userName}</h1>
                    <div className="absolute left-0 right-0 bottom-0 overflow-hidden leading-none pointer-events-none">
                        <svg viewBox="0 0 1200 120" preserveAspectRatio="none" className="relative block w-full h-10 text-secondary fill-current">
                            <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V0H0V46.35c0,0,10.13,10.61,46,14.73C158,74.15,221,68.05,321.39,56.44Z"></path>
                        </svg>
                    </div>
                </div>
                <nav className="flex gap-10 text-2xl font-bold italic pt-2">
                    <button className="hover:opacity-60">Login</button>
                    <button className="border-b-4 border-accent">Planer</button>
                    <button className="hover:opacity-60">AI instructor</button>
                </nav>
            </header>

            <main className="max-w-7xl mx-auto p-6 space-y-10">
                {/* Progress & Daily Focus */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <section className="bg-accent/40 rounded-3xl p-8 border-3 border-dark shadow-md">
                        <div className="space-y-5">
                            {['Year', 'Month', 'Week', 'Day'].map((label) => (
                                <div key={label} className="flex items-center gap-4">
                                    <div className="flex-1 bg-primary h-7 rounded-lg overflow-hidden border-2 border-dark relative">
                                        <div className="bg-dark h-full transition-all duration-1000" style={{ width: `${calculateProgress(label)}%` }}></div>
                                    </div>
                                    <span className="w-28 text-right italic font-bold text-xl">{label} : {calculateProgress(label)}%</span>
                                </div>
                            ))}
                        </div>
                    </section>

                    <section className="bg-accent/50 rounded-3xl p-6 border-2 border-dark shadow-sm">
                        <h2 className="text-center text-2xl border-b border-dark mb-4 pb-1 italic font-bold">Daily</h2>
                        <div className="grid grid-cols-2 text-lg italic gap-x-10">
                            <ul className="space-y-1">
                                {tasks.filter(t => new Date(t.date).toDateString() === new Date().toDateString()).slice(0, 3).map(t => <li key={t._id}>• {t.title}</li>)}
                            </ul>
                            <ul className="space-y-1">
                                {tasks.filter(t => new Date(t.date).toDateString() === new Date().toDateString()).slice(3, 6).map(t => <li key={t._id}>• {t.title}</li>)}
                            </ul>
                        </div>
                    </section>
                </div>

                {/* Weekly Grid */}
                <section>
                    <h2 className="text-center text-3xl mb-6 font-bold italic opacity-70">Weekly</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday', 'Anytime'].map((day) => (
                            <div key={day} className="hand-drawn-card bg-primary/80 flex flex-col min-h-[160px] border-2 border-dark">
                                <div className="bg-secondary/50 text-center py-1 font-bold text-xl border-b-2 border-dark">{day}</div>
                                <div className="p-2 flex-1 space-y-1">
                                    {tasks.filter(t => t.day === day).map((task) => (
                                        <div key={task._id} className="flex items-center gap-2">
                                            <input type="checkbox" checked={task.isCompleted} onChange={() => toggleTask(task._id, task.isCompleted)} className="w-4 h-4 accent-dark cursor-pointer" />
                                            <span className={`text-sm italic ${task.isCompleted ? 'line-through opacity-50' : ''}`}>{task.title}</span>
                                        </div>
                                    ))}
                                    {activeInput === day ? (
                                        <input autoFocus className="w-full bg-white border border-dark rounded px-1 text-sm outline-none" onKeyDown={(e) => e.key === 'Enter' && addTask(day, e.target.value)} onBlur={() => setActiveInput(null)} />
                                    ) : (
                                        <button onClick={() => setActiveInput(day)} className="text-dark font-bold text-lg">+</button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Month Calendar (Згідно з image_c5ec39.png) */}
                <section className="bg-accent/30 rounded-3xl p-8 border-2 border-dark shadow-inner">
                    <h2 className="text-center text-3xl font-bold italic mb-6 opacity-70">Month</h2>
                    <div className="flex justify-between items-center mb-6 px-10">
                        <button onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1))} className="text-3xl hover:scale-110 transition-all cursor-pointer">«</button>
                        <div className="text-center">
                            <span className="bg-secondary px-6 py-1 rounded-lg font-bold text-xl border-2 border-dark mr-4 italic">
                                {viewDate.toLocaleString('default', { month: 'Long' })}
                            </span>
                            <span className="text-4xl font-bold italic">{viewDate.getFullYear()}</span>
                        </div>
                        <button onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1))} className="text-3xl hover:scale-110 transition-all cursor-pointer">»</button>
                    </div>

                    <div className="grid grid-cols-7 gap-2">
                        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(d => (
                            <div key={d} className="text-center font-bold text-xl mb-2 italic">{d}</div>
                        ))}
                        {calendarDays.map((date, i) => {
                            if (!date) return <div key={`empty-${i}`} className="aspect-square"></div>;
                            const isToday = date.toDateString() === new Date().toDateString();
                            const isSelected = date.toDateString() === selectedDate.toDateString();
                            return (
                                <div
                                    key={i}
                                    onClick={() => setSelectedDate(date)}
                                    className={`aspect-square p-2 rounded-lg flex items-center justify-center cursor-pointer transition-all border-2 font-bold text-xl
                                        ${isSelected ? 'bg-dark text-primary border-dark scale-105 shadow-md' : 'bg-primary border-dark/20 hover:border-dark'}
                                        ${isToday && !isSelected ? 'ring-4 ring-accent' : ''}
                                    `}
                                >
                                    {date.getDate()}
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