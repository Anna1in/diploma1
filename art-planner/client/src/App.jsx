import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom';
import AuthPage from './pages/AuthPage.jsx';
import PlannerPage from './pages/PlannerPage.jsx';
import GalleryPage from './pages/GalleryPage.jsx';
import AIDetailView from './pages/AIDetailView.jsx';
import './App.css';

function App() {
    const isAuthenticated = !!localStorage.getItem('token');
    const userName = localStorage.getItem('username') || 'Artist';

    const handleExit = () => {
        localStorage.clear(); // Очищення localStorage при виході
        window.location.href = '/login'; // Редирект на логін
    };

    return (
        <Router>
            <div className="min-h-screen flex flex-col bg-[--color-primary]">
                <header className="p-4 border-b-2 border-[--color-dark] flex justify-between items-center bg-[--color-secondary]/30">
                    <h1 className="text-xl font-bold italic text-[--color-deep]">Welcome, {userName}</h1>
                    <nav className="flex gap-6 font-bold">
                        <Link to="/planner" className="text-[--color-deep] hover:underline">Planer</Link>
                        <Link to="/gallery" className="text-[--color-deep] hover:underline">AI instructor</Link>
                        {isAuthenticated ? (
                            <button onClick={handleExit} className="text-[--color-dark] cursor-pointer font-bold">Exit</button>
                        ) : (
                            <Link to="/login" className="text-[--color-deep] hover:underline">Login</Link>
                        )}
                    </nav>
                </header>

                <main className="flex-grow p-4">
                    <Routes>
                        <Route path="/login" element={<AuthPage />} />
                        <Route path="/planner" element={isAuthenticated ? <PlannerPage /> : <Navigate to="/login" />} />
                        <Route path="/gallery" element={isAuthenticated ? <GalleryPage /> : <Navigate to="/login" />} />
                        <Route path="/ai-instructor/:id" element={isAuthenticated ? <AIDetailView /> : <Navigate to="/login" />} />
                        <Route path="/" element={<Navigate to="/planner" />} />
                    </Routes>
                </main>
            </div>
        </Router>
    );
}

export default App;