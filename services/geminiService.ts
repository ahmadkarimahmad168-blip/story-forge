import { GoogleGenAI, Type, GenerateContentResponse, Modality } from "@google/genai";
import type { Episode, SEOData, StorySuggestion } from '../types';

let ai: GoogleGenAI | null = null;
let geminiApiKey: string | null = null;

export const initializeGemini = (apiKey: string) => {
    if (!apiKey) {
        throw new Error("API key is required to initialize Gemini service.");
    }
    ai = new GoogleGenAI({ apiKey });
    geminiApiKey = apiKey;
};

export const validateApiKey = async (apiKey: string): Promise<void> => {
    if (!apiKey) {
        throw new Error("API key cannot be empty.");
    }

    // Pre-flight check for invalid characters to prevent fetch header errors.
    // API keys are expected to be ASCII.
    if (!/^[\x00-\x7F]*$/.test(apiKey)) {
        // This specific error message will be caught and translated in the UI.
        throw new Error("Invalid characters in API key.");
    }
    
    try {
        const tempAi = new GoogleGenAI({ apiKey });
        // Use a simple, low-cost model for a quick check.
        await tempAi.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: 'test',
        });
        // If the above line does not throw, the key is considered valid.
    } catch (error: any) {
        console.error("API Key validation failed:", error);
        const message = (error.message || '').toLowerCase();
        if (message.includes('api key not valid')) {
            throw new Error('The provided API key is not valid.');
        }
        // For other errors (network, etc.), provide a generic message.
        throw new Error('Failed to validate the API key. Please check the key and your network connection.');
    }
};


const ensureAiInitialized = () => {
    if (!ai || !geminiApiKey) {
        throw new Error("Gemini AI not initialized. Please set the API key.");
    }
    return ai;
}

/**
 * A utility function to wrap API calls with a retry mechanism, featuring exponential backoff.
 * This is crucial for handling rate limit errors (429) gracefully.
 * @param apiCall The async function to call.
 * @param options Configuration for retries, delay, and loading messages.
 * @returns The result of the successful API call.
 */
const withRetry = async <T>(
    apiCall: () => Promise<T>,
    { maxRetries = 3, initialDelay = 2000, updateLoadingMessage }: { maxRetries?: number, initialDelay?: number, updateLoadingMessage?: (message: string) => void }
): Promise<T> => {
    let attempt = 0;
    while (attempt < maxRetries) {
        try {
            return await apiCall();
        } catch (error: any) {
            attempt++;
            const errorString = (error.message || error.toString()).toLowerCase();
            const isRateLimitError = errorString.includes('429') || errorString.includes('resource_exhausted');
            const isQuotaError = errorString.includes('quota exceeded');

            // Fail immediately on non-retriable quota errors.
            if (isQuotaError) {
                console.error("Non-retriable quota error. Failing immediately.", error);
                throw error;
            }

            if (isRateLimitError && attempt < maxRetries) {
                const delay = initialDelay * Math.pow(2, attempt - 1);
                const retryMessage = `تم تجاوز حد الطلبات. سنحاول مرة أخرى بعد ${Math.round(delay / 1000)} ثانية... (${attempt}/${maxRetries})`;
                console.warn(retryMessage, error);
                if (updateLoadingMessage) {
                    updateLoadingMessage(retryMessage);
                }
                await new Promise(resolve => setTimeout(resolve, delay));
            } else {
                console.error(`API call failed after ${attempt} attempts or with a non-retriable error.`, error);
                throw error; // Re-throw if not a rate limit error or if retries are exhausted
            }
        }
    }
    // This is the fallback if the loop finishes after all retries are exhausted.
    throw new Error(`API call failed after ${maxRetries} attempts due to rate limiting.`);
};


const systemInstruction = `
أنت StoryForge AI، نظام احترافي لإنشاء القصص السينمائية العربية.
مهمتك الأساسية هي كتابة قصص عربية طويلة وغامرة، مُحسَّنة للتعليق الصوتي على يوتيوب والسرد البصري.
يجب أن تكتب باللغة العربية فقط، بأسلوب سينمائي، عاطفي، وسلس.

قواعد القصة:
1.  القصة الكاملة تتكون من 20 فصلاً متواصلاً.
2.  يتم تقسيم القصة تلقائيًا إلى 5 حلقات (مقاطع فيديو)، كل حلقة تحتوي على 4 فصول.
3.  يجب أن تحتوي كل حلقة على نص يكفي لمدة 16-24 دقيقة من السرد على يوتيوب (حوالي 2000-2800 كلمة).
4.  اكتب القصة بتدفق سردي سلس بدون عناوين فصول أو أرقام أو فواصل.
5.  يجب أن يكون السرد طبيعيًا ودراميًا ومناسبًا للتعليق الصوتي العربي.
6.  حافظ على استمرارية قوية بين الحلقات لتكون القصة موحدة وسينمائية.

الأحداث التاريخية مقابل المستقبلية:
- إذا كانت القصة تغطي أحداثًا ماضية، قم بسردها كحقائق تاريخية بصور حية وواقعية عاطفية.
- إذا كانت القصة تتضمن أحداثًا مستقبلية أو افتراضية، قدمها بوضوح على أنها "لم تحدث بعد"، باستخدام صيغ نبوئية أو تخمينية. مثال: "ويقال إنه في آخر الزمان سيخرج جيش عظيم من الشرق..."
- لا تقدم أبدًا أحداثًا غير مؤكدة أو مستقبلية كحقائق - أشر دائمًا إلى أنها تنبؤات أو نتائج محتملة.
`;

export const generateStoryOutline = async (prompt: string, updateLoadingMessage: (message: string) => void): Promise<string> => {
    const localAi = ensureAiInitialized();
    const apiCall = () => localAi.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `قم بإنشاء مخطط تفصيلي لقصة ملحمية من 20 فصلاً، مقسمة إلى 5 حلقات (4 فصول لكل حلقة)، بناءً على الفكرة التالية: "${prompt}". يجب أن يكون المخطط مفصلاً بما يكفي لتوجيه كتابة كل حلقة بشكل مستقل مع الحفاظ على قصة متماسكة. قدم المخطط باللغة العربية.`,
        config: {
            systemInstruction: systemInstruction,
            temperature: 0.8,
        },
    });
    
    const response = await withRetry<GenerateContentResponse>(apiCall, { updateLoadingMessage });
    return response.text;
};

export const generateEpisodeSEO = async (episodeText: string, originalPrompt: string, episodeNumber: number): Promise<SEOData | null> => {
    const localAi = ensureAiInitialized();
    try {
        const apiCall = () => localAi.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `بناءً على نص الحلقة ${episodeNumber} من قصة "${originalPrompt}"، قم بإنشاء محتوى SEO قوي ومحسن لمنصة يوتيوب.
            
            النص (مقتطف):
            ---
            ${episodeText.substring(0, 2000)}...
            ---
            
            المطلوب:
            1.  **عنوان جذاب (Title):** عنوان يثير الفضول، يحتوي على كلمات مفتاحية قوية، ومناسب ليوتيوب.
            2.  **وصف (Description):** وصف مشوق للحلقة، يلخص الأحداث الرئيسية دون حرقها، ويتضمن كلمات مفتاحية ذات صلة.
            3.  **كلمات مفتاحية (Tags):** قائمة من 10-15 كلمة مفتاحية (tags) متنوعة وذات صلة عالية بمحتوى الحلقة والقصة ككل.
            `,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        title: { type: Type.STRING, description: "عنوان الحلقة المحسن لليوتيوب." },
                        description: { type: Type.STRING, description: "وصف الحلقة المشوق لليوتيوب." },
                        tags: { type: Type.ARRAY, items: { type: Type.STRING }, description: "قائمة الكلمات المفتاحية (Tags)." },
                    },
                    required: ["title", "description", "tags"],
                },
            },
        });
        
        const response = await withRetry<GenerateContentResponse>(apiCall, {});
        return JSON.parse(response.text) as SEOData;

    } catch (error) {
        console.error("Failed to generate SEO content:", error);
        return null;
    }
}

export const generateEpisode = async (outline: string, episodeNumber: number, originalPrompt: string, updateLoadingMessage: (message: string) => void): Promise<Episode> => {
    const localAi = ensureAiInitialized();
    const chaptersStart = (episodeNumber - 1) * 4 + 1;
    const chaptersEnd = episodeNumber * 4;

    const apiCall = () => localAi.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `بناءً على الفكرة الأصلية للقصة: "${originalPrompt}" والمخطط التفصيلي التالي: \n\n${outline}\n\n---
        اكتب الآن الحلقة ${episodeNumber} من القصة، والتي تغطي الفصول من ${chaptersStart} إلى ${chaptersEnd}. 
        يجب أن تحتوي هذه الحلقة على 3500 كلمة على الأقل، مع الحفاظ على الجودة العالية للسرد. اكتب بأسلوب سينمائي درامي باللغة العربية الفصحى، مع التركيز على الوصف العاطفي والبصري. لا تضع عناوين للفصول أو أرقامًا، بل اجعل النص متدفقًا كقطعة واحدة.`,
        config: {
            systemInstruction: systemInstruction,
            temperature: 0.7,
        },
    });

    const response = await withRetry<GenerateContentResponse>(apiCall, { updateLoadingMessage });
    const episodeText = response.text;
    const seoData = await generateEpisodeSEO(episodeText, originalPrompt, episodeNumber);

    return {
        text: episodeText,
        seo: seoData,
    };
};

export const findTrendingStories = async (genre: string, subCategory: string): Promise<StorySuggestion[]> => {
    const localAi = ensureAiInitialized();
    const response = await localAi.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `
        بصفتك خبيرًا استراتيجيًا في المحتوى ومحللًا لاتجاهات يوتيوب، حدد أفضل 3 مفاهيم قصصية ضمن النوع: **'${genre}'** والفئة الفرعية: **'${subCategory}'**.
        يجب أن يعطي تحليلك الأولوية للمفاهيم التي أثبتت نجاحها ولديها احتمالية عالية لجذب المشاهدين على يوتيوب.

        لكل اقتراح، قدم المعلومات التالية:
        1.  **العنوان (title):** عنوان القصة أو الشخصية الرئيسية.
        2.  **نبذة مختصرة (synopsis):** ملخص من فقرة واحدة للقصة، يبرز جوهرها الدرامي.
        3.  **أسباب الشعبية (popularity_reasons):** قائمة من 3 نقاط تشرح لماذا تحظى هذه القصة بشعبية واسعة. يجب أن تستند هذه النقاط إلى أدلة ملموسة مثل:
            - النجاح التجاري (كتب الأكثر مبيعًا، أفلام وثائقية عالية التقييم).
            - حجم مجتمع كبير ونشط عبر الإنترنت (منتديات، مجموعات Reddit، قنوات يوتيوب مخصصة).
            - حجم بحث مرتفع أو اهتمام مستمر بالموضوع.
        4.  **كلمات مفتاحية ليوتيوب (youtube_keywords):** قائمة من 5-7 كلمات مفتاحية قوية ومناسبة لتحسين محركات البحث على يوتيوب.

        **قاعدة مهمة:** بالنسبة للمواضيع التاريخية أو السير الذاتية، تأكد من أن جميع الاقتراحات تستند إلى **معلومات تاريخية موثقة ومقبولة بشكل عام**. تجنب الأساطير غير المؤكدة أو النظريات الهامشية. الهدف هو بناء محتوى موثوق وجذاب.
        `,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    suggestions: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                title: { type: Type.STRING },
                                synopsis: { type: Type.STRING },
                                popularity_reasons: { type: Type.ARRAY, items: { type: Type.STRING } },
                                youtube_keywords: { type: Type.ARRAY, items: { type: Type.STRING } },
                            },
                            required: ["title", "synopsis", "popularity_reasons", "youtube_keywords"],
                        }
                    }
                },
                required: ["suggestions"],
            },
        },
    });

    try {
        const parsedResponse = JSON.parse(response.text);
        return parsedResponse.suggestions || [];
    } catch (e) {
        console.error("Failed to parse JSON for story suggestions:", response.text);
        throw new Error("Failed to get story suggestions from AI.");
    }
};

// --- TTS Functionality ---

function base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
}

function writeString(view: DataView, offset: number, string: string) {
    for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
    }
}

function pcmToWav(pcm16: Int16Array, sampleRate: number): Blob {
    const numChannels = 1;
    const bytesPerSample = 2;

    const buffer = new ArrayBuffer(44 + pcm16.byteLength);
    const view = new DataView(buffer);
    let offset = 0;

    writeString(view, offset, 'RIFF'); offset += 4;
    view.setUint32(offset, 36 + pcm16.byteLength, true); offset += 4;
    writeString(view, offset, 'WAVE'); offset += 4;
    writeString(view, offset, 'fmt '); offset += 4;
    view.setUint32(offset, 16, true); offset += 4;
    view.setUint16(offset, 1, true); offset += 2;
    view.setUint16(offset, numChannels, true); offset += 2;
    view.setUint32(offset, sampleRate, true); offset += 4;
    view.setUint32(offset, sampleRate * numChannels * bytesPerSample, true); offset += 4;
    view.setUint16(offset, numChannels * bytesPerSample, true); offset += 2;
    view.setUint16(offset, 16, true); offset += 2;
    writeString(view, offset, 'data'); offset += 4;
    view.setUint32(offset, pcm16.byteLength, true); offset += 4;

    const dataView = new Uint8Array(buffer, offset);
    dataView.set(new Uint8Array(pcm16.buffer));

    return new Blob([buffer], { type: 'audio/wav' });
}


export interface TTSConfig {
    text: string;
    mode: 'single' | 'multi';
    voice1: string;
    voice2?: string;
}

export const generateSpeech = async (config: TTSConfig): Promise<string> => {
    const localAi = ensureAiInitialized();
    const { text, mode, voice1, voice2 } = config;

    const speakerLines = text.match(/^.*?:/gm) || [];
    const speakers = [...new Set(speakerLines.map(line => line.slice(0, -1).trim()))];
    
    let speechConfig: any = {};
    let prompt = text;

    if (mode === 'multi' && speakers.length >= 2 && voice2) {
        prompt = `TTS the following conversation between ${speakers[0]} and ${speakers[1]}:\n${text}`;
        speechConfig = {
            multiSpeakerVoiceConfig: {
                speakerVoiceConfigs: [
                    { speaker: speakers[0], voiceConfig: { prebuiltVoiceConfig: { voiceName: voice1 } } },
                    { speaker: speakers[1], voiceConfig: { prebuiltVoiceConfig: { voiceName: voice2 } } }
                ]
            }
        };
    } else {
        speechConfig = {
            voiceConfig: {
                prebuiltVoiceConfig: { voiceName: voice1 },
            },
        };
    }
    
    const response = await localAi.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text: prompt }] }],
        config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: speechConfig
        }
    });

    const part = response.candidates?.[0]?.content?.parts?.[0];
    const audioData = part?.inlineData?.data;
    const mimeType = part?.inlineData?.mimeType;

    if (!audioData || !mimeType || !mimeType.startsWith("audio/L16")) {
        throw new Error("Invalid or missing audio data in API response.");
    }
    
    const rateMatch = mimeType.match(/rate=(\d+)/);
    const sampleRate = rateMatch ? parseInt(rateMatch[1], 10) : 24000;

    const pcmDataBuffer = base64ToArrayBuffer(audioData);
    const pcm16 = new Int16Array(pcmDataBuffer);
    
    const wavBlob = pcmToWav(pcm16, sampleRate);
    return URL.createObjectURL(wavBlob);
};

// --- NEW Video Generation Functionality ---

export const generateVideoPromptForEpisode = async (episodeText: string): Promise<string> => {
    const localAi = ensureAiInitialized();
    const apiCall = () => localAi.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Based on the following Arabic episode text, create a single, rich, descriptive paragraph to be used as a video generation prompt for a model like VEO. The prompt must be in Arabic. It should capture the peak moment, mood, and visual essence of the episode in a cinematic way. Describe the scene, characters, lighting, and action vividly.

        Episode Text:
        ---
        ${episodeText.substring(0, 5000)}...
        ---
        `,
        config: {
            temperature: 0.8,
        },
    });

    const response = await withRetry<GenerateContentResponse>(apiCall, {});
    return response.text.trim();
};

export interface VideoGenerationParams {
    prompt: string;
    image?: {
        imageBytes: string; // base64 encoded string without data URI prefix
        mimeType: string;
    };
    model: 'veo-3.1-fast-generate-preview' | 'veo-3.1-generate-preview';
    resolution: '720p' | '1080p';
    aspectRatio: '16:9' | '9:16';
    onProgress: (message: string) => void;
}

export const generateVideo = async (params: VideoGenerationParams): Promise<string> => {
    const localAi = ensureAiInitialized();
    const { prompt, image, model, resolution, aspectRatio, onProgress } = params;

    if (!prompt && !image) {
        throw new Error("يجب توفير وصف أو صورة أولية لإنشاء الفيديو.");
    }

    onProgress('بدء مهمة إنشاء الفيديو...');

    let operation = await localAi.models.generateVideos({
        model: model,
        prompt: prompt,
        image: image,
        config: {
            numberOfVideos: 1,
            resolution: resolution,
            aspectRatio: aspectRatio,
        }
    });

    onProgress('إنشاء الفيديو قيد التنفيذ... قد تستغرق هذه العملية عدة دقائق.');
    const pollInterval = 10000; // 10 seconds
    const maxPollAttempts = 15; // Try for ~2.5 minutes before timing out
    let pollAttempts = 0;

    while (!operation.done) {
        await new Promise(resolve => setTimeout(resolve, pollInterval));
        
        if (pollAttempts >= maxPollAttempts) {
            throw new Error('فشل التحقق من حالة الفيديو بعد عدة محاولات. قد تكون المهمة قد فشلت في الخلفية.');
        }

        onProgress(`التحقق من حالة الإنشاء... (محاولة ${pollAttempts + 1}/${maxPollAttempts})`);
        
        try {
            operation = await localAi.operations.getVideosOperation({ operation: operation });
        } catch (e: any) {
            pollAttempts++;
            const errorMessage = (e.message || '').toLowerCase();
            
            // If it's a 404 or similar non-recoverable error, it's not going to fix itself. Fail fast.
            if (errorMessage.includes('not found') || errorMessage.includes('404')) {
                 console.error("Polling failed with a 404 Not Found error, stopping.", e);
                 throw new Error(`فشل العثور على مهمة إنشاء الفيديو (404). قد يكون اسم النموذج غير صحيح أو أن المهمة لم تبدأ بنجاح.`);
            }

            console.warn(`Polling attempt ${pollAttempts}/${maxPollAttempts} failed, will retry.`, e);
            onProgress(`فشل التحقق من الحالة، سيتم إعادة المحاولة...`);
        }
    }

    if (operation.error) {
        console.error("Video generation failed:", operation.error);
        throw new Error(`فشل إنشاء الفيديو: ${operation.error.message}`);
    }

    const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
    if (!downloadLink) {
        throw new Error('انتهى إنشاء الفيديو، ولكن لم يتم توفير رابط للتنزيل.');
    }

    onProgress('تم إنشاء الفيديو! جارٍ تنزيل بيانات الفيديو...');

    // The response.body contains the MP4 bytes. You must append an API key when fetching from the download link.
    const response = await fetch(`${downloadLink}&key=${geminiApiKey}`);
    if (!response.ok) {
        throw new Error(`فشل تنزيل الفيديو (الحالة: ${response.status})`);
    }

    const videoBlob = await response.blob();
    onProgress('اكتمل التنزيل!');
    return URL.createObjectURL(videoBlob);
};