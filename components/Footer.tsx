import React from 'react';

type Page = 'main' | 'about' | 'contact' | 'privacy' | 'terms';

interface FooterProps {
    onNavigate: (page: Page) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
    return (
        <footer className="w-full mt-12 py-6 border-t border-gray-700/50 text-gray-400 text-sm">
            <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-center items-center gap-x-6 gap-y-4 px-4">
                <div className="flex flex-wrap justify-center items-center gap-x-6 gap-y-2">
                    <a onClick={() => onNavigate('about')} className="cursor-pointer hover:text-amber-400 transition-colors">من نحن</a>
                    <a onClick={() => onNavigate('contact')} className="cursor-pointer hover:text-amber-400 transition-colors">اتصل بنا</a>
                    <a onClick={() => onNavigate('privacy')} className="cursor-pointer hover:text-amber-400 transition-colors">سياسة الخصوصية</a>
                    <a onClick={() => onNavigate('terms')} className="cursor-pointer hover:text-amber-400 transition-colors">الشروط والأحكام</a>
                </div>
            </div>
            <p className="mt-4 text-center">&copy; {new Date().getFullYear()} StoryForge AI. جميع الحقوق محفوظة.</p>
        </footer>
    );
};