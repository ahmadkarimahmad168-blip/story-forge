import React from 'react';
import { Icon } from './Icon';

interface SelectFolderModalProps {
    isOpen: boolean;
    onSelectFolder: () => void;
    isError?: boolean;
}

export const SelectFolderModal: React.FC<SelectFolderModalProps> = ({ isOpen, onSelectFolder, isError }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-gray-900/90 flex items-center justify-center z-50 backdrop-blur-sm p-4">
            <div className="bg-gray-800 border border-gray-700 rounded-2xl shadow-2xl w-full max-w-lg text-center p-8 space-y-6">
                <div className="flex justify-center">
                    <Icon name="folder-open" className="w-16 h-16 text-amber-400" />
                </div>
                <h2 className="text-3xl font-bold text-amber-400">اختر مجلد العمل</h2>
                <p className="text-gray-300">
                    لحفظ قصصك والوصول إليها لاحقًا، يرجى تحديد مجلد على جهاز الكمبيوتر الخاص بك. سيتم حفظ جميع مشاريعك هنا.
                </p>
                {isError && (
                    <p className="text-red-400 text-sm">
                        فشل الوصول إلى المجلد السابق. قد يكون قد تم نقله أو حذفه. يرجى تحديده مرة أخرى.
                    </p>
                )}
                <button
                    onClick={onSelectFolder}
                    className="w-full flex items-center justify-center gap-3 bg-gradient-to-r from-amber-500 to-orange-600 text-white font-bold py-3 px-6 rounded-lg text-xl shadow-lg hover:shadow-amber-500/30 transform hover:scale-105 transition-all duration-300"
                >
                    <Icon name="folder" className="w-7 h-7" />
                    اختر مجلد
                </button>
                 <p className="text-xs text-gray-500">
                    يستخدم هذا التطبيق واجهة برمجة تطبيقات نظام الملفات (File System Access API) لحفظ الملفات مباشرة على جهازك لضمان الخصوصية والتحكم الكامل. لن يتم رفع أي شيء إلى خوادمنا.
                </p>
            </div>
        </div>
    );
};
