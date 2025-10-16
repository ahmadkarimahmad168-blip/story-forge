import React, { useState, useEffect } from 'react';
import { Icon } from './Icon';
import { generateVideo, VideoGenerationParams } from '../services/geminiService';
import type { GeneratedImage } from '../types';

interface VideoGenerationModalProps {
    isOpen: boolean;
    onClose: () => void;
    images: GeneratedImage[];
    episodeTitle: string;
    aspectRatio: string;
    onVideoGenerated: (url: string) => void;
}

const parseDataUrl = (dataUrl: string): { imageBytes: string; mimeType: string } | null => {
    const match = dataUrl.match(/^data:(image\/\w+);base64,(.*)$/);
    if (!match) return null;
    return { mimeType: match[1], imageBytes: match[2] };
};

export const VideoGenerationModal: React.FC<VideoGenerationModalProps> = ({ isOpen, onClose, images, episodeTitle, aspectRatio: imageAspectRatio, onVideoGenerated }) => {
    const [prompt, setPrompt] = useState('');
    const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);

    // Video Settings
    const [videoModel, setVideoModel] = useState<VideoGenerationParams['model']>('veo-3.1-fast-generate-preview');
    const [resolution, setResolution] = useState<VideoGenerationParams['resolution']>('720p');
    const [videoAspectRatio, setVideoAspectRatio] = useState<VideoGenerationParams['aspectRatio']>('16:9');
    
    // State Management
    const [isLoading, setIsLoading] = useState(false);
    const [progressLog, setProgressLog] = useState<string[]>([]);
    const [videoUrl, setVideoUrl] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        // Set default aspect ratio based on image aspect ratio
        if (imageAspectRatio === '9:16') {
            setVideoAspectRatio('9:16');
        } else {
            setVideoAspectRatio('16:9');
        }
    }, [imageAspectRatio]);

    const handleProgressUpdate = (message: string) => {
        setProgressLog(prev => [...prev, message]);
    };

    const handleGenerate = async () => {
        if (!prompt && selectedImageIndex === null) {
            setError("يرجى كتابة وصف أو تحديد صورة على الأقل.");
            return;
        }

        setError(null);
        setProgressLog([]);
        setVideoUrl(null);
        setIsLoading(true);

        const selectedImage = selectedImageIndex !== null ? images[selectedImageIndex] : null;
        const imagePayload = selectedImage ? parseDataUrl(selectedImage.url) : undefined;
        
        const params: VideoGenerationParams = {
            prompt,
            image: imagePayload,
            model: videoModel,
            resolution,
            aspectRatio: videoAspectRatio,
            onProgress: handleProgressUpdate,
        };

        try {
            const finalUrl = await generateVideo(params);
            setVideoUrl(finalUrl);
            onVideoGenerated(finalUrl);
        } catch (err: any) {
            setError(err.message || 'حدث خطأ غير متوقع.');
            handleProgressUpdate(`خطأ: ${err.message}`);
        } finally {
            setIsLoading(false);
        }
    };
    
    if (!isOpen) return null;

    const renderOptionButton = (label: string, value: any, state: any, setter: (val: any) => void) => (
         <button
            onClick={() => setter(value)}
            disabled={isLoading}
            className={`px-3 py-1.5 text-sm font-semibold rounded-md transition-all ${state === value ? 'bg-amber-500 text-white' : 'bg-gray-600 hover:bg-gray-500'} ${isLoading ? 'opacity-50' : ''}`}>
            {label}
        </button>
    );

    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 backdrop-blur-sm p-4">
            <div className="bg-gray-800 border border-gray-700 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
                <header className="flex items-center justify-between p-4 border-b border-gray-600 flex-shrink-0">
                    <h2 className="text-2xl font-bold text-amber-400">إنشاء مشهد فيديو بالذكاء الاصطناعي (VEO)</h2>
                    <button onClick={onClose} disabled={isLoading} className="text-gray-400 hover:text-white transition-colors disabled:opacity-50">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </header>
                
                <div className="p-6 overflow-y-auto grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Left Column: Controls */}
                    <div className="space-y-6">
                        <div>
                            <h3 className="font-bold text-lg text-gray-300 mb-2">1. حدد صورة بداية (اختياري)</h3>
                            <div className="flex overflow-x-auto gap-2 p-2 bg-gray-900/50 rounded-lg">
                                {images.map((img, index) => (
                                    <img 
                                        key={index} 
                                        src={img.url} 
                                        alt={`Slide ${index + 1}`} 
                                        className={`h-24 w-auto rounded-md flex-shrink-0 cursor-pointer border-4 transition-all ${selectedImageIndex === index ? 'border-amber-400 scale-105' : 'border-transparent hover:border-gray-500'}`}
                                        onClick={() => setSelectedImageIndex(selectedImageIndex === index ? null : index)}
                                    />
                                ))}
                            </div>
                        </div>

                        <div>
                            <label className="font-bold text-lg text-gray-300 mb-2 block" htmlFor="prompt-input">2. اكتب وصف الفيديو</label>
                            <textarea
                                id="prompt-input"
                                rows={3}
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                                placeholder="مثال: اجعل هذه الشخصية تتحرك ببطء نحو القلعة مع غروب الشمس..."
                                className="w-full p-3 bg-gray-900/70 border border-gray-600 rounded-lg focus:ring-1 focus:ring-amber-500 focus:border-amber-500 text-sm"
                                disabled={isLoading}
                            />
                        </div>

                        <div className="space-y-4">
                             <h3 className="font-bold text-lg text-gray-300">3. اختر الإعدادات</h3>
                             <div>
                                <h4 className="text-md font-bold mb-2 text-gray-300">نموذج الفيديو</h4>
                                <div className="flex flex-wrap gap-2">
                                    {renderOptionButton("سريع (Fast)", "veo-3.1-fast-generate-preview", videoModel, setVideoModel)}
                                    {renderOptionButton("جودة عالية (HD)", "veo-3.1-generate-preview", videoModel, setVideoModel)}
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
                                <h4 className="text-md font-bold mb-2 text-gray-300">نسبة العرض إلى الارتفاع</h4>
                                <div className="flex flex-wrap gap-2">
                                    {renderOptionButton("16:9 (أفقي)", "16:9", videoAspectRatio, setVideoAspectRatio)}
                                    {renderOptionButton("9:16 (عمودي)", "9:16", videoAspectRatio, setVideoAspectRatio)}
                                </div>
                            </div>
                        </div>

                         <button
                            onClick={handleGenerate}
                            disabled={isLoading}
                            className="w-full flex items-center justify-center gap-3 bg-gradient-to-r from-indigo-600 to-purple-700 text-white font-bold py-3 px-6 rounded-lg text-lg shadow-lg hover:shadow-indigo-500/30 transform hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100"
                        >
                            <Icon name={isLoading ? 'regenerate' : 'video'} className={`w-7 h-7 ${isLoading ? 'animate-spin' : ''}`} />
                            {isLoading ? 'جارٍ الإنشاء...' : 'إنشاء مشهد الفيديو'}
                        </button>
                    </div>

                    {/* Right Column: Status & Result */}
                    <div className="bg-gray-900/50 p-4 rounded-lg border border-gray-700 flex flex-col">
                        <h3 className="font-bold text-lg text-gray-300 mb-2 flex-shrink-0">حالة الإنشاء والنتيجة</h3>
                        <div className="flex-grow min-h-0 space-y-4">
                            {(isLoading || progressLog.length > 0) && (
                                <div className="text-xs font-mono text-gray-400 bg-black/30 p-2 rounded-md max-h-48 overflow-y-auto">
                                    {progressLog.map((log, i) => (
                                        <p key={i} className={log.startsWith('خطأ') ? 'text-red-400' : ''}>{`> ${log}`}</p>
                                    ))}
                                </div>
                            )}

                            {isLoading && (
                                <div className="text-center">
                                    <Icon name="regenerate" className="w-12 h-12 animate-spin text-amber-400 mx-auto" />
                                    <p className="mt-4 text-lg font-semibold text-gray-300">جارٍ إنشاء الفيديو...</p>
                                    <p className="text-sm text-gray-400">قد تستغرق هذه العملية عدة دقائق. لا تغلق النافذة.</p>
                                </div>
                            )}

                            {error && !isLoading && (
                                <div className="bg-red-800/50 border border-red-700 text-red-200 px-4 py-3 rounded-lg text-center">
                                    <p className="font-bold">فشل الإنشاء</p>
                                    <p className="text-sm">{error}</p>
                                </div>
                            )}

                             {videoUrl && !isLoading && (
                                <div className="space-y-4">
                                     <div className="bg-green-800/50 border border-green-700 text-green-200 px-4 py-3 rounded-lg text-center">
                                        <p className="font-bold text-lg">اكتمل الفيديو بنجاح!</p>
                                    </div>
                                    <video controls src={videoUrl} className="w-full rounded-lg bg-black"></video>
                                    <a
                                        href={videoUrl}
                                        download={`${episodeTitle.replace(/\s/g, '_')}_scene.mp4`}
                                        className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-lg transition-colors text-lg"
                                    >
                                        <Icon name="download" className="w-6 h-6" />
                                        تحميل الفيديو (MP4)
                                    </a>
                                </div>
                            )}
                            {!isLoading && progressLog.length === 0 && (
                                <div className="h-full flex flex-col justify-center items-center text-center text-gray-500">
                                    <Icon name="video" className="w-16 h-16" />
                                    <p>ستظهر حالة الإنشاء هنا.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};