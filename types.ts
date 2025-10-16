export interface SEOData {
    title: string;
    description: string;
    tags: string[];
}

export interface GeneratedImage {
    url: string;
}

export interface Episode {
    text: string;
    seo: SEOData | null;
    audioUrl?: string;
    images?: GeneratedImage[];
}

export interface StoryData {
    storyPrompt: string;
    episodes: Episode[];
}

export interface ArchivedStory {
    id: string; // Firestore document ID
    title: string;
    createdAt: string; // ISO string
    data: StoryData;
}

export interface StorySuggestion {
    title:string;
    synopsis: string;
    popularity_reasons: string[];
    youtube_keywords: string[];
}