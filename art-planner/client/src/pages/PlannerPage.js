import React, { useState, useEffect } from 'react';
import axios from 'axios';

const PlannerPage = () => {
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const userId = localStorage.getItem('userId');

    useEffect(() => {
        fetchTasks();
    }, []);

    const fetchTasks = async () => {
        try {
            const res = await axios.get(`http://localhost:5000/api/tasks/${userId}`);
            setTasks(res.data);
            setLoading(false);
        } catch (err) {
            console.error("Error fetching tasks", err);
        }
    };

    const toggleTask = async (id, currentStatus) => {
        try {
            await axios.patch(`http://localhost:5000/api/tasks/${id}`, {
                isCompleted: !currentStatus,
                userId // Обов'язково передаємо userId
            });
            fetchTasks();
        } catch (err) {
            console.error("Error updating task", err);
        }
    };

    const calculateProgress = (category) => {
        const filtered = tasks.filter(t => t.category === category);
        if (filtered.length === 0) return 0;
        const completed = filtered.filter(t => t.isCompleted).length;
        return Math.round((completed / filtered.length) * 100);
    };

    const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday', 'Anytime'];

    return (
        <div className="p-6 max-w-6xl mx-auto">
            {/* Секція прогрес-барів */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10 hand-drawn-card p-6">
                <div>
                    {['year', 'month', 'week', 'day'].map(cat => (
                        <div key={cat} className="mb-4">
                            <div className="flex justify-between font-bold capitalize mb-1">
                                <span>{cat}: {calculateProgress(cat)}%</span>
                            </div>
                            <div className="progress-bar-container">
                                <div
                                    className="progress-bar-fill"
                                    style={{ width: `${calculateProgress(cat)}%` }}
                                ></div>
                            </div>
                        </div>
                    ))}
                </div>
                <div className="flex flex-col justify-center items-center italic text-lg">
                    <p>"Art is not what you see, but what you make others see."</p>
                    <p className="mt-4 font-bold text-[--color-deep]">Daily Tasks Tracker</p>
                </div>
            </div>

            {/* Тижнева сітка */}
            <h2 className="text-center text-2xl font-bold mb-6 underline decoration-wavy">Weekly</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-10">
                {daysOfWeek.map(day => (
                    <div key={day} className="hand-drawn-card p-4 min-h-[150px]">
                        <h3 className="text-center font-bold border-b-2 border-[--color-dark] mb-2">{day}</h3>
                        <ul className="text-sm">
                            {tasks.filter(t => t.day === day).map(task => (
                                <li key={task._id} className="flex items-center gap-2 mb-1">
                                    <input
                                        type="checkbox"
                                        checked={task.isCompleted}
                                        onChange={() => toggleTask(task._id, task.isCompleted)}
                                        className="accent-[--color-dark]"
                                    />
                                    <span className={task.isCompleted ? "line-through opacity-50" : ""}>{task.text}</span>
                                </li>
                            ))}
                        </ul>
                        <button className="text-xs mt-2 opacity-60 hover:opacity-100">+ Add Task</button>
                    </div>
                ))}
            </div>

            {/* Місячний календар (спрощений вигляд) */}
            <h2 className="text-center text-2xl font-bold mb-6 underline decoration-wavy">Month</h2>
            <div className="hand-drawn-card p-6 overflow-x-auto">
                <div className="grid grid-cols-7 gap-2 min-w-[600px]">
                    {Array.from({ length: 31 }, (_, i) => (
                        <div key={i} className="aspect-square border border-[--color-dark] bg-[--color-accent]/20 p-1 text-xs font-bold relative hover:bg-[--color-secondary] transition-colors">
                            {i + 1}
                            {/* Тут можна відображати крапки виконаних завдань */}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default PlannerPage;