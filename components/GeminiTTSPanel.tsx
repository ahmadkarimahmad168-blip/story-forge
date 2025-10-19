// FIX: Removed invalid file header that was causing syntax errors.
import React, { useState, useEffect } from 'react';
import { Icon } from './Icon';
import { generateSpeech, TTSConfig } from '../services/geminiService';

interface GeminiTTSPanelProps {
    episodeText: string;
    initialAudioUrls?: string[];
    onAudioGenerated: (urls: string[]) => void;
}

const VOICES = [
    { name: "Kore", label: "Kore (ثابت، يشبه صوت الذكر)" },
    { name: "Puck", label: "Puck (مبهج، يشبه صوت الذكر)" },
    { name: "Zephyr", label: "Zephyr (مشرق، يشبه صوت الأنثى)" },
    { name: "Charon", label: "Charon (إعلامي، يشبه صوت الأنثى)" },
    { name: "Fenrir", label: "Fenrir (متحمس، يشبه صوت الذكر)" },
];

export const GeminiTTSPanel: React.FC<GeminiTTSPanelProps> = ({ episodeText, initialAudioUrls, onAudioGenerated }) => {
    const [text, setText] = useState(episodeText);
    const [styleInstruction, setStyleInstruction] = useState('');
    const [mode, setMode] = useState<'single' | 'multi'>('single');
    const [voice1, setVoice1] = useState(VOICES[0].name);
    const [voice2, setVoice2] = useState(VOICES[1].name);

    const [isLoading, setIsLoading] = useState(false);
    const [loadingMessage, setLoadingMessage] = useState<string | null>(null);
    const [audioUrls, setAudioUrls] = useState<string[] | null>(initialAudioUrls || null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        setText(episodeText);
        setAudioUrls(initialAudioUrls || null);
        setError(null);
    }, [episodeText, initialAudioUrls]);

    const handleGenerate = async () => {
        if (!text.trim()) {
            setError("الرجاء إدخال نص لإنشاء التعليق الصوتي.");
            return;
        }

        setIsLoading(true);
        setError(null);
        setAudioUrls([]); // Initialize as empty array for progressive updates
        setLoadingMessage(null);

        try {
            const MAX_CHUNK_LENGTH = 4800; // Safe character limit for TTS API
            const chunks: string[] = [];
            let textToSplit = text.trim();

            while (textToSplit.length > 0) {
                if (textToSplit.length <= MAX_CHUNK_LENGTH) {
                    chunks.push(textToSplit);
                    break;
                }

                const searchSlice = textToSplit.substring(0, MAX_CHUNK_LENGTH);
                let splitIndex = -1;

                // Find the last occurrence of a good separator to split after it
                const separators = ['\n', '. ', '، ', '? ', '! '];
                for (const sep of separators) {
                    const index = searchSlice.lastIndexOf(sep);
                    if (index > splitIndex) {
                        splitIndex = index + sep.length;
                    }
                }

                // If no sentence/line ending, find the last space
                if (splitIndex === -1) {
                    splitIndex = searchSlice.lastIndexOf(' ');
                }
                
                // If no space, hard cut
                if (splitIndex === -1 || splitIndex === 0) {
                    splitIndex = MAX_CHUNK_LENGTH;
                }

                chunks.push(textToSplit.substring(0, splitIndex).trim());
                textToSplit = textToSplit.substring(splitIndex).trim();
            }

            const finalChunks = chunks.filter(chunk => chunk.length > 0);
            const generatedUrls: string[] = [];

            for (let i = 0; i < finalChunks.length; i++) {
                const chunk = finalChunks[i];
                setLoadingMessage(`جارٍ إنشاء الجزء ${i + 1} من ${finalChunks.length}...`);
                const config: TTSConfig = { text: chunk, mode, voice1, voice2, styleInstruction };
                const url = await generateSpeech(config);
                generatedUrls.push(url);
                setAudioUrls([...generatedUrls]); // Update UI progressively as each part finishes
            }
            
            onAudioGenerated(generatedUrls);
        } catch (err: any) {
            console.error("TTS Generation Error:", err);
            setError(err.message || "فشل إنشاء التعليق الصوتي. يرجى المحاولة مرة أخرى.");
        } finally {
            setIsLoading(false);
            setLoadingMessage(null);
        }
    };
    
    return (
        <div className="bg-gray-700/60 p-4 mt-6 rounded-2xl border border-gray-600">
            <h3 className="text-xl font-bold mb-4 text-amber-400 flex items-center gap-3">
                <Icon name="voice" className="w-7 h-7" />
                إنشاء التعليق الصوتي بـ Gemini
            </h3>
            <div className="space-y-4">
                <div>
                    <label htmlFor="tts-text" className="block text-sm font-medium text-gray-300 mb-1">
                        النص (للتعديل اليدوي)
                    </label>
                    <textarea
                        id="tts-text"
                        rows={8}
                        className="w-full p-3 bg-gray-900/70 border border-gray-600 rounded-lg focus:ring-1 focus:ring-amber-500 focus:border-amber-500 text-sm resize-none"
                        placeholder="أدخل النص هنا..."
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        disabled={isLoading}
                    />
                    {mode === 'multi' && (
                        <p className="text-xs text-amber-300 mt-1">
                            للمحادثات، استخدم الصيغة: <code className="bg-gray-800 p-1 rounded">المتحدث1: الحوار...</code>
                        </p>
                    )}
                </div>

                 <div>
                    <label htmlFor="tts-style" className="block text-sm font-medium text-gray-300 mb-1">
                        إرشادات الأسلوب (اختياري)
                    </label>
                    <input
                        id="tts-style"
                        type="text"
                        className="w-full p-2 bg-gray-900/70 border border-gray-600 rounded-lg focus:ring-1 focus:ring-amber-500 focus:border-amber-500 text-sm"
                        placeholder="مثال: اقرأ بنبرة دافئة وحماسية"
                        value={styleInstruction}
                        onChange={(e) => setStyleInstruction(e.target.value)}
                        disabled={isLoading}
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <div>
                        <label htmlFor="speaker-mode-select" className="block text-sm font-medium text-gray-300 mb-1">وضع المتحدث</label>
                        <select
                            id="speaker-mode-select" value={mode} onChange={(e) => setMode(e.target.value as 'single' | 'multi')} disabled={isLoading}
                            className="w-full p-2 bg-gray-900/70 border border-gray-600 rounded-lg focus:ring-1 focus:ring-amber-500 focus:border-amber-500 text-sm"
                        >
                            <option value="single">متحدث واحد</option>
                            <option value="multi">محادثة (متحدثان)</option>
                        </select>
                    </div>
                    <div>
                        <label htmlFor="voice-select-1" className="block text-sm font-medium text-gray-300 mb-1">{mode === 'multi' ? 'صوت المتحدث 1' : 'الصوت'}</label>
                        <select
                            id="voice-select-1" value={voice1} onChange={(e) => setVoice1(e.target.value)} disabled={isLoading}
                            className="w-full p-2 bg-gray-900/70 border border-gray-600 rounded-lg focus:ring-1 focus:ring-amber-500 focus:border-amber-500 text-sm"
                        >
                            {VOICES.map(v => <option key={v.name} value={v.name}>{v.label}</option>)}
                        </select>
                    </div>
                    {mode === 'multi' && (
                         <div>
                            <label htmlFor="voice-select-2" className="block text-sm font-medium text-gray-300 mb-1">صوت المتحدث 2</label>
                            <select
                                id="voice-select-2" value={voice2} onChange={(e) => setVoice2(e.target.value)} disabled={isLoading}
                                className="w-full p-2 bg-gray-900/70 border border-gray-600 rounded-lg focus:ring-1 focus:ring-amber-500 focus:border-amber-500 text-sm"
                            >
                                {VOICES.filter(v => v.name !== voice1).map(v => <option key={v.name} value={v.name}>{v.label}</option>)}
                            </select>
                        </div>
                    )}
                </div>

                <button
                    onClick={handleGenerate} disabled={isLoading || !text.trim()}
                    className="w-full flex items-center justify-center gap-3 bg-gradient-to-r from-amber-500 to-orange-600 text-white font-bold py-3 px-6 rounded-lg text-lg shadow-lg hover:shadow-amber-500/30 transform hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100"
                >
                    <Icon name={isLoading ? 'regenerate' : 'generate'} className={`w-6 h-6 ${isLoading ? 'animate-spin' : ''}`} />
                    {isLoading ? (loadingMessage || 'جارٍ الإنشاء...') : 'إنشاء/إعادة إنشاء التعليق الصوتي'}
                </button>

                {error && (
                    <div className="bg-red-800/50 border border-red-700 text-red-200 px-4 py-3 rounded-lg text-center">
                        <p>{error}</p>
                    </div>
                )}

                {audioUrls && audioUrls.length > 0 && !isLoading && (
                    <div className="space-y-4 mt-4">
                        {audioUrls.map((url, index) => (
                            <div key={index} className="flex flex-col sm:flex-row items-center gap-4 p-2 bg-gray-900/50 rounded-lg">
                                <p className="font-bold text-gray-300 shrink-0">الجزء {index + 1}</p>
                                <audio controls src={url} className="w-full sm:flex-1"></audio>
                                <a
                                    href={url} download={`StoryForge_Voiceover_Part_${index + 1}.wav`}
                                    className="w-full sm:w-auto flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-md transition-colors"
                                >
                                    <Icon name="download" className="w-5 h-5" />
                                    <span>تحميل الجزء {index + 1}</span>
                                </a>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};