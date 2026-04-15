import React, { useState, useEffect, useRef } from 'react';
import API from '../api/axiosConfig';

const GalleryPage = () => {
    const [activeFolder, setActiveFolder] = useState(null);
    const [arts, setArts] = useState([]);
    const [loading, setLoading] = useState(false); // Використовується для анімації завантаження

    const [currentArtIndex, setCurrentArtIndex] = useState(null);
    const [userPrompt, setUserPrompt] = useState('');
    const [isAnalyzing, setIsAnalyzing] = useState(false); // Використовується для блокування кнопки AI

    const fileInputRef = useRef(null);
    const userId = localStorage.getItem('userId');

    const folders = [
        { id: 'myArts', title: 'My Arts' },
        { id: 'processed', title: 'Processed' },
        { id: 'references', title: 'References for AI' }
    ];

    const fetchArts = async () => {
        if (!userId) return;
        try {
            const res = await API.get(`/arts/${userId}`);
            setArts(res.data.reverse());
        } catch (err) {
            console.error("Error fetching arts:", err);
        }
    };

    useEffect(() => { fetchArts(); }, [userId]);

    const handleUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onloadend = async () => {
            try {
                setLoading(true);
                const res = await API.post('/upload', { image: reader.result, userId });
                setArts(prev => [...prev, res.data]);
            } catch (err) {
                alert("Помилка завантаження");
            } finally {
                setLoading(false);
            }
        };
    };

    const handleAskAI = async () => {
        if (!userPrompt.trim()) return alert("Напишіть запит");
        try {
            setIsAnalyzing(true);
            // Тут ваш виклик API для аналізу
            console.log("Analyzing...");
        } catch (err) {
            alert("AI Error");
        } finally {
            setIsAnalyzing(false);
        }
    };

    const nextArt = () => setCurrentArtIndex(prev => (prev + 1) % arts.length);
    const prevArt = () => setCurrentArtIndex(prev => (prev - 1 + arts.length) % arts.length);

    const renderAiInstructorView = () => {
        const currentArt = arts[currentArtIndex];
        return (
            <div className="max-w-5xl mx-auto mt-2">
                <div className="bg-[#F4DBD8] p-3 text-center border-b-2 border-[#2A0800] mb-1">
                    <h2 className="text-3xl font-bold italic text-[#2A0800]">{currentArt.customName}</h2>
                </div>

                <div className="flex flex-col md:flex-row h-[550px] gap-1">
                    <div className="flex-[2] bg-[#2A0800] relative flex items-center justify-center p-10 border-2 border-[#2A0800]">
                        <button onClick={prevArt} className="absolute left-4 w-12 h-20 bg-[#BEA8A7] border-2 border-[#2A0800] text-[#2A0800] text-4xl flex items-center justify-center hover:bg-[#C09891]">{"<"}</button>
                        <img src={currentArt.originalPath} alt="Art" className="max-w-full max-h-full object-contain shadow-2xl" />
                        <button onClick={nextArt} className="absolute right-4 w-12 h-20 bg-[#BEA8A7] border-2 border-[#2A0800] text-[#2A0800] text-4xl flex items-center justify-center hover:bg-[#C09891]">{">"}</button>
                    </div>

                    <div className="flex-1 bg-[#BEA8A7] p-6 border-2 border-[#2A0800] flex flex-col justify-end gap-4">
                        <textarea
                            value={userPrompt}
                            onChange={(e) => setUserPrompt(e.target.value)}
                            placeholder="Напишіть запит..."
                            className="w-full h-32 p-3 bg-[#F4DBD8]/50 border-2 border-[#2A0800] rounded-lg resize-none font-bold text-[#2A0800]"
                        />
                        <button
                            onClick={handleAskAI}
                            disabled={isAnalyzing}
                            className={`w-full py-4 border-2 border-[#2A0800] rounded-full text-2xl font-bold italic text-[#2A0800] shadow-md transition-all ${isAnalyzing ? 'bg-gray-400' : 'bg-[#C09891] hover:bg-[#BEA8A7]'}`}
                        >
                            {isAnalyzing ? 'Analyzing...' : 'Ask AI'}
                        </button>
                    </div>
                </div>
                <button onClick={() => setCurrentArtIndex(null)} className="mt-4 text-[#775144] font-bold underline">← Назад</button>
            </div>
        );
    };

    const renderFolderView = () => (
        <div className="w-full">
            <div className="bg-[#775144] text-[#F4DBD8] flex justify-between items-center px-10 py-3 mb-8 shadow-lg">
                <div className="flex items-center gap-4">
                    <button onClick={() => setActiveFolder(null)} className="text-2xl font-bold">←</button>
                    <span className="text-2xl italic font-bold">Folder: "{folders.find(f => f.id === activeFolder).title}"</span>
                </div>
                <div
                    className={`flex items-center gap-3 cursor-pointer ${loading ? 'opacity-50' : ''}`}
                    onClick={() => !loading && fileInputRef.current.click()}
                >
                    <span className="text-xl font-bold">{loading ? 'Uploading...' : 'Download'}</span>
                    <div className="w-10 h-8 bg-[#F4DBD8] rounded flex items-center justify-center text-[#2A0800] font-extrabold text-2xl">+</div>
                    <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleUpload} />
                </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-10 px-10">
                {arts.map((art, index) => (
                    <div key={art._id} className="flex flex-col items-center group cursor-pointer" onClick={() => setCurrentArtIndex(index)}>
                        <div className="bg-[#BEA8A7] p-2 border-2 border-[#775144] w-full aspect-square overflow-hidden shadow-md group-hover:border-[#2A0800] transition-all">
                            <img src={art.originalPath} alt="Art" className="w-full h-full object-cover" />
                        </div>
                        <span className="mt-2 font-bold italic text-[#2A0800]">{art.customName}</span>
                    </div>
                ))}
            </div>
        </div>
    );

    return (
        <div className="bg-[#F4DBD8] min-h-screen font-serif text-[#2A0800]">
            <main className="max-w-6xl mx-auto pt-4">
                {currentArtIndex !== null ? renderAiInstructorView() : (activeFolder === null ?
                    <div className="flex flex-col md:flex-row justify-center items-center gap-12 mt-20">
                        {folders.map(folder => (
                            <div key={folder.id} className="flex flex-col items-center cursor-pointer group" onClick={() => setActiveFolder(folder.id)}>
                                <div className="w-56 h-44 bg-[#BEA8A7] border-2 border-[#775144] shadow-md flex items-center justify-center mb-4 transition-transform group-hover:scale-105">
                                    <svg className="w-32 h-32 text-[#775144]/40" fill="currentColor" viewBox="0 0 20 20">
                                        <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
                                    </svg>
                                </div>
                                <span className="text-2xl font-bold italic text-[#775144]">{folder.title}</span>
                            </div>
                        ))}
                    </div>
                    : renderFolderView())}
            </main>
        </div>
    );
};

export default GalleryPage;