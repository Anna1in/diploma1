import React, { useState, useEffect, useCallback, useMemo } from 'react';
import API from '../api/axiosConfig';

const PlannerPage = () => {
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeInput, setActiveInput] = useState(null);

    // Стан для календаря (2026 рік згідно з ТЗ)
    const [viewDate, setViewDate] = useState(new Date(2026, 0, 1));
    const [selectedDate, setSelectedDate] = useState(new Date());

    const userId = localStorage.getItem('userId');
    //const userName = localStorage.getItem('username') || 'Artist';

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

    // --- ДОПОМІЖНІ ФУНКЦІЇ ДЛЯ ДАТ ---

    // Отримуємо початок тижня (понеділок) для обраної дати
    const getStartOfWeek = (date) => {
        const d = new Date(date);
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1);
        return new Date(d.setDate(diff));
    };

    // Отримуємо дату конкретного дня тижня для обраного тижня
    const getDateForWeekday = (startOfWeek, index) => {
        const d = new Date(startOfWeek);
        d.setDate(d.getDate() + index);
        return d;
    };

    const addTask = async (dayIndex, title, dayName) => {
        if (!title || !userId) return;

        // Розраховуємо точну дату для таски на основі обраного тижня
        const startOfWeek = getStartOfWeek(selectedDate);
        const taskDate = dayName === 'Anytime' ? selectedDate : getDateForWeekday(startOfWeek, dayIndex);

        try {
            const res = await API.post('/tasks', {
                userId,
                title,
                day: dayName,
                category: dayName === 'Anytime' ? 'anytime' : 'week',
                date: taskDate
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
            setTasks(prev => prev.map(t => t._id === taskId ? { ...t, isCompleted: !isCompleted } : t));
        } catch (err) {
            console.error("Помилка оновлення");
        }
    };

    // --- РОЗРАХУНОК ПРОГРЕСУ ---
    const calculateProgress = (period) => {
        const filtered = (() => {
            if (period === 'Year') return tasks.filter(t => new Date(t.date).getFullYear() === 2026);
            if (period === 'Month') return tasks.filter(t => new Date(t.date).getMonth() === viewDate.getMonth());
            if (period === 'Week') {
                const start = getStartOfWeek(selectedDate);
                const end = new Date(start);
                end.setDate(end.getDate() + 6);
                return tasks.filter(t => {
                    const d = new Date(t.date);
                    return d >= start && d <= end && t.category === 'week';
                });
            }
            // Day (тільки для обраної дати)
            return tasks.filter(t => new Date(t.date).toDateString() === selectedDate.toDateString());
        })();

        if (filtered.length === 0) return 0;
        return Math.round((filtered.filter(t => t.isCompleted).length / filtered.length) * 100);
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

    if (loading) return <div className="min-h-screen bg-secondary flex items-center justify-center font-hand text-4xl">Loading...</div>;

    const daysOfWeekNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday', 'Anytime'];
    const startOfCurrentWeek = getStartOfWeek(selectedDate);

    return (
        <div className="bg-secondary p-8 font-hand text-dark space-y-12">

            {/* 1. Progress & Daily Focus */}
            <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-10">
                <section className="bg-accent/40 rounded-3xl p-8 border-3 border-dark shadow-[6px_6px_0px_#2A0800]">
                    <div className="space-y-6">
                        {['Year', 'Month', 'Week', 'Day'].map((label) => (
                            <div key={label} className="flex items-center justify-between gap-6">
                                <div className="flex-1 bg-primary h-8 rounded-xl border-2 border-dark overflow-hidden relative shadow-inner">
                                    <div className="bg-dark h-full transition-all duration-1000" style={{ width: `${calculateProgress(label)}%` }}></div>
                                </div>
                                {/* ВИПРАВЛЕНО: Відступ прибрано за допомогою фіксованої ширини та flex-shrink-0 */}
                                <span className="w-32 text-right italic font-bold text-2xl flex-shrink-0">{label} : {calculateProgress(label)}%</span>
                            </div>
                        ))}
                    </div>
                </section>

                <section className="bg-accent/50 rounded-3xl p-6 border-2 border-dark shadow-md flex flex-col items-center">
                    <h2 className="text-3xl border-b-2 border-dark mb-6 px-12 italic font-bold">Daily</h2>
                    <div className="w-full text-xl italic px-4 space-y-2">
                        {/* Фільтрація тільки за обраною датою selectedDate */}
                        {tasks.filter(t => new Date(t.date).toDateString() === selectedDate.toDateString()).length > 0 ? (
                            tasks.filter(t => new Date(t.date).toDateString() === selectedDate.toDateString()).map(t => (
                                <div key={t._id}>• {t.title}</div>
                            ))
                        ) : (
                            <div className="opacity-50 text-center">No tasks for this day</div>
                        )}
                    </div>
                </section>
            </div>

            {/* 2. Weekly Grid (Синхронізовано з обраним тижнем) */}
            <section className="max-w-7xl mx-auto">
                <h2 className="text-center text-4xl mb-8 font-bold italic uppercase tracking-widest opacity-80">Weekly</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {daysOfWeekNames.map((dayName, idx) => {
                        const currentDayDate = dayName === 'Anytime' ? null : getDateForWeekday(startOfCurrentWeek, idx);
                        return (
                            <div key={dayName} className="hand-drawn-card bg-primary min-h-[180px] border-2 border-dark rounded-xl flex flex-col shadow-lg">
                                <div className="bg-secondary/40 text-center py-2 font-bold text-2xl italic border-b-2 border-dark">{dayName}</div>
                                <div className="p-3 space-y-2 flex-1">
                                    {tasks.filter(t => {
                                        if (dayName === 'Anytime') return t.day === 'Anytime';
                                        return new Date(t.date).toDateString() === currentDayDate?.toDateString();
                                    }).map((task) => (
                                        <div key={task._id} className="flex items-center gap-2 text-sm italic">
                                            <input type="checkbox" checked={task.isCompleted} onChange={() => toggleTask(task._id, task.isCompleted)} className="w-4 h-4 accent-dark" />
                                            <span className={task.isCompleted ? 'line-through opacity-40' : ''}>{task.title}</span>
                                        </div>
                                    ))}
                                    {activeInput === dayName ? (
                                        <input autoFocus className="w-full bg-white border border-dark rounded px-2" onKeyDown={(e) => e.key === 'Enter' && addTask(idx, e.target.value, dayName)} onBlur={() => setActiveInput(null)} />
                                    ) : (
                                        <button onClick={() => setActiveInput(dayName)} className="text-dark font-bold text-2xl">+</button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </section>

            {/* 3. Monthly Calendar (з виділенням тижня) */}
            <section className="max-w-7xl mx-auto bg-accent/30 rounded-[3rem] p-10 border-3 border-dark shadow-inner">
                <div className="flex justify-between items-center mb-10 px-12">
                    <button onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1))} className="text-4xl">«</button>
                    <div className="flex items-center gap-6">
                        <span className="bg-secondary/60 px-10 py-2 rounded-2xl font-bold text-3xl border-3 border-dark italic">
                            {viewDate.toLocaleString('en-US', { month: 'long' })}
                        </span>
                        <span className="text-5xl font-bold italic text-deep">2026</span>
                    </div>
                    <button onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1))} className="text-4xl">»</button>
                </div>

                <div className="grid grid-cols-7 gap-4">
                    {['Mon', 'Tue', 'Wed', 'Th', 'Fri', 'Sat', 'Sun'].map(d => (
                        <div key={d} className="text-center font-bold text-2xl italic mb-4">{d}</div>
                    ))}
                    {calendarDays.map((date, i) => {
                        if (!date) return <div key={`empty-${i}`} className="aspect-square opacity-10 bg-dark rounded-2xl"></div>;

                        const isSelected = date.toDateString() === selectedDate.toDateString();

                        // ЛОГІКА ВИДІЛЕННЯ ТИЖНЯ:
                        const start = getStartOfWeek(selectedDate);
                        const end = new Date(start);
                        end.setDate(end.getDate() + 6);
                        const isInSelectedWeek = date >= start && date <= end;

                        return (
                            <div
                                key={i}
                                onClick={() => setSelectedDate(date)}
                                className={`aspect-square p-2 rounded-2xl flex items-start justify-start cursor-pointer border-2 font-bold text-2xl relative transition-all
                                    ${isSelected ? 'bg-dark text-primary border-primary ring-4 ring-accent z-10 scale-110 shadow-2xl' : 'bg-dark text-white border-dark/20 hover:opacity-80'}
                                    ${isInSelectedWeek && !isSelected ? 'ring-2 ring-primary bg-dark/90' : ''}
                                `}
                            >
                                {date.getDate()}
                                {tasks.some(t => new Date(t.date).toDateString() === date.toDateString()) && (
                                    <div className={`absolute bottom-2 right-2 w-2 h-2 rounded-full ${isSelected ? 'bg-primary' : 'bg-accent'}`}></div>
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