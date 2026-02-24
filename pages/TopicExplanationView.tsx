
import React from 'react';
import { StandaloneTopic, STANDALONE_TOPICS } from '../src/data/standalone_topics';

interface TopicExplanationViewProps {
    topicId: string;
    onBack: () => void;
}

const TopicExplanationView: React.FC<TopicExplanationViewProps> = ({ topicId, onBack }) => {
    const topic = STANDALONE_TOPICS.find(t => t.id === topicId);

    if (!topic) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center p-10 bg-slate-50 min-h-[400px]">
                <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Topic not found</p>
                <button onClick={onBack} className="mt-4 text-brand-500 font-black uppercase text-xs">Return</button>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full bg-white relative animate-fade-in overflow-hidden">
            <div className="absolute top-6 left-6 z-20 flex items-center gap-3">
                <button
                    onClick={onBack}
                    className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-xl hover:bg-brand-500 transition-all active:scale-95 group"
                >
                    <span className="material-symbols-outlined text-sm font-black group-hover:-translate-x-1 transition-transform">arrow_back</span>
                    Return to Subjects
                </button>
            </div>

            <main className="flex-1 overflow-y-auto custom-scrollbar pb-32 w-full">
                <div className="max-w-3xl mx-auto">
                    <header className="px-5 pt-32 pb-4">
                        <div className="flex items-center gap-2 text-brand-500 text-xs mb-3 font-black uppercase tracking-widest">
                            <span className="material-symbols-outlined text-sm font-black">menu_book</span>
                            <span>Subject Explanation</span>
                        </div>
                        <h1 className="text-4xl font-black leading-tight tracking-tight mb-2 text-slate-900 uppercase">
                            {topic.title}
                        </h1>
                    </header>

                    <div className="px-5 space-y-8 mt-10">
                        <article className="prose prose-lg prose-slate max-w-none 
                prose-headings:font-black prose-headings:text-slate-900 prose-headings:tracking-tight 
                prose-p:text-slate-800 prose-p:leading-relaxed prose-p:font-medium
                prose-strong:text-brand-600 prose-strong:font-black
                prose-ul:list-disc prose-ul:pl-6 prose-li:marker:text-brand-500
                prose-blockquote:border-l-4 prose-blockquote:border-brand-500 prose-blockquote:bg-slate-50 prose-blockquote:py-2 prose-blockquote:px-6 prose-blockquote:rounded-r-lg prose-blockquote:not-italic
                ">
                            <div dangerouslySetInnerHTML={{ __html: topic.content }} />
                        </article>

                        {/* Visual CTA for Standalone Topics */}
                        <div className="mt-20 p-12 bg-slate-50 rounded-[40px] border-2 border-slate-100 text-center">
                            <div className="w-20 h-20 bg-white shadow-lg text-brand-500 rounded-3xl flex items-center justify-center mx-auto mb-6 transform -rotate-3 hover:rotate-0 transition-transform">
                                <span className="material-symbols-outlined text-4xl">school</span>
                            </div>
                            <h3 className="font-black text-2xl text-slate-900 mb-2 uppercase tracking-tight">Expand Your Knowledge</h3>
                            <p className="text-slate-600 font-medium max-w-md mx-auto mb-8 text-sm">
                                This is a standalone topic explanation. To unlock full courses, certified exams, and technical assessments, visit our course catalog.
                            </p>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default TopicExplanationView;
