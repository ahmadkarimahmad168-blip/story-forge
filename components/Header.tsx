import React from 'react';
import { Icon } from './Icon';

interface HeaderProps {
    onNewStory: () => void;
    onOpenArchive: () => void;
    onNavigate: (page: 'main') => void;
    onOpenApiKeyModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onNewStory, onOpenArchive, onNavigate, onOpenApiKeyModal }) => {
    return (
        <header className="text-center relative py-4">
            <div 
                className="flex items-center justify-center gap-4 cursor-pointer"
                onClick={() => onNavigate('main')}
                title="العودة إلى الصفحة الرئيسية"
            >
                <Icon name="logo" className="w-16 h-16 text-amber-400" />
                <div>
                    <h1 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-300 to-amber-500">
                        StoryForge AI
                    </h1>
                    <h2 className="text-2xl font-bold text-gray-400 mt-1">صانع الحكايات السينمائية</h2>
                </div>
            </div>
            <p className="mt-4 max-w-3xl mx-auto text-lg text-gray-300">
                حوّل أفكارك إلى قصص عربية ملحمية, مصممة للرواية الصوتية والمرئية على يوتيوب.
            </p>
            <div className="absolute top-0 right-0 flex items-center gap-2">
                <button
                    onClick={onNewStory}
                    title="قصة جديدة"
                    className="p-2 text-gray-400 hover:text-amber-400 transition-colors duration-300"
                    aria-label="Create a new story"
                >
                    <Icon name="document" className="w-7 h-7" />
                </button>
                <button
                    onClick={onOpenArchive}
                    title="قصصي المحفوظة"
                    className="p-2 text-gray-400 hover:text-amber-400 transition-colors duration-300"
                    aria-label="View my stories"
                >
                    <Icon name="folder" className="w-7 h-7" />
                </button>
            </div>
            <div className="absolute top-0 left-0 flex items-center">
                <button
                    onClick={onOpenApiKeyModal}
                    title="إعدادات مفتاح API"
                    className="p-2 text-gray-400 hover:text-amber-400 transition-colors duration-300"
                    aria-label="API Key Settings"
                >
                    <Icon name="key" className="w-7 h-7" />
                </button>
            </div>
        </header>
    );
};
