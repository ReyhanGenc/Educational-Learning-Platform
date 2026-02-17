
import React, { useState, useEffect } from 'react';

interface ExamTakerProps {
  onExit: () => void;
  onSubmit: () => void;
}

const ExamTaker: React.FC<ExamTakerProps> = ({ onExit, onSubmit }) => {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(6322); // ~1h 45m
  const [currentQuestion, setCurrentQuestion] = useState(12);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const totalQuestions = 50;

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleNext = () => {
    if (currentQuestion === totalQuestions) {
      setIsModalOpen(true);
    } else {
      setCurrentQuestion(prev => Math.min(totalQuestions, prev + 1));
      setSelectedOption(null); // Reset selection for next question in demo
    }
  };

  const options = [
    { id: 'A', label: 'Power Rule' },
    { id: 'B', label: 'Product Rule' },
    { id: 'C', label: 'Quotient Rule' },
    { id: 'D', label: 'Chain Rule' },
  ];

  const progress = (currentQuestion / totalQuestions) * 100;

  return (
    <div className="flex flex-col h-screen bg-white text-slate-900">
      <header className="sticky top-0 z-50 bg-slate-50 border-b border-slate-200">
        <div className="flex items-center justify-between p-4 pb-2 lg:px-8">
          <div className="flex items-center gap-2">
            <button onClick={() => setIsModalOpen(true)} className="material-symbols-outlined text-slate-600 hover:text-slate-900 transition-colors">close</button>
            <div className="hidden lg:block ml-2">
              <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest block mb-0.5">Examination Mode</span>
              <h1 className="text-sm font-bold">Adv. Mathematics - Midterm</h1>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-red-500/10 px-3 py-1.5 rounded-full border border-red-500/20">
            <span className="material-symbols-outlined text-red-600 text-sm">timer</span>
            <p className="text-red-600 text-sm font-bold tracking-tight">{formatTime(timeLeft)}</p>
          </div>
        </div>
        <div className="px-4 pb-3 pt-1 lg:px-8">
          <div className="flex justify-between items-end mb-1.5">
            <span className="text-[10px] uppercase tracking-wider font-bold text-slate-600">Exam Progress</span>
            <span className="text-[10px] font-bold text-brand-500">{Math.round(progress)}% Complete</span>
          </div>
          <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
            <div className="h-full bg-brand-500 rounded-full transition-all duration-500" style={{ width: `${progress}%` }}></div>
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden lg:px-8">
        <main className="flex-1 overflow-y-auto p-4 lg:p-8 custom-scrollbar">
          <div className="max-w-3xl mx-auto space-y-8">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <span className="text-brand-500 text-xs font-bold uppercase tracking-widest">Question {currentQuestion} of {totalQuestions}</span>
                <h2 className="text-2xl lg:text-3xl font-bold leading-tight text-slate-900 uppercase">
                  Derivative calculation for trigonometric functions
                </h2>
              </div>
              <button className="p-2 rounded-full hover:bg-slate-100 text-slate-500">
                <span className="material-symbols-outlined">bookmark</span>
              </button>
            </div>

            <div className="text-slate-700 text-lg leading-relaxed font-medium">
              <p>
                A student is calculating the derivative of <code className="bg-slate-100 px-2 py-0.5 rounded font-mono">f(x) = sin(x) * cos(x)</code>. Which of the following rules should be applied first to find the correct derivative?
              </p>
            </div>

            <div className="flex flex-col gap-3">
              {options.map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => setSelectedOption(opt.id)}
                  className={`group flex items-center gap-4 rounded-2xl border-2 p-6 transition-all text-left ${
                    selectedOption === opt.id 
                    ? 'border-brand-500 bg-brand-50' 
                    : 'border-slate-100 hover:border-slate-200 bg-white'
                  }`}
                >
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border-2 font-bold text-sm ${
                    selectedOption === opt.id ? 'border-brand-500 bg-brand-500 text-white' : 'border-slate-200 text-slate-500'
                  }`}>
                    {opt.id}
                  </div>
                  <div className="flex grow font-black text-xs uppercase tracking-widest text-slate-800">{opt.label}</div>
                  {selectedOption === opt.id && <span className="material-symbols-outlined text-brand-500">check_circle</span>}
                </button>
              ))}
            </div>
          </div>
        </main>

        <aside className="hidden xl:block w-80 p-8 border-l border-slate-100 bg-white">
          <h3 className="text-lg font-black mb-6 uppercase tracking-tight text-slate-900">Question Index</h3>
          <div className="grid grid-cols-5 gap-2">
            {[...Array(25)].map((_, i) => (
              <div 
                key={i} 
                className={`aspect-square flex items-center justify-center rounded-xl font-bold text-xs cursor-pointer transition-all ${
                  i + 1 < currentQuestion ? 'bg-brand-500 text-white shadow-lg shadow-brand-500/20' :
                  i + 1 === currentQuestion ? 'border-2 border-brand-500 bg-brand-50 text-brand-500' :
                  'border border-slate-200 text-slate-600 hover:border-slate-400'
                }`}
              >
                {i + 1}
              </div>
            ))}
          </div>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="w-full mt-10 bg-slate-900 text-white py-5 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-2xl hover:bg-brand-600 transition-all active:scale-95"
          >
            Submit Exam
          </button>
        </aside>
      </div>

      <footer className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-xl border-t border-slate-200 p-4 pb-8 lg:pb-4 z-40">
        <div className="max-w-3xl mx-auto flex gap-4">
          <button 
            disabled={currentQuestion === 1}
            onClick={() => setCurrentQuestion(prev => Math.max(1, prev - 1))}
            className="flex-1 flex items-center justify-center gap-2 py-5 rounded-2xl border border-slate-200 font-black text-[10px] uppercase tracking-widest text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-lg">arrow_back</span>
            Previous
          </button>
          <button 
            onClick={handleNext}
            className="flex-1 flex items-center justify-center gap-2 py-5 rounded-2xl bg-brand-500 text-white font-black text-[10px] uppercase tracking-widest shadow-lg shadow-brand-500/20 hover:bg-brand-600 transition-colors"
          >
            {currentQuestion === totalQuestions ? 'Finish' : 'Next'}
            <span className="material-symbols-outlined text-lg">arrow_forward</span>
          </button>
        </div>
      </footer>

      {/* Confirmation Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-fade-in" onClick={() => setIsModalOpen(false)}></div>
          <div className="relative bg-white w-full max-w-md rounded-[32px] p-10 shadow-2xl border border-slate-100 flex flex-col items-center text-center animate-scale-up">
            <div className="w-20 h-20 bg-amber-50 text-amber-600 rounded-3xl flex items-center justify-center mb-8 border border-amber-100 shadow-inner">
               <span className="material-symbols-outlined text-4xl font-bold">warning</span>
            </div>
            <h3 className="text-2xl font-black text-slate-900 tracking-tight uppercase mb-4">Finish Exam?</h3>
            <p className="text-slate-600 text-sm leading-relaxed font-medium mb-10">
              Are you sure you want to finish the exam? {currentQuestion < totalQuestions ? <>You have <span className="text-brand-500 font-bold">{totalQuestions - currentQuestion}</span> questions remaining.</> : <>You have reached the end of the exam.</>} This action cannot be undone.
            </p>
            <div className="flex flex-col w-full gap-3">
              <button 
                onClick={onSubmit}
                className="w-full bg-brand-500 text-white py-5 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl hover:bg-brand-600 transition-all active:scale-95"
              >
                Yes, Finalize Submission
              </button>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="w-full bg-slate-100 text-slate-600 py-5 rounded-2xl font-black text-[10px] uppercase tracking-widest border border-slate-200 hover:bg-slate-200 transition-all"
              >
                No, Continue Exam
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
        @keyframes scale-up {
          from { transform: scale(0.95) translateY(10px); opacity: 0; }
          to { transform: scale(1) translateY(0); opacity: 1; }
        }
        .animate-fade-in { animation: fade-in 0.2s ease-out forwards; }
        .animate-scale-up {
          animation: scale-up 0.2s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default ExamTaker;
