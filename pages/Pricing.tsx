import React from 'react';

interface PricingProps {
    onBack: () => void;
    onStart: () => void;
}

const Pricing: React.FC<PricingProps> = ({ onBack, onStart }) => {
    return (
        <div className="min-h-screen bg-white font-sans text-slate-900 selection:bg-brand-100 selection:text-brand-700">
            {/* Navigation */}
            <nav className="fixed top-0 left-0 right-0 z-50 bg-white/70 backdrop-blur-xl border-b border-slate-100">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-20 items-center">
                        <div className="flex items-center gap-2.5 cursor-pointer" onClick={onBack}>
                            <div className="w-10 h-10 bg-brand-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-brand-500/20">
                                <span className="material-symbols-outlined text-[24px]">school</span>
                            </div>
                            <span className="font-bold text-2xl tracking-tight text-slate-900">EduExam</span>
                        </div>

                        <button
                            onClick={onBack}
                            className="flex items-center gap-2 text-sm font-bold text-slate-600 hover:text-brand-500 transition-colors"
                        >
                            <span className="material-symbols-outlined text-lg">arrow_back</span>
                            Back to Home
                        </button>
                    </div>
                </div>
            </nav>

            {/* Pricing Content */}
            <div className="pt-32 pb-20 px-4">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center max-w-3xl mx-auto mb-16">
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-50 border border-brand-100 text-brand-700 text-xs font-bold mb-8 uppercase tracking-widest">
                            Simple Pricing
                        </div>
                        <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight mb-6">
                            Invest in your <span className="text-brand-500">future</span>.
                        </h1>
                        <p className="text-lg text-slate-500 font-medium">
                            Transparent pricing with no hidden fees. Choose the plan that fits your learning goals.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {/* Exam Pass */}
                        <div className="p-8 rounded-[32px] border border-slate-200 bg-white hover:border-brand-500 hover:shadow-2xl transition-all group relative overflow-hidden flex flex-col">
                            <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
                                <span className="material-symbols-outlined text-8xl text-brand-500">quiz</span>
                            </div>
                            <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight mb-2">Exam Pass</h3>
                            <p className="text-sm text-slate-500 font-medium mb-6 min-h-[40px]">Perfect for single assessment attempts and certification.</p>
                            <div className="flex items-baseline gap-1 mb-6">
                                <span className="text-sm font-bold text-slate-500">from</span>
                                <span className="text-4xl font-black text-slate-900">$9.99</span>
                            </div>
                            <ul className="space-y-4 mb-8 flex-1">
                                <li className="flex items-center gap-3 text-sm font-bold text-slate-600">
                                    <span className="material-symbols-outlined text-brand-500 text-lg">check_circle</span>
                                    One-time exam entry
                                </li>
                                <li className="flex items-center gap-3 text-sm font-bold text-slate-600">
                                    <span className="material-symbols-outlined text-brand-500 text-lg">check_circle</span>
                                    Detailed result analysis
                                </li>
                                <li className="flex items-center gap-3 text-sm font-bold text-slate-600">
                                    <span className="material-symbols-outlined text-brand-500 text-lg">check_circle</span>
                                    Official certificate
                                </li>
                            </ul>
                            <button onClick={onStart} className="w-full py-4 rounded-xl border-2 border-slate-900 text-slate-900 font-black uppercase tracking-widest text-xs hover:bg-slate-900 hover:text-white transition-all">
                                Get Started
                            </button>
                        </div>

                        {/* Single Course - Featured */}
                        <div className="p-8 rounded-[32px] border-2 border-brand-500 bg-slate-900 text-white shadow-2xl relative overflow-hidden transform md:-translate-y-4 flex flex-col">
                            <div className="absolute top-0 right-0 bg-brand-500 text-white text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-bl-xl">
                                Best Value
                            </div>
                            <h3 className="text-xl font-black uppercase tracking-tight mb-2 text-white">Full Course</h3>
                            <p className="text-sm text-slate-400 font-medium mb-6 min-h-[40px]">Comprehensive learning modules with lifetime access.</p>
                            <div className="flex items-baseline gap-1 mb-6">
                                <span className="text-sm font-bold text-slate-400">from</span>
                                <span className="text-4xl font-black text-white">$19.99</span>
                            </div>
                            <ul className="space-y-4 mb-8 flex-1">
                                <li className="flex items-center gap-3 text-sm font-bold text-slate-300">
                                    <span className="material-symbols-outlined text-brand-500 text-lg">check_circle</span>
                                    Lifetime course access
                                </li>
                                <li className="flex items-center gap-3 text-sm font-bold text-slate-300">
                                    <span className="material-symbols-outlined text-brand-500 text-lg">check_circle</span>
                                    All 12+ modules included
                                </li>
                                <li className="flex items-center gap-3 text-sm font-bold text-slate-300">
                                    <span className="material-symbols-outlined text-brand-500 text-lg">check_circle</span>
                                    Instructor Q&A support
                                </li>
                                <li className="flex items-center gap-3 text-sm font-bold text-slate-300">
                                    <span className="material-symbols-outlined text-brand-500 text-lg">check_circle</span>
                                    Final exam included
                                </li>
                            </ul>
                            <button onClick={onStart} className="w-full py-4 rounded-xl bg-brand-500 text-white font-black uppercase tracking-widest text-xs hover:bg-brand-600 transition-all shadow-lg shadow-brand-500/25">
                                Start Learning
                            </button>
                        </div>

                    </div>
                </div>
            </div>

            {/* Footer is not needed here as it's a focused page, or we could reuse the footer component if we extracted it */}
            <footer className="py-12 px-4 border-t border-slate-100 bg-slate-50">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
                    <p className="text-slate-400 text-sm font-medium">&copy; 2024 EduExam Academic Systems. All rights reserved.</p>
                </div>
            </footer>
        </div>
    );
};

export default Pricing;
