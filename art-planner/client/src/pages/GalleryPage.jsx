import React, { useState, useEffect, useRef } from 'react';
import API from '../api/axiosConfig';

const GalleryPage = ({ showToast }) => {
    const [activeFolder, setActiveFolder] = useState(null);
    const [arts, setArts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [currentArtIndex, setCurrentArtIndex] = useState(null);
    const [userPrompt, setUserPrompt] = useState('');
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [hoveredAnnotation, setHoveredAnnotation] = useState(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [artToDelete, setArtToDelete] = useState(null);
    const [hoveredFolder, setHoveredFolder] = useState(null); // Стан для підказок папок

    const fileInputRef = useRef(null);
    const userId = localStorage.getItem('userId');

    const folders = [
        {
            id: 'myArts',
            title: 'My Arts',
            description: "Завантаж малюнок для обробки АІ-інструктором та отримання підказок."
        },
        {
            id: 'processed',
            title: 'Processed',
            description: "Тут зберігаються результати обробки зображень нейромережею."
        }
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
                showToast("Помилка завантаження файлу", 'error');
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
            showToast("Помилка при видаленні", 'error');
        }
    };

    const nextArt = () => setCurrentArtIndex(prev => (prev + 1) % arts.length);
    const prevArt = () => setCurrentArtIndex(prev => (prev - 1 + arts.length) % arts.length);

    const handleAskAI = async () => {
        if (!userPrompt.trim()) {
            showToast("Будь ласка, напишіть, що саме вас цікавить.", 'warning');
            return;
        }
        setIsAnalyzing(true);

        try {
            const currentArt = arts[currentArtIndex];
            await API.post('/ai/analyze', {
                artId: currentArt._id,
                prompt: userPrompt
            });
            await fetchArts();
            setUserPrompt('');
            setCurrentArtIndex(null);
            setActiveFolder('processed');
            showToast("Аналіз завершено! Перевірте папку Processed.", 'success');

        } catch (err) {
            if (err.response?.status === 429) {
                showToast("Ваш попередній запит ще обробляється. Зачекайте кілька секунд.", 'warning');
            } else if (err.response?.status === 503) {
                showToast("ШІ наразі перевантажений. Спробуйте через 1-2 хвилини.", 'warning');
            } else {
                showToast("Помилка при аналізі малюнку ШІ", 'error');
            }
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
        let aiData = null;
        if (currentArt?.status === 'processed' && currentArt.processedPath) {
            try { aiData = JSON.parse(currentArt.processedPath); }
            catch (e) { console.error("Error parsing AI JSON:", e); }
        }

        // Рендер тексту з markdown-секціями
        const renderAnalysisText = (text) => {
            if (!text) return null;
            return text.split('\n').map((line, i) => {
                if (line.startsWith('## ')) {
                    return (
                        <p key={i} className="font-bold text-[#2A0800] text-base mt-3 mb-1 border-b border-[#775144]">
                            {line.replace('## ', '')}
                        </p>
                    );
                }
                if (line.startsWith('- ')) {
                    return (
                        <p key={i} className="text-[#2A0800] text-sm pl-3">
                            • {line.replace('- ', '')}
                        </p>
                    );
                }
                if (line.trim() === '') return <br key={i} />;
                return <p key={i} className="text-[#2A0800] text-sm">{line}</p>;
            });
        };

        return (
            <div className="max-w-5xl mx-auto mt-2 relative">

                <div className="bg-[#F4DBD8] p-3 text-center border-b-2 border-[#2A0800] mb-1">
                    <h2 className="text-3xl font-bold italic text-[#2A0800]">
                        {currentArt?.customName || "Loading..."}
                    </h2>
                </div>

                <div className="flex flex-col md:flex-row h-[550px] gap-1">

                    {/* Ліва частина — зображення з SVG розміткою */}
                    <div className="flex-[2] bg-[#2A0800] relative flex items-center justify-center p-10 border-2 border-[#2A0800] overflow-hidden">
                        <button
                            onClick={prevArt}
                            className="absolute left-4 z-50 w-12 h-20 bg-[#BEA8A7] border-2 border-[#2A0800] text-[#2A0800] text-4xl hover:bg-[#C09891]"
                        >{"<"}</button>

                        {currentArt && (
                            <div className="relative inline-block" style={{ maxWidth: '100%', maxHeight: '100%' }}>
                                <img
                                    src={currentArt.originalPath}
                                    alt="Art"
                                    className="block max-w-full max-h-[450px] object-contain shadow-2xl"
                                />
                                {aiData && (
                                    <svg
                                        className="absolute inset-0"
                                        style={{ width: '100%', height: '100%', pointerEvents: 'none' }}
                                    >
                                        {/* Структурні лінії */}
                                        {aiData.lines?.map((line, index) => (
                                            <g key={`line-${index}`} style={{ pointerEvents: 'auto' }}>
                                                {/* Невидима широка зона для hover */}
                                                <line
                                                    x1={`${line.x1}%`} y1={`${line.y1}%`}
                                                    x2={`${line.x2}%`} y2={`${line.y2}%`}
                                                    stroke="transparent" strokeWidth="14"
                                                />
                                                {/* Видима лінія */}
                                                <line
                                                    x1={`${line.x1}%`} y1={`${line.y1}%`}
                                                    x2={`${line.x2}%`} y2={`${line.y2}%`}
                                                    stroke={line.color || "rgba(255,0,0,0.7)"}
                                                    strokeWidth="2"
                                                >
                                                    <title>{line.label || "Структурна лінія"}</title>
                                                </line>
                                                {/* Підпис при hover через foreignObject */}
                                                {line.label && (
                                                    <text
                                                        x={`${(line.x1 + line.x2) / 2}%`}
                                                        y={`${(line.y1 + line.y2) / 2 - 2}%`}
                                                        fill="white"
                                                        fontSize="11"
                                                        fontWeight="bold"
                                                        textAnchor="middle"
                                                        style={{
                                                            paintOrder: 'stroke',
                                                            stroke: '#2A0800',
                                                            strokeWidth: '3px',
                                                            pointerEvents: 'none'
                                                        }}
                                                    >
                                                        {line.label}
                                                    </text>
                                                )}
                                            </g>
                                        ))}

                                        {/* Прямокутники зон */}
                                        {aiData.rectangles?.map((rect, index) => (
                                            <g key={`rect-${index}`} style={{ pointerEvents: 'auto' }}>
                                                <rect
                                                    x={`${rect.x}%`}
                                                    y={`${rect.y}%`}
                                                    width={`${rect.width}%`}
                                                    height={`${rect.height}%`}
                                                    fill={rect.color || "rgba(255,165,0,0.2)"}
                                                    stroke={rect.color?.replace('0.5', '1') || "rgba(255,165,0,1)"}
                                                    strokeWidth="1.5"
                                                    strokeDasharray="5,3"
                                                >
                                                    <title>{rect.label || ""}</title>
                                                </rect>
                                                {rect.label && (
                                                    <text
                                                        x={`${rect.x + rect.width / 2}%`}
                                                        y={`${rect.y + 4}%`}
                                                        fill="white"
                                                        fontSize="11"
                                                        fontWeight="bold"
                                                        textAnchor="middle"
                                                        style={{
                                                            paintOrder: 'stroke',
                                                            stroke: '#2A0800',
                                                            strokeWidth: '3px',
                                                            pointerEvents: 'none'
                                                        }}
                                                    >
                                                        {rect.label}
                                                    </text>
                                                )}
                                            </g>
                                        ))}

                                        {/* Анотації — точки з tooltip при hover */}
                                        {aiData.annotations?.map((ann, index) => (
                                            <g
                                                key={`ann-${index}`}
                                                style={{ pointerEvents: 'auto', cursor: 'help' }}
                                                onMouseEnter={() => setHoveredAnnotation(index)}
                                                onMouseLeave={() => setHoveredAnnotation(null)}
                                            >
                                                {/* Зовнішнє кільце — тільки при hover */}
                                                <circle
                                                    cx={`${ann.pointer_x}%`}
                                                    cy={`${ann.pointer_y}%`}
                                                    r="12"
                                                    fill="rgba(255,0,0,0.15)"
                                                    stroke="red"
                                                    strokeWidth="1"
                                                    opacity={hoveredAnnotation === index ? 1 : 0}
                                                    style={{ transition: 'opacity 0.2s' }}
                                                />
                                                {/* Сама точка — завжди видима */}
                                                <circle
                                                    cx={`${ann.pointer_x}%`}
                                                    cy={`${ann.pointer_y}%`}
                                                    r="6"
                                                    fill="red"
                                                    opacity="0.9"
                                                />
                                                {/* Текст — тільки при hover */}
                                                {hoveredAnnotation === index && (
                                                    <text
                                                        x={`${ann.pointer_x}%`}
                                                        y={`${ann.pointer_y - 5}%`}
                                                        fill="white"
                                                        fontSize="11"
                                                        fontWeight="bold"
                                                        textAnchor="middle"
                                                        style={{
                                                            paintOrder: 'stroke',
                                                            stroke: '#2A0800',
                                                            strokeWidth: '3px',
                                                            pointerEvents: 'none'
                                                        }}
                                                    >
                                                        {ann.text}
                                                    </text>
                                                )}
                                            </g>
                                        ))}
                                    </svg>
                                )}
                            </div>
                        )}

                        <button
                            onClick={nextArt}
                            className="absolute right-4 z-50 w-12 h-20 bg-[#BEA8A7] border-2 border-[#2A0800] text-[#2A0800] text-4xl hover:bg-[#C09891]"
                        >{">"}</button>
                    </div>

                    {/* Права частина — текст аналізу або форма запиту */}
                    <div className="flex-1 bg-[#BEA8A7] p-4 border-2 border-[#2A0800] flex flex-col gap-3">
                        {aiData ? (
                            <div className="flex flex-col h-full gap-2">
                                <div className="bg-[#C09891] px-3 py-2 border border-[#775144] text-center">
                                <span className="text-[#2A0800] font-bold text-sm">
                                    Аналіз від ШІ-інструктора
                                </span>
                                </div>
                                <div className="flex-1 bg-[#F4DBD8]/90 p-3 border-2 border-[#2A0800] overflow-y-auto shadow-inner leading-relaxed">
                                    {renderAnalysisText(aiData.analysis_text)}
                                </div>
                                <div className="text-xs italic text-[#2A0800] text-center opacity-70">
                                    * Наведіть на червоні точки або зони для деталей
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col h-full justify-end gap-3">
                                <div className="bg-[#C09891] p-3 rounded-md text-[#2A0800] text-sm border border-[#775144]">
                                    Очікує на ваш запит
                                </div>
                                <textarea
                                    value={userPrompt}
                                    onChange={(e) => setUserPrompt(e.target.value)}
                                    placeholder="Напишіть, що саме перевірити..."
                                    className="w-full h-32 p-3 bg-[#F4DBD8]/50 border-2 border-[#2A0800] rounded-lg resize-none font-bold text-[#2A0800] focus:outline-none"
                                />
                                <button
                                    onClick={handleAskAI}
                                    disabled={isAnalyzing}
                                    className={`w-full py-4 border-2 border-[#2A0800] rounded-full text-2xl font-bold italic text-[#2A0800] transition-all flex items-center justify-center gap-3 ${isAnalyzing ? 'bg-gray-400 cursor-wait' : 'bg-[#C09891] hover:bg-[#BEA8A7]'}`}
                                >
                                    {isAnalyzing ? "Analyzing..." : "Ask AI"}
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                <button
                    onClick={() => setCurrentArtIndex(null)}
                    className="mt-4 text-[#775144] font-bold underline hover:text-[#2A0800]"
                >
                    ← Назад до галереї
                </button>
            </div>
        );
    };

    const renderFolderView = () => {
        const folderArts = activeFolder === 'myArts' ? arts.filter(a => a.status === 'pending') : arts.filter(a => a.status === 'processed');
        return (
            <div className="w-full">
                <div className="bg-[#775144] text-[#F4DBD8] flex justify-between items-center px-10 py-3 mb-8 shadow-lg">
                    <div className="flex items-center gap-4">
                        <button onClick={() => setActiveFolder(null)} className="text-2xl font-bold">←</button>
                        <span className="text-2xl italic font-bold">Folder: "{folders.find(f => f.id === activeFolder)?.title}"</span>
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
                        <div key={art._id} className="flex flex-col items-center group cursor-pointer" onClick={() => setCurrentArtIndex(arts.indexOf(art))}>
                            <div className="bg-[#BEA8A7] p-2 border-2 border-[#775144] w-full aspect-square overflow-hidden shadow-md relative group-hover:border-[#2A0800] transition-all">
                                <button onClick={(e) => handleDeleteClick(e, art)} className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 z-20 bg-[#F4DBD8] border border-[#2A0800] p-1"><svg className="w-5 h-5 text-[#2A0800]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
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

                {currentArtIndex !== null ? renderAiInstructorView() : (activeFolder === null ? (
                    <div className="flex flex-col items-center mt-20">
                        {/* Контейнер папок */}
                        <div className="flex flex-col md:flex-row justify-center items-center gap-12">
                            {folders.map(folder => (
                                <div
                                    key={folder.id}
                                    className="flex flex-col items-center cursor-pointer group"
                                    onClick={() => setActiveFolder(folder.id)}
                                    onMouseEnter={() => setHoveredFolder(folder.id)}
                                    onMouseLeave={() => setHoveredFolder(null)}
                                >
                                    <div className="w-56 h-44 bg-[#BEA8A7] border-2 border-[#775144] shadow-md flex items-center justify-center mb-4 transition-all group-hover:scale-105 group-hover:bg-[#C09891] group-hover:border-[#2A0800]">
                                        <svg className="w-32 h-32 text-[#775144]/40 group-hover:text-[#2A0800]/30" fill="currentColor" viewBox="0 0 20 20">
                                            <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
                                        </svg>
                                    </div>
                                    <span className="text-2xl font-bold italic text-[#775144] group-hover:text-[#2A0800] transition-colors">
                                        {folder.title}
                                    </span>
                                </div>
                            ))}
                        </div>

                        {/* Динамічний блок підказок (Завжди займає місце, щоб не було стрибків контенту) */}
                        <div className="mt-12 h-16 max-w-2xl text-center px-4">
                            <p className={`text-xl font-medium italic text-[#775144] transition-opacity duration-300 ${hoveredFolder ? 'opacity-100' : 'opacity-0'}`}>
                                {hoveredFolder ? folders.find(f => f.id === hoveredFolder)?.description : ''}
                            </p>
                        </div>
                    </div>
                ) : renderFolderView())}
            </main>
        </div>
    );
};

export default GalleryPage;