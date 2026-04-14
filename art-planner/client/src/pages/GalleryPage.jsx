import React, { useState } from 'react';

const GalleryPage = () => {
    // Стан для відстеження поточної відкритої папки (null = головна сторінка)
    const [activeFolder, setActiveFolder] = useState(null);

    // Дані для папок (опис "додати" з'являтиметься при наведенні)
    const folders = [
        { id: 'myArts', title: 'My Arts', description: 'додати' },
        { id: 'processed', title: 'Processed', description: 'додати' },
        { id: 'references', title: 'References for AI', description: 'додати' }
    ];

    // Тимчасові дані для відображення сітки малюнків (поки не підключили бекенд)
    const mockImages = {
        myArts: [
            { id: 1, name: 'Hyunjin.png', src: 'https://via.placeholder.com/150/4A3B32/FFFFFF?text=Hyunjin' },
            { id: 2, name: 'Paint.jpeg', src: 'https://via.placeholder.com/150/4A3B32/FFFFFF?text=Paint' },
            { id: 3, name: 'Pencil.jpeg', src: 'https://via.placeholder.com/150/4A3B32/FFFFFF?text=Pencil' },
            { id: 4, name: 'Image4.jpeg', src: 'https://via.placeholder.com/150/4A3B32/FFFFFF?text=Image4' },
            { id: 5, name: 'Image5.jpeg', src: 'https://via.placeholder.com/150/4A3B32/FFFFFF?text=Image5' },
        ],
        processed: [
            { id: 1, name: 'Hyunjin_AI.png', src: 'https://via.placeholder.com/150/775144/FFFFFF?text=AI+Lines' },
            { id: 2, name: 'Paint_AI.jpeg', src: 'https://via.placeholder.com/150/775144/FFFFFF?text=AI+Lines' },
            { id: 3, name: 'Description_1.txt', src: 'https://via.placeholder.com/150/FFFFFF/000000?text=TXT+File' }, // Іконка файлу
        ],
        references: []
    };

    // Компонент головного вигляду (Папки)
    const renderMainView = () => (
        <div className="flex justify-center items-start gap-12 mt-16">
            {folders.map(folder => (
                <div
                    key={folder.id}
                    className="flex flex-col items-center cursor-pointer group relative"
                    onClick={() => setActiveFolder(folder.id)}
                >
                    {/* Іконка папки */}
                    <div className="w-48 h-40 bg-white border-2 border-dark shadow-sm flex items-center justify-center mb-4 transition-transform group-hover:scale-105">
                        <svg className="w-32 h-32 text-primary" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
                        </svg>
                    </div>
                    <span className="text-2xl font-bold italic">{folder.title}</span>

                    {/* Hover Tooltip (Опис папки) */}
                    <div className="absolute top-[110%] opacity-0 group-hover:opacity-100 transition-opacity bg-dark text-white text-sm px-3 py-1 rounded-md pointer-events-none z-10 whitespace-nowrap">
                        {folder.description}
                    </div>
                </div>
            ))}
        </div>
    );

    // Компонент вигляду всередині папки
    const renderFolderView = () => {
        const folderData = folders.find(f => f.id === activeFolder);
        const images = mockImages[activeFolder] || [];

        return (
            <div className="w-full">
                {/* Верхня панель (Header папки) */}
                <div className="bg-[#6B4E41] text-primary/90 flex justify-between items-center px-10 py-4 mb-10">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setActiveFolder(null)}
                            className="text-2xl font-bold hover:scale-110 transition-transform"
                            title="Back to folders"
                        >
                            ←
                        </button>
                        <h2 className="text-2xl italic font-bold">Folder: "{folderData.title}"</h2>
                    </div>

                    {/* Кнопка Download/Upload (тільки для My Arts) */}
                    {activeFolder === 'myArts' && (
                        <div className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity">
                            <span className="text-xl">Download</span>
                            <div className="w-10 h-8 bg-primary rounded flex items-center justify-center">
                                {/* Маленька іконка папки */}
                                <svg className="w-6 h-6 text-dark" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
                                </svg>
                            </div>
                        </div>
                    )}
                </div>

                {/* Сітка малюнків */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-x-8 gap-y-12 px-10">
                    {images.map(img => (
                        <div key={img.id} className="flex flex-col items-center">
                            <div className="bg-primary/40 p-4 border border-dark/10 shadow-sm w-full aspect-square flex items-center justify-center mb-3">
                                <img src={img.src} alt={img.name} className="max-w-full max-h-full object-contain" />
                            </div>
                            <span className="text-lg font-bold italic">{img.name}</span>
                        </div>
                    ))}
                    {images.length === 0 && (
                        <div className="col-span-full text-center text-xl italic opacity-50">
                            Папка порожня
                        </div>
                    )}
                </div>
            </div>
        );
    };

    return (
        <div className="bg-secondary min-h-screen font-hand text-dark pb-20">
            {/* Контент сторінки */}
            <main className="max-w-6xl mx-auto pt-10">
                {activeFolder === null ? renderMainView() : renderFolderView()}
            </main>
        </div>
    );
};

export default GalleryPage;