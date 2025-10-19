import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Header } from './components/Header';
import { StoryInput } from './components/StoryInput';
import { EpisodeDisplay } from './components/EpisodeDisplay';
import { Loader } from './components/Loader';
import { PreviousStoriesModal } from './components/PreviousStoriesModal';
import { StoryFinder } from './components/StoryFinder';
import { ApiKeyModal } from './components/ApiKeyModal';
import { SelectFolderModal } from './components/SelectFolderModal';
import { initializeGemini, validateApiKey, generateStoryOutline, generateEpisode, generateImageScenePrompts, generateStoryboardPrompts, generateImage, registerApiCallListener } from './services/geminiService';
import * as fileSystemService from './services/fileSystemService';
import { exportStoryAsZip } from './services/exportService';
import type { Episode, ArchivedStory, StoryData } from './types';
import { Footer } from './components/Footer';
import { AboutPage } from './components/pages/AboutPage';
import { ContactPage } from './components/pages/ContactPage';
import { PrivacyPolicyPage } from './components/pages/PrivacyPolicyPage';
import { TermsAndConditionsPage } from './components/pages/TermsAndConditionsPage';
import type { CreativeFxParams } from './components/ImageGenerationPanel';

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

    // --- File System State ---
    const [dirHandle, setDirHandle] = useState<FileSystemDirectoryHandle | null>(null);
    const [isRequestingDir, setIsRequestingDir] = useState(false);
    const [dirError, setDirError] = useState(false);
    const dirRequestResolver = useRef<((handle: FileSystemDirectoryHandle | null) => void) | null>(null);

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
    
    // --- API Usage State ---
    const [apiRequests, setApiRequests] = useState<number[]>([]);
    const MAX_RPM = 60;

    // Register API call listener and set up a cleanup interval for old requests
    useEffect(() => {
        // Function to add a timestamp when an API call is made
        const handleApiCall = () => {
            setApiRequests(prev => [...prev, Date.now()]);
        };

        // Register the listener with the geminiService
        registerApiCallListener(handleApiCall);

        // Set up an interval to clear out requests older than 60 seconds
        const cleanupInterval = setInterval(() => {
            const sixtySecondsAgo = Date.now() - 60000;
            setApiRequests(prev => prev.filter(ts => ts > sixtySecondsAgo));
        }, 1000); // Check every second

        // Cleanup function
        return () => {
            clearInterval(cleanupInterval);
            registerApiCallListener(null); // Unregister the listener
        };
    }, []); // Empty dependency array means this runs once on mount and cleans up on unmount

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

    // Try to load directory handle and stories in the background without prompting the user.
    useEffect(() => {
        if (!apiKey) return;

        const tryLoadInBackground = async () => {
            const handle = await fileSystemService.getDirectoryHandle(false); // false = don't prompt
            if (handle) {
                setDirHandle(handle);
                try {
                    // Temporarily show loader for background loading
                    setLoadingMessage("جارٍ تحميل القصص السابقة في الخلفية...");
                    setIsLoading(true);
                    const stories = await fileSystemService.loadStories(handle);
                    setArchivedStories(stories);
                } catch (e) {
                    console.error("Background story load failed, likely due to permissions. Stale handle will be cleared.", e);
                    await fileSystemService.clearDirectoryHandle();
                    setDirHandle(null);
                } finally {
                    setIsLoading(false);
                    setLoadingMessage("");
                }
            }
        };

        if ('showDirectoryPicker' in window) {
            tryLoadInBackground();
        } else {
            setError("متصفحك لا يدعم واجهة برمجة تطبيقات نظام الملفات. لا يمكن حفظ القصص. يرجى استخدام متصفح حديث مثل Chrome أو Edge.");
        }
    }, [apiKey]);
    
    const handleSaveApiKey = async (key: string): Promise<void> => {
        await validateApiKey(key);
        localStorage.setItem('gemini_api_key', key);
        initializeGemini(key);
        setApiKey(key);
        setIsApiKeyModalOpen(false);
    };

    const promptForDirectory = (): Promise<FileSystemDirectoryHandle | null> => {
        return new Promise((resolve) => {
            dirRequestResolver.current = resolve;
            setDirError(false);
            setIsRequestingDir(true);
        });
    };

    const handleSelectFolder = async () => {
        const handle = await fileSystemService.getDirectoryHandle(true); // true prompts native picker
        setIsRequestingDir(false);
        if (handle) {
            setDirHandle(handle);
            setIsLoading(true);
            setLoadingMessage("جارٍ فحص المجلد...");
            try {
                const stories = await fileSystemService.loadStories(handle);
                setArchivedStories(stories);
            } catch (e) {
                console.error("Failed to load stories after selection:", e);
                setError("فشل تحميل القصص من المجلد المختار.");
            } finally {
                setIsLoading(false);
                setLoadingMessage("");
            }
        }
        if (dirRequestResolver.current) {
            dirRequestResolver.current(handle);
            dirRequestResolver.current = null;
        }
    };

    const handleApiError = (err: any, context: string) => {
        console.error(`Error during '${context}':`, err);
        const errorMessage = getErrorMessage(err);
        let userFriendlyMessage = `حدث خطأ أثناء '${context}': ${errorMessage}`;
    
        if (errorMessage.includes('api key not valid')) {
            userFriendlyMessage = "مفتاح Gemini API غير صالح. يرجى التحقق منه والمحاولة مرة أخرى.";
        } else if (errorMessage.includes('quota exceeded') || errorMessage.includes('resource_exhausted')) {
            userFriendlyMessage = "لقد تجاوزت حصتك الحالية من استخدام Gemini API. يرجى التحقق من خطتك وتفاصيل الفوترة في حساب Google AI الخاص بك. قد تحتاج إلى الانتظار لليوم التالي أو الترقية.";
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
        clearWorkspace();

        try {
            setLoadingMessage('جارٍ إنشاء الخطوط العريضة للقصة...');
            const outline = await generateStoryOutline(storyPrompt, setLoadingMessage);
            
            const newEpisodes: Episode[] = [];
            for (let i = 0; i < 5; i++) {
                setLoadingMessage(`[${i + 1}/5] جارٍ كتابة نص الحلقة...`);
                const episodeData = await generateEpisode(outline, i + 1, storyPrompt, setLoadingMessage);
                newEpisodes.push({ ...episodeData, images: [], storyboardPrompts: [] });
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

    const handleGenerateImageScenes = useCallback(async (
        episodeIndex: number,
        fxParams: CreativeFxParams
    ) => {
        const episode = episodes[episodeIndex];
        if (!episode?.text) {
            setError("لا يوجد نص للحلقة لتحليله.");
            return;
        }

        setIsLoading(true);
        setError(null);
        
        try {
            setLoadingMessage(`[1/2] جارٍ تحليل الحلقة ${episodeIndex + 1} لتحديد المشاهد الرئيسية...`);
            const scenePrompts = await generateImageScenePrompts(episode.text);

            if (!scenePrompts || scenePrompts.length === 0) {
                throw new Error("لم يتمكن الذكاء الاصطناعي من تحديد مشاهد من النص.");
            }
            
            setLoadingMessage(`[2/2] جارٍ إنشاء ${scenePrompts.length} صور سينمائية...`);
            
            const seedValue = fxParams.seed ? parseInt(fxParams.seed, 10) : undefined;
            
            const imagePromises = scenePrompts.map((prompt, index) => 
                generateImage({
                    prompt,
                    style: fxParams.style,
                    chips: fxParams.chips,
                    negativePrompt: fxParams.negativePrompt,
                    numberOfImages: 1,
                    seed: seedValue ? seedValue + index : undefined,
                })
            );
            
            const imageResultArrays = await Promise.all(imagePromises);
            const newImages = imageResultArrays.flat();

            const updatedEpisode: Episode = {
                ...episode,
                images: [...(episode.images || []), ...newImages],
            };
            handleUpdateEpisode(episodeIndex, updatedEpisode);

        } catch (err) {
            handleApiError(err, 'إنشاء مشاهد الصور');
        } finally {
            setIsLoading(false);
            setLoadingMessage('');
        }
    }, [episodes]);

    const handleGenerateStoryboard = useCallback(async (episodeIndex: number, promptCount: number) => {
        const episode = episodes[episodeIndex];
        if (!episode?.text) {
            setError("لا يوجد نص حلقة لتحليل لوحة القصة.");
            return;
        }

        setIsLoading(true);
        setError(null);
        
        try {
            setLoadingMessage(`جارٍ تحليل النص لإنشاء ${promptCount} مشهدًا...`);
            const prompts = await generateStoryboardPrompts(episode.text, promptCount);
            
            const updatedEpisode: Episode = {
                ...episode,
                storyboardPrompts: prompts,
            };
            handleUpdateEpisode(episodeIndex, updatedEpisode);

        } catch (err) {
            handleApiError(err, 'إنشاء لوحة قصصية');
        } finally {
            setIsLoading(false);
            setLoadingMessage('');
        }
    }, [episodes]);

    const handleSaveStory = async () => {
        if (!storyPrompt && episodes.length === 0) {
            setError("لا توجد قصة لحفظها."); return;
        }

        let handle = dirHandle;
        if (!handle) {
            handle = await promptForDirectory();
        }

        if (!handle) {
            setError("يجب تحديد مجلد لإتمام عملية الحفظ.");
            return;
        }
        
        setIsLoading(true);
        setLoadingMessage("جارٍ حفظ القصة في مجلدك...");

        const storyId = activeStoryId || new Date().getTime().toString();
        const storyData: StoryData = { storyPrompt, episodes };
        
        const newStory: ArchivedStory = {
            id: storyId,
            title: episodes[0]?.seo?.title || storyPrompt.substring(0, 50) || "قصة بدون عنوان",
            createdAt: new Date().toISOString(), data: storyData,
        };
        
        try {
            await fileSystemService.saveStory(handle, newStory);
            setActiveStoryId(storyId);

            const updatedStories = await fileSystemService.loadStories(handle);
            setArchivedStories(updatedStories);

            alert("تم حفظ القصة بنجاح في مجلدك!");
        } catch (e) {
            console.error("Failed to save story:", e);
            setError("فشل حفظ القصة. تحقق من الأذونات والمساحة المتاحة.");
        } finally {
            setIsLoading(false);
            setLoadingMessage("");
        }
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

    const handleOpenArchive = async () => {
        let handle = dirHandle;
        if (!handle) {
            handle = await promptForDirectory();
        }
        if (handle) {
            setIsArchiveOpen(true);
        }
    };

    const handleLoadArchivedStory = (storyToLoad: ArchivedStory) => {
        const { data, id } = storyToLoad;
        setActiveStoryId(id);
        setStoryPrompt(data.storyPrompt); 
        setEpisodes(data.episodes.map(e => ({
            ...e,
            images: e.images || [],
            storyboardPrompts: e.storyboardPrompts || [],
        })));
        setIsArchiveOpen(false);
        setPage('main');
    };

    const handleDeleteArchivedStory = async (id: string) => {
        if (!dirHandle) {
            setError("لا يمكن العثور على مقبض المجلد لحذف القصة.");
            return;
        }
        if (window.confirm("هل أنت متأكد أنك تريد حذف هذه القصة؟ سيتم حذف مجلدها من جهاز الكمبيوتر الخاص بك.")) {
            try {
                await fileSystemService.deleteStory(dirHandle, id);
                setArchivedStories(prev => prev.filter(story => story.id !== id));
                if (activeStoryId === id) clearWorkspace();
            } catch (e) {
                console.error("Failed to delete story folder:", e);
                setError("فشل حذف مجلد القصة.");
            }
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
                <Header onNewStory={clearWorkspace} onOpenArchive={handleOpenArchive} onNavigate={setPage} />
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
                                onGenerateImageScenes={handleGenerateImageScenes}
                                onGenerateStoryboard={handleGenerateStoryboard}
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
            <Footer onNavigate={setPage} currentRpm={apiRequests.length} maxRpm={MAX_RPM} />
            {(isLoading || isExporting) && <Loader message={loadingMessage} />}
            <PreviousStoriesModal 
                isOpen={isArchiveOpen}
                onClose={() => setIsArchiveOpen(false)}
                stories={archivedStories}
                onLoad={handleLoadArchivedStory}
                onDelete={handleDeleteArchivedStory}
            />
            <SelectFolderModal isOpen={isRequestingDir} onSelectFolder={handleSelectFolder} isError={dirError} />
        </div>
    );
};

export default App;