import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom';
import AuthPage from './pages/AuthPage.jsx';
import PlannerPage from './pages/PlannerPage.jsx';
import GalleryPage from './pages/GalleryPage.jsx';
import AIDetailView from './pages/AIDetailView.jsx';
import Toast from './components/Toast.jsx';
import './App.css';

function App() {
    const [token, setToken] = useState(localStorage.getItem('token'));
    const [userName, setUserName] = useState(localStorage.getItem('username') || 'Artist');
    const [toast, setToast] = useState(null);

    const showToast = (message, type = 'success') => {
        setToast({ message, type });
    };

    const updateAuth = () => {
        setToken(localStorage.getItem('token'));
        setUserName(localStorage.getItem('username') || 'Artist');
    };

    const handleExit = () => {
        localStorage.clear();
        setToken(null);
        setUserName('Artist');
        window.location.href = '/login';
    };

    return (
        <Router>
            {toast && (
                <Toast
                    message={toast.message}
                    type={toast.type}
                    onClose={() => setToast(null)}
                />
            )}

            <div className="min-h-screen flex flex-col bg-primary">
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
                        <Route
                            path="/login"
                            element={
                                <AuthPage
                                    onLogin={updateAuth}
                                    showToast={showToast}
                                />
                            }
                        />
                        <Route
                            path="/planner"
                            element={token
                                ? <PlannerPage showToast={showToast} />
                                : <Navigate to="/login" />}
                        />
                        <Route
                            path="/gallery"
                            element={token
                                ? <GalleryPage showToast={showToast} />
                                : <Navigate to="/login" />}
                        />
                        <Route
                            path="/ai-instructor/:id"
                            element={token
                                ? <AIDetailView showToast={showToast} />
                                : <Navigate to="/login" />}
                        />
                        <Route
                            path="/"
                            element={<Navigate to={token ? "/planner" : "/login"} />}
                        />
                    </Routes>
                </main>
            </div>
        </Router>
    );
}

export default App;