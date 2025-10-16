import type { GeneratedImage } from '../types';

export interface SlideshowOptions {
    animationStyle: 'ken_burns' | 'static';
    transitionStyle: 'fade' | 'wipe_right' | 'cube_spin';
    slideDurationSec: number;
    totalDurationMinutes: 10 | 15;
}

export interface ProgressUpdate {
    message: string;
    isError?: boolean;
}

const BASE_URL = 'https://api.json2video.com/v2/movies';

/**
 * Polls the JSON2Video API for the status of a rendering job.
 */
const pollStatus = async (
    projectId: string, 
    apiKey: string, 
    onProgressUpdate: (update: ProgressUpdate) => void,
    attempt = 0
): Promise<string> => {
    // Exponential backoff delay
    const delay = Math.min(1000 * Math.pow(2, attempt), 30000); 
    await new Promise(resolve => setTimeout(resolve, delay));
    
    try {
        const response = await fetch(`${BASE_URL}?project=${projectId}`, {
            method: 'GET',
            headers: { 'x-api-key': apiKey }
        });

        if (!response.ok) {
            throw new Error(`خطأ في الشبكة: ${response.status}`);
        }

        const result = await response.json();
        const movie = result.movie;

        onProgressUpdate({ message: `محاولة التحقق ${attempt + 1}: الحالة هي ${movie.status.toUpperCase()}` });

        if (movie.status === 'done' && movie.url) {
            onProgressUpdate({ message: 'اكتمل تصيير الفيديو بنجاح!' });
            return movie.url;
        } else if (movie.status === 'error' || !movie.success) {
            throw new Error(`فشل التصيير: ${movie.message || 'خطأ غير معروف'}`);
        }

        // If not done, continue polling
        return pollStatus(projectId, apiKey, onProgressUpdate, attempt + 1);

    } catch (error: any) {
        onProgressUpdate({ message: `فشل التحقق من الحالة: ${error.message}. المحاولة مرة أخرى...`, isError: true });
        // Retry on error with backoff
        return pollStatus(projectId, apiKey, onProgressUpdate, attempt + 1);
    }
};

/**
 * Creates the JSON payload for the JSON2Video API.
 */
const createVideoPayload = (images: GeneratedImage[], options: SlideshowOptions, episodeTitle: string) => {
    const { animationStyle, transitionStyle, slideDurationSec, totalDurationMinutes } = options;

    const singleLoopDuration = images.length * (slideDurationSec + 1); // +1 for transition
    const totalDurationSec = totalDurationMinutes * 60;
    const requiredLoops = Math.ceil(totalDurationSec / singleLoopDuration);

    const singleScene = {
        'type': 'image',
        'src': '', // Placeholder, will be replaced in loop
        'duration': slideDurationSec,
        'pan': animationStyle === 'ken_burns' ? 'zoom-in' : undefined,
        'pan-distance': animationStyle === 'ken_burns' ? 0.05 : undefined
    };

    let scenes = [];
    for (let i = 0; i < requiredLoops; i++) {
        for (const image of images) {
            const sceneCopy = { ...singleScene, src: image.url };
            // Add transition to all scenes
            const transition = {
                'transition-effect': transitionStyle,
                'transition-duration': 1
            };
            scenes.push({ ...transition, 'elements': [sceneCopy] });
        }
    }
    
    // Remove transition from the very last scene
    if (scenes.length > 0) {
        delete scenes[scenes.length - 1]['transition-effect'];
        delete scenes[scenes.length - 1]['transition-duration'];
    }
    
    const projectId = `${episodeTitle.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${Date.now()}`;

    return {
        'project_id': projectId,
        'resolution': 'full-hd', // 1920x1080
        'quality': 'high',
        'draft': false,
        'scenes': scenes
    };
};

/**
 * Main function to generate the slideshow video.
 */
export const generateSlideshowVideo = async (
    apiKey: string,
    images: GeneratedImage[],
    options: SlideshowOptions,
    episodeTitle: string,
    onProgressUpdate: (update: ProgressUpdate) => void
): Promise<string> => {
    if (!apiKey) {
        throw new Error("مفتاح API الخاص بـ JSON2Video مطلوب.");
    }
    if (images.length === 0) {
        throw new Error("لا توجد صور لإنشاء الفيديو.");
    }

    onProgressUpdate({ message: 'جارٍ إنشاء حمولة الفيديو...' });
    const payload = createVideoPayload(images, options, episodeTitle);
    
    try {
        onProgressUpdate({ message: `بدء مهمة التصيير للمشروع: ${payload.project_id}` });
        const response = await fetch(BASE_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': apiKey
            },
            body: JSON.stringify(payload)
        });

        const result = await response.json();

        if (!response.ok || !result.success) {
            throw new Error(`خطأ في واجهة برمجة التطبيقات: ${result.message || response.statusText}`);
        }

        const projectId = result.project;
        onProgressUpdate({ message: `تم استلام معرّف المشروع: ${projectId}. بدء التحقق من الحالة...` });
        
        // Start polling for the result
        return await pollStatus(projectId, apiKey, onProgressUpdate);

    } catch (error: any) {
        onProgressUpdate({ message: `حدث خطأ فادح: ${error.message}`, isError: true });
        throw error;
    }
};