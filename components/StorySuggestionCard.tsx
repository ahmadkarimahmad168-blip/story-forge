import React, { useState } from 'react';
import type { StorySuggestion } from '../types';

interface StorySuggestionCardProps {
    suggestion: StorySuggestion;
    onSelect: (title: string) => void;
}

export const StorySuggestionCard: React.FC<StorySuggestionCardProps> = ({ suggestion, onSelect }) => {
    const [copied, setCopied] = useState(false);

    const handleCopyKeywords = () => {
        navigator.clipboard.writeText(suggestion.youtube_keywords.join(', '));
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="bg-gray-900/50 border border-gray-700 rounded-xl p-4 flex flex-col h-full">
            <h4 className="text-lg font-bold text-amber-300">{suggestion.title}</h4>
            <p className="text-gray-300 mt-2 text-sm flex-grow">{suggestion.synopsis}</p>
            
            <div className="mt-4">
                <h5 className="text-sm font-semibold text-gray-200">لماذا هي رائجة؟</h5>
                <ul className="mt-1 list-disc list-inside space-y-1 text-xs text-gray-400">
                    {suggestion.popularity_reasons.map((reason, i) => <li key={i}>{reason}</li>)}
                </ul>
            </div>
            
            <div className="mt-4">
                 <div className="flex justify-between items-center mb-1">
                    <h5 className="text-sm font-semibold text-gray-200">كلمات مفتاحية مقترحة</h5>
                     <button onClick={handleCopyKeywords} className="text-sky-400 hover:text-sky-300 text-xs font-bold">
                        {copied ? 'تم النسخ!' : 'نسخ'}
                    </button>
                </div>
                <div className="flex flex-wrap gap-1">
                    {suggestion.youtube_keywords.map(tag => (
                        <span key={tag} className="bg-gray-700 text-gray-200 text-xs font-medium px-2 py-0.5 rounded-full">{tag}</span>
                    ))}
                </div>
            </div>

            <button
                onClick={() => onSelect(suggestion.title)}
                className="mt-6 w-full bg-amber-600 hover:bg-amber-700 text-white font-bold py-2 px-4 rounded-lg text-sm transition-all duration-200"
            >
                ابدأ بهذه القصة
            </button>
        </div>
    );
};