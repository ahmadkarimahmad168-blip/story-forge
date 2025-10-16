import React, { useState } from 'react';
import { Icon } from './Icon';

interface ApiKeyModalProps {
    isOpen: boolean;
    onSave: (apiKey: string) => Promise<void>;
}

export const ApiKeyModal: React.FC<ApiKeyModalProps> = ({ isOpen, onSave }) => {
    const [inputKey, setInputKey] = useState('');
    const [showKey, setShowKey] = useState(false);
    const [isValidating, setIsValidating] = useState(false);
    const [error, setError] = useState<string | null>(null);

    if (!isOpen) {
        return null;
    }

    const handleSaveClick = async () => {
        const trimmedKey = inputKey.trim();
        if (!trimmedKey || isValidating) {
            return;
        }
        setError(null);
        setIsValidating(true);
        try {
            await onSave(trimmedKey);
            // If onSave resolves, success is implied and the parent component closes the modal.
        } catch (err: any) {
            let userMessage = "فشل التحقق من المفتاح. يرجى التأكد من صحة المفتاح واتصالك بالإنترنت.";
            const errorMessage = err.message || '';
    
            if (errorMessage.includes('Invalid characters')) {
                userMessage = "يحتوي المفتاح على أحرف غير صالحة. يرجى التأكد من أنك نسخت المفتاح الصحيح.";
            } else if (errorMessage.includes('not valid')) {
                userMessage = "المفتاح الذي أدخلته غير صالح. يرجى التحقق منه والمحاولة مرة أخرى.";
            }
            setError(userMessage);
        } finally {
            setIsValidating(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-gray-900/90 flex items-center justify-center z-50 backdrop-blur-sm p-4">
            <div className="bg-gray-800 border border-gray-700 rounded-2xl shadow-2xl w-full max-w-lg text-center p-8 space-y-6">
                <div className="flex justify-center">
                    <Icon name="key" className="w-16 h-16 text-amber-400" />
                </div>
                <h2 className="text-3xl font-bold text-amber-400">مطلوب مفتاح Gemini API</h2>
                <p className="text-gray-300">
                    لتفعيل جميع ميزات الذكاء الاصطناعي في StoryForge, يرجى إدخال مفتاح واجهة برمجة التطبيقات (API Key) الخاص بك من Google AI.
                </p>
                
                 {error && (
                    <div className="bg-red-800/50 border border-red-700 text-red-200 px-4 py-3 rounded-lg text-center text-sm">
                        <p>{error}</p>
                    </div>
                )}

                <div className="relative">
                    <input
                        id="api-key-input"
                        type={showKey ? 'text' : 'password'}
                        value={inputKey}
                        onChange={(e) => setInputKey(e.target.value)}
                        placeholder="أدخل مفتاح الواجهة البرمجية هنا"
                        className="w-full p-4 pr-12 bg-gray-900/70 border-2 border-gray-600 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all duration-300 text-lg text-center placeholder-gray-500"
                        aria-label="Gemini API Key"
                        disabled={isValidating}
                    />
                    <button
                        onClick={() => setShowKey(!showKey)}
                        className="absolute inset-y-0 right-0 flex items-center px-4 text-gray-400 hover:text-amber-400"
                        aria-label={showKey ? 'Hide API Key' : 'Show API Key'}
                        disabled={isValidating}
                    >
                        <Icon name={showKey ? 'eye-slash' : 'eye'} className="w-6 h-6" />
                    </button>
                </div>
                
                <button
                    onClick={handleSaveClick}
                    disabled={!inputKey.trim() || isValidating}
                    className="w-full flex items-center justify-center gap-3 bg-gradient-to-r from-amber-500 to-orange-600 text-white font-bold py-3 px-6 rounded-lg text-xl shadow-lg hover:shadow-amber-500/30 transform hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100"
                >
                    {isValidating ? 'جارٍ التحقق...' : 'حفظ ومتابعة'}
                </button>
                <p className="text-sm text-gray-400">
                    لا تملك مفتاحاً؟{' '}
                    <a
                        href="https://aistudio.google.com/app/apikey"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-amber-400 hover:underline font-semibold"
                    >
                        احصل على واحد من Google AI Studio
                    </a>
                </p>
            </div>
        </div>
    );
};