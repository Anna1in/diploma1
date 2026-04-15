// client/src/pages/GalleryPage.jsx
import React, { useState, useEffect, useRef } from 'react';
import API from '../api/axiosConfig';

const GalleryPage = () => {
    const [activeFolder, setActiveFolder] = useState(null);
    const [arts, setArts] = useState([]);
    const [loading, setLoading] = useState(false);

    // Стан для AI Інструктора
    const [activeArtForAi, setActiveArtForAi] = useState(null);
    const [userPrompt, setUserPrompt] = useState('');
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    // Стан для повідомлення про перевантаження
    const [aiOverloadMessage, setAiOverloadMessage] = useState(null);

    const fileInputRef = useRef(null);
    const userId = localStorage.getItem('userId');
    // Використовуй URL Render або localhost
    const serverURL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'https://ai-planner-fiqq.onrender.com';

    const folders = [
        { id: 'myArts', title: 'My Arts', description: 'додати' },
        { id: 'processed', title: 'Processed', description: 'додати' },
        { id: 'references', title: 'References for AI', description: 'додати' }
    ];

    const fetchArts = async () => {
        if (!userId) return;
        try {
            const res = await API.get(`/arts/${userId}`);
            setArts(res.data);
        } catch (err) {
            console.error("Помилка завантаження малюнків:", err);
        }
    };

    useEffect(() => { fetchArts(); }, [userId]);

    // ВИПРАВЛЕНО: Функція завантаження файлу (Робоча версія)
    const handleUpload = async (e) => {
        const file = e.target.files[0];
        if (!file || !userId) return;
        const formData = new FormData();
        formData.append('image', file);
        formData.append('userId', userId);
        try {
            setLoading(true);
            const res = await API.post('/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' }});
            // Додаємо новий малюнок на початок сітки
            setArts(prev => [res.data, ...prev]);
        } catch (err) {
            alert("Помилка завантаження файлу. Перевір CORS та сервер.");
        } finally {
            setLoading(false);
            e.target.value = null;
        }
    };

    const handleAskAI = async () => {
        if (!userPrompt.trim()) return alert("Будь ласка, напишіть, що саме вас цікавить.");

        setIsAnalyzing(true);
        setAiOverloadMessage(null); // Очищаємо старі помилки

        try {
            await API.post('/ai/analyze', {
                artId: activeArtForAi._id,
                prompt: userPrompt
            });

            await fetchArts();
            setActiveArtForAi(null);
            setUserPrompt('');
            setActiveFolder('processed');

        } catch (err) {
            console.error(err);
            // ВИПРАВЛЕНО: Обробка повідомлення про перевантаження
            if (err.response?.status === 503 && err.response?.data?.error === "AI_OVERLOADED") {
                setAiOverloadMessage("AI-інструктор наразі перевантажений великою кількістю запитів. Спробуйте, будь ласка, пізніше (через 1-2 хвилини).");
            } else {
                alert("Помилка при аналізі малюнку ШІ.");
            }
        } finally {
            setIsAnalyzing(false);
        }
    };

    const renderMainView = () => (
        <div className="flex flex-col md:flex-row justify-center items-center gap-8 md:gap-12 mt-16 pb-20">
            {folders.map(folder => (
                <div key={folder.id} className="flex flex-col items-center cursor-pointer group relative" onClick={() => setActiveFolder(folder.id)}>
                    <div className="w-48 h-40 bg-white border-2 border-dark shadow-sm flex items-center justify-center mb-4 transition-transform group-hover:scale-105 hover:border-[#6B4E41]">
                        <svg className="w-32 h-32 text-primary group-hover:text-[#6B4E41]" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
                        </svg>
                    </div>
                    <span className="text-2xl font-bold italic">{folder.title}</span>
                </div>
            ))}
        </div>
    );

    // ІНТЕРФЕЙС AI ІНСТРУКТОРА (Як на Фото 1)
    const renderAiInstructorView = () => (
        <div className="w-full max-w-5xl mx-auto bg-[#e5cfc3] p-6 md:p-8 rounded-xl shadow-lg border-2 border-[#6B4E41] mb-20 relative">

            {/* ПОВІДОМЛЕННЯ ПРО ПЕРЕВАНТАЖЕННЯ ШІ */}
            {aiOverloadMessage && (
                <div className="absolute inset-0 bg-dark/90 flex items-center justify-center z-50 rounded-xl p-10 text-center">
                    <div className="text-white">
                        <span className="text-8xl mb-5 block">⚠️</span>
                        <h3 className="text-3xl font-bold mb-4">AI перевантажено</h3>
                        <p className="text-xl mb-6">{aiOverloadMessage}</p>
                        <button
                            onClick={() => { setAiOverloadMessage(null); setIsAnalyzing(false); }}
                            className="bg-primary text-dark px-6 py-2 rounded-lg font-bold"
                        >
                            Зрозуміло
                        </button>
                    </div>
                </div>
            )}

            <button onClick={() => setActiveArtForAi(null)} className="text-[#6B4E41] font-bold text-xl mb-6 hover:underline flex items-center gap-2">
                ← Назад до My Arts
            </button>

            <div className="flex flex-col md:flex-row gap-8 md:gap-10">
                {/* Малюнок оригіналу */}
                <div className="flex-1 bg-white p-4 border-2 border-[#6B4E41] shadow-inner flex items-center justify-center min-h-[350px] md:min-h-[400px]">
                    <img
                        src={`${serverURL}/uploads/${activeArtForAi.originalPath}`}
                        alt="Selected Art"
                        className="max-w-full max-h-[500px] object-contain"
                    />
                </div>

                {/* Чат */}
                <div className="flex-1 flex flex-col">
                    <h3 className="text-3xl font-hand italic font-bold text-[#6B4E41] mb-4">Ask AI Instructor</h3>
                    <p className="text-[#6B4E41] mb-2 font-hand text-lg">Які аспекти малюнку вас цікавлять? (анатомія, кольори...)</p>

                    <textarea
                        className="w-full flex-1 min-h-[180px] p-4 border-2 border-[#6B4E41] rounded-lg resize-none mb-6 font-hand text-xl focus:outline-none focus:ring-2 focus:ring-[#6B4E41]/50 bg-white/50"
                        placeholder="Наприклад: Чи правильна анатомія обличчя на цьому портреті?"
                        value={userPrompt}
                        onChange={(e) => setUserPrompt(e.target.value)}
                    ></textarea>

                    <button
                        onClick={handleAskAI}
                        disabled={isAnalyzing}
                        className={`w-full py-4 text-2xl font-hand font-bold text-white rounded-lg transition-all ${
                            isAnalyzing ? 'bg-gray-500 cursor-not-allowed' : 'bg-[#6B4E41] hover:bg-[#523A30] shadow-md hover:shadow-lg'
                        }`}
                    >
                        {isAnalyzing ? 'ШІ аналізує...' : 'Ask AI'}
                    </button>
                </div>
            </div>
        </div>
    );

    const renderFolderView = () => {
        const folderData = folders.find(f => f.id === activeFolder);
        // Фільтруємо малюнки: в My Arts -pending, в Processed -processed
        const folderArts = activeFolder === 'myArts'
            ? arts.filter(a => a.status === 'pending')
            : arts.filter(art => art.status === 'processed');

        return (
            <div className="w-full">
                {/* Панель керування папкою */}
                <div className="bg-[#6B4E41] text-primary/90 flex justify-between items-center px-6 md:px-10 py-4 mb-10 shadow-md">
                    <div className="flex items-center gap-4">
                        <button onClick={() => setActiveFolder(null)} className="text-2xl font-bold hover:scale-110">←</button>
                        <h2 className="text-xl md:text-2xl italic font-bold">Folder: "{folderData.title}"</h2>
                    </div>

                    {/* Кнопка Upload (Лише для My Arts) */}
                    {activeFolder === 'myArts' && (
                        <div
                            className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity p-2 border border-primary/20 rounded-md bg-dark/10"
                            onClick={() => fileInputRef.current.click()}
                        >
                            <span className="text-lg md:text-xl font-bold">Upload Art</span>
                            <div className="w-10 h-8 bg-primary rounded flex items-center justify-center">
                                <span className="text-dark font-bold text-2xl leading-none mb-1">+</span>
                            </div>
                            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleUpload}/>
                        </div>
                    )}
                </div>

                {/* ВИПРАВЛЕНО: Сітка малюнків користувача (Робоча версія) */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-x-8 md:gap-y-12 px-6 md:px-10 pb-20">
                    {folderArts.map(art => {
                        // Визначаємо правильну папку на сервері: /uploads або /results
                        const imageSubFolder = activeFolder === 'processed' ? 'results' : 'uploads';

                        return (
                            <div
                                key={art._id}
                                className="flex flex-col items-center cursor-pointer group"
                                onClick={() => {
                                    if (activeFolder === 'myArts') setActiveArtForAi(art); // Відкриваємо ШІ
                                }}
                            >
                                <div className="bg-primary/40 p-2 border-2 border-dark/10 shadow-sm w-full aspect-square flex items-center justify-center mb-3 overflow-hidden group-hover:border-[#6B4E41] transition-all relative">
                                    <img
                                        src={`${serverURL}/${imageSubFolder}/${art.originalPath}`}
                                        alt="Art"
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                    />
                                    {/* Кнопка для TXT файлу (Лише в Processed) */}
                                    {activeFolder === 'processed' && art.processedPath && (
                                        <a
                                            href={`${serverURL}/results/${art.processedPath}`}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="absolute bottom-2 right-2 bg-white text-dark p-2 border border-dark shadow-md hover:scale-110 transition-transform font-bold text-xs"
                                            onClick={(e) => e.stopPropagation()} // Зупиняємо клік на фото
                                        >
                                            📄 FEEDBACK
                                        </a>
                                    )}
                                </div>
                                <span className="text-sm md:text-lg font-bold italic truncate w-full text-center group-hover:text-[#6B4E41]">
                                {art.originalPath.split('-').pop()}
                            </span>
                            </div>
                        )
                    })}
                </div>
            </div>
        );
    };

    return (
        <div className="bg-secondary min-h-screen font-hand text-dark">
            <main className="max-w-6xl mx-auto pt-10 px-4 md:px-0">
                {/* Роутинг між станами */}
                {activeArtForAi ? renderAiInstructorView() : (activeFolder === null ? renderMainView() : renderFolderView())}
            </main>
        </div>
    );
};

export default GalleryPage;