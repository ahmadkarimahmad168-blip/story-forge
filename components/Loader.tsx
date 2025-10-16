import React from 'react';

interface LoaderProps {
    message: string;
}

export const Loader: React.FC<LoaderProps> = ({ message }) => {
    return (
        <div className="fixed inset-0 bg-black/80 flex flex-col items-center justify-center z-50 backdrop-blur-sm">
            <div className="w-24 h-24 border-8 border-dashed rounded-full animate-spin border-amber-500"></div>
            <p className="text-white text-2xl font-bold mt-8 text-center px-4">{message}</p>
        </div>
    );
};