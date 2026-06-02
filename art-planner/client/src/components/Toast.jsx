import React, { useEffect } from 'react';

const Toast = ({ message, onClose, type = 'success' }) => {
    useEffect(() => {
        const timer = setTimeout(onClose, 3000);
        return () => clearTimeout(timer);
    }, [onClose]);

    const colors = {
        success: 'bg-[#C09891] border-[#775144]',
        error:   'bg-[#e8a09a] border-[#8B3A3A]',
        warning: 'bg-[#e8d09a] border-[#8B6A3A]',
    };

    return (
        <div className={`fixed top-6 left-1/2 -translate-x-1/2 z-[999]
            ${colors[type]} border-2 shadow-[4px_4px_0px_#2A0800]
            px-8 py-4 min-w-[300px] max-w-[500px] text-center`}>
            <p className="text-[#2A0800] font-bold text-lg italic">
                {message}
            </p>
            <button
                onClick={onClose}
                className="mt-3 px-6 py-1 bg-[#F4DBD8] border-2
                border-[#2A0800] text-[#2A0800] font-bold
                hover:bg-[#BEA8A7] transition-all"
            >
                OK
            </button>
        </div>
    );
};

export default Toast;