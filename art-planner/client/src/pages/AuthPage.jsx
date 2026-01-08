import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom';
import AuthPage from 'AuthPage.jsx';
import PlannerPage from 'PlannerPage.jsx';
import GalleryPage from 'GalleryPage.jsx';
import AIDetailView from 'AIDetailView.jsx';
import './App.css';

function App() {
    const isAuthenticated = !!localStorage.getItem('token');
    const userName = localStorage.getItem('username') || 'Artist';

    const handleExit = () => {
        localStorage.clear(); // Очищення localStorage
        window.location.href = '/login'; // Редирект на логін
    };

    return (
        <Router>
            <div className="min-h-screen flex flex-col">
                {/* Навігація (Header) */}
                <header className="bg-[--color-primary] p-4 border-b-2 border-[--color-dark] flex justify-between items-center">
                    <h1 className="text-xl font-bold italic">Welcome, {userName}</h1>
                    <nav className="flex gap-6 font-bold">
                        <Link color="--color-deep" to="/planner">Planer</Link>
                        <Link color="--color-deep" to="/gallery">Gallery</Link>
                        {isAuthenticated ? (
                            <button onClick={handleExit} className="cursor-pointer text-[--color-dark] hover:underline">Exit</button>
                        ) : (
                            <Link to="/login">Login</Link>
                        )}
                    </nav>
                </header>

                {/* Контент сторінок */}
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