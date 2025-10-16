import React, { useState } from 'react';
import { Icon } from './Icon';
import { CreativeFxControls } from './CreativeFxControls';

export interface CreativeFxParams {
    style: string;
    chips: string[];
    negativePrompt: string;
    seed: string;
}

interface ImageGenerationPanelProps {
    onGenerateScenes: (params: CreativeFxParams) => void;
    isGenerating: boolean;
}

export const ImageGenerationPanel: React.FC<ImageGenerationPanelProps> = ({
    onGenerateScenes,
    isGenerating,
}) => {
    const [promptChips, setPromptChips] = useState<string[]>(['4k', 'highly detailed', 'epic']);
    const [creativeFxStyle, setCreativeFxStyle] = useState('cinematic');
    const [negativePrompt, setNegativePrompt] = useState('text, watermark, blurry, cartoon, anime');
    const [seed, setSeed] = useState('');

    const handleGenerate = () => {
        onGenerateScenes({
            chips: promptChips,
            style: creativeFxStyle,
            negativePrompt: negativePrompt,
            seed: seed,
        });
    };

    return (
        <div className="bg-gray-800/50 p-4 rounded-xl border border-gray-700 space-y-4">
            <h3 className="text-xl font-bold text-amber-300 flex items-center gap-3">
                <Icon name="image" className="w-7 h-7" />
                إنشاء صور سينمائية
            </h3>
            
            <p className="text-sm text-gray-400">
                استخدم عناصر التحكم أدناه لضبط النمط الفني العام للصور. عند النقر، سيقوم الذكاء الاصطناعي بتحليل نص الحلقة وإنشاء 6 صور فريدة تمثل المشاهد الرئيسية.
            </p>

            <CreativeFxControls
                promptChips={promptChips}
                setPromptChips={setPromptChips}
                creativeFxStyle={creativeFxStyle}
                setCreativeFxStyle={setCreativeFxStyle}
                negativePrompt={negativePrompt}
                setNegativePrompt={setNegativePrompt}
                seed={seed}
                setSeed={setSeed}
                isLoading={isGenerating}
            />

            <button
                onClick={handleGenerate}
                disabled={isGenerating}
                className="w-full flex items-center justify-center gap-3 bg-gradient-to-r from-indigo-600 to-purple-700 text-white font-bold py-3 px-6 rounded-lg text-lg shadow-lg hover:shadow-indigo-500/30 transform hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100"
            >
                <Icon name={isGenerating ? 'regenerate' : 'image'} className={`w-7 h-7 ${isGenerating ? 'animate-spin' : ''}`} />
                {isGenerating ? 'جارٍ الإنشاء...' : 'إنشاء 6 مشاهد للحلقة'}
            </button>
        </div>
    );
};