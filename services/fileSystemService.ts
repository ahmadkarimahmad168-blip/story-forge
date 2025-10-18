import { set, get, del } from './idbService';
import type { ArchivedStory, GeneratedImage, Episode } from '../types';

const DIR_HANDLE_KEY = 'storyForgeDirHandle';

// Helper to verify and request permission if needed
async function verifyPermission(fileHandle: FileSystemHandle, readWrite: boolean): Promise<boolean> {
    // FIX: Define options type inline and cast fileHandle to `any` to work around missing File System Access API types.
    const options: { mode?: 'read' | 'readwrite' } = {};
    if (readWrite) {
        options.mode = 'readwrite';
    }
    // Check if permission was already granted
    if ((await (fileHandle as any).queryPermission(options)) === 'granted') {
        return true;
    }
    // Request permission
    if ((await (fileHandle as any).requestPermission(options)) === 'granted') {
        return true;
    }
    // Permission was denied
    return false;
}

// Helper to fetch blob URLs (data URLs, object URLs)
const fetchBlob = async (url: string): Promise<Blob> => {
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`Failed to fetch blob from ${url}, status: ${response.status}`);
    }
    return await response.blob();
};


export const getDirectoryHandle = async (requestIfNotFound: boolean = false): Promise<FileSystemDirectoryHandle | null> => {
    let dirHandle = await get<FileSystemDirectoryHandle>(DIR_HANDLE_KEY);
    
    if (dirHandle) {
        try {
             if (await verifyPermission(dirHandle, true)) {
                return dirHandle;
            } else {
                // User denied permission for the stored handle
                return null;
            }
        } catch(e) {
            console.error("Error verifying permission for stored handle, it might be stale.", e);
            // The handle might be stale (e.g., folder deleted), so we should prompt again.
            dirHandle = null; 
        }
    }

    if (requestIfNotFound) {
        try {
            // FIX: Cast window to `any` to access `showDirectoryPicker`, which may be missing from default TS types.
            dirHandle = await (window as any).showDirectoryPicker({
                mode: 'readwrite',
            });
            await set(DIR_HANDLE_KEY, dirHandle);
            return dirHandle;
        } catch (e) {
            // User cancelled the picker
            console.log('User cancelled directory picker.');
            return null;
        }
    }

    return null;
};

export const clearDirectoryHandle = async (): Promise<void> => {
    await del(DIR_HANDLE_KEY);
};

export const saveStory = async (dirHandle: FileSystemDirectoryHandle, storyToSave: ArchivedStory): Promise<void> => {
    const storyDirHandle = await dirHandle.getDirectoryHandle(storyToSave.id, { create: true });

    // Save story.json metadata
    const storyFileHandle = await storyDirHandle.getFileHandle('story.json', { create: true });
    let writable = await storyFileHandle.createWritable();
    await writable.write(JSON.stringify(storyToSave, null, 2));
    await writable.close();

    // Save assets for each episode
    for (let i = 0; i < storyToSave.data.episodes.length; i++) {
        const episode = storyToSave.data.episodes[i];
        const episodeDirHandle = await storyDirHandle.getDirectoryHandle(`episode_${i + 1}`, { create: true });

        // Save audio
        if (episode.audioUrl) {
            try {
                const audioBlob = await fetchBlob(episode.audioUrl);
                const audioFileHandle = await episodeDirHandle.getFileHandle('voiceover.wav', { create: true });
                writable = await audioFileHandle.createWritable();
                await writable.write(audioBlob);
                await writable.close();
            } catch (e) {
                console.error(`Failed to save audio for episode ${i+1}`, e);
            }
        }
        
        // Save images
        if (episode.images && episode.images.length > 0) {
            const imagesDirHandle = await episodeDirHandle.getDirectoryHandle('images', { create: true });
            for (let j = 0; j < episode.images.length; j++) {
                const image = episode.images[j];
                 try {
                    const imageBlob = await fetchBlob(image.url);
                    const imageFileHandle = await imagesDirHandle.getFileHandle(`image_${j+1}.png`, { create: true });
                    writable = await imageFileHandle.createWritable();
                    await writable.write(imageBlob);
                    await writable.close();
                } catch (e) {
                    console.error(`Failed to save image ${j+1} for episode ${i+1}`, e);
                }
            }
        }
    }
};

const loadStoryFromDirectory = async (storyDirHandle: FileSystemDirectoryHandle): Promise<ArchivedStory | null> => {
    if (storyDirHandle.kind !== 'directory') return null;

    try {
        const storyFileHandle = await storyDirHandle.getFileHandle('story.json');
        const storyFile = await storyFileHandle.getFile();
        const storyJson = JSON.parse(await storyFile.text());

        // Now, load assets and replace placeholders with object URLs
        for (let i = 0; i < storyJson.data.episodes.length; i++) {
            const episode: Episode = storyJson.data.episodes[i];
            
            try {
                const episodeDirHandle = await storyDirHandle.getDirectoryHandle(`episode_${i + 1}`);

                 // Load audio
                try {
                    const audioFileHandle = await episodeDirHandle.getFileHandle('voiceover.wav');
                    const audioBlob = await audioFileHandle.getFile();
                    episode.audioUrl = URL.createObjectURL(audioBlob);
                } catch {
                    episode.audioUrl = undefined;
                }

                // Load images
                try {
                    const imagesDirHandle = await episodeDirHandle.getDirectoryHandle('images');
                    const newImages: GeneratedImage[] = [];
                    const imageHandles = [];
                    // Collect all file handles first
                    for await (const imageHandle of imagesDirHandle.values()) {
                        if (imageHandle.kind === 'file' && imageHandle.name.endsWith('.png')) {
                            imageHandles.push(imageHandle);
                        }
                    }
                    // Sort by name to maintain order (e.g., image_1.png, image_2.png)
                    imageHandles.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));

                    for (const imageHandle of imageHandles) {
                         const imageBlob = await imageHandle.getFile();
                         newImages.push({ url: URL.createObjectURL(imageBlob) });
                    }
                    episode.images = newImages;
                } catch {
                    episode.images = [];
                }
            } catch {
                console.warn(`Could not find asset directory for episode ${i+1} in story ${storyDirHandle.name}`);
            }
        }
        
        return storyJson as ArchivedStory;

    } catch (e) {
        console.error(`Failed to load story from directory ${storyDirHandle.name}`, e);
        return null;
    }
};


export const loadStories = async (dirHandle: FileSystemDirectoryHandle): Promise<ArchivedStory[]> => {
    const stories: ArchivedStory[] = [];
    for await (const entry of dirHandle.values()) {
        if (entry.kind === 'directory') {
            // FIX: Cast entry to FileSystemDirectoryHandle as TS doesn't infer it from the kind check.
            const story = await loadStoryFromDirectory(entry as FileSystemDirectoryHandle);
            if(story) stories.push(story);
        }
    }
    // Sort stories by date, newest first
    return stories.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
};

export const deleteStory = async (dirHandle: FileSystemDirectoryHandle, storyId: string): Promise<void> => {
    await dirHandle.removeEntry(storyId, { recursive: true });
};
