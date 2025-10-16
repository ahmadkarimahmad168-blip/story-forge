import React, { useState, useEffect } from 'react';
import { Icon } from './Icon';
import { generateSlideshowVideo, SlideshowOptions, ProgressUpdate } from '../services/videoService';
import type { GeneratedImage } from '../types';

interface AnimatedSlideshowModalProps {
    isOpen: boolean;
    onClose: () => void;
    images: GeneratedImage[];
    episodeTitle: string;
}

export const AnimatedSlideshowModal: React.FC<AnimatedSlideshowModalProps> = ({ isOpen, onClose, images, episodeTitle }) => {
    const [apiKey, setApiKey] = useState('');
    const [animationStyle, setAnimationStyle] = useState<SlideshowOptions['animationStyle']>('ken_burns');
    const [transitionStyle, setTransitionStyle] = useState<SlideshowOptions['transitionStyle']>('fade');
    const [slideDuration, setSlideDuration] = useState<number>(10);
    const [totalDuration, setTotalDuration] = useState<SlideshowOptions['totalDurationMinutes']>(10);

    const [isLoading, setIsLoading] = useState(false);
    const [progressLog, setProgressLog] = useState<ProgressUpdate[]>([]);
    const [videoUrl, setVideoUrl] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const savedApiKey = localStorage.getItem('json2video_api_key');
        if (savedApiKey) {
            setApiKey(savedApiKey);
        }
    }, []);

    const handleApiKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setApiKey(e.target.value);
        localStorage.setItem('json2video_api_key', e.target.value);
    };

    const handleProgressUpdate = (update: ProgressUpdate) => {
        setProgressLog(prev => [...prev, update]);
    };

    const handleGenerate = async () => {
        setError(null);
        setProgressLog([]);
        setVideoUrl(null);
        setIsLoading(true);

        const options: SlideshowOptions = {
            animationStyle,
            transitionStyle,
            slideDurationSec: slideDuration,
            totalDurationMinutes: totalDuration,
        };

        try {
            const finalUrl = await generateSlideshowVideo(apiKey, images, options, episodeTitle, handleProgressUpdate);
            setVideoUrl(finalUrl);
        } catch (err: any) {
            setError(err.message || 'حدث خطأ غير متوقع.');
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
                    <h2 className="text-2xl font-bold text-amber-400">إنشاء عرض فيديو متحرك</h2>
                    <button onClick={onClose} disabled={isLoading} className="text-gray-400 hover:text-white transition-colors disabled:opacity-50">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </header>
                
                <div className="p-6 overflow-y-auto grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Left Column: Controls */}
                    <div className="space-y-6">
                         {/* Filmstrip */}
                        <div>
                            <h3 className="font-bold text-lg text-gray-300 mb-2">الصور المصدر ({images.length})</h3>
                            <div className="flex overflow-x-auto gap-2 p-2 bg-gray-900/50 rounded-lg">
                                {images.map((img, index) => (
                                    <img key={index} src={img.url} alt={`Slide ${index + 1}`} className="h-20 w-auto rounded-md flex-shrink-0" />
                                ))}
                            </div>
                        </div>

                        {/* API Key */}
                        <div>
                            <label className="font-bold text-lg text-gray-300 mb-2 block" htmlFor="api-key-input">مفتاح JSON2Video API</label>
                            <input
                                id="api-key-input"
                                type="password"
                                value={apiKey}
                                onChange={handleApiKeyChange}
                                placeholder="أدخل مفتاح الواجهة البرمجية هنا"
                                className="w-full p-2 bg-gray-900/70 border border-gray-600 rounded-lg focus:ring-1 focus:ring-amber-500 focus:border-amber-500 text-sm"
                                disabled={isLoading}
                            />
                        </div>

                        {/* Options */}
                        <div className="space-y-4">
                            <div>
                                <h4 className="text-md font-bold mb-2 text-gray-300">نمط التحريك</h4>
                                <div className="flex flex-wrap gap-2">
                                    {renderOptionButton("كين بيرنز (تكبير/تصغير)", "ken_burns", animationStyle, setAnimationStyle)}
                                    {renderOptionButton("ثابت", "static", animationStyle, setAnimationStyle)}
                                </div>
                            </div>
                             <div>
                                <h4 className="text-md font-bold mb-2 text-gray-300">نمط الانتقال</h4>
                                <div className="flex flex-wrap gap-2">
                                    {renderOptionButton("تداخل (Fade)", "fade", transitionStyle, setTransitionStyle)}
                                    {renderOptionButton("مسح (Wipe)", "wipe_right", transitionStyle, setTransitionStyle)}
                                    {renderOptionButton("مكعب (Cube)", "cube_spin", transitionStyle, setTransitionStyle)}
                                </div>
                            </div>
                             <div>
                                <label htmlFor="slide-duration" className="font-bold text-md text-gray-300 mb-2 block">مدة عرض الشريحة: <span className="text-amber-400">{slideDuration} ثانية</span></label>
                                <input id="slide-duration" type="range" min="5" max="20" step="1" value={slideDuration} onChange={e => setSlideDuration(Number(e.target.value))} disabled={isLoading} className="w-full" />
                            </div>
                             <div>
                                <h4 className="text-md font-bold mb-2 text-gray-300">المدة الإجمالية للفيديو</h4>
                                <div className="flex flex-wrap gap-2">
                                    {renderOptionButton("10 دقائق", 10, totalDuration, setTotalDuration)}
                                    {renderOptionButton("15 دقيقة", 15, totalDuration, setTotalDuration)}
                                </div>
                            </div>
                        </div>

                         <button
                            onClick={handleGenerate}
                            disabled={isLoading || !apiKey}
                            className="w-full flex items-center justify-center gap-3 bg-gradient-to-r from-indigo-600 to-purple-700 text-white font-bold py-3 px-6 rounded-lg text-lg shadow-lg hover:shadow-indigo-500/30 transform hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100"
                        >
                            <Icon name={isLoading ? 'regenerate' : 'video'} className={`w-7 h-7 ${isLoading ? 'animate-spin' : ''}`} />
                            {isLoading ? 'جارٍ التصيير...' : 'إنشاء الفيديو'}
                        </button>
                    </div>

                    {/* Right Column: Status & Result */}
                    <div className="bg-gray-900/50 p-4 rounded-lg border border-gray-700 flex flex-col">
                        <h3 className="font-bold text-lg text-gray-300 mb-2 flex-shrink-0">حالة التصيير والنتيجة</h3>
                        <div className="flex-grow min-h-0 space-y-4">
                            {isLoading && (
                                <div className="h-full flex flex-col justify-center items-center text-center">
                                    <Icon name="regenerate" className="w-12 h-12 animate-spin text-amber-400" />
                                    <p className="mt-4 text-lg font-semibold text-gray-300">جارٍ إنشاء الفيديو...</p>
                                    <p className="text-sm text-gray-400">قد تستغرق هذه العملية عدة دقائق.</p>
                                </div>
                            )}

                            {progressLog.length > 0 && (
                                <div className="text-xs font-mono text-gray-400 bg-black/30 p-2 rounded-md max-h-48 overflow-y-auto">
                                    {progressLog.map((log, i) => (
                                        <p key={i} className={log.isError ? 'text-red-400' : ''}>{`> ${log.message}`}</p>
                                    ))}
                                </div>
                            )}

                            {error && (
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
                                    <video controls src={videoUrl} className="w-full rounded-lg"></video>
                                    <a
                                        href={videoUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        download={`${episodeTitle}_slideshow.mp4`}
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
                                    <p>ستظهر حالة التصيير هنا.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};