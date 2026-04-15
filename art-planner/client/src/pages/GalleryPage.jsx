import React, { useState, useEffect, useRef } from 'react';
import API from '../api/axiosConfig';

const GalleryPage = () => {
    const [activeFolder, setActiveFolder] = useState(null);
    const [arts, setArts] = useState([]);
    const [loading, setLoading] = useState(false); // Тепер використовується

    const [currentArtIndex, setCurrentArtIndex] = useState(null);
    const [userPrompt, setUserPrompt] = useState('');
    const [isAnalyzing, setIsAnalyzing] = useState(false); // Тепер використовується

    const fileInputRef = useRef(null);
    const userId = localStorage.getItem('userId');
    const username = localStorage.getItem('username') || 'User';

    const folders = [
        { id: 'myArts', title: 'My Arts' },
        { id: 'processed', title: 'Processed' },
        { id: 'references', title: 'References for AI' }
    ];

    const fetchArts = async () => {
        if (!userId) return;
        try {
            const res = await API.get(`/arts/${userId}`);
            setArts(res.data);
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
            const base64String = reader.result;
            try {
                setLoading(true); // Початок завантаження
                const res = await API.post('/upload', { image: base64String, userId });
                setArts(prev => [res.data, ...prev]);
            } catch (err) {
                alert("Помилка завантаження");
            } finally {
                setLoading(false); // Завершення завантаження
            }
        };
    };

    const handleAskAI = async () => {
        if (!userPrompt.trim()) return alert("Напишіть запит");

        try {
            setIsAnalyzing(true); // Використання setIsAnalyzing
            // Тут буде логіка виклику AI роута
            console.log("Analyzing art index:", currentArtIndex);
        } catch (err) {
            alert("AI Error");
        } finally {
            setIsAnalyzing(false); // Скидання стану
        }
    };

    const nextArt = () => setCurrentArtIndex(prev => (prev + 1) % arts.length);
    const prevArt = () => setCurrentArtIndex(prev => (prev - 1 + arts.length) % arts.length);

    const renderMainView = () => (
        <div className="flex flex-col md:flex-row justify-center items-center gap-12 mt-16">
            {folders.map(folder => (
                <div key={folder.id} className="flex flex-col items-center cursor-pointer group" onClick={() => setActiveFolder(folder.id)}>
                    <div className="w-56 h-44 bg-[#F5E6DA] border-2 border-[#6B4E41] shadow-md flex items-center justify-center mb-4 transition-transform group-hover:scale-105">
                        <svg className="w-32 h-32 text-[#6B4E41]/40" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
                        </svg>
                    </div>
                    <span className="text-2xl font-bold italic text-[#6B4E41]">{folder.title}</span>
                </div>
            ))}
        </div>
    );

    const renderAiInstructorView = () => {
        const currentArt = arts[currentArtIndex];
        return (
            <div className="max-w-5xl mx-auto mt-5">
                <div className="bg-[#F5E6DA] p-3 text-center border-b-2 border-black mb-1">
                    <h2 className="text-3xl font-bold italic">Name of downloaded photo</h2>
                </div>

                <div className="flex flex-col md:flex-row h-[600px] gap-1">
                    <div className="flex-[2] bg-[#2A0F08] relative flex items-center justify-center p-10 border-2 border-black">
                        <button onClick={prevArt} className="absolute left-4 w-12 h-20 bg-[#8B7369] border-2 border-black text-4xl flex items-center justify-center hover:bg-[#6B4E41]">{"<"}</button>
                        <img src={currentArt.originalPath} alt="Current" className="max-w-full max-h-full object-contain" />
                        <button onClick={nextArt} className="absolute right-4 w-12 h-20 bg-[#8B7369] border-2 border-black text-4xl flex items-center justify-center hover:bg-[#6B4E41]">{">"}</button>
                    </div>

                    <div className="flex-1 bg-[#A1867A] p-6 border-2 border-black flex flex-col justify-end gap-4">
                        <textarea
                            value={userPrompt}
                            onChange={(e) => setUserPrompt(e.target.value)}
                            placeholder="Напишіть запит..."
                            className="w-full h-24 p-3 bg-white/50 border-2 border-black rounded-lg resize-none font-bold"
                        />
                        <button
                            onClick={handleAskAI}
                            disabled={isAnalyzing} // Кнопка неактивна під час аналізу
                            className={`w-full py-3 border-2 border-black rounded-full text-2xl font-bold italic transition-all ${isAnalyzing ? 'bg-gray-400' : 'bg-[#C4B1A8] hover:bg-[#b39d93]'}`}
                        >
                            {isAnalyzing ? 'Analyzing...' : 'Ask AI'}
                        </button>
                    </div>
                </div>
                <button onClick={() => setCurrentArtIndex(null)} className="mt-4 text-[#6B4E41] font-bold underline">← Назад</button>
            </div>
        );
    };

    const renderFolderView = () => (
        <div className="w-full">
            <header className="bg-[#F5E6DA] p-6 border-b-4 border-[#6B4E41] mb-8">
                <div className="flex justify-between items-center max-w-6xl mx-auto">
                    <h1 className="text-4xl font-bold italic text-[#6B4E41]">Welcome, {username}</h1>
                    <nav className="flex gap-8 text-xl font-bold text-[#6B4E41]">
                        <button className="hover:underline">Planer</button>
                        <button className="hover:underline">AI instructor</button>
                    </nav>
                </div>
            </header>

            <div className="bg-[#6B4E41] text-[#F5E6DA] flex justify-between items-center px-10 py-3 mb-8">
                <div className="flex items-center gap-4">
                    <button onClick={() => setActiveFolder(null)} className="text-2xl font-bold">←</button>
                    <span className="text-2xl italic font-bold">Folder: "{folders.find(f => f.id === activeFolder).title}"</span>
                </div>
                <div
                    className={`flex items-center gap-3 cursor-pointer ${loading ? 'opacity-50' : ''}`}
                    onClick={() => !loading && fileInputRef.current.click()} // Заборона натискання під час завантаження
                >
                    <span className="text-xl font-bold">{loading ? 'Uploading...' : 'Download'}</span>
                    <div className="w-10 h-8 bg-[#F5E6DA] rounded flex items-center justify-center text-[#6B4E41] font-extrabold text-2xl">+</div>
                    <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleUpload} />
                </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-10 px-10">
                {arts.map((art, index) => (
                    <div key={art._id} className="flex flex-col items-center group cursor-pointer" onClick={() => setCurrentArtIndex(index)}>
                        <div className="bg-[#C4B1A8] p-2 border-2 border-[#6B4E41] w-full aspect-square overflow-hidden shadow-md group-hover:border-black transition-all">
                            <img src={art.originalPath} alt="Art" className="w-full h-full object-cover" />
                        </div>
                        <span className="mt-2 font-bold italic text-[#6B4E41]">Image_{index + 1}.png</span>
                    </div>
                ))}
            </div>
        </div>
    );

    return (
        <div className="bg-[#D9C5B2] min-h-screen font-serif text-[#2A0F08]">
            {currentArtIndex !== null ? renderAiInstructorView() : (activeFolder === null ? renderMainView() : renderFolderView())}
        </div>
    );
};

export default GalleryPage;