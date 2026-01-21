import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api/axiosConfig';


const AuthPage = ({ onLogin }) => {
    const [isSignUp, setIsSignUp] = useState(true);
    const [formData, setFormData] = useState({ username: '', email: '', password: '' });
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleAuth = async (e) => {
        e.preventDefault();
        setError('');

        try {
            const endpoint = isSignUp ? '/register' : '/login';
            const response = await API.post(endpoint, formData);

            if (!isSignUp || endpoint === '/login') {
                // Зберігаємо userId для ШІ-інструктора та розрахунку прогресу
                localStorage.setItem('token', response.data.token);
                localStorage.setItem('userId', response.data.userId);
                localStorage.setItem('username', response.data.username);
                if (onLogin) {
                    onLogin();
                }
                navigate('/planner');
            } else {
                setIsSignUp(false);
                alert('Реєстрація успішна! Тепер увійдіть у свій акаунт.');
            }
        } catch (err) {
            // Обробка помилки 500 (сервер) або 401 (пароль)
            const message = err.response?.data?.message || err.message || "Помилка з'єднання з сервером";
            setError(message);
            alert("Auth error: " + message);
        }
    };

    return (
        <div className="min-h-screen bg-primary flex flex-col font-jacques">

            {/* Навігаційна панель */}
            <header className="bg-primary pt-6 pb-4 border-b-3 border-dark text-center">
                <h1 className="text-4xl text-deep mb-4 tracking-wide italic font-harlow">Welcome</h1>
                <nav className="flex justify-center gap-16 text-xl text-dark font-harlow">
                    <button onClick={() => setIsSignUp(false)} className="hover:opacity-60 cursor-pointer">Login</button>
                    <button className="hover:opacity-60 cursor-pointer">Planer</button>
                    <button className="hover:opacity-60 cursor-pointer">AI instructor</button>
                </nav>
            </header>

            {/* Контейнер з карткою */}
            <main className="flex-1 flex items-center justify-center p-6">
                <div className="hand-drawn-card bg-primary w-full max-w-lg p-10 relative overflow-hidden">

                    {/* Декоративні отвори блокнота */}
                    <div className="absolute top-0 left-0 right-0 h-4 flex justify-around opacity-30">
                        {[...Array(10)].map((_, i) => (
                            <div key={i} className="w-6 h-6 bg-secondary rounded-full -mt-3 border border-dark"></div>
                        ))}
                    </div>

                    {/* Перемикач Sign Up / Sign In */}
                    <div className="flex bg-accent rounded-full p-1.5 mb-10 border-2 border-dark relative">
                        <button
                            onClick={() => setIsSignUp(true)}
                            className={`flex-1 py-3 rounded-full text-2xl --font-harlow transition-all duration-300 z-10 ${
                                isSignUp ? 'text-deep' : 'opacity-50'
                            }`}
                        >
                            Sign Up
                        </button>
                        <button
                            onClick={() => setIsSignUp(false)}
                            className={`flex-1 py-3 rounded-full text-2xl --font-harlow transition-all duration-300 z-10 ${
                                !isSignUp ? 'text-deep' : 'opacity-50'
                            }`}
                        >
                            Sign In
                        </button>
                        {/* Повзунок перемикача */}
                        <div className={`absolute top-1 bottom-1 w-[calc(50%-4px)] bg-primary border-2 border-dark rounded-full transition-transform duration-300 ${
                            isSignUp ? 'translate-x-0' : 'translate-x-full'
                        }`}></div>
                    </div>

                    <form className="space-y-6" onSubmit={handleAuth}>
                        {isSignUp && (
                            <div>
                                <label className="block text-2xl text-dark mb-1 ml-2 --font-harlow italic">Name</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full bg-white/50 border-2 border-dark rounded-2xl h-14 px-5 outline-none text-lg focus:ring-2 ring-accent"
                                    placeholder="Enter your name"
                                    onChange={(e) => setFormData({...formData, username: e.target.value})}
                                />
                            </div>
                        )}

                        <div>
                            <label className="block text-2xl text-dark mb-1 ml-2 --font-harlow italic">Email</label>
                            <input
                                type="email"
                                required
                                className="w-full bg-white/50 border-2 border-dark rounded-2xl h-14 px-5 outline-none text-lg focus:ring-2 ring-accent"
                                placeholder="example@art.com"
                                onChange={(e) => setFormData({...formData, email: e.target.value})}
                            />
                        </div>

                        <div>
                            <label className="block text-2xl text-dark mb-1 ml-2 --font-harlow italic">Password</label>
                            <input
                                type="password"
                                required
                                className="w-full bg-white/50 border-2 border-dark rounded-2xl h-14 px-5 outline-none text-lg focus:ring-2 ring-accent"
                                placeholder="••••••••"
                                onChange={(e) => setFormData({...formData, password: e.target.value})}
                            />
                        </div>

                        {error && <p className="text-red-700 --font-harlow text-center">{error}</p>}

                        <div className="pt-8 flex justify-center">
                            <button
                                type="submit"
                                className="bg-secondary border-3 border-dark rounded-[2rem] px-14 py-3 text-3xl text-deep --font-harlow shadow-[6px_6px_0px_#2A0800] hover:scale-105 active:scale-95 transition-all"
                            >
                                {isSignUp ? 'Sign Up' : 'Login'}
                            </button>
                        </div>
                    </form>
                </div>
            </main>
        </div>
    );
};

export default AuthPage;