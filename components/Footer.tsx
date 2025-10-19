import React from 'react';

// --- New Component: ApiUsageMeter ---
interface ApiUsageMeterProps {
    currentRpm: number;
    maxRpm: number;
}

const ApiUsageMeter: React.FC<ApiUsageMeterProps> = ({ currentRpm, maxRpm }) => {
    const usagePercentage = Math.min((currentRpm / maxRpm) * 100, 100);

    let barColor = 'bg-green-500';
    if (usagePercentage >= 90) {
        barColor = 'bg-red-500';
    } else if (usagePercentage >= 70) {
        barColor = 'bg-yellow-500';
    }

    return (
        <div className="flex items-center gap-3" title={`You have made ${currentRpm} of your ${maxRpm} allowed requests in the last 60 seconds.`}>
            <span className="font-semibold text-gray-300 whitespace-nowrap">
                API Usage: {currentRpm} / {maxRpm} RPM
            </span>
            <div className="w-32 h-4 bg-gray-700 rounded-full overflow-hidden">
                <div
                    className={`h-full rounded-full transition-all duration-300 ${barColor}`}
                    style={{ width: `${usagePercentage}%` }}
                ></div>
            </div>
        </div>
    );
};


// --- Main Footer Component ---
type Page = 'main' | 'about' | 'contact' | 'privacy' | 'terms';

interface FooterProps {
    onNavigate: (page: Page) => void;
    currentRpm: number;
    maxRpm: number;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate, currentRpm, maxRpm }) => {
    return (
        <footer className="w-full mt-12 py-6 border-t border-gray-700/50 text-gray-400 text-sm">
            <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-x-6 gap-y-4 px-4">
                <div className="flex flex-wrap justify-center sm:justify-start items-center gap-x-6 gap-y-2">
                    <a onClick={() => onNavigate('about')} className="cursor-pointer hover:text-amber-400 transition-colors">من نحن</a>
                    <a onClick={() => onNavigate('contact')} className="cursor-pointer hover:text-amber-400 transition-colors">اتصل بنا</a>
                    <a onClick={() => onNavigate('privacy')} className="cursor-pointer hover:text-amber-400 transition-colors">سياسة الخصوصية</a>
                    <a onClick={() => onNavigate('terms')} className="cursor-pointer hover:text-amber-400 transition-colors">الشروط والأحكام</a>
                </div>
                
                <ApiUsageMeter currentRpm={currentRpm} maxRpm={maxRpm} />
            </div>
            <p className="mt-4 text-center">&copy; {new Date().getFullYear()} StoryForge AI. جميع الحقوق محفوظة.</p>
        </footer>
    );
};