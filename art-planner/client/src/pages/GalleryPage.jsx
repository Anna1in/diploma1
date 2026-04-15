import React, { useState, useEffect, useRef } from 'react';
import API from '../api/axiosConfig';

const GalleryPage = () => {
    const [activeFolder, setActiveFolder] = useState(null);
    const [arts, setArts] = useState([]);
    const [loading, setLoading] = useState(false);

    // Нові стани для AI-інструктора
    const [activeArt, setActiveArt] = useState(null);
    const [userPrompt, setUserPrompt] = useState('');
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    const fileInputRef = useRef(null);
    const userId = localStorage.getItem('userId');

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

    const handleUpload = async (e) => {
        // ... (Тут залишається твій існуючий код handleUpload) ...
        const file = e.target.files[0];
        if (!file || !userId) return;
        const formData = new FormData();
        formData.append('image', file);
        formData.append('userId', userId);
        try {
            setLoading(true);
            const res = await API.post('/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' }});
            setArts(prev => [res.data, ...prev]); // Додаємо на початок
        } catch (err) {
            alert("Помилка завантаження файлу.");
        } finally {
            setLoading(false);
            e.target.value = null;
        }
    };

    // ФУНКЦІЯ ВІДПРАВКИ ЗАПИТУ ДО ШІ
    const handleAskAI = async () => {
        if (!userPrompt.trim()) return alert("Будь ласка, напишіть, що саме вас цікавить.");

        setIsAnalyzing(true);
        try {
            await API.post('/ai/analyze', {
                artId: activeArt._id,
                prompt: userPrompt
            });

            // Після успішного аналізу
            await fetchArts(); // Оновлюємо дані
            setActiveArt(null); // Закриваємо чат
            setUserPrompt('');
            setActiveFolder('processed'); // Переходимо в папку Processed

        } catch (err) {
            console.error(err);
            alert("Помилка при аналізі малюнку ШІ.");
        } finally {
            setIsAnalyzing(false);
        }
    };

    const renderMainView = () => (
        // ... (Твій існуючий код renderMainView) ...
        <div className="flex flex-col md:flex-row justify-center items-center gap-8 md:gap-12 mt-16">
            {folders.map(folder => (
                <div key={folder.id} className="flex flex-col items-center cursor-pointer group relative" onClick={() => setActiveFolder(folder.id)}>
                    <div className="w-48 h-40 bg-white border-2 border-dark shadow-sm flex items-center justify-center mb-4 transition-transform group-hover:scale-105">
                        <svg className="w-32 h-32 text-primary" fill="currentColor" viewBox="0 0 20 20">
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
        <div className="w-full max-w-5xl mx-auto bg-[#e5cfc3] p-8 rounded-xl shadow-lg border-2 border-[#6B4E41]">
            <button onClick={() => setActiveArt(null)} className="text-[#6B4E41] font-bold text-xl mb-6 hover:underline">
                ← Назад до My Arts
            </button>

            <div className="flex flex-col md:flex-row gap-10">
                {/* Ліва частина: Малюнок */}
                <div className="flex-1 bg-white p-4 border-2 border-[#6B4E41] shadow-inner flex items-center justify-center min-h-[400px]">
                    <img
                        src={`https://ai-planner-fiqq.onrender.com/uploads/${activeArt.originalPath}`}
                        alt="Selected Art"
                        className="max-w-full max-h-[500px] object-contain"
                    />
                </div>

                {/* Права частина: Чат / Запит */}
                <div className="flex-1 flex flex-col">
                    <h3 className="text-3xl font-hand italic font-bold text-[#6B4E41] mb-4">Ask AI Instructor</h3>
                    <p className="text-[#6B4E41] mb-2 font-hand text-lg">Що ви хочете покращити? (колір, анатомія, тіні...)</p>

                    <textarea
                        className="w-full flex-1 min-h-[200px] p-4 border-2 border-[#6B4E41] rounded-lg resize-none mb-6 font-hand text-xl focus:outline-none focus:ring-2 focus:ring-[#6B4E41]/50"
                        placeholder="Наприклад: Чи правильні пропорції обличчя на цьому скетчі?"
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
        const folderArts = activeFolder === 'myArts' ? arts.filter(a => a.status === 'pending') : arts.filter(art => art.status === 'processed');

        return (
            <div className="w-full">
                <div className="bg-[#6B4E41] text-primary/90 flex justify-between items-center px-6 md:px-10 py-4 mb-10">
                    <div className="flex items-center gap-4">
                        <button onClick={() => setActiveFolder(null)} className="text-2xl font-bold hover:scale-110">←</button>
                        <h2 className="text-xl md:text-2xl italic font-bold">Folder: "{folderData.title}"</h2>
                    </div>
                    {/* ... (Кнопка Upload залишається без змін) ... */}
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-x-8 md:gap-y-12 px-6 md:px-10">
                    {folderArts.map(art => (
                        <div
                            key={art._id}
                            className="flex flex-col items-center cursor-pointer group"
                            onClick={() => {
                                // Якщо ми в My Arts, відкриваємо інтерфейс AI
                                if (activeFolder === 'myArts') setActiveArt(art);
                            }}
                        >
                            <div className="bg-primary/40 p-2 border border-dark/10 shadow-sm w-full aspect-square flex items-center justify-center mb-3 overflow-hidden group-hover:border-[#6B4E41] transition-colors relative">
                                <img
                                    src={`https://ai-planner-fiqq.onrender.com/uploads/${art.originalPath}`}
                                    alt="Art"
                                    className="w-full h-full object-cover"
                                />
                                {/* Якщо це папка Processed, показуємо іконку TXT файлу поверх */}
                                {activeFolder === 'processed' && art.processedPath && (
                                    <a
                                        href={`https://ai-planner-fiqq.onrender.com/results/${art.processedPath}`}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="absolute bottom-2 right-2 bg-white p-2 border border-dark shadow-md hover:scale-110 transition-transform"
                                        title="Відкрити коментарі ШІ"
                                        onClick={(e) => e.stopPropagation()} // Щоб не клікалося саме фото
                                    >
                                        📄 TXT
                                    </a>
                                )}
                            </div>
                            <span className="text-sm md:text-lg font-bold italic truncate w-full text-center">
                                {art.originalPath.split('-').pop()}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    return (
        <div className="bg-secondary min-h-screen font-hand text-dark pb-20">
            <main className="max-w-6xl mx-auto pt-10">
                {/* Роутинг між станами: Якщо вибрано малюнок -> AI чат, інакше -> папки */}
                {activeArt ? renderAiInstructorView() : (activeFolder === null ? renderMainView() : renderFolderView())}
            </main>
        </div>
    );
};

export default GalleryPage;