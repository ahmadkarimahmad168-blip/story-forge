import React from 'react';
import type { ArchivedStory } from '../types';
import { Icon } from './Icon';

interface PreviousStoriesModalProps {
    isOpen: boolean;
    onClose: () => void;
    stories: ArchivedStory[];
    onLoad: (story: ArchivedStory) => void;
    onDelete: (id: string) => void;
}

export const PreviousStoriesModal: React.FC<PreviousStoriesModalProps> = ({ isOpen, onClose, stories, onLoad, onDelete }) => {
    if (!isOpen) return null;

    const formatDate = (isoString: string) => {
        return new Date(isoString).toLocaleString('ar-EG', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 backdrop-blur-sm p-4">
            <div className="bg-gray-800 border border-gray-700 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col">
                <header className="flex items-center justify-between p-4 border-b border-gray-600 flex-shrink-0">
                    <h2 className="text-2xl font-bold text-amber-400">قصصي المحفوظة</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </header>
                <div className="p-6 overflow-y-auto">
                    {stories.length === 0 ? (
                        <p className="text-center text-gray-400 py-8">لا توجد قصص محفوظة في هذا المتصفح.</p>
                    ) : (
                        <ul className="space-y-4">
                            {stories.map(story => (
                                <li key={story.id} className="bg-gray-900/50 p-4 rounded-lg border border-gray-700 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-bold text-lg text-gray-200 truncate" title={story.title}>{story.title}</h3>
                                        <p className="text-sm text-gray-400">{formatDate(story.createdAt)}</p>
                                    </div>
                                    <div className="flex items-center gap-2 flex-shrink-0 w-full sm:w-auto">
                                        <button onClick={() => onLoad(story)} className="flex-1 sm:flex-auto w-full flex items-center justify-center gap-2 bg-amber-600 hover:bg-amber-700 text-white font-bold py-2 px-3 rounded-md transition-colors text-sm">
                                            <Icon name="generate" className="w-5 h-5" />
                                            <span>تحميل</span>
                                        </button>
                                        <button onClick={() => onDelete(story.id)} className="flex-1 sm:flex-auto w-full flex items-center justify-center gap-2 bg-red-800 hover:bg-red-700 text-white font-bold py-2 px-3 rounded-md transition-colors text-sm">
                                            <Icon name="trash" className="w-5 h-5" />
                                            <span>حذف</span>
                                        </button>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>
        </div>
    );
};