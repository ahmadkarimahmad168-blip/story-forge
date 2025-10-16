import React from 'react';

export const ContactPage: React.FC = () => (
    <div className="space-y-6 leading-relaxed text-center">
        <h1 className="text-4xl font-bold text-amber-400 border-b-2 border-amber-500/30 pb-2 inline-block">اتصل بنا</h1>
        <p className="max-w-xl mx-auto">
            نحن نرحب دائماً بآرائكم ومقترحاتكم! إذا كان لديك أي أسئلة، أو واجهت مشكلة فنية، أو ترغب في تقديم ملاحظات لتحسين StoryForge AI، فلا تتردد في التواصل معنا.
        </p>
        <p className="max-w-xl mx-auto">
            إن ملاحظاتكم تساعدنا على تطوير الأداة لتلبية احتياجاتكم بشكل أفضل.
        </p>
        <div className="pt-4">
            <p className="text-lg">يمكنكم التواصل معنا مباشرة عبر البريد الإلكتروني:</p>
            <a href="mailto:contact@storyforge-ai.example.com" className="text-2xl font-bold text-amber-300 hover:text-amber-200 transition-colors tracking-wider">
                contact@storyforge-ai.example.com
            </a>
            <p className="text-sm text-gray-400 mt-2">(يرجى استبدال هذا البريد الإلكتروني بعنوان الاتصال الفعلي الخاص بك)</p>
        </div>
        <p className="max-w-xl mx-auto pt-4">
            سنبذل قصارى جهدنا للرد على جميع الاستفسارات في أقرب وقت ممكن. شكراً لاهتمامكم!
        </p>
    </div>
);