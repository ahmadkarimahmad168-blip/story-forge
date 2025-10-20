import React from 'react';
import { Icon } from './Icon';
import { CreativeFxControls } from './CreativeFxControls';
import type { Episode, CreativeFxParams } from '../types';

interface SceneCardProps {
    index: number;
    basePrompt: string;
    creativeParams: CreativeFxParams;
    generatedImageUrl: string | null | undefined;
    isGenerating: boolean;
    onGenerate: () => void;
    onUpdateParams: (params: CreativeFxParams) => void;
    onUpdateBasePrompt: (newPrompt: string) => void;
}

const SceneCard: React.FC<SceneCardProps> = ({ index, basePrompt, creativeParams, generatedImageUrl, isGenerating, onGenerate, onUpdateParams, onUpdateBasePrompt }) => {
    return (
        <div className="bg-gray-900/50 p-4 rounded-xl border border-gray-600 grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="space-y-4">
                <h4 className="font-bold text-lg text-gray-200">المشهد {index + 1}</h4>
                <div>
                    <label className="text-md font-bold mb-1 text-gray-300 block">الوصف الأساسي (قابل للتعديل)</label>
                    <textarea
                        value={basePrompt}
                        onChange={(e) => onUpdateBasePrompt(e.target.value)}
                        rows={3}
                        className="w-full p-2 bg-gray-900/70 border border-gray-600 rounded-lg focus:ring-1 focus:ring-amber-500 focus:border-amber-500 text-sm"
                        disabled={isGenerating}
                    />
                </div>
                <CreativeFxControls
                    creativeFxStyle={creativeParams.style}
                    setCreativeFxStyle={(style) => onUpdateParams({ ...creativeParams, style })}
                    promptChips={creativeParams.chips}
                    setPromptChips={(chips) => onUpdateParams({ ...creativeParams, chips })}
                    negativePrompt={creativeParams.negativePrompt}
                    setNegativePrompt={(negativePrompt) => onUpdateParams({ ...creativeParams, negativePrompt })}
                    seed={creativeParams.seed}
                    setSeed={(seed) => onUpdateParams({ ...creativeParams, seed })}
                    isLoading={isGenerating}
                />
            </div>

            <div className="flex flex-col items-center justify-center bg-gray-900/70 rounded-lg p-4 min-h-[250px]">
                {isGenerating && !generatedImageUrl ? (
                    <div className="text-center">
                        <Icon name="regenerate" className="w-12 h-12 animate-spin text-amber-400 mx-auto" />
                        <p className="mt-2 text-gray-300">جارٍ إنشاء الصورة...</p>
                    </div>
                ) : generatedImageUrl ? (
                    <img src={generatedImageUrl} alt={`Generated scene ${index + 1}`} className="w-full rounded-md aspect-video object-cover" />
                ) : (
                    <div className="text-center text-gray-500">
                        <Icon name="image" className="w-16 h-16 mx-auto" />
                        <p>الصورة ستظهر هنا</p>
                    </div>
                )}
                 <button
                    onClick={onGenerate}
                    disabled={isGenerating}
                    className="mt-4 w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-lg transition-colors disabled:opacity-50"
                >
                    <Icon name="generate" className="w-5 h-5" />
                    {generatedImageUrl ? 'إعادة إنشاء هذه الصورة' : 'إنشاء هذه الصورة'}
                </button>
            </div>
        </div>
    );
};


interface ImageGenerationPanelProps {
    onGenerateScenes: () => void;
    isGenerating: boolean;
    episode: Episode;
    onGenerateSingleImage: (sceneIndex: number) => void;
    onGenerateAllImages: () => void;
    onUpdateCreativeParams: (sceneIndex: number, params: CreativeFxParams) => void;
    onUpdateImageScenePrompt: (sceneIndex: number, newPrompt: string) => void;
}

export const ImageGenerationPanel: React.FC<ImageGenerationPanelProps> = ({
    onGenerateScenes,
    isGenerating,
    episode,
    onGenerateSingleImage,
    onGenerateAllImages,
    onUpdateCreativeParams,
    onUpdateImageScenePrompt,
}) => {
    const prompts = episode.imageScenePrompts || [];
    const creativeParamsList = episode.imageSceneCreativeParams || [];
    const images = episode.images || [];

    if (prompts.length === 0) {
        return (
             <div className="bg-gray-800/50 p-4 rounded-xl border border-gray-700 space-y-4 text-center">
                 <h3 className="text-xl font-bold text-amber-300 flex items-center justify-center gap-3">
                    <Icon name="image" className="w-7 h-7" />
                    إنشاء الصور السينمائية
                </h3>
                 <p className="text-gray-400 max-w-2xl mx-auto">
                    انقر على الزر أدناه ليقوم الذكاء الاصطناعي بتحليل نص الحلقة واقتراح 6 مشاهد رئيسية يمكنك تحويلها إلى صور مذهلة.
                </p>
                 <button
                    onClick={onGenerateScenes}
                    disabled={isGenerating}
                    className="inline-flex items-center justify-center gap-3 bg-gradient-to-r from-indigo-600 to-purple-700 text-white font-bold py-3 px-6 rounded-lg text-lg shadow-lg hover:shadow-indigo-500/30 transform hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100"
                >
                    <Icon name={isGenerating ? 'regenerate' : 'generate'} className={`w-7 h-7 ${isGenerating ? 'animate-spin' : ''}`} />
                    {isGenerating ? 'جارٍ تحليل النص...' : 'تحليل النص وإنشاء المشاهد'}
                </button>
             </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="bg-gray-800/50 p-4 rounded-xl border border-gray-700 flex flex-col sm:flex-row justify-between items-center gap-4">
                 <h3 className="text-xl font-bold text-amber-300">
                    لوحة التحكم الإبداعي للصور
                </h3>
                <button
                    onClick={onGenerateAllImages}
                    disabled={isGenerating}
                    className="w-full sm:w-auto flex items-center justify-center gap-3 bg-gradient-to-r from-amber-500 to-orange-600 text-white font-bold py-3 px-6 rounded-lg text-lg shadow-lg hover:shadow-amber-500/30 transform hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100"
                >
                    <Icon name="generate" className="w-7 h-7" />
                    {isGenerating ? 'جارٍ الإنشاء...' : 'إنشاء جميع الصور (بالترتيب)'}
                </button>
            </div>
            
            <div className="space-y-4">
                {prompts.map((prompt, index) => (
                    <SceneCard
                        key={index}
                        index={index}
                        basePrompt={prompt}
                        creativeParams={creativeParamsList[index]}
                        generatedImageUrl={images[index]?.url}
                        isGenerating={isGenerating}
                        onGenerate={() => onGenerateSingleImage(index)}
                        onUpdateParams={(params) => onUpdateCreativeParams(index, params)}
                        onUpdateBasePrompt={(newPrompt) => onUpdateImageScenePrompt(index, newPrompt)}
                    />
                ))}
            </div>
        </div>
    );
};