import React, { useState, KeyboardEvent } from 'react';
import { Icon } from './Icon';

const ControlOptionButton: React.FC<{
    label: string;
    onClick: () => void;
    isActive: boolean;
    disabled: boolean;
}> = ({ label, onClick, isActive, disabled }) => (
    <button
        onClick={onClick}
        disabled={disabled}
        className={`px-3 py-1.5 text-sm font-semibold rounded-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-700 focus:ring-amber-500
            ${isActive ? 'bg-amber-500 text-white shadow' : 'bg-gray-600 hover:bg-gray-500 text-gray-200'}
            ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        `}
    >
        {label}
    </button>
);


const fxStyles = [
    { value: 'photographic', label: 'صورة فوتوغرافية' },
    { value: 'cinematic', label: 'سينمائي' },
    { value: 'anime', label: 'أنمي' },
    { value: 'fantasy art', label: 'فن خيالي' },
    { value: 'watercolor', label: 'ألوان مائية' },
    { value: '3d model', label: 'نموذج 3D' },
    { value: 'long exposure', label: 'تعريض طويل' },
];


interface CreativeFxControlsProps {
    promptChips: string[];
    setPromptChips: (chips: string[]) => void;
    creativeFxStyle: string;
    setCreativeFxStyle: (style: string) => void;
    negativePrompt: string;
    setNegativePrompt: (prompt: string) => void;
    seed: string;
    setSeed: (seed: string) => void;
    isLoading: boolean;
}

export const CreativeFxControls: React.FC<CreativeFxControlsProps> = ({
    promptChips,
    setPromptChips,
    creativeFxStyle,
    setCreativeFxStyle,
    negativePrompt,
    setNegativePrompt,
    seed,
    setSeed,
    isLoading
}) => {
    const [inputValue, setInputValue] = useState('');

    const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault();
            const trimmedInput = inputValue.trim();
            if (trimmedInput && !promptChips.includes(trimmedInput)) {
                setPromptChips([...promptChips, trimmedInput]);
            }
            setInputValue('');
        }
    };

    const removeChip = (chipToRemove: string) => {
        setPromptChips(promptChips.filter(chip => chip !== chipToRemove));
    };

    const randomizeSeed = () => {
        setSeed(Math.floor(Math.random() * 1000000).toString());
    };

    return (
        <div className="space-y-4 my-3 p-3 bg-gray-900/40 rounded-lg border border-gray-600">
            <div>
                <h5 className="text-md font-bold mb-2 text-gray-300">وصف الصورة (بالرقاقات)</h5>
                <div className="flex flex-wrap items-center gap-2 p-2 bg-gray-900/70 border border-gray-600 rounded-lg">
                    {promptChips.map(chip => (
                        <div key={chip} className="flex items-center gap-1 bg-sky-800 text-white text-sm font-medium pl-3 pr-2 py-1 rounded-full">
                            <span>{chip}</span>
                            <button onClick={() => removeChip(chip)} className="text-sky-200 hover:text-white">&times;</button>
                        </div>
                    ))}
                    <input
                        type="text"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="أضف وصفاً واضغط Enter"
                        className="flex-grow bg-transparent p-1 focus:outline-none text-sm"
                        disabled={isLoading}
                    />
                </div>
            </div>
             <div>
                <h5 className="text-md font-bold mb-2 text-gray-300">النمط الفني FX</h5>
                <div className="flex flex-wrap gap-2">
                     {fxStyles.map(style => (
                        <ControlOptionButton
                            key={style.value}
                            label={style.label}
                            onClick={() => setCreativeFxStyle(style.value)}
                            isActive={creativeFxStyle === style.value}
                            disabled={isLoading}
                        />
                    ))}
                </div>
            </div>
            <div>
                <h5 className="text-md font-bold mb-2 text-gray-300">الوصف السلبي (Negative Prompt)</h5>
                <input
                    type="text"
                    value={negativePrompt}
                    onChange={(e) => setNegativePrompt(e.target.value)}
                    placeholder="مثال: نص، علامة مائية، ضبابي"
                    className="w-full p-2 bg-gray-900/70 border border-gray-600 rounded-lg focus:ring-1 focus:ring-amber-500 focus:border-amber-500 text-sm"
                    disabled={isLoading}
                />
            </div>
            <div>
                 <h5 className="text-md font-bold mb-2 text-gray-300">البذرة (Seed)</h5>
                 <div className="flex items-center gap-2">
                    <input
                        type="text"
                        value={seed}
                        onChange={(e) => setSeed(e.target.value.replace(/[^0-9]/g, ''))}
                        placeholder="رقم عشوائي"
                        className="flex-grow p-2 bg-gray-900/70 border border-gray-600 rounded-lg focus:ring-1 focus:ring-amber-500 focus:border-amber-500 text-sm"
                        disabled={isLoading}
                    />
                     <button onClick={randomizeSeed} disabled={isLoading} className="p-2 bg-gray-600 hover:bg-gray-500 rounded-lg disabled:opacity-50" title="عشوائي">
                        <Icon name="dice" className="w-5 h-5" />
                     </button>
                 </div>
            </div>
        </div>
    );
};