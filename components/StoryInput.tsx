import React from 'react';
import { Icon } from './Icon';

interface StoryInputProps {
    prompt: string;
    setPrompt: (prompt: string) => void;
    onGenerate: () => void;
    isLoading: boolean;
}

export const StoryInput: React.FC<StoryInputProps> = ({ prompt, setPrompt, onGenerate, isLoading }) => {
    return (
        <div>
            <label htmlFor="story-prompt" className="block text-xl font-bold mb-3 text-amber-400">
                أدخل فكرة القصة
            </label>
            <textarea
                id="story-prompt"
                rows={3}
                className="w-full p-4 bg-gray-900/70 border-2 border-gray-600 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all duration-300 text-lg placeholder-gray-500"
                placeholder="مثال: قصة عن محارب قديم يدافع عن آخر قلعة في الصحراء..."
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                disabled={isLoading}
            />
            <button
                onClick={onGenerate}
                disabled={isLoading || !prompt}
                className="mt-4 w-full flex items-center justify-center gap-3 bg-gradient-to-r from-amber-500 to-orange-600 text-white font-bold py-3 px-6 rounded-lg text-xl shadow-lg hover:shadow-amber-500/30 transform hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100"
            >
                <Icon name="generate" className="w-7 h-7" />
                {isLoading ? 'جارٍ الإنشاء...' : 'اِصنع القصة'}
            </button>
        </div>
    );
};