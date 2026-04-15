import React, { useState, useEffect, useRef } from 'react';
import API from '../api/axiosConfig';

const GalleryPage = () => {
    const [activeFolder, setActiveFolder] = useState(null);
    const [arts, setArts] = useState([]);
    const [loading, setLoading] = useState(false);

    // AI States
    const [activeArtForAi, setActiveArtForAi] = useState(null);
    const [userPrompt, setUserPrompt] = useState('');
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    const fileInputRef = useRef(null);
    const userId = localStorage.getItem('userId');
    const serverURL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';

    const folders = [
        { id: 'myArts', title: 'My Arts', description: 'Ваші завантажені малюнки' },
        { id: 'processed', title: 'Processed', description: 'Роботи, перевірені ШІ' },
        { id: 'references', title: 'References for AI', description: 'Референси' }
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
        const file = e.target.files[0];
        if (!file || !userId) return;
        const formData = new FormData();
        formData.append('image', file);
        formData.append('userId', userId);
        try {
            setLoading(true);
            const res = await API.post('/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' }});
            setArts(prev => [res.data, ...prev]);
        } catch (err) {
            alert("Помилка завантаження. Перевірте з'єднання з сервером.");
        } finally {
            setLoading(false);
            e.target.value = null;
        }
    };

    const handleAskAI = async () => {
        if (!userPrompt.trim()) return alert("Будь ласка, напишіть ваш запит до ШІ.");
        setIsAnalyzing(true);
        try {
            await API.post('/ai/analyze', { artId: activeArtForAi._id, prompt: userPrompt });
            await fetchArts();
            setActiveArtForAi(null);
            setUserPrompt('');
            setActiveFolder('processed');
        } catch (err) {
            console.error("AI Error:", err);
            alert("Помилка ШІ. Можливо, фото було видалено сервером Render. Спробуйте завантажити нове фото.");
        } finally {
            setIsAnalyzing(false);
        }
    };

    const renderMainView = () => (
        <div className="flex justify-center items-start gap-16 mt-20">
            {folders.map(folder => (
                <div key={folder.id} className="flex flex-col items-center cursor-pointer group relative" onClick={() => setActiveFolder(folder.id)}>
                    {/* Іконка папки як на макеті */}
                    <div className="w-48 h-36 bg-[#F4E1DD] rounded-t-xl rounded-b-md border-b-8 border-[#D8A7A0] relative shadow-md group-hover:scale-105 transition-transform flex items-center justify-center">
                        <div className="absolute -top-4 left-0 w-16 h-6 bg-[#F4E1DD] rounded-t-lg"></div>
                    </div>
                    <span className="text-2xl font-bold font-serif mt-4 text-[#4A3B32]">{folder.title}</span>
                </div>
            ))}
        </div>
    );

    const renderAiInstructorView = () => (
        <div className="w-full">
            {/* Панель папки */}
            <div className="bg-[#6B4E41] text-[#F4E1DD] flex justify-between items-center px-10 py-3 mb-8">
                <div className="flex items-center gap-4">
                    <button onClick={() => setActiveArtForAi(null)} className="text-2xl font-bold hover:scale-110">←</button>
                    <h2 className="text-2xl font-serif">Folder: "Ask AI"</h2>
                </div>
            </div>

            {/* Інтерфейс чату з ШІ */}
            <div className="flex flex-col md:flex-row gap-8 px-10">
                {/* Ліва колонка: Фото */}
                <div className="flex-1 bg-[#F4E1DD] p-4 flex items-center justify-center min-h-[500px]">
                    <img
                        src={`${serverURL}/uploads/${activeArtForAi.originalPath}`}
                        alt="Selected Art"
                        className="max-w-full max-h-[600px] object-contain shadow-lg"
                        onError={(e) => { e.target.src = 'https://via.placeholder.com/400?text=Image+Lost+On+Server'; }}
                    />
                </div>

                {/* Права колонка: Чат */}
                <div className="flex-1 flex flex-col bg-[#F4E1DD] p-8 relative">
                    <h3 className="text-3xl font-serif text-[#4A3B32] mb-6 font-bold border-b-2 border-[#6B4E41] pb-2">
                        Chat with AI Instructor
                    </h3>

                    <div className="flex-1 overflow-y-auto mb-6 space-y-4">
                        <div className="bg-white p-4 rounded-lg shadow-sm text-[#4A3B32] font-serif border border-[#6B4E41]/20">
                            <p className="font-bold mb-1">AI Instructor:</p>
                            <p>Вітаю! Я проаналізую ваш малюнок. Напишіть, що саме ви хочете перевірити (пропорції, тіні, кольори)?</p>
                        </div>
                    </div>

                    <div className="mt-auto">
                        <textarea
                            className="w-full min-h-[120px] p-4 bg-white border border-[#6B4E41] rounded-none resize-none font-serif text-lg focus:outline-none mb-4 text-[#4A3B32]"
                            placeholder="Ваш запит..."
                            value={userPrompt}
                            onChange={(e) => setUserPrompt(e.target.value)}
                        ></textarea>

                        <button
                            onClick={handleAskAI}
                            disabled={isAnalyzing}
                            className={`w-full py-3 text-xl font-serif font-bold text-[#F4E1DD] transition-all ${
                                isAnalyzing ? 'bg-gray-500' : 'bg-[#6B4E41] hover:bg-[#523A30]'
                            }`}
                        >
                            {isAnalyzing ? 'Processing...' : 'Send to AI'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );

    const renderFolderView = () => {
        const folderData = folders.find(f => f.id === activeFolder);
        const folderArts = activeFolder === 'myArts'
            ? arts.filter(a => a.status === 'pending')
            : arts.filter(art => art.status === 'processed');

        return (
            <div className="w-full">
                <div className="bg-[#6B4E41] text-[#F4E1DD] flex justify-between items-center px-10 py-3 mb-10">
                    <div className="flex items-center gap-4">
                        <button onClick={() => setActiveFolder(null)} className="text-2xl font-bold hover:scale-110">←</button>
                        <h2 className="text-2xl font-serif">Folder: "{folderData.title}"</h2>
                    </div>

                    {activeFolder === 'myArts' && (
                        <div className="flex items-center gap-4">
                            <span className="text-xl font-serif">Download</span>
                            <div
                                className="w-12 h-10 bg-[#F4E1DD] cursor-pointer hover:bg-white transition-colors flex items-center justify-center relative"
                                onClick={() => fileInputRef.current.click()}
                            >
                                <div className="absolute top-1 left-1 w-4 h-2 bg-[#F4E1DD] border border-[#6B4E41]"></div>
                                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleUpload}/>
                            </div>
                        </div>
                    )}
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-8 px-10">
                    {folderArts.map(art => {
                        const subFolder = activeFolder === 'processed' ? 'results' : 'uploads';
                        return (
                            <div key={art._id} className="flex flex-col items-center cursor-pointer group" onClick={() => { if (activeFolder === 'myArts') setActiveArtForAi(art); }}>
                                <div className="bg-[#F4E1DD] p-4 w-full aspect-square flex items-center justify-center mb-2 relative">
                                    <img
                                        src={`${serverURL}/${subFolder}/${art.originalPath}`}
                                        alt="Art"
                                        className="max-w-full max-h-full object-cover shadow-sm"
                                        onError={(e) => { e.target.src = 'https://via.placeholder.com/150?text=Lost'; }}
                                    />
                                    {activeFolder === 'processed' && art.processedPath && (
                                        <a href={`${serverURL}/results/${art.processedPath}`} target="_blank" rel="noreferrer" className="absolute bottom-2 right-2 bg-white px-2 py-1 text-xs font-bold border border-black z-10" onClick={(e) => e.stopPropagation()}>
                                            TXT
                                        </a>
                                    )}
                                </div>
                                <span className="text-lg font-serif text-[#4A3B32]">{art.originalPath.split('-').pop()}</span>
                            </div>
                        )
                    })}
                </div>
            </div>
        );
    };

    return (
        <div className="bg-[#EAD8D3] min-h-screen">
            <main className="max-w-7xl mx-auto pt-6 pb-20">
                {activeArtForAi ? renderAiInstructorView() : (activeFolder === null ? renderMainView() : renderFolderView())}
            </main>
        </div>
    );
};

export default GalleryPage;