import React, { useState } from 'react';
import { signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from '../services/firebase';
import { Icon } from './Icon';

export const Auth: React.FC = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSignIn = async () => {
        setIsLoading(true);
        setError(null);
        try {
            await signInWithPopup(auth, googleProvider);
        } catch (error: any) {
            console.error("Authentication error:", error);
            setError("فشل تسجيل الدخول. يرجى المحاولة مرة أخرى.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="text-center py-16 bg-gray-800/30 p-6 rounded-2xl shadow-2xl border border-gray-700 backdrop-blur-sm mt-8">
            <h2 className="text-3xl font-bold text-amber-400">مرحباً بك في StoryForge AI</h2>
            <p className="mt-4 text-lg text-gray-300">
                يرجى تسجيل الدخول بحساب Google الخاص بك للبدء في إنشاء وحفظ قصصك السينمائية.
            </p>
            <button
                onClick={handleSignIn}
                disabled={isLoading}
                className="mt-8 inline-flex items-center justify-center gap-3 bg-white text-gray-800 font-bold py-3 px-8 rounded-lg text-xl shadow-lg hover:bg-gray-200 transform hover:scale-105 transition-all duration-300 disabled:opacity-50"
            >
                <svg className="w-6 h-6" viewBox="0 0 48 48">
                    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.53-4.18 7.09-10.36 7.09-17.65z"></path>
                    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                    <path fill="none" d="M0 0h48v48H0z"></path>
                </svg>
                {isLoading ? 'جارٍ تسجيل الدخول...' : 'تسجيل الدخول باستخدام Google'}
            </button>
            {error && <p className="text-red-400 mt-4">{error}</p>}
        </div>
    );
};