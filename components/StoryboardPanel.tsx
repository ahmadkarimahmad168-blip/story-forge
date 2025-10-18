import React, { useState, useMemo, useEffect } from 'react';
import { Icon } from './Icon';
import type { Episode } from '../types';

interface StoryboardPanelProps {
    episode: Episode;
    onGenerate: (promptCount: number) => void;
    onUpdatePrompts: (newPrompts: string[]) => void;
    isLoading: boolean;
}

const SceneCard: React.FC<{
    sceneNumber: number;
    prompt: string;
    onPromptChange: (newPrompt: string) => void;
    isGenerating: boolean;
}> = ({ sceneNumber, prompt, onPromptChange, isGenerating }) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(prompt);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="bg-gray-900/50 p-3 rounded-lg border border-gray-600">
            <div className="flex justify-between items-center mb-2">
                <h4 className="font-bold text-gray-300">المشهد {sceneNumber}</h4>
                <button
                    onClick={handleCopy}
                    className="text-sky-400 hover:text-sky-300 text-xs font-bold"
                    disabled={isGenerating}
                >
                    {copied ? 'تم النسخ!' : 'نسخ النص'}
                </button>
            </div>
            <textarea
                value={prompt}
                onChange={(e) => onPromptChange(e.target.value)}
                rows={4}
                className="w-full p-2 bg-gray-800/60 border border-gray-500 rounded-md focus:ring-1 focus:ring-amber-500 focus:border-amber-500 text-sm text-gray-200 resize-y"
                placeholder="وصف المشهد..."
                disabled={isGenerating}
            />
        </div>
    );
};

export const StoryboardPanel: React.FC<StoryboardPanelProps> = ({ episode, onGenerate, onUpdatePrompts, isLoading }) => {
    const [videoDurationMinutes, setVideoDurationMinutes] = useState('10');
    
    const promptCount = useMemo(() => {
        const duration = parseInt(videoDurationMinutes, 10);
        if (isNaN(duration) || duration <= 0) {
            return 0;
        }
        return Math.ceil((duration * 60) / 8); // 8 seconds per scene
    }, [videoDurationMinutes]);

    const handleGenerateClick = () => {
        if (promptCount > 0 && !isLoading) {
            onGenerate(promptCount);
        }
    };
    
    const handlePromptChange = (index: number, newPrompt: string) => {
        const newPrompts = [...(episode.storyboardPrompts || [])];
        newPrompts[index] = newPrompt;
        onUpdatePrompts(newPrompts);
    };

    return (
        <div className="space-y-4">
            <p className="text-sm text-gray-400">
                حدد المدة الإجمالية للفيديو، وسيقوم النظام بحساب عدد المشاهد (8 ثوانٍ لكل مشهد) المطلوبة. ثم، سيقوم الذكاء الاصطناعي بتحليل نص الحلقة لإنشاء وصف فيديو لكل مشهد.
            </p>
            <div className="bg-gray-900/40 p-3 rounded-lg border border-gray-600 flex flex-col sm:flex-row items-center gap-4">
                <div className="flex-1 w-full">
                    <label htmlFor="video-duration" className="block text-md font-bold text-gray-300 mb-1">
                        مدة الفيديو (بالدقائق)
                    </label>
                    <input
                        type="number"
                        id="video-duration"
                        value={videoDurationMinutes}
                        onChange={(e) => setVideoDurationMinutes(e.target.value)}
                        className="w-full p-2 bg-gray-800/70 border border-gray-500 rounded-lg focus:ring-1 focus:ring-amber-500 focus:border-amber-500 text-lg"
                        placeholder="10"
                        min="1"
                        disabled={isLoading}
                    />
                </div>
                 <div className="text-center text-2xl font-black text-gray-400 hidden sm:block">
                    &rarr;
                </div>
                <div className="flex-1 w-full text-center bg-gray-800/50 p-3 rounded-lg">
                    <span className="block text-md font-bold text-gray-300 mb-1">عدد المشاهد المطلوبة</span>
                    <span className="block text-4xl font-black text-amber-400">{promptCount}</span>
                </div>
            </div>
            
            <button
                onClick={handleGenerateClick}
                disabled={isLoading || promptCount === 0}
                className="w-full flex items-center justify-center gap-3 bg-gradient-to-r from-sky-600 to-blue-700 text-white font-bold py-3 px-6 rounded-lg text-lg shadow-lg hover:shadow-sky-500/30 transform hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100"
            >
                <Icon name={isLoading ? 'regenerate' : 'generate'} className={`w-7 h-7 ${isLoading ? 'animate-spin' : ''}`} />
                {isLoading ? 'جارٍ الإنشاء...' : 'إنشاء لوحة قصصية'}
            </button>

            {episode.storyboardPrompts && episode.storyboardPrompts.length > 0 && (
                 <div className="pt-4 space-y-3 max-h-[50vh] overflow-y-auto pr-2">
                    <h3 className="text-lg font-bold text-amber-300">أوصاف المشاهد</h3>
                    {episode.storyboardPrompts.map((prompt, index) => (
                         <SceneCard 
                            key={index}
                            sceneNumber={index + 1}
                            prompt={prompt}
                            onPromptChange={(newPrompt) => handlePromptChange(index, newPrompt)}
                            isGenerating={isLoading}
                         />
                    ))}
                 </div>
            )}
        </div>
    );
};