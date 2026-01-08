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

    useEffect(() => {
        fetchArtDetail();
    }, [id]);

    const fetchArtDetail = async () => {
        try {
            const res = await API.get(`/arts/detail/${id}`);
            setArt(res.data);
            if (res.data.status === 'completed') {
                setFeedback({
                    image: res.data.processedPath,
                    text: res.data.feedbackText
                });
            }
        } catch (err) {
            console.error("Помилка завантаження деталей малюнка:", err);
        }
    };

    const handleAskAI = async () => {
        if (!userPrompt.trim()) return;
        setIsProcessing(true);

        try {
            // Відправка запиту до ШІ через бекенд
            // userId додається автоматично через axiosConfig інтерцептор
            const res = await API.post('/ai/process-art', {
                artId: id,
                userPrompt: userPrompt
            });

            setFeedback({
                image: res.data.processedPath,
                text: res.data.feedbackText
            });
            setArt({ ...art, status: 'completed' });
        } catch (err) {
            alert("ШІ не зміг обробити запит. Спробуйте пізніше.");
        } finally {
            setIsProcessing(false);
        }
    };

    if (!art) return <div className="p-10 text-center">Loading...</div>;

    return (
        <div className="max-w-7xl mx-auto p-4 flex flex-col h-[calc(100vh-100px)]">
            {/* Заголовок (Фото 7) */}
            <h1 className="text-3xl font-bold italic mb-4 text-center">
                Name of downloaded photo: <span className="underline">{art.originalPath.split('-').pop()}</span>
            </h1>

            <div className="flex flex-col lg:flex-row gap-6 flex-grow overflow-hidden">
                {/* Ліва частина: Перегляд зображення (Фото 7) */}
                <div className="lg:w-2/3 bg-[--color-bg-deep] rounded-lg border-4 border-[--color-dark] relative flex items-center justify-center overflow-hidden">
                    <button className="absolute left-4 z-10 p-2 bg-[--color-secondary]/50 rounded-md hover:bg-[--color-secondary]">
                        <ChevronLeft size={40} />
                    </button>

                    <img
                        src={`https://ai-planner-fiqg.onrender.com/${feedback ? 'results/' + feedback.image : 'uploads/' + art.originalPath}`}
                        className="max-w-full max-h-full object-contain"
                        alt="Art preview"
                    />

                    <button className="absolute right-4 z-10 p-2 bg-[--color-secondary]/50 rounded-md hover:bg-[--color-secondary]">
                        <ChevronRight size={40} />
                    </button>
                </div>

                {/* Права частина: AI Instructor Panel (Фото 7) */}
                <div className="lg:w-1/3 flex flex-col gap-4">
                    <div className="flex-grow hand-drawn-card bg-[--color-secondary] p-4 overflow-y-auto flex flex-col gap-4">

                        {/* Повідомлення про статус */}
                        <div className="self-end bg-[--color-accent] p-3 rounded-lg border-2 border-[--color-dark] text-sm max-w-[80%]">
                            {userPrompt || "Тут з'явиться ваш запит..."}
                        </div>

                        {art.status === 'completed' && (
                            <div className="self-start bg-[--color-primary] p-3 rounded-lg border-2 border-[--color-dark] text-sm italic">
                                Збережено в папці "Processed"
                            </div>
                        )}

                        {/* Текст аналізу від ШІ */}
                        {feedback && (
                            <div className="self-start bg-white p-4 rounded-lg border-2 border-[--color-dark] text-sm shadow-sm">
                                <p className="whitespace-pre-wrap">{feedback.text}</p>
                            </div>
                        )}

                        {isProcessing && (
                            <div className="text-center italic animate-pulse">AI Instructor аналізує пропорції...</div>
                        )}
                    </div>

                    {/* Поле вводу та кнопка (Фото 7) */}
                    <div className="flex flex-col gap-2">
            <textarea
                className="w-full p-3 hand-drawn-card bg-[--color-primary] focus:outline-none min-h-[100px] resize-none"
                placeholder="Поясни що не так з кольорами, пропорціями обличчя на малюнку. Надай зображення з коректною розміткою та текстовий файл..."
                value={userPrompt}
                onChange={(e) => setUserPrompt(e.target.value)}
                disabled={isProcessing}
            />
                        <button
                            onClick={handleAskAI}
                            disabled={isProcessing || !userPrompt}
                            className="w-full py-3 bg-[--color-secondary] border-4 border-[--color-dark] font-bold text-xl rounded-full shadow-[6px_6px_0px_#2A0800] active:translate-y-1 active:shadow-none transition-all flex items-center justify-center gap-2 disabled:opacity-50"
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