import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Send } from 'lucide-react';
import API from '../api/axiosConfig';

const AIDetailView = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [art, setArt] = useState(null);
    const [userPrompt, setUserPrompt] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [feedback, setFeedback] = useState(null);

    // Беремо URL сервера для підстановки картинок
    const serverURL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'https://ai-planner-fiqq.onrender.com';

    useEffect(() => {
        fetchArtDetail();
    }, [id]);

    const fetchArtDetail = async () => {
        try {
            // Отримуємо ВСІ арти юзера і знаходимо потрібний (або зроби окремий роут GET /arts/detail/:id на бекенді)
            const userId = localStorage.getItem('userId');
            const res = await API.get(`/arts/${userId}`);
            const currentArt = res.data.find(a => a._id === id);

            if (currentArt) {
                setArt(currentArt);
                if (currentArt.status === 'processed') {
                    setFeedback({
                        image: currentArt.originalPath, // Тепер тут зображення з розміткою
                        text: currentArt.processedPath // А тут txt файл
                    });
                }
            }
        } catch (err) {
            console.error("Помилка завантаження деталей малюнка:", err);
        }
    };

    const handleAskAI = async () => {
        if (!userPrompt.trim()) return;
        setIsProcessing(true);

        try {
            // Стукаємо на наш новий AI роут
            const res = await API.post('/ai/analyze', {
                artId: id,
                prompt: userPrompt
            });

            // Оновлюємо інтерфейс результатами
            setFeedback({
                image: res.data.originalPath, // Фото з розміткою
                text: "Аналіз завершено! Текстовий звіт збережено у файл: " + res.data.processedPath
            });
            setArt({ ...art, status: 'processed' });
            setUserPrompt('');
        } catch (err) {
            if (err.response?.status === 503) {
                alert("AI-інструктор перевантажений. Спробуйте через хвилину.");
            } else {
                alert("ШІ не зміг обробити запит. Перевірте консоль.");
            }
        } finally {
            setIsProcessing(false);
        }
    };

    if (!art) return <div className="p-10 text-center text-[#4A3B32] font-bold text-xl">Loading...</div>;

    return (
        <div className="max-w-7xl mx-auto p-4 flex flex-col h-[calc(100vh-100px)] bg-[#F4E1DD]">
            {/* Заголовок */}
            <div className="flex items-center gap-4 mb-4">
                <button onClick={() => navigate(-1)} className="text-[#4A3B32] font-bold hover:underline">← Назад</button>
                <h1 className="text-3xl font-bold italic text-center flex-1 text-[#4A3B32]">
                    Name of downloaded photo: <span className="underline">{art.originalPath.split('-').pop()}</span>
                </h1>
            </div>

            <div className="flex flex-col lg:flex-row gap-6 flex-grow overflow-hidden">
                {/* Ліва частина: Зображення */}
                <div className="lg:w-2/3 bg-[#3A2A22] rounded-lg border-4 border-[#2A1A12] relative flex items-center justify-center overflow-hidden shadow-xl">
                    <button className="absolute left-4 z-10 p-2 bg-white/20 text-white rounded-md hover:bg-white/40 transition">
                        <ChevronLeft size={40} />
                    </button>

                    <img
                        // Якщо є фідбек - показуємо розмальоване фото з папки results, інакше - оригінал з uploads
                        src={`${serverURL}/${feedback ? 'results/' + feedback.image : 'uploads/' + art.originalPath}`}
                        className="max-w-full max-h-full object-contain"
                        alt="Art preview"
                        onError={(e) => { e.target.src = 'https://via.placeholder.com/400?text=Image+Lost+On+Server'; }}
                    />

                    <button className="absolute right-4 z-10 p-2 bg-white/20 text-white rounded-md hover:bg-white/40 transition">
                        <ChevronRight size={40} />
                    </button>
                </div>

                {/* Права частина: Чат AI */}
                <div className="lg:w-1/3 flex flex-col gap-4">
                    <div className="flex-grow bg-[#A38A80] rounded-xl p-4 overflow-y-auto flex flex-col gap-4 border-2 border-[#4A3B32] shadow-inner">

                        {art.status === 'processed' && (
                            <div className="self-start bg-[#F4E1DD] p-3 rounded-lg border-2 border-[#4A3B32] text-[#4A3B32] text-sm italic font-bold">
                                Збережено в папці "Processed"
                            </div>
                        )}

                        {/* Текст аналізу від ШІ (або посилання на файл) */}
                        {feedback && (
                            <div className="self-start bg-white p-4 rounded-lg border-2 border-[#4A3B32] text-sm shadow-md">
                                <p className="whitespace-pre-wrap text-[#4A3B32]">{feedback.text}</p>
                                <a
                                    href={`${serverURL}/results/${feedback.text}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="mt-2 inline-block text-blue-600 underline font-bold"
                                >
                                    Відкрити повний TXT файл
                                </a>
                            </div>
                        )}

                        {isProcessing && (
                            <div className="self-start bg-white/80 p-3 rounded-lg text-sm italic animate-pulse text-[#4A3B32]">
                                AI Instructor аналізує зображення...
                            </div>
                        )}
                    </div>

                    {/* Поле вводу */}
                    <div className="flex flex-col gap-2">
                        <textarea
                            className="w-full p-4 bg-[#F4E1DD] border-4 border-[#4A3B32] rounded-xl focus:outline-none min-h-[120px] resize-none text-[#4A3B32] font-semibold"
                            placeholder="Поясни що не так з кольорами, пропорціями..."
                            value={userPrompt}
                            onChange={(e) => setUserPrompt(e.target.value)}
                            disabled={isProcessing}
                        />
                        <button
                            onClick={handleAskAI}
                            disabled={isProcessing || !userPrompt}
                            className="w-full py-4 bg-[#A38A80] border-4 border-[#4A3B32] font-bold text-xl text-white rounded-full shadow-[6px_6px_0px_#4A3B32] active:translate-y-1 active:shadow-none transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            <Send size={24} />
                            Ask AI
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AIDetailView;