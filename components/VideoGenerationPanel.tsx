import React, { useState } from 'react';
import { Icon } from './Icon';

interface VideoGenerationPanelProps {
    videoPrompt: string;
    onUpdatePrompt: (newPrompt: string) => void;
    onGenerateVideo: (params: { model: 'veo-3.1-fast-generate-preview' | 'veo-3.1-generate-preview'; resolution: '720p' | '1080p'; aspectRatio: '16:9' | '9:16' }) => void;
    onGenerateVideoPrompt: () => Promise<void>;
    isGeneratingPrompt: boolean;
    isGeneratingVideo: boolean;
}

export const VideoGenerationPanel: React.FC<VideoGenerationPanelProps> = ({
    videoPrompt,
    onUpdatePrompt,
    onGenerateVideo,
    onGenerateVideoPrompt,
    isGeneratingPrompt,
    isGeneratingVideo,
}) => {
    const [model, setModel] = useState<'veo-3.1-fast-generate-preview' | 'veo-3.1-generate-preview'>('veo-3.1-fast-generate-preview');
    const [resolution, setResolution] = useState<'720p' | '1080p'>('720p');
    const [aspectRatio, setAspectRatio] = useState<'16:9' | '9:16'>('16:9');
    
    const isLoading = isGeneratingPrompt || isGeneratingVideo;

    const renderOptionButton = (label: string, value: any, state: any, setter: (val: any) => void) => (
        <button
            onClick={() => setter(value)}
            disabled={isLoading}
            className={`px-3 py-1.5 text-sm font-semibold rounded-md transition-all ${state === value ? 'bg-amber-500 text-white' : 'bg-gray-600 hover:bg-gray-500'} ${isLoading ? 'opacity-50' : ''}`}>
            {label}
        </button>
    );

    return (
        <div className="bg-gray-800/50 p-4 rounded-xl border border-gray-700 space-y-4">
            <h3 className="text-xl font-bold text-amber-300 flex items-center gap-3">
                <Icon name="video" className="w-7 h-7" />
                إنشاء مشهد فيديو (VEO)
            </h3>

            <div>
                <div className="flex justify-between items-center mb-2">
                    <label htmlFor="video-prompt-textarea" className="font-bold text-gray-300">
                        وصف مشهد الفيديو
                    </label>
                    <button 
                        onClick={onGenerateVideoPrompt}
                        disabled={isLoading}
                        className="text-sky-400 hover:text-sky-300 text-sm font-bold disabled:opacity-50 flex items-center gap-1"
                    >
                        <Icon name="generate" className="w-4 h-4" />
                        {isGeneratingPrompt ? 'جارٍ التحليل...' : 'تحليل النص تلقائياً'}
                    </button>
                </div>
                <textarea
                    id="video-prompt-textarea"
                    rows={4}
                    value={videoPrompt}
                    onChange={(e) => onUpdatePrompt(e.target.value)}
                    placeholder="انقر على 'تحليل النص تلقائياً' للبدء, أو اكتب وصف المشهد هنا..."
                    className="w-full p-3 bg-gray-900/70 border border-gray-600 rounded-lg focus:ring-1 focus:ring-amber-500 focus:border-amber-500 text-sm"
                    disabled={isLoading}
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                    <h4 className="text-md font-bold mb-2 text-gray-300">نموذج الفيديو</h4>
                    <div className="flex flex-wrap gap-2">
                        {renderOptionButton("سريع", "veo-3.1-fast-generate-preview", model, setModel)}
                        {renderOptionButton("جودة عالية", "veo-3.1-generate-preview", model, setModel)}
                    </div>
                </div>
                <div>
                    <h4 className="text-md font-bold mb-2 text-gray-300">الدقة</h4>
                    <div className="flex flex-wrap gap-2">
                        {renderOptionButton("720p", "720p", resolution, setResolution)}
                        {renderOptionButton("1080p", "1080p", resolution, setResolution)}
                    </div>
                </div>
                <div>
                    <h4 className="text-md font-bold mb-2 text-gray-300">نسبة العرض</h4>
                    <div className="flex flex-wrap gap-2">
                        {renderOptionButton("16:9", "16:9", aspectRatio, setAspectRatio)}
                        {renderOptionButton("9:16", "9:16", aspectRatio, setAspectRatio)}
                    </div>
                </div>
            </div>

            <button
                onClick={() => onGenerateVideo({ model, resolution, aspectRatio })}
                disabled={isLoading || !videoPrompt}
                className="w-full flex items-center justify-center gap-3 bg-gradient-to-r from-indigo-600 to-purple-700 text-white font-bold py-3 px-6 rounded-lg text-lg shadow-lg hover:shadow-indigo-500/30 transform hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100"
            >
                <Icon name={isGeneratingVideo ? 'regenerate' : 'video'} className={`w-7 h-7 ${isGeneratingVideo ? 'animate-spin' : ''}`} />
                {isGeneratingVideo ? 'جارٍ إنشاء الفيديو...' : 'إنشاء مشهد الفيديو'}
            </button>
        </div>
    );
};
