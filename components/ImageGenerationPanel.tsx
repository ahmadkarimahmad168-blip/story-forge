import React, { useState } from 'react';
import { Icon } from './Icon';
import { CreativeFxControls } from './CreativeFxControls';

export interface CreativeFxParams {
    style: string;
    chips: string[];
    negativePrompt: string;
    seed: string;
    model: 'gemini' | 'imagen';
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
    const [imageModel, setImageModel] = useState<'gemini' | 'imagen'>('gemini');

    const handleGenerate = () => {
        onGenerateScenes({
            chips: promptChips,
            style: creativeFxStyle,
            negativePrompt: negativePrompt,
            seed: seed,
            model: imageModel,
        });
    };
    
    const ModelOptionButton: React.FC<{
        label: string;
        onClick: () => void;
        isActive: boolean;
        disabled: boolean;
    }> = ({ label, onClick, isActive, disabled }) => (
        <button
            onClick={onClick}
            disabled={disabled}
            className={`px-3 py-1.5 text-sm font-semibold rounded-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-700 focus:ring-amber-500
                ${isActive ? 'bg-indigo-600 text-white shadow' : 'bg-gray-600 hover:bg-gray-500 text-gray-200'}
                ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
            `}
        >
            {label}
        </button>
    );

    return (
        <div className="bg-gray-800/50 p-4 rounded-xl border border-gray-700 space-y-4">
            <h3 className="text-xl font-bold text-amber-300 flex items-center gap-3">
                <Icon name="image" className="w-7 h-7" />
                إنشاء صور سينمائية
            </h3>
            
            <p className="text-sm text-gray-400">
                استخدم عناصر التحكم أدناه لضبط النمط الفني العام للصور. عند النقر، سيقوم الذكاء الاصطناعي بتحليل نص الحلقة وإنشاء 6 صور فريدة تمثل المشاهد الرئيسية.
            </p>
            
            <div>
                <h4 className="text-md font-bold mb-2 text-gray-300">نموذج إنشاء الصور</h4>
                <div className="flex flex-wrap gap-2">
                    <ModelOptionButton
                        label="قياسي (Gemini Flash)"
                        onClick={() => setImageModel('gemini')}
                        isActive={imageModel === 'gemini'}
                        disabled={isGenerating}
                    />
                    <ModelOptionButton
                        label="جودة عالية (Imagen)"
                        onClick={() => setImageModel('imagen')}
                        isActive={imageModel === 'imagen'}
                        disabled={isGenerating}
                    />
                </div>
                <p className="text-xs text-gray-500 mt-2">
                   يتطلب خيار "جودة عالية" حساب فوترة نشط في Google Cloud.
                </p>
            </div>

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