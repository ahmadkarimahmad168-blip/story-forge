import React, { useState, useCallback, useEffect } from 'react';
import { Header } from './components/Header';
import { StoryInput } from './components/StoryInput';
import { EpisodeDisplay } from './components/EpisodeDisplay';
import { Loader } from './components/Loader';
import { PreviousStoriesModal } from './components/PreviousStoriesModal';
import { StoryFinder } from './components/StoryFinder';
import { ApiKeyModal } from './components/ApiKeyModal';
import { initializeGemini, validateApiKey, generateStoryOutline, generateEpisode, generateVideoPromptForEpisode, generateVideo } from './services/geminiService';
import { exportStoryAsZip } from './services/exportService';
import type { Episode, ArchivedStory, StoryData } from './types';
import { Footer } from './components/Footer';
import { AboutPage } from './components/pages/AboutPage';
import { ContactPage } from './components/pages/ContactPage';
import { PrivacyPolicyPage } from './components/pages/PrivacyPolicyPage';
import { TermsAndConditionsPage } from './components/pages/TermsAndConditionsPage';

type Page = 'main' | 'about' | 'contact' | 'privacy' | 'terms';

/**
 * Intelligently extracts a lowercase error message from various error formats.
 */
const getErrorMessage = (error: any): string => {
    let message = '';
    if (error?.error?.message && typeof error.error.message === 'string') message = error.error.message;
    else if (error?.message && typeof error.message === 'string') message = error.message;
    else message = String(error);
    return message.toLowerCase();
};

const App: React.FC = () => {
    // --- Page State ---
    const [page, setPage] = useState<Page>('main');

    // --- API Key State ---
    const [apiKey, setApiKey] = useState<string | null>(null);
    const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState<boolean>(false);

    // --- Story State ---
    const [activeStoryId, setActiveStoryId] = useState<string | null>(null);
    const [storyPrompt, setStoryPrompt] = useState<string>('');
    const [episodes, setEpisodes] = useState<Episode[]>([]);
    
    // --- Loading & Error State ---
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [isExporting, setIsExporting] = useState<boolean>(false);
    const [loadingMessage, setLoadingMessage] = useState<string>('');
    const [error, setError] = useState<string | null>(null);

    // --- Archive / Saved Stories ---
    const [archivedStories, setArchivedStories] = useState<ArchivedStory[]>([]);
    const [isArchiveOpen, setIsArchiveOpen] = useState<boolean>(false);

    // Check for API Key on initial mount
    useEffect(() => {
        try {
            const savedKey = localStorage.getItem('gemini_api_key');
            if (savedKey) {
                initializeGemini(savedKey);
                setApiKey(savedKey);
            } else {
                setIsApiKeyModalOpen(true);
            }
        } catch (e) {
            console.error("Error handling API key:", e);
            setIsApiKeyModalOpen(true);
        }
    }, []);

    // Load stories from Local Storage on initial mount
    useEffect(() => {
        try {
            const savedStories = localStorage.getItem('storyforge_stories');
            if (savedStories) {
                setArchivedStories(JSON.parse(savedStories));
            }
        } catch (e) {
            console.error("Failed to load stories from local storage:", e);
            setError("فشل في تحميل القصص المحفوظة من المتصفح.");
        }
    }, []);

    // Save stories to Local Storage whenever they change
    useEffect(() => {
        try {
            // Sort stories by date before saving
            const sortedStories = [...archivedStories].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
            localStorage.setItem('storyforge_stories', JSON.stringify(sortedStories));
        } catch (e) {
            console.error("Failed to save stories to local storage:", e);
            setError("فشل في حفظ القصة في المتصفح.");
        }
    }, [archivedStories]);

    const handleSaveApiKey = async (key: string): Promise<void> => {
        // `validateApiKey` will throw on failure, which is caught by the modal.
        await validateApiKey(key);
        
        // On success:
        localStorage.setItem('gemini_api_key', key);
        initializeGemini(key);
        setApiKey(key);
        setIsApiKeyModalOpen(false);
    };

    const handleApiError = (err: any, context: string) => {
        console.error(`Error during '${context}':`, err);
        const errorMessage = getErrorMessage(err);
        let userFriendlyMessage = `حدث خطأ: ${errorMessage}`;

        if (errorMessage.includes('api key not valid')) {
            userFriendlyMessage = "مفتاح Gemini API غير صالح. يرجى التحقق منه والمحاولة مرة أخرى.";
        }
        setError(userFriendlyMessage);
    };

    const clearWorkspace = () => {
        setActiveStoryId(null);
        setStoryPrompt('');
        setEpisodes([]);
        setPage('main');
    };

    const handleUpdateEpisode = (index: number, updatedEpisode: Episode) => {
        setEpisodes(prev => {
            const newEpisodes = [...prev];
            newEpisodes[index] = updatedEpisode;
            return newEpisodes;
        });
    };

    const handleGenerateStory = useCallback(async () => {
        if (!storyPrompt) {
            setError('الرجاء إدخال فكرة القصة أولاً.');
            return;
        }
        setIsLoading(true);
        setError(null);
        clearWorkspace(); // Resets episodes and other states

        try {
            setLoadingMessage('جارٍ إنشاء الخطوط العريضة للقصة...');
            const outline = await generateStoryOutline(storyPrompt, setLoadingMessage);
            
            const newEpisodes: Episode[] = [];
            for (let i = 0; i < 5; i++) {
                setLoadingMessage(`[${i + 1}/5] جارٍ كتابة نص الحلقة...`);
                const episodeData = await generateEpisode(outline, i + 1, storyPrompt, setLoadingMessage);
                newEpisodes.push({ ...episodeData, videoPrompt: '', videoUrls: [] });
                setEpisodes([...newEpisodes]);

                if (i < 4) await new Promise(resolve => setTimeout(resolve, 1500));
            }
        } catch (err) {
            handleApiError(err, 'إنشاء القصة');
        } finally {
            setIsLoading(false);
            setLoadingMessage('');
        }
    }, [storyPrompt]);

    const handleGenerateVideoScene = useCallback(async (
        episodeIndex: number,
        params: { model: 'veo-3.1-fast-generate-preview' | 'veo-3.1-generate-preview'; resolution: '720p' | '1080p'; aspectRatio: '16:9' | '9:16' }
    ) => {
        const episode = episodes[episodeIndex];
        if (!episode?.videoPrompt) {
            setError("لا يوجد وصف لإنشاء الفيديو.");
            return;
        }

        setIsLoading(true);
        setError(null);
        
        const onProgress = (message: string) => {
            setLoadingMessage(message);
        };

        try {
            onProgress("جارٍ إرسال الطلب إلى VEO...");
            const videoUrl = await generateVideo({
                prompt: episode.videoPrompt,
                model: params.model,
                resolution: params.resolution,
                aspectRatio: params.aspectRatio,
                onProgress,
            });

            const updatedEpisode: Episode = {
                ...episode,
                videoUrls: [...(episode.videoUrls || []), videoUrl],
            };
            handleUpdateEpisode(episodeIndex, updatedEpisode);

        } catch (err) {
            handleApiError(err, 'إنشاء مشهد الفيديو');
        } finally {
            setIsLoading(false);
            setLoadingMessage('');
        }
    }, [episodes]);

     const handleGenerateVideoPrompt = useCallback(async (episodeIndex: number) => {
        const episode = episodes[episodeIndex];
        if (!episode?.text) return;

        setIsLoading(true);
        setLoadingMessage(`جارٍ تحليل نص الحلقة ${episodeIndex + 1}...`);
        setError(null);
        try {
            const prompt = await generateVideoPromptForEpisode(episode.text);
            const updatedEpisode: Episode = { ...episode, videoPrompt: prompt };
            handleUpdateEpisode(episodeIndex, updatedEpisode);
        } catch (err) {
            handleApiError(err, 'تحليل النص لوصف الفيديو');
        } finally {
            setIsLoading(false);
            setLoadingMessage('');
        }
    }, [episodes]);

    const handleSaveStory = () => {
        if (!storyPrompt && episodes.length === 0) {
            setError("لا توجد قصة لحفظها."); return;
        }

        const storyId = activeStoryId || new Date().getTime().toString();
        const storyData: StoryData = { storyPrompt, episodes };
        
        const newStory: ArchivedStory = {
            id: storyId,
            title: episodes[0]?.seo?.title || storyPrompt.substring(0, 50) || "قصة بدون عنوان",
            createdAt: new Date().toISOString(), data: storyData,
        };

        setArchivedStories(prev => {
            const existingIndex = prev.findIndex(story => story.id === storyId);
            if (existingIndex > -1) {
                const updatedStories = [...prev];
                updatedStories[existingIndex] = newStory;
                return updatedStories;
            } else {
                return [...prev, newStory];
            }
        });
        
        setActiveStoryId(storyId);
        alert("تم حفظ القصة بنجاح!");
    };
    
    const handleSaveEpisode = (episodeIndex: number) => {
        try {
            const episodeText = episodes[episodeIndex]?.text; if (!episodeText) return;
            const blob = new Blob([episodeText], { type: 'text/plain;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a'); a.href = url;
            const safeTitle = (episodes[episodeIndex]?.seo?.title || `episode_${episodeIndex + 1}`).replace(/[^a-z0-9_ -]/gi, '_').substring(0, 50);
            a.download = `Episode_${safeTitle}.txt`;
            document.body.appendChild(a); a.click(); document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch(error) {
            handleApiError(error, "حفظ نص الحلقة");
        }
    };

    const handleExportProject = async () => {
        if (isExporting || episodes.length === 0) return;
        setIsExporting(true);
        setError(null);
        setLoadingMessage("جارٍ تجميع وتصدير ملفات المشروع...");
        try {
            const storyData: StoryData = { storyPrompt, episodes };
            await exportStoryAsZip(storyData);
        } catch (err: any) {
            console.error("Failed to export project:", err);
            setError("فشل تصدير المشروع. يرجى التحقق من وحدة التحكم لمزيد من التفاصيل.");
        } finally {
            setIsExporting(false);
            setLoadingMessage("");
        }
    };

    const handleLoadArchivedStory = (storyToLoad: ArchivedStory) => {
        const { data, id } = storyToLoad;
        setActiveStoryId(id);
        setStoryPrompt(data.storyPrompt); 
        // Ensure backward compatibility
        setEpisodes(data.episodes.map(e => ({
            ...e,
            videoPrompt: e.videoPrompt || '',
            videoUrls: e.videoUrls || []
        })));
        setIsArchiveOpen(false);
        setPage('main');
    };

    const handleDeleteArchivedStory = (id: string) => {
        if (window.confirm("هل أنت متأكد أنك تريد حذف هذه القصة؟ سيتم الحذف من هذا المتصفح فقط.")) {
            setArchivedStories(prev => prev.filter(story => story.id !== id));
            if (activeStoryId === id) clearWorkspace();
        }
    };

    const handleSelectSuggestedStory = (prompt: string) => {
        setStoryPrompt(prompt);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    if (!apiKey) {
        return <ApiKeyModal isOpen={isApiKeyModalOpen} onSave={handleSaveApiKey} />;
    }

    return (
        <div className="min-h-screen bg-gray-900 text-gray-100 p-4 sm:p-6 lg:p-8 flex flex-col">
            <div className="max-w-7xl mx-auto space-y-8 w-full flex-grow">
                <Header onNewStory={clearWorkspace} onOpenArchive={() => setIsArchiveOpen(true)} onNavigate={setPage} />
                {page === 'main' ? (
                    <main>
                        <div className="space-y-6 bg-gray-800/30 p-4 sm:p-6 rounded-2xl shadow-2xl border border-gray-700 backdrop-blur-sm">
                           <StoryInput prompt={storyPrompt} setPrompt={setStoryPrompt} onGenerate={handleGenerateStory} isLoading={isLoading} />
                            <div className="border-t border-gray-600/50 pt-6">
                                <StoryFinder onSelectStory={handleSelectSuggestedStory} isLoading={isLoading} />
                            </div>
                        </div>
                        {error && (
                            <div className="mt-4 bg-red-800/50 border border-red-700 text-red-200 px-4 py-3 rounded-lg text-center">
                                <p>{error}</p>
                            </div>
                        )}
                        {episodes.length > 0 && (
                            <EpisodeDisplay
                                episodes={episodes}
                                isLoading={isLoading}
                                isExporting={isExporting}
                                onGenerateVideoScene={handleGenerateVideoScene}
                                onGenerateVideoPrompt={handleGenerateVideoPrompt}
                                onSaveEpisode={handleSaveEpisode}
                                onSaveStory={handleSaveStory}
                                onUpdateEpisode={handleUpdateEpisode}
                                onExportProject={handleExportProject}
                            />
                        )}
                    </main>
                ) : (
                    <main className="bg-gray-800/30 p-6 sm:p-8 rounded-2xl shadow-2xl border border-gray-700 backdrop-blur-sm text-gray-300 max-w-4xl mx-auto w-full">
                        {page === 'about' && <AboutPage />}
                        {page === 'contact' && <ContactPage />}
                        {page === 'privacy' && <PrivacyPolicyPage />}
                        {page === 'terms' && <TermsAndConditionsPage />}
                    </main>
                )}
            </div>
            <Footer onNavigate={setPage} />
            {(isLoading || isExporting) && <Loader message={loadingMessage} />}
            <PreviousStoriesModal 
                isOpen={isArchiveOpen}
                onClose={() => setIsArchiveOpen(false)}
                stories={archivedStories}
                onLoad={handleLoadArchivedStory}
                onDelete={handleDeleteArchivedStory}
            />
        </div>
    );
};

export default App;
