
import React from 'react';

interface ResultViewProps {
  onBack: () => void;
}

const ResultView: React.FC<ResultViewProps> = ({ onBack }) => {
  const stats = [
    { label: 'Total Score', value: '42/50', icon: 'grade', color: 'brand' },
    { label: 'Time Spent', value: '52m 12s', icon: 'timer', color: 'indigo' },
    { label: 'Accuracy', value: '84%', icon: 'check_circle', color: 'emerald' },
    { label: 'Cohort Rank', value: '#12', icon: 'military_tech', color: 'amber' },
  ];

  return (
    <div className="min-h-full bg-slate-100 flex flex-col pb-24 lg:pb-10 animate-fade-in text-slate-900">
      <header className="bg-white border-b border-slate-200 px-8 py-6 sticky top-0 z-10 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="material-symbols-outlined p-2 hover:bg-slate-100 rounded-xl transition-all text-slate-900 font-bold">arrow_back</button>
          <div>
            <h1 className="text-xl font-black text-slate-900 tracking-tight uppercase leading-none">Performance Report</h1>
            <p className="text-[10px] text-slate-600 font-black uppercase tracking-widest mt-1">Mathematics Final • Dec 12</p>
          </div>
        </div>
        <button className="bg-slate-900 text-white px-8 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-xl active:scale-95 transition-all">
          Download PDF
        </button>
      </header>

      <main className="p-6 lg:p-12 max-w-6xl mx-auto w-full space-y-12">
        <div className="bg-white p-16 rounded-[48px] border border-slate-200 shadow-xl flex flex-col items-center text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full -mr-32 -mt-32 blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-brand-500/5 rounded-full -ml-32 -mb-32 blur-3xl"></div>
          
          <div className="w-32 h-32 bg-emerald-500 text-white rounded-[32px] flex items-center justify-center mb-10 shadow-2xl shadow-emerald-500/20 ring-4 ring-emerald-50">
            <span className="material-symbols-outlined text-6xl font-bold">verified</span>
          </div>
          <h2 className="text-4xl font-black text-slate-900 tracking-tighter uppercase mb-4 leading-none">Assessment Passed</h2>
          <p className="text-slate-600 font-black uppercase tracking-[0.2em] text-[11px] mb-2">Credential issued on Dec 12, 2024</p>
          <div className="h-1 w-20 bg-brand-500 rounded-full mx-auto"></div>
          
          <div className="mt-14 grid grid-cols-2 lg:grid-cols-4 gap-8 w-full">
            {stats.map((s, i) => (
              <div key={i} className="flex flex-col items-center gap-4 group">
                 <div className={`w-16 h-16 rounded-2xl bg-${s.color}-50 text-${s.color}-600 flex items-center justify-center border border-${s.color}-200 transition-transform group-hover:scale-110 shadow-sm`}>
                   <span className="material-symbols-outlined text-2xl font-bold">{s.icon}</span>
                 </div>
                 <div>
                    <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-1">{s.label}</p>
                    <p className="text-2xl font-black text-slate-900 tracking-tight">{s.value}</p>
                 </div>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          <section className="bg-white p-12 rounded-[32px] border border-slate-200 shadow-sm space-y-8">
            <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Question Breakdown</h3>
            <div className="space-y-6">
              {[
                { label: 'Correct Answers', value: 42, color: 'bg-emerald-500' },
                { label: 'Incorrect Answers', value: 5, color: 'bg-red-500' },
                { label: 'Skipped', value: 3, color: 'bg-slate-300' }
              ].map((b, i) => (
                <div key={i} className="space-y-3">
                   <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                     <span className="text-slate-600">{b.label}</span>
                     <span className="text-slate-900">{b.value} items</span>
                   </div>
                   <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                     <div className={`h-full ${b.color} rounded-full transition-all duration-1000`} style={{width: `${(b.value/50)*100}%`}}></div>
                   </div>
                </div>
              ))}
            </div>
          </section>

          <section className="bg-slate-900 p-12 rounded-[32px] text-white shadow-2xl space-y-8 flex flex-col justify-center border border-slate-800">
            <div>
              <h3 className="text-xl font-black tracking-tight uppercase">Institutional Analytics</h3>
              <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mt-1">Intelligence Module v4.2</p>
            </div>
            <div className="bg-white/5 p-8 rounded-[24px] border border-white/5">
                <p className="text-slate-300 text-base leading-relaxed font-bold italic">
                  "You demonstrated exceptional proficiency in Vector Transforms and Multidimensional Differentiation. 
                  Recommendation: focus on Stokes' Theorem applications for physical surfaces to reach elite status."
                </p>
            </div>
            <div className="pt-4">
              <button onClick={onBack} className="w-full bg-white text-slate-900 py-5 rounded-2xl font-black text-[11px] uppercase tracking-widest hover:bg-slate-100 transition-all shadow-xl active:scale-95">
                Return to Exam Hub
              </button>
            </div>
          </section>
        </div>
      </main>

      <style>{`
        @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
        .animate-fade-in { animation: fade-in 0.4s ease-out forwards; }
      `}</style>
    </div>
  );
};

export default ResultView;
