
import React from 'react';

interface AnalysisProps {
  onBack?: () => void;
  standalone?: boolean;
}

const Analysis: React.FC<AnalysisProps> = ({ onBack, standalone = true }) => {
  const reviews = [
    { id: '01', status: 'Correct', question: 'Which algorithm is most efficient for sorting large, unsorted datasets in most average cases?', subject: 'Computer Science', color: 'bg-emerald-500' },
    { id: '02', status: 'Incorrect', question: 'What is the time complexity of searching for an element in a balanced binary search tree?', subject: 'Logic Analysis', color: 'bg-red-500' },
    { id: '03', status: 'Correct', question: 'Explain the concept of polymorphism in object-oriented programming.', subject: 'OOP Principles', color: 'bg-indigo-500' },
  ];

  // Precise Circle Calculations for 85% completion
  const size = 240;
  const strokeWidth = 20;
  const center = size / 2;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (85 / 100) * circumference;

  return (
    <div className="flex flex-col h-full bg-[#f8fafc] text-slate-900 pb-24">
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-100 px-8 py-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          {!standalone && onBack && (
            <button onClick={onBack} className="material-symbols-outlined p-2 hover:bg-slate-100 rounded-lg transition-all">arrow_back</button>
          )}
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Academic Analytics</h1>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">CS Engineering • Term 4</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-6 py-3 bg-white border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-sm hover:bg-slate-50">
            <span className="material-symbols-outlined text-[18px]">file_download</span>
            Export
          </button>
        </div>
      </header>

      <main className="p-6 lg:p-10 space-y-10 max-w-7xl mx-auto w-full overflow-y-auto custom-scrollbar">
        {/* Main Stats Summary: Increased Y-Axis Height */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          <div className="lg:col-span-1 bg-white p-16 rounded-[32px] border border-slate-100 shadow-sm flex flex-col items-center justify-center min-h-[550px]">
            <div className="relative flex items-center justify-center mb-16">
              <svg width={size} height={size} className="transform -rotate-90 overflow-visible">
                {/* Background track - Lighter, cleaner */}
                <circle
                  stroke="#f1f5f9"
                  fill="transparent"
                  strokeWidth={strokeWidth}
                  r={radius}
                  cx={center}
                  cy={center}
                />
                {/* Progress track - Vivid, shadowed */}
                <circle
                  stroke="#4850e5"
                  fill="transparent"
                  strokeWidth={strokeWidth}
                  strokeDasharray={`${circumference} ${circumference}`}
                  style={{ strokeDashoffset: offset }}
                  strokeLinecap="round"
                  r={radius}
                  cx={center}
                  cy={center}
                  className="transition-all duration-1000 ease-out drop-shadow-[0_0_8px_rgba(72,80,229,0.4)]"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-7xl font-black text-slate-900 tracking-tighter">85<span className="text-3xl font-bold text-slate-300">%</span></span>
                <div className="flex flex-col items-center mt-6">
                    <span className="text-emerald-600 font-black text-[9px] bg-emerald-50 px-5 py-2 rounded-full uppercase tracking-widest border border-emerald-100 shadow-sm">Grade: Distinction</span>
                </div>
              </div>
            </div>
            <div className="text-center space-y-3">
              <h3 className="text-2xl font-black text-slate-900 tracking-tight">Academic Performance</h3>
              <p className="text-slate-400 font-bold uppercase text-[9px] tracking-[0.2em] opacity-75">Global Institutional Percentile: Top 5%</p>
            </div>
          </div>

          <div className="lg:col-span-2 grid grid-cols-2 gap-8">
            {[
              { label: 'Study Efficiency', val: '42m 15s', sub: 'Top 5% speed', icon: 'timer', color: 'blue' },
              { label: 'Cohort Ranking', val: 'Top 10%', sub: 'Rank #12', icon: 'military_tech', color: 'purple' },
              { label: 'Accuracy Rate', val: '42/50', sub: '+5 improvement', icon: 'check_circle', color: 'emerald' },
              { label: 'Progression', val: '+12.4%', sub: 'Target met', icon: 'trending_up', color: 'amber' }
            ].map((stat, i) => (
              <div key={i} className="bg-white p-12 rounded-[32px] border border-slate-100 shadow-sm group hover:border-brand-500 transition-all flex flex-col justify-between min-h-[260px]">
                 <div className={`w-14 h-14 bg-${stat.color}-50 text-${stat.color}-600 rounded-xl flex items-center justify-center mb-8 shadow-sm`}>
                   <span className="material-symbols-outlined text-3xl">{stat.icon}</span>
                 </div>
                 <div>
                   <p className="text-slate-400 text-[8px] font-bold uppercase tracking-[0.2em] mb-1">{stat.label}</p>
                   <h4 className="text-2xl font-black text-slate-900 tracking-tight">{stat.val}</h4>
                   <p className={`text-[10px] text-${stat.color}-600 font-bold mt-2 uppercase tracking-wide`}>{stat.sub}</p>
                 </div>
              </div>
            ))}
          </div>
        </div>

        {/* Breakdown Section: Increased vertical heights */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-10">
          <section className="bg-white rounded-[32px] p-12 border border-slate-100 shadow-sm min-h-[500px]">
            <div className="mb-12">
              <h3 className="text-xl font-black text-slate-900 flex items-center gap-3 tracking-tight">
                <span className="material-symbols-outlined text-brand-500 text-3xl">insights</span>
                Skill Distribution
              </h3>
              <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-1">Weighted Assessment Metrics</p>
            </div>
            <div className="space-y-12">
              {[
                { label: 'Data Structures', value: 95, color: 'bg-brand-500' },
                { label: 'Algorithms', value: 72, color: 'bg-amber-500' },
                { label: 'Operating Systems', value: 88, color: 'bg-emerald-500' },
                { label: 'Database Systems', value: 65, color: 'bg-red-500' }
              ].map((topic, i) => (
                <div key={i} className="space-y-4">
                  <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                    <span className="text-slate-500">{topic.label}</span>
                    <span className="text-slate-900">{topic.value}%</span>
                  </div>
                  <div className="h-4 bg-slate-50 rounded-full overflow-hidden p-0.5 border border-slate-100">
                    <div className={`h-full ${topic.color} rounded-full transition-all duration-1000 shadow-sm`} style={{ width: `${topic.value}%` }}></div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="bg-white rounded-[32px] p-12 border border-slate-100 shadow-sm flex flex-col min-h-[500px]">
            <div className="flex items-center justify-between mb-12">
              <div>
                <h3 className="text-xl font-black text-slate-900 tracking-tight">Topic Review</h3>
                <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-1">Refining Academic Weak Points</p>
              </div>
              <button className="text-brand-500 text-[9px] font-black uppercase tracking-widest hover:underline px-4 py-2 bg-brand-50 rounded-lg">Full Report</button>
            </div>
            <div className="space-y-8 flex-1 overflow-y-auto custom-scrollbar pr-3">
              {reviews.map((item) => (
                <div key={item.id} className="p-10 rounded-2xl bg-slate-50/50 border border-slate-100 hover:bg-white hover:shadow-xl transition-all group">
                  <div className="flex justify-between items-center mb-5">
                    <span className="text-[9px] font-black text-slate-300 uppercase tracking-[0.2em]">Question Reference: #{item.id}</span>
                    <span className={`px-4 py-1.5 rounded-md text-[9px] font-black uppercase tracking-widest ${
                      item.status === 'Correct' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-500'
                    }`}>
                      {item.status}
                    </span>
                  </div>
                  <p className="text-base font-bold text-slate-700 leading-relaxed tracking-tight">{item.question}</p>
                </div>
              ))}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
};

export default Analysis;
