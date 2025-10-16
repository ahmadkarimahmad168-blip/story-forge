import React, { useState, useEffect } from 'react';
import { Icon } from './Icon';
import { findTrendingStories } from '../services/geminiService';
import type { StorySuggestion } from '../types';
import { StorySuggestionCard } from './StorySuggestionCard';

interface StoryFinderProps {
    onSelectStory: (prompt: string) => void;
    isLoading: boolean;
}

const storyGenres = [
    {
        name: 'التاريخ والسير الذاتية',
        subCategories: [
            'قصص الأنبياء والرسل',
            'قصص الصحابة والخلفاء الراشدين',
            'المعارك والغزوات الإسلامية',
            'العصر الذهبي للإسلام',
            '---', // Separator
            'الإمبراطورية الرومانية',
            'الحضارة المصرية القديمة',
            'سير شخصيات غيرت التاريخ',
            'عصر الفايكنج',
        ]
    },
    {
        name: 'الأساطير والفولكلور العالمي',
        subCategories: [
            'الأساطير الإغريقية',
            'الأساطير المصرية القديمة',
            'الأساطير النوردية (الشمالية)',
            'حكايات ألف ليلة وليلة',
            'الفولكلور الياباني (يوكاي)',
        ]
    },
    {
        name: 'الخيال العلمي والمستقبل',
        subCategories: [
            'استكشاف الفضاء والكواكب البعيدة',
            'أول اتصال مع كائنات فضائية',
            'الديستوبيا والسايبربنك',
            'السفر عبر الزمن ومفارقاته',
            'الذكاء الاصطناعي والثورة التكنولوجية',
        ]
    },
    {
        name: 'الغموض والجرائم الحقيقية',
        subCategories: [
            'ألغاز تاريخية لم تحل',
            'قضايا جرائم غامضة',
            'قصص محققين أسطوريين',
            'أشهر عمليات السطو والسرقة',
        ]
    }
];

export const StoryFinder: React.FC<StoryFinderProps> = ({ onSelectStory, isLoading }) => {
    const [selectedGenre, setSelectedGenre] = useState(storyGenres[0].name);
    const [selectedSubCategory, setSelectedSubCategory] = useState(storyGenres[0].subCategories[0]);
    const [suggestions, setSuggestions] = useState<StorySuggestion[]>([]);
    const [isFinding, setIsFinding] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    // Effect to update sub-category when genre changes
    useEffect(() => {
        const currentGenre = storyGenres.find(g => g.name === selectedGenre);
        if (currentGenre && currentGenre.subCategories.length > 0) {
            // Find the first valid (non-separator) sub-category
            const firstValidSubCategory = currentGenre.subCategories.find(sc => sc !== '---');
            setSelectedSubCategory(firstValidSubCategory || '');
        }
    }, [selectedGenre]);

    const handleFindStories = async () => {
        if (!selectedGenre || !selectedSubCategory) return;
        setIsFinding(true);
        setError(null);
        setSuggestions([]);
        try {
            const results = await findTrendingStories(selectedGenre, selectedSubCategory);
            setSuggestions(results);
        } catch (err: any) {
            console.error("Failed to find stories:", err);
            setError("حدث خطأ أثناء البحث عن القصص. يرجى المحاولة مرة أخرى.");
        } finally {
            setIsFinding(false);
        }
    };
    
    const handleSelect = (title: string) => {
        const detailedPrompt = `اكتب قصة ملحمية ومفصلة عن "${title}"، مع التركيز على الجوانب الدرامية والسينمائية التي تجعلها مؤثرة. يجب أن تكون القصة مناسبة لإنتاج فيديو على يوتيوب، مع سرد غني ومحتوى عاطفي عميق.`;
        onSelectStory(detailedPrompt);
    };

    const currentSubCategories = storyGenres.find(g => g.name === selectedGenre)?.subCategories || [];

    return (
        <div>
            <h3 className="text-xl font-bold mb-4 text-amber-400 text-center">
                اكتشف أفكارًا للقصص
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                <select
                    value={selectedGenre}
                    onChange={(e) => setSelectedGenre(e.target.value)}
                    disabled={isLoading || isFinding}
                    className="w-full p-3 bg-gray-900/70 border-2 border-gray-600 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all duration-300 text-lg"
                >
                    {storyGenres.map(genre => (
                        <option key={genre.name} value={genre.name}>{genre.name}</option>
                    ))}
                </select>

                <select
                    value={selectedSubCategory}
                    onChange={(e) => setSelectedSubCategory(e.target.value)}
                    disabled={isLoading || isFinding || currentSubCategories.length === 0}
                    className="w-full p-3 bg-gray-900/70 border-2 border-gray-600 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all duration-300 text-lg"
                >
                    {currentSubCategories.map((cat, index) => (
                        cat === '---' 
                        ? <option key={index} disabled>──────────</option>
                        : <option key={cat} value={cat}>{cat}</option>
                    ))}
                </select>

                <button
                    onClick={handleFindStories}
                    disabled={isLoading || isFinding}
                    className="w-full flex items-center justify-center gap-3 bg-gradient-to-r from-sky-600 to-blue-700 text-white font-bold py-3 px-6 rounded-lg text-lg shadow-lg hover:shadow-sky-500/30 transform hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100"
                >
                    <Icon name="search" className="w-6 h-6" />
                    {isFinding ? 'جارٍ البحث...' : 'ابحث عن أفكار'}
                </button>
            </div>

            {error && <p className="text-red-400 text-center mt-4">{error}</p>}

            <div className="mt-6">
                {isFinding && (
                    <div className="flex justify-center items-center p-8">
                        <div className="w-12 h-12 border-4 border-dashed rounded-full animate-spin border-sky-400"></div>
                    </div>
                )}
                {suggestions.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {suggestions.map((suggestion, index) => (
                           <StorySuggestionCard key={index} suggestion={suggestion} onSelect={handleSelect} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};