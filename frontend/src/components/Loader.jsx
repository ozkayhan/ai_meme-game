import React from 'react';

const Loader = ({ message = "Yükleniyor..." }) => {
    return (
        <div className="fixed inset-0 bg-slate-900/90 z-50 flex flex-col items-center justify-center">
            <div className="w-16 h-16 border-4 border-slate-700 border-t-yellow-400 rounded-full animate-spin mb-4"></div>
            <h2 className="text-2xl font-bold text-white animate-pulse">{message}</h2>
        </div>
    );
};

export default Loader;
