import JSZip from 'jszip';
import type { StoryData, SEOData } from '../types';

// Helper to format SEO data into a readable string
const formatSeoData = (seo: SEOData | null): string => {
    if (!seo) return "لا توجد بيانات SEO متاحة.";
    return `العنوان: ${seo.title}\n\nالوصف: ${seo.description}\n\nالكلمات المفتاحية: ${seo.tags.join(', ')}`;
};

// Helper to fetch blob URLs and handle potential errors
const fetchBlob = async (url: string): Promise<Blob | null> => {
    try {
        const response = await fetch(url);
        if (!response.ok) {
            console.error(`Failed to fetch blob from ${url}, status: ${response.status}`);
            return null;
        }
        return await response.blob();
    } catch (error) {
        console.error(`Error fetching blob from ${url}:`, error);
        return null;
    }
};

export const exportStoryAsZip = async (storyData: StoryData): Promise<void> => {
    const zip = new JSZip();
    const { episodes } = storyData;

    for (let i = 0; i < episodes.length; i++) {
        const episode = episodes[i];
        const episodeFolder = zip.folder(`episode_${i + 1}`);

        if (!episodeFolder) continue;

        // Create all subfolders, even if empty
        const textFolder = episodeFolder.folder("text");
        const audioFolder = episodeFolder.folder("audio");
        const videosFolder = episodeFolder.folder("videos");
        const imagesFolder = episodeFolder.folder("images"); // Keep for structure consistency

        // 1. Add text files
        if (textFolder) {
            textFolder.file("episode_script.txt", episode.text || "");
            textFolder.file("seo_and_metadata.txt", formatSeoData(episode.seo));
        }
        
        // 2. Add audio file
        if (audioFolder && episode.audioUrl) {
            const audioBlob = await fetchBlob(episode.audioUrl);
            if (audioBlob) {
                audioFolder.file("voiceover.wav", audioBlob);
            }
        }

        // 3. Add video files
        const episodeVideos = episode.videoUrls || [];
        if (videosFolder && episodeVideos.length > 0) {
            const videoPromises = episodeVideos.map(async (videoUrl, j) => {
                const videoBlob = await fetchBlob(videoUrl);
                if (videoBlob) {
                    videosFolder.file(`scene_${String(j + 1).padStart(2, '0')}.mp4`, videoBlob);
                }
            });
            await Promise.all(videoPromises);
        }
    }

    // Generate and download the zip file
    const storyTitle = storyData.episodes[0]?.seo?.title || storyData.storyPrompt.substring(0, 30) || "story_project";
    const safeFilename = storyTitle.replace(/[^a-z0-9_ -]/gi, '_').substring(0, 50);

    const zipBlob = await zip.generateAsync({ type: "blob" });
    
    const link = document.createElement("a");
    link.href = URL.createObjectURL(zipBlob);
    link.download = `${safeFilename}.zip`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
};
