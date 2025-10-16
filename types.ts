export interface SEOData {
    title: string;
    description: string;
    tags: string[];
}

export interface Episode {
    text: string;
    seo: SEOData | null;
    audioUrl?: string;
    videoPrompt?: string; // New field for the AI-generated VEO prompt
    videoUrls?: string[];
}

// FIX: Added missing GeneratedImage interface to resolve import errors.
export interface GeneratedImage {
    url: string;
}

export interface StoryData {
    storyPrompt: string;
    episodes: Episode[];
    // All image-related fields have been removed.
}

export interface ArchivedStory {
    id: string; // Firestore document ID
    title: string;
    createdAt: string; // ISO string
    data: StoryData;
}

export interface StorySuggestion {
    title: string;
    synopsis: string;
    popularity_reasons: string[];
    youtube_keywords: string[];
}