import React, { useState, useEffect, useRef } from 'react';
import API from '../api/axiosConfig';

const GalleryPage = () => {
    const [activeFolder, setActiveFolder] = useState(null);
    const [arts, setArts] = useState([]); // Дані з бази
    const [loading, setLoading] = useState(false);

    const fileInputRef = useRef(null);
    const userId = localStorage.getItem('userId');

    const folders = [
        { id: 'myArts', title: 'My Arts', description: 'додати' },
        { id: 'processed', title: 'Processed', description: 'додати' },
        { id: 'references', title: 'References for AI', description: 'додати' }
    ];

    // Завантаження малюнків з бекенду
    const fetchArts = async () => {
        if (!userId) return;
        try {
            const res = await API.get(`/arts/${userId}`);
            setArts(res.data);
        } catch (err) {
            console.error("Помилка завантаження малюнків:", err);
        }
    };

    useEffect(() => {
        fetchArts();
    }, [userId]);

    // Логіка відправки файлу на сервер
    const handleUpload = async (e) => {
        const file = e.target.files[0];
        if (!file || !userId) return;

        const formData = new FormData();
        formData.append('image', file);
        formData.append('userId', userId);

        try {
            setLoading(true);
            // Відправляємо на твій існуючий роут /api/upload
            const res = await API.post('/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            // Додаємо новий малюнок у стейт, щоб він одразу з'явився на екрані
            setArts(prev => [...prev, res.data]);
        } catch (err) {
            alert("Помилка завантаження файлу. Перевір чи працює сервер.");
        } finally {
            setLoading(false);
            e.target.value = null; // Очищаємо інпут
        }
    };

    const renderMainView = () => (
        // АДАПТИВНІСТЬ: flex-col для телефону, md:flex-row для ПК
        <div className="flex flex-col md:flex-row justify-center items-center gap-8 md:gap-12 mt-16">
            {folders.map(folder => (
                <div
                    key={folder.id}
                    className="flex flex-col items-center cursor-pointer group relative"
                    onClick={() => setActiveFolder(folder.id)}
                >
                    <div className="w-48 h-40 bg-white border-2 border-dark shadow-sm flex items-center justify-center mb-4 transition-transform group-hover:scale-105">
                        <svg className="w-32 h-32 text-primary" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
                        </svg>
                    </div>
                    <span className="text-2xl font-bold italic">{folder.title}</span>

                    <div className="absolute top-[110%] opacity-0 group-hover:opacity-100 transition-opacity bg-dark text-white text-sm px-3 py-1 rounded-md pointer-events-none z-10 whitespace-nowrap">
                        {folder.description}
                    </div>
                </div>
            ))}
        </div>
    );

    const renderFolderView = () => {
        const folderData = folders.find(f => f.id === activeFolder);

        // Фільтруємо малюнки залежно від папки
        const folderArts = activeFolder === 'myArts'
            ? arts // Всі оригінальні завантажені малюнки
            : arts.filter(art => art.status === 'processed'); // Тільки оброблені ШІ

        return (
            <div className="w-full">
                <div className="bg-[#6B4E41] text-primary/90 flex justify-between items-center px-6 md:px-10 py-4 mb-10">
                    <div className="flex items-center gap-4">
                        <button onClick={() => setActiveFolder(null)} className="text-2xl font-bold hover:scale-110">←</button>
                        <h2 className="text-xl md:text-2xl italic font-bold">Folder: "{folderData.title}"</h2>
                    </div>

                    {/* Кнопка Upload (Лише для My Arts) */}
                    {activeFolder === 'myArts' && (
                        <div
                            className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity"
                            onClick={() => fileInputRef.current.click()}
                        >
                            <span className="text-lg md:text-xl font-bold">{loading ? 'Uploading...' : 'Upload'}</span>
                            <div className="w-10 h-8 bg-primary rounded flex items-center justify-center">
                                <span className="text-dark font-bold text-xl leading-none mb-1">+</span>
                            </div>
                            <input
                                type="file"
                                ref={fileInputRef}
                                className="hidden"
                                accept="image/*"
                                onChange={handleUpload}
                            />
                        </div>
                    )}
                </div>

                {/* Сітка малюнків (БЕЗ іконок-заглушок, тільки самі картинки та назви) */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-x-8 md:gap-y-12 px-6 md:px-10">
                    {folderArts.map(art => (
                        <div key={art._id} className="flex flex-col items-center">
                            <div className="bg-primary/40 p-2 border border-dark/10 shadow-sm w-full aspect-square flex items-center justify-center mb-3 overflow-hidden">
                                {/* Показуємо реальний малюнок з сервера */}
                                <img
                                    src={`http://localhost:5000/uploads/${art.originalPath}`}
                                    alt="Art"
                                    className="w-full h-full object-cover"
                                    onError={(e) => e.target.style.display = 'none'} // Ховаємо, якщо картинка не завантажилась
                                />
                            </div>
                            {/* Відображаємо оригінальну назву файлу, обрізаючи дату, яку додає multer */}
                            <span className="text-sm md:text-lg font-bold italic truncate w-full text-center">
                                {art.originalPath ? art.originalPath.split('-').pop() : 'Image'}
                            </span>
                        </div>
                    ))}

                    {folderArts.length === 0 && (
                        <div className="col-span-full text-center text-xl italic opacity-50 mt-10">
                            Папка порожня. Завантажте свій перший малюнок!
                        </div>
                    )}
                </div>
            </div>
        );
    };

    return (
        <div className="bg-secondary min-h-screen font-hand text-dark pb-20">
            <main className="max-w-6xl mx-auto pt-10">
                {activeFolder === null ? renderMainView() : renderFolderView()}
            </main>
        </div>
    );
};

export default GalleryPage;