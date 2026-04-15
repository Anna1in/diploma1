import React, { useState, useEffect, useRef } from 'react';
import API from '../api/axiosConfig';

const GalleryPage = () => {
    const [activeFolder, setActiveFolder] = useState(null);
    const [arts, setArts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [currentArtIndex, setCurrentArtIndex] = useState(null);
    const [userPrompt, setUserPrompt] = useState(''); // Використовується в чаті AI
    const [isAnalyzing, setIsAnalyzing] = useState(false); // Використовується для блокування кнопки

    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [artToDelete, setArtToDelete] = useState(null);

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
            // Сортуємо: старі малюнки спочатку для коректної нумерації Image_1, Image_2
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
                alert("Upload error");
            } finally {
                setLoading(false);
            }
        };
    };

    const handleDeleteClick = (e, art) => {
        e.stopPropagation();
        setArtToDelete(art);
        setShowDeleteModal(true);
    };

    const confirmDelete = async () => {
        try {
            await API.delete(`/arts/${artToDelete._id}`);
            setArts(prev => prev.filter(a => a._id !== artToDelete._id));
            setShowDeleteModal(false);
            setArtToDelete(null);
        } catch (err) {
            alert("Помилка при видаленні");
        }
    };

    // ЛОГІКА ПЕРЕМИКАННЯ (Повернуто з минулих версій)
    const nextArt = () => setCurrentArtIndex(prev => (prev + 1) % arts.length);
    const prevArt = () => setCurrentArtIndex(prev => (prev - 1 + arts.length) % arts.length);

    const handleAskAI = async () => {
        if (!userPrompt.trim()) return alert("Напишіть запит");
        try {
            setIsAnalyzing(true); // Використання стану аналізу
            // Тут буде виклик API для AI
            console.log("Analyzing art:", arts[currentArtIndex].customName);
        } catch (err) {
            alert("AI Error");
        } finally {
            setIsAnalyzing(false);
        }
    };

    const renderDeleteModal = () => (
        <div className="fixed inset-0 bg-[#2A0800]/70 flex items-center justify-center z-50">
            <div className="bg-[#F4DBD8] border-4 border-[#2A0800] p-8 max-w-sm w-full shadow-[10px_10px_0px_#775144]">
                <h3 className="text-xl font-bold italic text-[#2A0800] text-center mb-6">
                    Чи впевнені ви в видаленні "{artToDelete?.customName}"?
                </h3>
                <div className="flex justify-center gap-6">
                    <button onClick={confirmDelete} className="bg-[#C09891] border-2 border-[#2A0800] px-6 py-2 font-bold hover:bg-[#BEA8A7] text-[#2A0800]">Так</button>
                    <button onClick={() => setShowDeleteModal(false)} className="bg-[#BEA8A7] border-2 border-[#2A0800] px-6 py-2 font-bold hover:bg-[#C09891] text-[#2A0800]">Ні</button>
                </div>
            </div>
        </div>
    );

    const renderAiInstructorView = () => {
        const currentArt = arts[currentArtIndex];
        return (
            <div className="max-w-5xl mx-auto mt-2">
                <div className="bg-[#F4DBD8] p-3 text-center border-b-2 border-[#2A0800] mb-1">
                    <h2 className="text-3xl font-bold italic text-[#2A0800]">{currentArt.customName}</h2>
                </div>

                <div className="flex flex-col md:flex-row h-[550px] gap-1">
                    {/* ФОТО ТА НАВІГАЦІЯ */}
                    <div className="flex-[2] bg-[#2A0800] relative flex items-center justify-center p-10 border-2 border-[#2A0800]">
                        <button onClick={prevArt} className="absolute left-4 w-12 h-20 bg-[#BEA8A7] border-2 border-[#2A0800] text-[#2A0800] text-4xl flex items-center justify-center hover:bg-[#C09891]">{"<"}</button>
                        <img src={currentArt.originalPath} alt="Art" className="max-w-full max-h-full object-contain shadow-2xl" />
                        <button onClick={nextArt} className="absolute right-4 w-12 h-20 bg-[#BEA8A7] border-2 border-[#2A0800] text-[#2A0800] text-4xl flex items-center justify-center hover:bg-[#C09891]">{">"}</button>
                    </div>

                    {/* ЧАТ ТА ЗАПИТ */}
                    <div className="flex-1 bg-[#BEA8A7] p-6 border-2 border-[#2A0800] flex flex-col justify-end gap-4">
                        <div className="bg-[#C09891] p-3 rounded-md text-[#2A0800] text-sm border border-[#775144]">Збережено в папці "Processed"</div>
                        <textarea
                            value={userPrompt}
                            onChange={(e) => setUserPrompt(e.target.value)} // Використання setUserPrompt
                            placeholder="Напишіть запит..."
                            className="w-full h-32 p-3 bg-[#F4DBD8]/50 border-2 border-[#2A0800] rounded-lg resize-none font-bold text-[#2A0800]"
                        />
                        <button
                            onClick={handleAskAI}
                            disabled={isAnalyzing} // Використання isAnalyzing
                            className={`w-full py-4 border-2 border-[#2A0800] rounded-full text-2xl font-bold italic text-[#2A0800] shadow-md transition-all ${isAnalyzing ? 'bg-gray-400' : 'bg-[#C09891] hover:bg-[#BEA8A7]'}`}
                        >
                            {isAnalyzing ? 'Analyzing...' : 'Ask AI'}
                        </button>
                    </div>
                </div>
                <button onClick={() => setCurrentArtIndex(null)} className="mt-4 text-[#775144] font-bold underline">← Назад до галереї</button>
            </div>
        );
    };

    const renderFolderView = () => {
        const folderArts = activeFolder === 'myArts'
            ? arts.filter(a => a.status === 'pending')
            : arts.filter(a => a.status === 'processed');

        return (
            <div className="w-full">
                <div className="bg-[#775144] text-[#F4DBD8] flex justify-between items-center px-10 py-3 mb-8 shadow-lg">
                    <div className="flex items-center gap-4">
                        <button onClick={() => setActiveFolder(null)} className="text-2xl font-bold">←</button>
                        <span className="text-2xl italic font-bold">Folder: "{folders.find(f => f.id === activeFolder).title}"</span>
                    </div>
                    {activeFolder === 'myArts' && (
                        <div className="flex items-center gap-3 cursor-pointer" onClick={() => fileInputRef.current.click()}>
                            <span className="text-xl font-bold">{loading ? 'Uploading...' : 'Download'}</span>
                            <div className="w-10 h-8 bg-[#F4DBD8] rounded flex items-center justify-center text-[#2A0800] font-extrabold text-2xl">+</div>
                            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleUpload} />
                        </div>
                    )}
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-10 px-10">
                    {folderArts.map((art) => (
                        <div key={art._id} className="flex flex-col items-center group cursor-pointer relative" onClick={() => setCurrentArtIndex(arts.indexOf(art))}>
                            <div className="bg-[#BEA8A7] p-2 border-2 border-[#775144] w-full aspect-square overflow-hidden shadow-md relative group-hover:border-[#2A0800] transition-all">
                                <div className="absolute inset-0 bg-[#2A0800]/0 group-hover:bg-[#2A0800]/20 transition-all z-10" />
                                <button onClick={(e) => handleDeleteClick(e, art)} className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 z-20 bg-[#F4DBD8] border border-[#2A0800] p-1 hover:bg-[#C09891]"><svg className="w-5 h-5 text-[#2A0800]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                                <img src={art.originalPath} alt="Art" className="w-full h-full object-cover" />
                            </div>
                            <span className="mt-2 font-bold italic text-[#2A0800]">{art.customName}</span>
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    return (
        <div className="bg-[#F4DBD8] min-h-screen font-serif text-[#2A0800]">
            <main className="max-w-6xl mx-auto pt-4">
                {showDeleteModal && renderDeleteModal()}
                {currentArtIndex !== null ? renderAiInstructorView() : (activeFolder === null ?
                    <div className="flex flex-col md:flex-row justify-center items-center gap-12 mt-20">
                        {folders.map(folder => (
                            <div key={folder.id} className="flex flex-col items-center cursor-pointer group" onClick={() => setActiveFolder(folder.id)}>
                                <div className="w-56 h-44 bg-[#BEA8A7] border-2 border-[#775144] shadow-md flex items-center justify-center mb-4 transition-transform group-hover:scale-105"><svg className="w-32 h-32 text-[#775144]/40" fill="currentColor" viewBox="0 0 20 20"><path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" /></svg></div>
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