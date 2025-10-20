import React, { useState } from 'react';
import type { Episode } from '../types';
import { Icon } from './Icon';
import { GeminiTTSPanel } from './GeminiTTSPanel';
import { ImageGenerationPanel } from './ImageGenerationPanel';
import { StoryboardPanel } from './StoryboardPanel';

interface EpisodeDisplayProps {
    episodes: Episode[];
    isLoading: boolean;
    isExporting: boolean;
    onGenerateImageScenes: (episodeIndex: number, episodeText: string) => void;
    onGenerateStoryboard: (episodeIndex: number, promptCount: number) => void;
    onSaveEpisode: (episodeIndex: number) => void;
    onSaveStory: () => void;
    onUpdateEpisode: (index: number, episode: Episode) => void;
    onExportProject: () => void;
    onAddImage: (episodeIndex: number, file: File) => void;
    onGenerateAllImages: (episodeIndex: number, style: string) => void;
}

const SEODisplay: React.FC<{ seo: Episode['seo'] }> = ({ seo }) => {
    const [copied, setCopied] = useState<string | null>(null);

    const handleCopy = (text: string, type: string) => {
        navigator.clipboard.writeText(text);
        setCopied(type);
        setTimeout(() => setCopied(null), 2000);
    };

    if (!seo) return <p className="text-gray-400 text-center py-4">لا توجد بيانات SEO لهذه الحلقة.</p>;

    return (
        <div className="space-y-4 text-sm">
            <div>
                <div className="flex justify-between items-center mb-1">
                    <label className="font-bold text-gray-300">عنوان مقترح</label>
                    <button onClick={() => handleCopy(seo.title, 'title')} className="text-sky-400 hover:text-sky-300 text-xs font-bold">{copied === 'title' ? 'تم النسخ!' : 'نسخ'}</button>
                </div>
                <p className="p-2 bg-gray-900/50 rounded-md text-gray-200">{seo.title}</p>
            </div>
            <div>
                 <div className="flex justify-between items-center mb-1">
                    <label className="font-bold text-gray-300">وصف مقترح</label>
                    <button onClick={() => handleCopy(seo.description, 'desc')} className="text-sky-400 hover:text-sky-300 text-xs font-bold">{copied === 'desc' ? 'تم النسخ!' : 'نسخ'}</button>
                </div>
                <p className="p-2 bg-gray-900/50 rounded-md text-gray-200 whitespace-pre-wrap">{seo.description}</p>
            </div>
            <div>
                 <div className="flex justify-between items-center mb-1">
                    <label className="font-bold text-gray-300">كلمات مفتاحية</label>
                    <button onClick={() => handleCopy(seo.tags.join(', '), 'tags')} className="text-sky-400 hover:text-sky-300 text-xs font-bold">{copied === 'tags' ? 'تم النسخ!' : 'نسخ'}</button>
                </div>
                <div className="flex flex-wrap gap-2 p-2 bg-gray-900/50 rounded-md">
                    {seo.tags.map(tag => (
                        <span key={tag} className="bg-gray-700 text-gray-200 text-xs font-medium px-2 py-1 rounded-full">{tag}</span>
                    ))}
                </div>
            </div>
        </div>
    );
};

const TabButton: React.FC<{
    iconName: string;
    label: string;
    isActive: boolean;
    onClick: () => void;
}> = ({ iconName, label, isActive, onClick }) => (
    <button
        onClick={onClick}
        className={`flex items-center gap-3 px-4 py-3 font-bold text-lg transition-colors duration-300 rounded-t-lg ${isActive ? 'bg-gray-700/50 text-amber-400' : 'text-gray-400 hover:text-amber-300 hover:bg-gray-800/40'}`}
    >
        <Icon name={iconName} className="w-6 h-6" />
        <span>{label}</span>
    </button>
);

const EpisodePanel: React.FC<Omit<EpisodeDisplayProps, 'episodes' | 'onSaveStory' | 'onExportProject' | 'onAddImage' > & { episode: Episode; index: number; onAddImage: (file: File) => void; }> = (props) => {
    const {
        episode, index, isLoading, onGenerateImageScenes, onGenerateStoryboard,
        onSaveEpisode, onUpdateEpisode, onAddImage, onGenerateAllImages
    } = props;
    
    const [activeTab, setActiveTab] = useState<'images' | 'audio' | 'storyboard'>('images');
    const [copiedText, setCopiedText] = useState(false);

    const handleCopyText = () => {
        navigator.clipboard.writeText(episode.text);
        setCopiedText(true);
        setTimeout(() => setCopiedText(false), 2000);
    };

    const handleAudioGenerated = (audioUrls: string[]) => {
        onUpdateEpisode(index, { ...episode, audioUrls });
    };

    const handleStoryboardPromptsUpdate = (newPrompts: string[]) => {
        onUpdateEpisode(index, { ...episode, storyboardPrompts: newPrompts });
    };
    
    const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            onAddImage(file);
        }
    };

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                <div className="lg:col-span-2 space-y-4">
                    <div className="bg-gray-800/50 p-4 rounded-xl border border-gray-700">
                        <div className="flex justify-between items-center mb-2">
                             <h3 className="text-xl font-bold text-amber-300">نص الحلقة</h3>
                             <button onClick={handleCopyText} className="text-sky-400 hover:text-sky-300 text-sm font-bold">{copiedText ? 'تم النسخ!' : 'نسخ النص'}</button>
                        </div>
                        <p className="text-gray-300 whitespace-pre-wrap max-h-96 overflow-y-auto p-2 bg-gray-900/40 rounded-md">{episode.text}</p>
                    </div>
                     <div className="bg-gray-800/50 p-4 rounded-xl border border-gray-700">
                        <h3 className="text-xl font-bold text-amber-300 mb-2">تحسينات SEO ليوتيوب</h3>
                        <SEODisplay seo={episode.seo} />
                    </div>
                </div>

                <div className="lg:col-span-3">
                    <div className="flex border-b border-gray-600/50">
                        <TabButton iconName="image" label="الصور" isActive={activeTab === 'images'} onClick={() => setActiveTab('images')} />
                        <TabButton iconName="voice" label="التعليق الصوتي" isActive={activeTab === 'audio'} onClick={() => setActiveTab('audio')} />
                        <TabButton iconName="clapperboard" label="اللوحة القصصية" isActive={activeTab === 'storyboard'} onClick={() => setActiveTab('storyboard')} />
                    </div>
                    <div className="bg-gray-700/50 p-4 rounded-b-xl">
                        {activeTab === 'images' && (
                             <ImageGenerationPanel
                                onGenerateScenes={() => onGenerateImageScenes(index, episode.text)}
                                isGenerating={isLoading}
                                episode={episode}
                                onGenerateAllImages={(style: string) => onGenerateAllImages(index, style)}
                             />
                        )}
                        {activeTab === 'audio' && (
                             <GeminiTTSPanel 
                                episodeText={episode.text} 
                                initialAudioUrls={episode.audioUrls}
                                onAudioGenerated={handleAudioGenerated} 
                            />
                        )}
                        {activeTab === 'storyboard' && (
                            <StoryboardPanel 
                                episode={episode}
                                onGenerate={(promptCount) => onGenerateStoryboard(index, promptCount)}
                                onUpdatePrompts={handleStoryboardPromptsUpdate}
                                isLoading={isLoading}
                            />
                        )}
                    </div>
                </div>
            </div>

            <div className="bg-gray-800/50 p-4 rounded-xl border border-gray-700 mt-6">
                 <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold text-amber-300">معرض الصور</h3>
                    <label className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-lg transition-colors cursor-pointer text-sm">
                        <Icon name="upload" className="w-5 h-5" />
                        <span>إضافة صورة من جهازك</span>
                        <input type='file' className="hidden" accept="image/png, image/jpeg, image/webp" onChange={handleFileSelect} />
                    </label>
                </div>
                {(episode.images && episode.images.some(img => img !== null)) ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {episode.images.map((image, imageIndex) => (
                            <div key={imageIndex} className="bg-gray-900/50 p-2 rounded-lg">
                                {image ? (
                                    <>
                                        <img src={image.url} className="w-full rounded-md bg-black aspect-video object-cover" alt={`Generated scene ${imageIndex + 1}`} />
                                        <a
                                            href={image.url}
                                            download={`Episode_${index + 1}_Image_${imageIndex + 1}.png`}
                                            className="mt-2 w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-3 rounded-md transition-colors text-sm"
                                        >
                                            <Icon name="download" className="w-5 h-5" />
                                            <span>تحميل PNG</span>
                                        </a>
                                    </>
                                ) : (
                                    <div className="w-full rounded-md bg-black aspect-video flex items-center justify-center text-gray-500">
                                        <Icon name="image" className="w-10 h-10" />
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-8 text-gray-500">
                        <Icon name="image" className="w-16 h-16 mx-auto" />
                        <p className="mt-2">لم يتم إنشاء أي صور بعد.</p>
                        <p className="text-sm">اذهب إلى لوحة التحكم الإبداعي لإنشاء صورك.</p>
                    </div>
                )}
            </div>
             <div className="text-center pt-4">
                <button onClick={() => onSaveEpisode(index)} className="inline-flex items-center gap-2 bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded-lg transition-colors">
                    <Icon name="document" className="w-5 h-5" />
                    حفظ نص الحلقة
                </button>
            </div>
        </div>
    );
};

export const EpisodeDisplay: React.FC<EpisodeDisplayProps> = (props) => {
    const { episodes, onSaveStory, onExportProject, isLoading, isExporting } = props;
    const [activeTab, setActiveTab] = useState(0);

    return (
        <div className="mt-8 bg-gray-800/30 p-4 sm:p-6 rounded-2xl shadow-2xl border border-gray-700 backdrop-blur-sm">
            <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
                <div className="flex flex-wrap items-center border-b-2 border-gray-700">
                    {episodes.map((_, index) => (
                        <button
                            key={index}
                            onClick={() => setActiveTab(index)}
                            className={`px-4 py-2 font-bold text-lg transition-colors duration-300 ${activeTab === index ? 'text-amber-400 border-b-2 border-amber-400' : 'text-gray-400 hover:text-amber-300'}`}
                        >
                            الحلقة {index + 1}
                        </button>
                    ))}
                </div>
                <div className="flex items-center gap-3">
                     <button onClick={onSaveStory} title="حفظ القصة" className="p-2 text-gray-400 hover:text-amber-400 transition-colors disabled:opacity-50" disabled={isLoading || isExporting}>
                        <Icon name="save" className="w-7 h-7" />
                    </button>
                    <button onClick={onExportProject} title="تصدير المشروع" className="p-2 text-gray-400 hover:text-amber-400 transition-colors disabled:opacity-50" disabled={isLoading || isExporting}>
                        <Icon name="archive" className="w-7 h-7" />
                    </button>
                </div>
            </div>

            <div>
                {episodes[activeTab] && (
                    <EpisodePanel
                        {...props}
                        episode={episodes[activeTab]}
                        index={activeTab}
                        onAddImage={(file) => props.onAddImage(activeTab, file)}
                    />
                )}
            </div>
        </div>
    );
};