import React, { useState } from 'react';
import { Icon } from './Icon';
import { ImageGenerationControls } from './ImageGenerationControls';
import type { Episode } from '../types';

interface ImageGenerationPanelProps {
    onGenerateScenes: () => void;
    isGenerating: boolean;
    episode: Episode;
    onGenerateAllImages: (style: string) => void;
}

export const ImageGenerationPanel: React.FC<ImageGenerationPanelProps> = ({
    onGenerateScenes,
    isGenerating,
    episode,
    onGenerateAllImages,
}) => {
    const [imageStyle, setImageStyle] = useState('cinematic');
    const prompts = episode.imageScenePrompts || [];

    if (prompts.length === 0) {
        return (
             <div className="bg-gray-800/50 p-4 rounded-xl border border-gray-700 space-y-4 text-center">
                 <h3 className="text-xl font-bold text-amber-300 flex items-center justify-center gap-3">
                    <Icon name="image" className="w-7 h-7" />
                    إنشاء الصور السينمائية
                </h3>
                 <p className="text-gray-400 max-w-2xl mx-auto">
                    انقر على الزر أدناه ليقوم الذكاء الاصطناعي بتحليل نص الحلقة واقتراح 6 مشاهد رئيسية يمكنك تحويلها إلى صور مذهلة.
                </p>
                 <button
                    onClick={onGenerateScenes}
                    disabled={isGenerating}
                    className="inline-flex items-center justify-center gap-3 bg-gradient-to-r from-indigo-600 to-purple-700 text-white font-bold py-3 px-6 rounded-lg text-lg shadow-lg hover:shadow-indigo-500/30 transform hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100"
                >
                    <Icon name={isGenerating ? 'regenerate' : 'generate'} className={`w-7 h-7 ${isGenerating ? 'animate-spin' : ''}`} />
                    {isGenerating ? 'جارٍ تحليل النص...' : 'تحليل النص وإنشاء المشاهد'}
                </button>
             </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="bg-gray-800/50 p-4 rounded-xl border border-gray-700 space-y-4">
                 <h3 className="text-xl font-bold text-amber-300">
                    لوحة التحكم الإبداعي للصور
                </h3>
                <div>
                    <h4 className="font-bold text-gray-300 mb-2">المشاهد المقترحة من النص:</h4>
                    <ul className="list-decimal list-inside bg-gray-900/50 p-3 rounded-lg space-y-2 text-sm text-gray-400">
                        {prompts.map((prompt, index) => (
                            <li key={index}>{prompt}</li>
                        ))}
                    </ul>
                </div>
                
                <ImageGenerationControls
                    imageStyle={imageStyle}
                    setImageStyle={setImageStyle}
                    isLoading={isGenerating}
                />

                <button
                    onClick={() => onGenerateAllImages(imageStyle)}
                    disabled={isGenerating}
                    className="w-full flex items-center justify-center gap-3 bg-gradient-to-r from-amber-500 to-orange-600 text-white font-bold py-3 px-6 rounded-lg text-lg shadow-lg hover:shadow-amber-500/30 transform hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100"
                >
                    <Icon name="generate" className="w-7 h-7" />
                    {isGenerating ? 'جارٍ الإنشاء...' : 'إنشاء جميع الصور'}
                </button>
            </div>
        </div>
    );
};