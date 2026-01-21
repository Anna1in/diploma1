import React, { useState, useEffect, useCallback, useMemo } from 'react';
import API from '../api/axiosConfig';

const PlannerPage = () => {
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeInput, setActiveInput] = useState(null);

    const [viewDate, setViewDate] = useState(new Date(2026, 0, 1));
    const [selectedDate, setSelectedDate] = useState(new Date());

    const userId = localStorage.getItem('userId');

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
            alert("Не вдалося зберегти завдання. Перевірте сервер.");
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

    const calendarDays = useMemo(() => {
        const year = viewDate.getFullYear();
        const month = viewDate.getMonth();
        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const offset = firstDay === 0 ? 6 : firstDay - 1;

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

    if (loading) return <div className="min-h-screen bg-secondary flex items-center justify-center text-4xl font-bold">Loading...</div>;

    return (
        <div className="bg-secondary p-8 space-y-12">
            {/* Секція прогресу та Daily */}
            <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-10">
                <section className="bg-accent/40 rounded-3xl p-8 border-3 border-dark shadow-[6px_6px_0px_#2A0800]">
                    <div className="space-y-6">
                        {['Year', 'Month', 'Week', 'Day'].map((label) => (
                            <div key={label} className="flex items-center gap-6">
                                <div className="flex-1 bg-primary h-8 rounded-xl border-2 border-dark overflow-hidden relative">
                                    <div className="bg-dark h-full transition-all duration-1000" style={{ width: `${calculateProgress(label)}%` }}></div>
                                </div>
                                <span className="w-32 text-right italic font-bold text-2xl">{label} : {calculateProgress(label)}%</span>
                            </div>
                        ))}
                    </div>
                </section>

                <section className="bg-accent/50 rounded-3xl p-6 border-2 border-dark shadow-md">
                    <h2 className="text-center text-2xl border-b-2 border-dark mb-4 italic font-bold">Daily</h2>
                    <div className="grid grid-cols-2 text-xl italic gap-x-8">
                        <ul className="space-y-1">{tasks.filter(t => new Date(t.date).toDateString() === new Date().toDateString()).slice(0, 3).map(t => <li key={t._id}>• {t.title}</li>)}</ul>
                        <ul className="space-y-1">{tasks.filter(t => new Date(t.date).toDateString() === new Date().toDateString()).slice(3, 6).map(t => <li key={t._id}>• {t.title}</li>)}</ul>
                    </div>
                </section>
            </div>

            {/* Weekly Grid */}
            <section className="max-w-7xl mx-auto">
                <h2 className="text-center text-3xl mb-8 font-bold italic opacity-70 uppercase tracking-widest">Weekly</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday', 'Anytime'].map((day) => (
                        <div key={day} className="hand-drawn-card bg-primary/90 min-h-[160px] border-2 border-dark rounded-xl flex flex-col">
                            <div className="bg-secondary/40 text-center py-2 font-bold text-2xl italic border-b-2 border-dark">{day}</div>
                            <div className="p-3 space-y-2 flex-1">
                                {tasks.filter(t => t.day === day).map((task) => (
                                    <div key={task._id} className="flex items-center gap-2 text-sm italic">
                                        <input type="checkbox" checked={task.isCompleted} onChange={() => toggleTask(task._id, task.isCompleted)} className="w-4 h-4 accent-dark" />
                                        <span className={task.isCompleted ? 'line-through opacity-40' : ''}>{task.title}</span>
                                    </div>
                                ))}
                                {activeInput === day ? (
                                    <input autoFocus className="w-full bg-white border border-dark rounded px-2" onKeyDown={(e) => e.key === 'Enter' && addTask(day, e.target.value)} onBlur={() => setActiveInput(null)} />
                                ) : (
                                    <button onClick={() => setActiveInput(day)} className="text-dark font-bold text-2xl hover:scale-110">+</button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* Month Calendar (Дизайн image_c5ec39.png) */}
            <section className="max-w-7xl mx-auto bg-accent/30 rounded-[3rem] p-10 border-3 border-dark shadow-inner">
                <h2 className="text-center text-4xl font-bold italic mb-10 opacity-90">Month</h2>
                <div className="flex justify-between items-center mb-10 px-12">
                    <button onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1))} className="text-4xl hover:scale-125 transition-all">«</button>
                    <div className="flex items-center gap-6">
                        <span className="bg-secondary/60 px-10 py-2 rounded-2xl font-bold text-3xl border-3 border-dark italic">
                            {/* ВИПРАВЛЕНО: 'long' замість 'Long' для усунення RangeError */}
                            {viewDate.toLocaleString('en-US', { month: 'long' })}
                        </span>
                        <span className="text-5xl font-bold italic text-deep">{viewDate.getFullYear()}</span>
                    </div>
                    <button onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1))} className="text-4xl hover:scale-125 transition-all">»</button>
                </div>

                <div className="grid grid-cols-7 gap-4">
                    {['Mon', 'Tue', 'Wed', 'Th', 'Fri', 'Sat', 'Sun'].map(d => (
                        <div key={d} className="text-center font-bold text-2xl italic mb-4">{d}</div>
                    ))}
                    {calendarDays.map((date, i) => {
                        if (!date) return <div key={`empty-${i}`} className="aspect-square opacity-20 bg-dark/5 rounded-2xl"></div>;
                        const isSelected = date.toDateString() === selectedDate.toDateString();
                        const isToday = date.toDateString() === new Date().toDateString();
                        return (
                            <div
                                key={i}
                                onClick={() => setSelectedDate(date)}
                                className={`aspect-square p-2 rounded-2xl flex items-start justify-start cursor-pointer transition-all border-2 font-bold text-2xl relative
                                    ${isSelected ? 'border-primary ring-3 ring-accent bg-dark text-primary' : 'bg-dark text-white border-dark/20 hover:opacity-80'}
                                    ${isToday && !isSelected ? 'ring-4 ring-accent' : ''}
                                `}
                            >
                                {date.getDate()}
                                {tasks.some(t => new Date(t.date).toDateString() === date.toDateString()) && (
                                    <div className={`absolute bottom-2 right-2 w-3 h-3 rounded-full ${isSelected ? 'bg-primary' : 'bg-accent'}`}></div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </section>
        </div>
    );
};

export default PlannerPage;