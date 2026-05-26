import React, { useState, useEffect, useCallback, useMemo } from 'react';
import API from '../api/axiosConfig';

const PlannerPage = () => {
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeInput, setActiveInput] = useState(null);

    // НОВЕ: id задачі, яку підтверджуємо для видалення
    const [confirmDeleteId, setConfirmDeleteId] = useState(null);

    const today = useMemo(() => new Date(), []);
    const [selectedDate, setSelectedDate] = useState(today);
    const [viewDate, setViewDate] = useState(today);

    const userId = localStorage.getItem('userId');

    const fetchTasks = useCallback(async () => {
        if (!userId) return;
        try {
            setLoading(true);
            const res = await API.get(`/tasks/${userId}`);
            setTasks(res.data);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    }, [userId]);

    useEffect(() => { fetchTasks(); }, [fetchTasks]);

    const getStartOfWeek = (date) => {
        const d = new Date(date);
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1);
        return new Date(d.setDate(diff));
    };

    const getDateForWeekday = (startOfWeek, index) => {
        const d = new Date(startOfWeek);
        d.setHours(0, 0, 0, 0);
        d.setDate(d.getDate() + index);
        return d;
    };

    const addTask = async (dayIndex, title, dayName) => {
        if (!title || !userId) return;
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
        } catch (err) { alert("Не вдалося зберегти завдання"); }
    };

    const toggleTask = async (taskId, isCompleted) => {
        try {
            await API.patch(`/tasks/${taskId}`, { isCompleted: !isCompleted });
            setTasks(prev => prev.map(t =>
                t._id === taskId ? { ...t, isCompleted: !isCompleted } : t
            ));
        } catch (err) { console.error(err); }
    };

    // +++ НОВЕ: видалення з БД + оновлення стейту
    const deleteTask = async () => {
        if (!confirmDeleteId) return;
        try {
            await API.delete(`/tasks/${confirmDeleteId}`);
            setTasks(prev => prev.filter(t => t._id !== confirmDeleteId));
        } catch (err) {
            console.error(err);
            alert("Не вдалося видалити завдання");
        } finally {
            setConfirmDeleteId(null);
        }
    };

    const calculateProgress = (period) => {
        const filtered = (() => {
            if (period === 'Year')  return tasks.filter(t => new Date(t.date).getFullYear() === viewDate.getFullYear());
            if (period === 'Month') return tasks.filter(t => new Date(t.date).getMonth() === viewDate.getMonth());
            if (period === 'Week') {
                const start = getStartOfWeek(selectedDate);
                const end = new Date(start);
                end.setDate(end.getDate() + 6);
                end.setHours(23, 59, 59, 999);
                return tasks.filter(t => {
                    const d = new Date(t.date);
                    return d >= start && d <= end;
                });
            }
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

    const daysOfWeekNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday', 'Anytime'];
    const startOfSelectedWeek = getStartOfWeek(selectedDate);

    if (loading) return <div className="p-20 text-center font-hand text-4xl">Loading...</div>;

    return (
        <div className="bg-secondary p-8 font-hand text-dark space-y-12 min-h-screen">
            <main className="max-w-7xl mx-auto space-y-12">

                {/* 1. Progress & Daily */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                    <section className="bg-accent/40 rounded-3xl p-8 border-3 border-dark shadow-[6px_6px_0px_#2A0800]">
                        <div className="space-y-6">
                            {['Year', 'Month', 'Week', 'Day'].map((label) => (
                                <div key={label} className="flex items-center gap-6">
                                    <div className="flex-1 bg-primary h-8 rounded-xl border-2 border-dark overflow-hidden relative shadow-inner">
                                        <div className="bg-dark h-full transition-all duration-1000" style={{ width: `${calculateProgress(label)}%` }}></div>
                                    </div>
                                    <span className="w-44 text-right italic font-bold text-2xl flex-shrink-0 whitespace-nowrap">
                                        {label} : {calculateProgress(label)}%
                                    </span>
                                </div>
                            ))}
                        </div>
                    </section>

                    <section className="bg-accent/50 rounded-3xl p-8 border-2 border-dark shadow-md flex flex-col">
                        <h2 className="text-center text-3xl border-b-2 border-dark mb-6 italic font-bold">Daily</h2>
                        <div className="text-xl italic space-y-2 flex-1">
                            {tasks.filter(t => new Date(t.date).toDateString() === selectedDate.toDateString()).length > 0 ? (
                                tasks
                                    .filter(t => new Date(t.date).toDateString() === selectedDate.toDateString())
                                    .map(t => <div key={t._id}>• {t.title}</div>)
                            ) : (
                                <div className="opacity-40 text-center">No tasks for this day</div>
                            )}
                        </div>
                    </section>
                </div>

                {/* 2. Weekly Schedule */}
                <section>
                    <h2 className="text-center text-4xl mb-8 font-bold italic uppercase tracking-widest opacity-80">Weekly</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {daysOfWeekNames.map((dayName, idx) => {
                            const currentDayDate = dayName === 'Anytime'
                                ? null
                                : getDateForWeekday(startOfSelectedWeek, idx);

                            return (
                                <div key={dayName} className="hand-drawn-card bg-primary min-h-[180px] border-2 border-dark rounded-xl flex flex-col shadow-lg">
                                    <div className="bg-secondary/40 text-center py-2 font-bold text-2xl italic border-b-2 border-dark">
                                        {dayName}
                                    </div>
                                    <div className="p-3 space-y-2 flex-1">
                                        {tasks
                                            .filter(t => {
                                                if (dayName === 'Anytime') return t.day === 'Anytime';
                                                return new Date(t.date).toDateString() === currentDayDate?.toDateString();
                                            })
                                            .map((task) => (
                                                // +++ НОВЕ: group для показу кнопки видалення при hover
                                                <div key={task._id} className="group flex items-center gap-2 text-sm italic">
                                                    <input
                                                        type="checkbox"
                                                        checked={task.isCompleted}
                                                        onChange={() => toggleTask(task._id, task.isCompleted)}
                                                        className="w-5 h-5 accent-dark cursor-pointer rounded-sm flex-shrink-0"
                                                    />
                                                    <span className={`flex-1 ${task.isCompleted ? 'line-through opacity-40' : ''}`}>
                                                        {task.title}
                                                    </span>
                                                    {/* +++ НОВЕ: кнопка видалення */}
                                                    <button
                                                        onClick={() => setConfirmDeleteId(task._id)}
                                                        title="Видалити"
                                                        className="opacity-0 group-hover:opacity-100 transition-opacity
                                                                   text-red-400 hover:text-red-600 text-base leading-none
                                                                   flex-shrink-0 px-1"
                                                    >
                                                        ×
                                                    </button>
                                                </div>
                                            ))
                                        }
                                        {activeInput === dayName ? (
                                            <input
                                                autoFocus
                                                className="w-full bg-white border border-dark rounded px-2"
                                                onKeyDown={(e) => e.key === 'Enter' && addTask(idx, e.target.value, dayName)}
                                                onBlur={() => setActiveInput(null)}
                                            />
                                        ) : (
                                            <button
                                                onClick={() => setActiveInput(dayName)}
                                                className="text-dark font-bold text-2xl"
                                            >
                                                +
                                            </button>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </section>

                {/* 3. Monthly Calendar */}
                <section className="bg-accent/30 rounded-[3rem] p-10 border-3 border-dark shadow-inner">
                    <div className="flex justify-between items-center mb-10 px-12">
                        <button
                            onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1))}
                            className="text-4xl hover:scale-125 transition-all"
                        >«</button>

                        <div className="flex flex-col items-center gap-3">
                            <div className="relative flex items-center gap-6 cursor-pointer hover:opacity-80 transition-opacity group">
                                <span className="bg-secondary/60 px-10 py-2 rounded-2xl font-bold text-3xl border-3 border-dark italic">
                                    {viewDate.toLocaleString('en-US', { month: 'long' })}
                                </span>
                                <span className="text-5xl font-bold italic text-deep">
                                    {viewDate.getFullYear()}
                                </span>
                                <input
                                    type="date"
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                    onChange={(e) => {
                                        if (e.target.value) {
                                            const [year, month, day] = e.target.value.split('-');
                                            const pickedDate = new Date(year, month - 1, day);
                                            setSelectedDate(pickedDate);
                                            setViewDate(pickedDate);
                                        }
                                    }}
                                />
                            </div>
                            <button
                                onClick={() => {
                                    const now = new Date();
                                    setSelectedDate(now);
                                    setViewDate(now);
                                }}
                                className="bg-primary text-dark border-2 border-dark px-6 py-1 rounded-xl font-bold text-xl italic hover:bg-dark hover:text-primary transition-colors shadow-[2px_2px_0px_#2A0800]"
                            >
                                Today
                            </button>
                        </div>

                        <button
                            onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1))}
                            className="text-4xl hover:scale-125 transition-all"
                        >»</button>
                    </div>

                    <div className="grid grid-cols-7 gap-4">
                        {['Mon', 'Tue', 'Wed', 'Th', 'Fri', 'Sat', 'Sun'].map(d => (
                            <div key={d} className="text-center font-bold text-2xl italic mb-4">{d}</div>
                        ))}
                        {calendarDays.map((date, i) => {
                            if (!date) return <div key={`empty-${i}`} className="aspect-square opacity-10 bg-dark rounded-2xl"></div>;
                            const isSelected = date.toDateString() === selectedDate.toDateString();
                            const isToday = date.toDateString() === today.toDateString();
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
                                        ${isInSelectedWeek && !isSelected ? 'ring-2 ring-primary border-primary bg-dark/90' : ''}
                                    `}
                                >
                                    {date.getDate()}
                                    {isToday && (
                                        <div className="absolute bottom-2 right-2 w-2.5 h-2.5 rounded-full bg-primary border border-dark"></div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </section>
            </main>

            {/* +++ НОВЕ: Модальне вікно підтвердження видалення */}
            {confirmDeleteId && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-secondary border-3 border-dark rounded-3xl p-8 shadow-[8px_8px_0px_#2A0800] max-w-sm w-full font-hand">
                        <p className="text-2xl font-bold italic text-center mb-6">
                            Видалити це завдання?
                        </p>
                        <div className="flex gap-4">
                            <button
                                onClick={() => setConfirmDeleteId(null)}
                                className="flex-1 py-2 border-2 border-dark rounded-2xl font-bold text-xl italic
                                           hover:bg-dark hover:text-primary transition-colors"
                            >
                                Скасувати
                            </button>
                            <button
                                onClick={deleteTask}
                                className="flex-1 py-2 bg-dark text-primary border-2 border-dark rounded-2xl
                                           font-bold text-xl italic hover:opacity-80 transition-opacity"
                            >
                                Видалити
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PlannerPage;