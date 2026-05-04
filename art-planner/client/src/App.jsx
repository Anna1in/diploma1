import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom';
import AuthPage from './pages/AuthPage.jsx';
import PlannerPage from './pages/PlannerPage.jsx';
import GalleryPage from './pages/GalleryPage.jsx';
import AIDetailView from './pages/AIDetailView.jsx';
import './App.css';

function App() {
    // Використовуємо стан, щоб React реагував на вхід/вихід
    const [token, setToken] = useState(localStorage.getItem('token'));
    const userName = localStorage.getItem('username') || 'Artist';

    // Функція для оновлення стану після логіну
    const updateAuth = () => {
        setToken(localStorage.getItem('token'));
    };

    const handleExit = () => {
        localStorage.clear(); //
        setToken(null);
        window.location.href = '/login';
    };

    return (
        <Router>
            <div className="min-h-screen flex flex-col bg-primary">
                {/* Показуємо хедер ТІЛЬКИ якщо користувач авторизований (щоб не було дублів з AuthPage) */}
                {token && (
                    <header className="p-4 border-b-2 border-dark flex justify-between items-center bg-secondary/30">
                        <h1 className="text-xl font-bold italic text-deep">Welcome, {userName}</h1>
                        <nav className="flex gap-6 font-bold">
                            <Link to="/planner" className="text-deep hover:underline">Planer</Link>
                            <Link to="/gallery" className="text-deep hover:underline">AI instructor</Link>
                            <button onClick={handleExit} className="text-dark cursor-pointer font-bold">Exit</button>
                        </nav>
                    </header>
                )}

                <main className="flex-grow p-4">
                    <Routes>
                        {/* Передаємо функцію оновлення в AuthPage */}
                        <Route path="/login" element={<AuthPage onLogin={updateAuth} />} />

                        {/* Захищені маршрути: тепер вони бачать актуальний стан token */}
                        <Route path="/planner" element={token ? <PlannerPage /> : <Navigate to="/login" />} />
                        <Route path="/gallery" element={token ? <GalleryPage /> : <Navigate to="/login" />} />
                        <Route path="/ai-instructor/:id" element={token ? <AIDetailView /> : <Navigate to="/login" />} />

                        <Route path="/" element={<Navigate to={token ? "/planner" : "/login"} />} />
                    </Routes>
                </main>
            </div>
        </Router>
    );
}

export default App;