import React, { useState, useEffect } from 'react';
import { Folder, FileText, ArrowLeft, Download } from 'lucide-react';
import API from '../api/axiosConfig';

const GalleryPage = () => {
    // Стани для навігації між папками
    const [currentFolder, setCurrentFolder] = useState('main'); // 'main', 'my-arts', 'processed', 'references'
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const userId = localStorage.getItem('userId');

    useEffect(() => {
        if (userId) fetchGalleryData();
    }, [userId]);

    const fetchGalleryData = async () => {
        try {
            const res = await API.get(`/arts/${userId}`);
            setItems(res.data);
            setLoading(false);
        } catch (err) {
            console.error("Помилка завантаження галереї:", err);
            setLoading(false);
        }
    };

    // Фільтрація контенту за папками
    const unprocessedArts = items.filter(item => item.status === 'pending');
    const processedArts = items.filter(item => item.status === 'completed');

    // Головний екран з папками (Фото 4)
    const MainFolders = () => (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 p-10">
            <div onClick={() => setCurrentFolder('my-arts')} className="hand-drawn-card p-10 cursor-pointer flex flex-col items-center hover:scale-105 transition-transform">
                <Folder size={80} className="text-[--color-dark]" />
                <span className="font-bold mt-4 text-xl">My Drawings</span>
            </div>
            <div onClick={() => setCurrentFolder('processed')} className="hand-drawn-card p-10 cursor-pointer flex flex-col items-center hover:scale-105 transition-transform">
                <Folder size={80} className="text-[--color-dark]" />
                <span className="font-bold mt-4 text-xl">Processed</span>
            </div>
            <div onClick={() => setCurrentFolder('references')} className="hand-drawn-card p-10 cursor-pointer flex flex-col items-center hover:scale-105 transition-transform">
                <Folder size={80} className="text-[--color-dark]" />
                <span className="font-bold mt-4 text-xl">References for AI</span>
            </div>
        </div>
    );

    // Сітка зображень у папці (Фото 5 та 6)
    const FolderView = ({ title, data, isProcessed }) => (
        <div className="p-4">
            <div className="flex justify-between items-center mb-6 border-b-4 border-[--color-dark] pb-2">
                <div className="flex items-center gap-4">
                    <button onClick={() => setCurrentFolder('main')} className="p-2 hover:bg-[--color-accent] rounded-full">
                        <ArrowLeft size={32} />
                    </button>
                    <h2 className="text-2xl font-bold italic">Folder: "{title}"</h2>
                </div>
                <div className="flex items-center gap-2">
                    <span className="font-bold">Download</span>
                    <div className="w-8 h-8 bg-[--color-primary] border-2 border-[--color-dark] rounded-sm"></div>
                </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {data.map((item) => (
                    <div key={item._id} className="flex flex-col items-center">
                        <div className="hand-drawn-card p-2 bg-white w-full aspect-square overflow-hidden">
                            <img
                                src={`https://ai-planner-fiqg.onrender.com/${isProcessed ? 'results/' + item.processedPath : 'uploads/' + item.originalPath}`}
                                alt="art"
                                className="w-full h-full object-cover"
                            />
                        </div>
                        <span className="mt-2 font-bold text-sm truncate w-full text-center">
              {item.originalPath.split('-').pop()}
            </span>
                        {isProcessed && (
                            <div className="flex gap-2 mt-1">
                                <FileText size={20} className="text-[--color-dark] cursor-pointer" title="View feedback.txt" />
                            </div>
                        )}
                    </div>
                ))}

                {/* Іконка текстового файлу, якщо вона є в папці (Фото 6) */}
                {isProcessed && data.length > 0 && (
                    <div className="flex flex-col items-center">
                        <div className="hand-drawn-card p-4 bg-white w-full aspect-square flex items-center justify-center">
                            <FileText size={64} className="text-[--color-deep]" />
                        </div>
                        <span className="mt-2 font-bold text-sm">Description_1.txt</span>
                    </div>
                )}
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-[--color-secondary]/30">
            {loading ? (
                <div className="text-center p-20 font-bold text-2xl">Loading Gallery...</div>
            ) : (
                <>
                    {currentFolder === 'main' && <MainFolders />}
                    {currentFolder === 'my-arts' && (
                        <FolderView title="My Arts" data={unprocessedArts} isProcessed={false} />
                    )}
                    {currentFolder === 'processed' && (
                        <FolderView title="Processed" data={processedArts} isProcessed={true} />
                    )}
                    {currentFolder === 'references' && (
                        <div className="p-10 text-center font-bold">Папка з референсами порожня.</div>
                    )}
                </>
            )}
        </div>
    );
};

export default GalleryPage;