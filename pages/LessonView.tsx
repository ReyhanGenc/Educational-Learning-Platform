
import React, { useState } from 'react';

interface LessonViewProps {
  onBack: () => void;
}

const LessonView: React.FC<LessonViewProps> = ({ onBack }) => {
  const [sliderPos, setSliderPos] = useState(50);

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSliderPos(parseInt(e.target.value));
  };

  return (
    <div className="flex flex-col h-full bg-white text-slate-900">
      <nav className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200 px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="material-symbols-outlined text-brand-500 p-2 hover:bg-brand-50 rounded-full font-bold">arrow_back</button>
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-brand-500 uppercase tracking-wider">Unit 2: Molecular Bonds</span>
            <span className="text-sm font-bold text-slate-900 truncate max-w-[200px]">Organic Chemistry Foundations</span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex flex-col items-end">
            <span className="text-[10px] font-bold text-slate-600">PROGRESS</span>
            <span className="text-xs font-bold text-emerald-600">65%</span>
          </div>
        </div>
      </nav>

      <main className="flex-1 overflow-y-auto custom-scrollbar pb-32 w-full">
        {/* Hero Image Section */}
        <div className="w-full">
          <div className="aspect-[2.5/1] overflow-hidden shadow-lg border-b border-slate-200">
            <img src="https://picsum.photos/seed/molecule/1200/480" className="w-full h-full object-cover" alt="Molecule Hero" />
          </div>
        </div>

        <div className="max-w-3xl mx-auto">
          <header className="px-5 pt-12 pb-4">
            <div className="flex items-center gap-2 text-slate-600 text-xs mb-3 font-bold uppercase">
              <span className="material-symbols-outlined text-sm font-bold">auto_stories</span>
              <span>Lesson 4 of 12</span>
            </div>
            <h1 className="text-3xl font-black leading-tight tracking-tight mb-2 text-slate-900 uppercase">
              Understanding Molecular Bonds in Organic Chemistry
            </h1>
          </header>

          <div className="px-5 space-y-8">
            <article className="space-y-6 text-lg leading-relaxed text-slate-800">
              <p className="font-medium">
                Organic chemistry is the study of the structure, properties, composition, reactions, and preparation of carbon-containing compounds.
              </p>

              <div className="bg-brand-50 border-l-4 border-brand-500 p-6 rounded-r-2xl">
                <h4 className="font-bold text-brand-600 text-sm mb-2 flex items-center gap-2 uppercase tracking-widest">
                  <span className="material-symbols-outlined text-lg font-bold">lightbulb</span>
                  Key Concept
                </h4>
                <p className="text-base font-bold text-slate-900">
                  Carbon's unique ability for <strong className="text-brand-600">catenation</strong> allows it to form vast, complex chains and rings.
                </p>
              </div>

              <h2 className="text-2xl font-black text-slate-900 pt-4 uppercase tracking-tight">2D vs 3D Representations</h2>
              <p className="font-medium">
                Visualizing how these bonds occupy space is critical for understanding chemical reactivity.
              </p>

              <div className="relative group rounded-3xl overflow-hidden border border-slate-300 shadow-xl h-[300px]">
                <div className="absolute inset-0">
                  <img src="https://picsum.photos/seed/chem-3d/800/600" className="w-full h-full object-cover" alt="3D View" />
                  <div className="absolute bottom-4 right-4 bg-black/70 px-3 py-1.5 rounded-xl text-[10px] text-white font-black tracking-widest uppercase">3D MODEL</div>
                </div>
                <div 
                  className="absolute inset-0 border-r-4 border-white z-10" 
                  style={{ clipPath: `inset(0 ${100 - sliderPos}% 0 0)` }}
                >
                  <img src="https://picsum.photos/seed/chem-2d/800/600" className="w-full h-full object-cover" alt="2D View" />
                  <div className="absolute bottom-4 left-4 bg-black/70 px-3 py-1.5 rounded-xl text-[10px] text-white font-black tracking-widest uppercase">2D FORMULA</div>
                </div>
                <input 
                  type="range" 
                  min="0" max="100" 
                  value={sliderPos}
                  onChange={handleSliderChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-col-resize z-20"
                />
                <div 
                  className="absolute top-0 bottom-0 w-1 bg-white z-10 pointer-events-none" 
                  style={{ left: `${sliderPos}%` }}
                >
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-brand-500 rounded-full flex items-center justify-center text-white shadow-lg">
                    <span className="material-symbols-outlined text-sm font-bold">unfold_more</span>
                  </div>
                </div>
              </div>

              <section className="bg-amber-50 border border-amber-200 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-black text-amber-800 flex items-center gap-2 text-xs uppercase tracking-widest">
                    <span className="material-symbols-outlined text-lg font-bold">edit_note</span>
                    Personal Notes
                  </h3>
                  <button className="text-[10px] font-black text-amber-700 uppercase tracking-widest hover:text-amber-900">Edit</button>
                </div>
                <p className="text-sm text-slate-800 italic font-bold">
                  "Must remember: Single bonds rotate, Double bonds don't. This is key for isomerism questions!"
                </p>
              </section>

              <section className="bg-slate-900 rounded-3xl p-8 text-white shadow-2xl">
                <div className="flex flex-col md:flex-row items-center gap-6">
                  <div className="w-16 h-16 bg-brand-500 rounded-2xl flex items-center justify-center shrink-0 shadow-lg">
                    <span className="material-symbols-outlined text-3xl font-bold">quiz</span>
                  </div>
                  <div className="flex-1 text-center md:text-left">
                    <h3 className="font-black text-xl leading-tight uppercase tracking-tight">Practice Quiz</h3>
                    <p className="text-slate-400 text-sm mt-1 font-bold">Test your knowledge with 5 quick questions on Molecular Bonds.</p>
                    <button className="mt-6 w-full md:w-auto bg-white text-slate-900 font-black py-4 px-10 rounded-xl text-[10px] uppercase tracking-widest hover:bg-brand-50 hover:text-brand-600 transition-all shadow-xl active:scale-95">
                      Start Practice
                    </button>
                  </div>
                </div>
              </section>
            </article>
          </div>
        </div>
      </main>

      <footer className="fixed bottom-0 left-0 lg:left-[280px] right-0 bg-white/95 backdrop-blur-xl border-t border-slate-200 p-4 pb-8 lg:pb-4 flex justify-end px-10 z-40 shadow-inner">
        <button className="w-16 h-14 bg-slate-100 text-slate-700 rounded-2xl flex items-center justify-center hover:bg-slate-200 border border-slate-200 transition-all active:scale-95">
          <span className="material-symbols-outlined font-bold">bookmark</span>
        </button>
      </footer>
    </div>
  );
};

export default LessonView;
