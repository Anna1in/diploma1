import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api/axiosConfig';

const AuthPage = () => {
    const [isLogin, setIsLogin] = useState(true);
    const [formData, setFormData] = useState({ username: '', email: '', password: '' });
    const navigate = useNavigate();

    const handleAuth = async (e) => {
        e.preventDefault();
        try {
            const endpoint = isLogin ? '/login' : '/register';
            const res = await API.post(endpoint, formData);
            if (isLogin) {
                localStorage.setItem('token', res.data.token);
                localStorage.setItem('userId', res.data.userId); // Збереження userId
                localStorage.setItem('username', res.data.username);
                navigate('/planner');
            } else {
                setIsLogin(true);
            }
        } catch (err) {
            alert("Auth error: " + err.response?.data?.message);
        }
    };

    return (
        <div className="flex items-center justify-center pt-20">
            <div className="hand-drawn-card w-full max-w-md p-8 bg-[--color-secondary]">
                {/* Перемикач Sign Up / Sign In (Фото 2) */}
                <div className="flex bg-[--color-accent] rounded-full p-1 border-2 border-[--color-dark] mb-8 relative">
                    <button onClick={() => setIsLogin(false)} className={`flex-1 py-2 font-bold z-10 ${!isLogin ? 'text-[--color-deep]' : 'opacity-50'}`}>Sign Up</button>
                    <button onClick={() => setIsLogin(true)} className={`flex-1 py-2 font-bold z-10 ${isLogin ? 'text-[--color-deep]' : 'opacity-50'}`}>Sign In</button>
                    <div className={`absolute top-1 bottom-1 w-[calc(50%-4px)] bg-[--color-primary] border-2 border-[--color-dark] rounded-full transition-transform ${isLogin ? 'translate-x-[calc(100%)]' : 'translate-x-0'}`}></div>
                </div>

                <form onSubmit={handleAuth} className="space-y-4">
                    {!isLogin && (
                        <input type="text" placeholder="Name" className="w-full p-2 border-2 border-[--color-dark] rounded-md bg-[--color-primary]"
                               onChange={(e) => setFormData({...formData, username: e.target.value})} required />
                    )}
                    <input type="email" placeholder="Email" className="w-full p-2 border-2 border-[--color-dark] rounded-md bg-[--color-primary]"
                           onChange={(e) => setFormData({...formData, email: e.target.value})} required />
                    <input type="password" placeholder="Password" className="w-full p-2 border-2 border-[--color-dark] rounded-md bg-[--color-primary]"
                           onChange={(e) => setFormData({...formData, password: e.target.value})} required />
                    <button type="submit" className="w-full py-3 bg-[--color-primary] border-2 border-[--color-dark] font-bold rounded-lg shadow-[4px_4px_0px_#2A0800]">
                        {isLogin ? 'Login' : 'Sign Up'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default AuthPage;