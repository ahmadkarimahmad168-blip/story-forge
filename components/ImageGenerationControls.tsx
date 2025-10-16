import React from 'react';

interface ImageGenerationControlsProps {
    imageStyle: string;
    setImageStyle: (style: string) => void;
    isLoading: boolean;
}

const imageStyles = [
    { value: 'cinematic', label: 'سينمائي' },
    { value: 'photorealistic', label: 'واقعي' },
    { value: 'anime', label: 'أنمي' },
    { value: 'fantasy art', label: 'فن خيالي' }
];

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


export const ImageGenerationControls: React.FC<ImageGenerationControlsProps> = ({
    imageStyle,
    setImageStyle,
    isLoading
}) => {
    return (
        <div className="my-3 p-3 bg-gray-900/40 rounded-lg border border-gray-600">
            <div>
                <h5 className="text-md font-bold mb-2 text-gray-300">النمط الفني</h5>
                <div className="flex flex-wrap gap-2">
                     {imageStyles.map(style => (
                        <ControlOptionButton
                            key={style.value}
                            label={style.label}
                            onClick={() => setImageStyle(style.value)}
                            isActive={imageStyle === style.value}
                            disabled={isLoading}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
};